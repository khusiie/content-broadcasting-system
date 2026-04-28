import { useState, useEffect } from 'react';
import { Upload, FileText, Clock, CheckCircle, XCircle, Loader2, ArrowUpCircle } from 'lucide-react';
import api from '../utils/api';

const TeacherDashboard = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', subject: '', description: '',
    start_time: '', end_time: '', rotation_duration: 5
  });
  const [file, setFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(content.length / itemsPerPage);
  const paginatedContent = content.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchContent = async () => {
    try {
      const { data } = await api.get('/content/my-content');
      setContent(data);
    } catch (err) { console.error('Failed to fetch content'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContent(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a file');
    setUploading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => { if (formData[key]) data.append(key, formData[key]); });
    data.append('file', file);
    try {
      await api.post('/content/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Content uploaded successfully!');
      fetchContent();
      setFile(null);
      setFormData({ title: '', subject: '', description: '', start_time: '', end_time: '', rotation_duration: 5 });
    } catch (err) { alert(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const getStatusStyles = (s) => {
    if (s === 'approved') return 'bg-emerald-500/10 text-emerald-400';
    if (s === 'rejected') return 'bg-rose-500/10 text-rose-400';
    if (s === 'uploaded') return 'bg-sky-500/10 text-sky-400';
    return 'bg-amber-500/10 text-amber-400';
  };

  const StatusIcon = ({ status }) => {
    if (status === 'approved') return <CheckCircle size={20} className="text-emerald-500" />;
    if (status === 'rejected') return <XCircle size={20} className="text-rose-500" />;
    if (status === 'uploaded') return <ArrowUpCircle size={20} className="text-sky-500" />;
    return <Clock size={20} className="text-amber-500" />;
  };

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Teacher Dashboard</h1>
          <p className="text-gray-400">Upload and schedule your broadcast content</p>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-gray-400 hover:text-white transition-colors">Logout</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Upload size={20} className="text-indigo-400" /> New Broadcast
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Title <span className="text-rose-400">*</span></label>
                <input type="text" className="glass-input" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Subject <span className="text-rose-400">*</span></label>
                <input type="text" className="glass-input" required placeholder="e.g. Maths, Science" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Description <span className="text-gray-600">(optional)</span></label>
                <textarea className="glass-input resize-none h-20 text-sm" placeholder="Brief description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">Start Time</label>
                  <input type="datetime-local" className="glass-input text-xs" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">End Time</label>
                  <input type="datetime-local" className="glass-input text-xs" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-gray-600 -mt-2">Without start/end time, content won't be active for broadcasting</p>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Rotation (mins)</label>
                <input type="number" className="glass-input" min="1" value={formData.rotation_duration} onChange={(e) => setFormData({ ...formData, rotation_duration: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Media File <span className="text-rose-400">*</span></label>
                <input type="file" className="hidden" id="file-upload" accept=".jpg,.jpeg,.png,.gif" onChange={(e) => setFile(e.target.files[0])} />
                <label htmlFor="file-upload" className="glass-input border-dashed cursor-pointer flex flex-col items-center py-6 hover:bg-white/5">
                  <FileText className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-300">{file ? file.name : 'Choose JPG, PNG, or GIF (max 10MB)'}</span>
                </label>
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin" size={18} /> : 'Upload Content'}
              </button>
            </form>
          </div>
        </div>

        {/* Content List — read-only status view */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 min-h-[500px]">
            <h2 className="text-xl font-bold mb-6">My Uploads</h2>
            {loading ? (
              <div className="flex-center h-64"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : content.length === 0 ? (
              <div className="text-center py-20 text-gray-500 italic">No content uploaded yet.</div>
            ) : (
              <div className="space-y-4">
                {paginatedContent.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      {item.file_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/30 flex-shrink-0">
                          <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                          <FileText size={24} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Clock size={12} /> {item.subject}
                          {item.start_time ? ` • ${new Date(item.start_time).toLocaleDateString()}` : ' • Not scheduled'}
                        </p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
                        {item.status === 'rejected' && item.rejection_reason && (
                          <p className="text-xs text-rose-400 mt-1 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 italic">Reason: {item.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyles(item.status)}`}>{item.status}</span>
                      <StatusIcon status={item.status} />
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-white/5 text-sm text-gray-300 disabled:opacity-30 hover:bg-white/10 transition-all">Previous</button>
                    <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl bg-white/5 text-sm text-gray-300 disabled:opacity-30 hover:bg-white/10 transition-all">Next</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;