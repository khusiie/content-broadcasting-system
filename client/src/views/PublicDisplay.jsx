import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Tv, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const PublicDisplay = () => {
  const { teacherId } = useParams();
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    try {
      const { data } = await api.get(`/public/live/${teacherId}`);
      if (Array.isArray(data) && data.length > 0) {
        setContent(data[0]); // Show the first active item for this teacher
      } else {
        setContent(null);
      }
    } catch (err) {
      setError('System Offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [teacherId]);

  if (loading) return <div className="flex-center min-h-screen"><Tv className="animate-pulse text-indigo-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />

      {content ? (
        <div className="w-full max-w-6xl animate-fade-in flex flex-col items-center text-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <img 
              src={content.file_url} 
              alt={content.title}
              className="relative rounded-2xl max-h-[70vh] shadow-2xl object-contain border border-white/10"
            />
          </div>
          
          <div className="mt-12 space-y-4">
            <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 font-bold uppercase tracking-widest text-sm">
              {content.subject}
            </span>
            <h1 className="text-6xl font-black !bg-clip-text !text-white leading-tight">
              {content.title}
            </h1>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              {content.description || 'Welcome to the live educational broadcast.'}
            </p>
          </div>

          <div className="mt-12 flex items-center gap-6 text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span>Broadcast Active</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Update Every 30s</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center animate-fade-in">
          <AlertCircle size={64} className="text-gray-700 mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-gray-600 mb-4">No Active Broadcast</h1>
          <p className="text-xl text-gray-700">Please wait for the next scheduled lesson.</p>
          <div className="mt-12 p-6 glass-card bg-white/[0.01]">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Display ID: {teacherId}</p>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="fixed bottom-8 left-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex-center text-white">
          <Tv size={16} />
        </div>
        <span className="font-bold text-gray-500 tracking-tighter">EDU-CAST</span>
      </div>
    </div>
  );
};

export default PublicDisplay;
