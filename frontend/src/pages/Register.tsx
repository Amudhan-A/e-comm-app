import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword } = formData;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      await register({ firstName, lastName, email, password });
      navigate('/');
    } catch (err: any) {
      if (err.data?.errors) {
        // Validation Error shape
        const msgs = Object.values(err.data.errors).join(', ');
        setError(msgs);
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white flex items-center justify-center p-6 relative overflow-hidden py-24">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="bg-white/5 border border-white/10 p-10 md:p-14 rounded-3xl w-full max-w-lg relative z-10 backdrop-blur-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-white/5 rounded-2xl border border-white/10 mb-6 group hover:bg-white/10 transition-colors">
            <Package size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mb-2">Create an Account</h2>
          <p className="text-white/50 font-light">Join our premium community today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-light">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="firstName" className="block text-white/70 text-sm font-light mb-2 ml-1">First Name</label>
              <input 
                id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-white/70 text-sm font-light mb-2 ml-1">Last Name</label>
              <input 
                id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-white/70 text-sm font-light mb-2 ml-1">Email Address</label>
            <input 
              id="email" type="email" name="email" value={formData.email} onChange={handleChange} required 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-white/70 text-sm font-light mb-2 ml-1">Password</label>
            <input 
              id="password" type="password" name="password" value={formData.password} onChange={handleChange} required 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-white/70 text-sm font-light mb-2 ml-1">Confirm Password</label>
            <input 
              id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-white text-black py-4 mt-4 rounded-xl font-medium tracking-wide hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-8 text-white/50 font-light text-sm">
          Already have an account? <Link to="/login" className="text-white hover:text-white/80 font-medium transition-colors ml-1 border-b border-white/30 hover:border-white pb-0.5">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
