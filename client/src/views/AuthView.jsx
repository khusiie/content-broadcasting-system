import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Shield, GraduationCap } from 'lucide-react';
import api from '../utils/api';

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, formData);
      
      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'principal') {
          navigate('/principal');
        } else {
          navigate('/teacher');
        }
      } else {
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center min-h-screen p-4">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Join System'}
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Login to manage your broadcast' : 'Create an account to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <input
                type="text"
                className="glass-input"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              className="glass-input"
              placeholder="name@school.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              className="glass-input"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {!isLogin && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Select Role</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    formData.role === 'teacher' 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'teacher' })}
                >
                  <GraduationCap size={18} />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    formData.role === 'principal' 
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'principal' })}
                >
                  <Shield size={18} />
                  <span>Principal</span>
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}

          <button 
            type="submit" 
            className="btn-primary flex items-center justify-center gap-2 mt-4"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? (
              <><LogIn size={18} /> Login</>
            ) : (
              <><UserPlus size={18} /> Register</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 font-semibold hover:underline"
          >
            {isLogin ? 'Register Now' : 'Login Here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
