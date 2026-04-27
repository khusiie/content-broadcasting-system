const supabase = require('../utils/supabase');

exports.getAllPendingContent = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*, users!content_uploaded_by_fkey(name)')
      .in('status', ['uploaded', 'pending'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveOrReject = async (req, res) => {
  const { contentId } = req.params;
  const { status, rejection_reason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected".' });
  }

  // Rejection must include reason
  if (status === 'rejected' && (!rejection_reason || !rejection_reason.trim())) {
    return res.status(400).json({ error: 'Rejection reason is required when rejecting content.' });
  }

  try {
    // Verify content exists and is in reviewable state
    const { data: existing, error: fetchError } = await supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (!['uploaded', 'pending'].includes(existing.status)) {
      return res.status(400).json({ error: `Content is already ${existing.status}. Cannot change status.` });
    }

    const updateData = {
      status,
      approved_by: req.user.id,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      rejection_reason: status === 'rejected' ? rejection_reason.trim() : null
    };

    const { data, error } = await supabase
      .from('content')
      .update(updateData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) throw error;

    // On approval, ensure content_schedule entry exists
    if (status === 'approved') {
      const { data: scheduleExists } = await supabase
        .from('content_schedule')
        .select('id')
        .eq('content_id', contentId)
        .single();

      if (!scheduleExists) {
        // Find or create slot
        let slotId;
        const { data: existingSlot } = await supabase
          .from('content_slots')
          .select('id')
          .eq('subject', existing.subject)
          .single();

        if (existingSlot) {
          slotId = existingSlot.id;
        } else {
          const { data: newSlot, error: slotError } = await supabase
            .from('content_slots')
            .insert([{ subject: existing.subject }])
            .select()
            .single();
          if (slotError) console.warn('Slot creation warning:', slotError.message);
          slotId = newSlot?.id;
        }

        if (slotId) {
          const { data: maxOrderData } = await supabase
            .from('content_schedule')
            .select('rotation_order')
            .eq('slot_id', slotId)
            .order('rotation_order', { ascending: false })
            .limit(1)
            .single();

          const nextOrder = (maxOrderData?.rotation_order || 0) + 1;

          await supabase
            .from('content_schedule')
            .insert([{
              content_id: contentId,
              slot_id: slotId,
              rotation_order: nextOrder,
              duration: existing.rotation_duration || 5
            }]);
        }
      }
    }

    res.json({ message: `Content ${status} successfully`, content: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllContent = async (req, res) => {
  const { subject, teacherId, status, page = 1, limit = 10 } = req.query;

  try {
    let query = supabase
      .from('content')
      .select('*, users!content_uploaded_by_fkey(name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (subject) query = query.eq('subject', subject);
    if (teacherId) query = query.eq('uploaded_by', teacherId);
    if (status) query = query.eq('status', status);

    // Pagination
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
