const supabase = require('../utils/supabase');

/**
 * Scheduling / Rotation Logic
 *
 * 1. Fetch all approved content for a teacher within its active time window.
 * 2. Group content by subject.
 * 3. For each subject, attempt to use content_schedule for rotation order/duration.
 *    Fallback to content.rotation_duration if no schedule entries exist.
 * 4. Use modular time arithmetic to determine which content item is currently active
 *    in the continuous rotation loop.
 */
exports.getActiveContentForTeacher = async (teacherId, subjectFilter = null) => {
  const now = new Date();
  console.log("NOW:", now);
  // 1. Fetch approved content for this teacher within schedule window
  let query = supabase
    .from('content')
    .select('*')
    .eq('uploaded_by', teacherId)
    .eq('status', 'approved')
    .lte('start_time', now.toISOString())
    .gte('end_time', now.toISOString());

  if (subjectFilter) {
    query = query.eq('subject', subjectFilter);
  }

  const { data: contents, error } = await query;

  if (error) throw error;
  if (!contents || contents.length === 0) return [];

  // 2. Group by subject
  const subjects = {};
  contents.forEach(content => {
    if (!subjects[content.subject]) {
      subjects[content.subject] = [];
    }
    subjects[content.subject].push(content);
  });

  const activeContents = [];

  // 3. For each subject, find the active content in rotation
  for (const subject in subjects) {
    const subjectItems = subjects[subject];
    console.log("CONTENT ID:", content.id);
    console.log("START:", content.start_time);
    console.log("END:", content.end_time);

    // Try to get schedule entries for rotation order
    const contentIds = subjectItems.map(c => c.id);
    const { data: scheduleEntries } = await supabase
      .from('content_schedule')
      .select('*, content_slots!inner(subject)')
      .in('content_id', contentIds)
      .order('rotation_order', { ascending: true });

    let items;
    if (scheduleEntries && scheduleEntries.length > 0) {
      // Use schedule-ordered items with schedule durations
      items = scheduleEntries.map(se => {
        const contentItem = subjectItems.find(c => c.id === se.content_id);
        return { ...contentItem, rotation_duration: se.duration };
      }).filter(Boolean);
    } else {
      // Fallback: order by created_at, use content.rotation_duration
      items = subjectItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    if (items.length === 0) continue;

    // Calculate total duration in minutes
    const totalDuration = items.reduce((sum, item) => sum + (item.rotation_duration || 5), 0);

    if (totalDuration === 0) continue;

    // Use current time to find position in the rotation loop
    // Minutes elapsed since Unix epoch, mod by total duration → position in loop
    const currentTotalMinutes = Math.floor(Date.now() / 60000);
    const elapsedInLoop = currentTotalMinutes % totalDuration;

    let runningSum = 0;
    let activeItem = items[0];

    for (const item of items) {
      runningSum += (item.rotation_duration || 5);
      if (elapsedInLoop < runningSum) {
        activeItem = item;
        break;
      }
    }

    activeContents.push(activeItem);
  }

  return activeContents;
};
