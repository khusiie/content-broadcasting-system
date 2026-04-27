const supabase = require('../utils/supabase');
const path = require('path');
const fs = require('fs');

exports.uploadContent = async (req, res) => {
  const { title, description, subject, start_time, end_time, rotation_duration } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'File is required' });
  }

  if (!title || !subject) {
    return res.status(400).json({ error: 'Title and Subject are required' });
  }

  try {
    // 1. Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.originalname}`;
    let publicUrl = '';
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('content-files')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (storageError) {
      console.log('Storage Error Object:', storageError);
      if (storageError.message === 'Bucket not found') {
        console.warn('Supabase Bucket not found, falling back to local storage...');
        const localPath = path.join(__dirname, '../../uploads', fileName);
        fs.writeFileSync(localPath, file.buffer);
        publicUrl = `http://localhost:5000/uploads/${fileName}`;
      } else {
        throw storageError;
      }
    } else {
      // 2. Get Public URL
      const { data: { publicUrl: supabaseUrl } } = supabase.storage
        .from('content-files')
        .getPublicUrl(fileName);
      publicUrl = supabaseUrl;
    }

    // 3. Save to Database — status starts as 'uploaded'
    const { data: content, error: dbError } = await supabase
      .from('content')
      .insert([{
        title,
        description: description || null,
        subject,
        file_url: publicUrl,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: req.user.id,
        status: 'uploaded',
        start_time: start_time || null,
        end_time: end_time || null,
        rotation_duration: parseInt(rotation_duration) || 5
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    // 4. Auto-transition to 'pending' (content is ready for review)
    const { data: updatedContent, error: updateError } = await supabase
      .from('content')
      .update({ status: 'pending' })
      .eq('id', content.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Create or find subject slot
    let slotId;
    const { data: existingSlot } = await supabase
      .from('content_slots')
      .select('id')
      .eq('subject', subject)
      .single();

    if (existingSlot) {
      slotId = existingSlot.id;
    } else {
      const { data: newSlot, error: slotError } = await supabase
        .from('content_slots')
        .insert([{ subject }])
        .select()
        .single();
      if (slotError) throw slotError;
      slotId = newSlot.id;
    }

    // 6. Get current max rotation_order for this slot
    const { data: maxOrderData } = await supabase
      .from('content_schedule')
      .select('rotation_order')
      .eq('slot_id', slotId)
      .order('rotation_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderData?.rotation_order || 0) + 1;

    // 7. Create content_schedule entry
    const { error: scheduleError } = await supabase
      .from('content_schedule')
      .insert([{
        content_id: content.id,
        slot_id: slotId,
        rotation_order: nextOrder,
        duration: parseInt(rotation_duration) || 5
      }]);

    if (scheduleError) console.warn('Schedule creation warning:', scheduleError.message);

    res.status(201).json({ message: 'Content uploaded successfully and pending approval', content: updatedContent });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTeacherContent = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('uploaded_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
