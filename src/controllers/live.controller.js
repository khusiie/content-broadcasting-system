const schedulingService = require('../services/scheduling.service');
const supabase = require('../utils/supabase');

exports.getLiveContent = async (req, res) => {
  const { teacherId } = req.params;
  const { subject } = req.query;

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, name')
      .eq('id', teacherId)
      .single();

    if (userError || !user) {
      return res.json({ message: "No content available" });
    }

    if (user.role !== 'teacher') {
      return res.json({ message: "No content available" });
    }

    const activeContent = await schedulingService.getActiveContentForTeacher(teacherId, subject);

    if (!activeContent || activeContent.length === 0) {
      return res.json({ message: "No content available" });
    }

    res.json(activeContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
