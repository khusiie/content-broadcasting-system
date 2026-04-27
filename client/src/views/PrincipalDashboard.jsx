import { useState, useEffect } from 'react';
import { Check, X, Clock, FileText, Info, Loader2, AlertTriangle, XCircle, Filter, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import api from '../utils/api';

const PrincipalDashboard = () => {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // Preview modal
  const [previewItem, setPreviewItem] = useState(null);

  // Filters & pagination for history
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMeta, setHistoryMeta] = useState({ total: 0, totalPages: 1 });
  const historyLimit = 6;

  const fetchData = async () => {
    try {
      const pendingRes = await api.get('/approval/pending');
      setPending(pendingRes.data);
      await fetchHistory();
    } catch (err) { console.error('Failed to fetch data'); }
    finally { setLoading(false); }
  };

  const fetchHistory = async (page = historyPage) => {
    try {
      const params = new URLSearchParams({ page, limit: historyLimit });
      if (subjectFilter) params.append('subject', subjectFilter);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/approval/all?${params}`);
      setHistory(res.data.data || res.data);
      if (res.data.pagination) setHistoryMeta(res.data.pagination);
    } catch (err) { console.error('Failed to fetch history'); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (!loading) fetchHistory(historyPage); }, [historyPage, subjectFilter, statusFilter]);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await api.post(`/approval/status/${id}`, { status: 'approved', rejection_reason: '' });
      fetchData();
    } catch (err) { alert('Approval failed'); }
    finally { setApprovingId(null); }
  };

  const openRejectModal = (item) => { setSelectedItem(item); setRejectReason(''); setShowRejectModal(true); };
  const closeRejectModal = () => { setShowRejectModal(false); setSelectedItem(null); setRejectReason(''); };

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert('Please enter a rejection reason');
    setRejecting(true);
    try {
      await api.post(`/approval/status/${selectedItem.id}`, { status: 'rejected', rejection_reason: rejectReason.trim() });
      closeRejectModal();
      fetchData();
    } catch (err) { alert('Rejection failed'); }
    finally { setRejecting(false); }
  };

  const subjects = [...new Set([...pending, ...history].map(i => i.subject).filter(Boolean))];
  const displayList = activeTab === 'pending' ? pending : history;

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Principal Dashboard</h1>
          <p className="text-gray-400">Review and moderate educational broadcasts</p>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-gray-400 hover:text-white transition-colors">Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-full font-semibold transition-all ${activeTab === 'pending' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          Pending ({pending.length})
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-full font-semibold transition-all ${activeTab === 'history' ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
          All Content
        </button>
      </div>

      {/* Filters (history tab only) */}
      {activeTab === 'history' && (
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <Filter size={16} className="text-gray-500" />
          <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setHistoryPage(1); }} className="glass-input py-1.5 px-3 text-sm w-auto min-w-[140px]">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setHistoryPage(1); }} className="glass-input py-1.5 px-3 text-sm w-auto min-w-[140px]">
            <option value="">All Status</option>
            <option value="uploaded">Uploaded</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {/* Content Grid */}
      <div className="glass-card p-6 min-h-[500px]">
        {loading ? (
          <div className="flex-center h-64"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayList.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-500 italic">No {activeTab} content to show.</div>
              ) : (
                displayList.map(item => (
                  <div key={item.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {/* File thumbnail — clickable for preview */}
                          <button onClick={() => setPreviewItem(item)} className="w-10 h-10 rounded-xl overflow-hidden bg-purple-500/20 flex items-center justify-center text-purple-400 hover:ring-2 hover:ring-purple-500/50 transition-all flex-shrink-0">
                            {item.file_url ? <img src={item.file_url} alt="" className="w-full h-full object-cover" /> : <FileText size={20} />}
                          </button>
                          <div>
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <span className="text-xs font-bold text-indigo-400 uppercase">{item.subject}</span>
                          </div>
                        </div>
                        {item.status !== 'pending' && item.status !== 'uploaded' && (
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{item.status}</span>
                        )}
                        {item.status === 'uploaded' && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400">uploaded</span>}
                      </div>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{item.description || 'No description provided.'}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
                        <span className="flex items-center gap-1"><Clock size={14} /> {item.start_time ? new Date(item.start_time).toLocaleString() : 'Not scheduled'}</span>
                        {item.users?.name && <span>by {item.users.name}</span>}
                      </div>
                    </div>

                    {['pending', 'uploaded'].includes(item.status) ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => openRejectModal(item)} className="flex items-center justify-center gap-2 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all">
                          <X size={16} /> Reject
                        </button>
                        <button onClick={() => handleApprove(item.id)} disabled={approvingId === item.id} className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-60">
                          {approvingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Approve</>}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/20 flex items-center gap-2 text-xs text-gray-400 italic">
                        <Info size={14} />
                        {item.rejection_reason ? `Rejected: ${item.rejection_reason}` : `Approved on ${new Date(item.approved_at).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pagination for history tab */}
            {activeTab === 'history' && historyMeta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
                <button onClick={() => setHistoryPage(p => Math.max(p - 1, 1))} disabled={historyPage === 1} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 text-sm text-gray-300 disabled:opacity-30 hover:bg-white/10 transition-all">
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray-500">Page {historyPage} of {historyMeta.totalPages} ({historyMeta.total} items)</span>
                <button onClick={() => setHistoryPage(p => Math.min(p + 1, historyMeta.totalPages))} disabled={historyPage === historyMeta.totalPages} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 text-sm text-gray-300 disabled:opacity-30 hover:bg-white/10 transition-all">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) closeRejectModal(); }}>
          <div className="glass-card p-6 w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><AlertTriangle size={20} className="text-rose-400" /></div>
              <div><h3 className="text-lg font-bold">Reject Content</h3><p className="text-xs text-gray-400">The teacher will see your reason</p></div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
              <p className="text-xs text-gray-400 mb-1">Content being rejected</p>
              <p className="font-semibold text-white">{selectedItem?.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selectedItem?.subject}</p>
            </div>
            <div className="flex flex-col gap-2 mb-5">
              <label className="text-sm text-gray-400">Rejection Reason <span className="text-rose-400">*</span></label>
              <textarea className="glass-input w-full h-28 resize-none text-sm leading-relaxed" placeholder="Explain why this content is being rejected..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} autoFocus />
              <p className="text-xs text-gray-500 text-right">{rejectReason.length} chars</p>
            </div>
            <div className="flex gap-3">
              <button onClick={closeRejectModal} disabled={rejecting} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium disabled:opacity-40">Cancel</button>
              <button onClick={handleReject} disabled={rejecting || !rejectReason.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {rejecting ? <><Loader2 size={15} className="animate-spin" /> Rejecting...</> : <><XCircle size={15} /> Confirm Reject</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) setPreviewItem(null); }}>
          <div className="glass-card p-6 w-full max-w-2xl mx-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold">{previewItem.title}</h3>
                <p className="text-xs text-indigo-400 uppercase font-bold">{previewItem.subject}</p>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            {previewItem.file_url && (
              <div className="rounded-xl overflow-hidden bg-black/30 mb-4">
                <img src={previewItem.file_url} alt={previewItem.title} className="w-full max-h-[60vh] object-contain" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
              <div><span className="text-gray-600">Type:</span> {previewItem.file_type}</div>
              <div><span className="text-gray-600">Size:</span> {(previewItem.file_size / 1024).toFixed(1)} KB</div>
              <div><span className="text-gray-600">Start:</span> {previewItem.start_time ? new Date(previewItem.start_time).toLocaleString() : 'Not set'}</div>
              <div><span className="text-gray-600">End:</span> {previewItem.end_time ? new Date(previewItem.end_time).toLocaleString() : 'Not set'}</div>
            </div>
            {previewItem.description && <p className="mt-3 text-sm text-gray-400">{previewItem.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;