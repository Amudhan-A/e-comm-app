import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      await login({ email, password });
      navigate('/'); // Redirect to home on success
    } catch (err: any) {
      setError(err.message || 'Login failed Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="bg-white/5 border border-white/10 p-10 md:p-14 rounded-3xl w-full max-w-md relative z-10 backdrop-blur-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-white/5 rounded-2xl border border-white/10 mb-6 group hover:bg-white/10 transition-colors">
            <Package size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mb-2">Welcome Back</h2>
          <p className="text-white/50 font-light">Log in to your premier account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-light">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="email" className="block text-white/70 text-sm font-light mb-2 ml-1">Email Address</label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-white/70 text-sm font-light mb-2 ml-1">Password</label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-white text-black py-4 mt-2 rounded-xl font-medium tracking-wide hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center mt-8 text-white/50 font-light text-sm">
          Don't have an account? <Link to="/register" className="text-white hover:text-white/80 font-medium transition-colors ml-1 border-b border-white/30 hover:border-white pb-0.5">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
