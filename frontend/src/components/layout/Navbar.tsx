import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCartStore } from '../../store/useCartStore';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems, fetchCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  const handleLogout = async () => {
    try {
      await logout();
      useCartStore.getState().clearCartState();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-3 text-white group">
          <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
            <Package size={20} className="text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">E-Commerce</span>
        </Link>
      </div>
      
      <nav className="hidden md:flex items-center space-x-1">
        <Link to="/" className="text-white/80 hover:text-white text-xs font-light px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Home</Link>
        <Link to="/shop" className="text-white/80 hover:text-white text-xs font-light px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Shop</Link>
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="text-white hover:text-white text-xs font-medium px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-200 ml-2">
            Admin Dashboard
          </Link>
        )}
      </nav>
      
      <div className="flex items-center gap-4">
        <Link to="/cart" className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200">
          <ShoppingCart size={18} />
          {totalItems > 0 && <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">{totalItems}</span>}
        </Link>
        
        {user ? (
          <div className="flex items-center gap-2">
            <Link to={user.role === 'ADMIN' ? '/admin' : '/orders'} className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">
              <User size={16} />
              <span className="hidden sm:inline">{user.firstName}</span>
            </Link>
            <button onClick={handleLogout} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-white/80 hover:text-white text-xs font-light px-4 py-2 rounded-full hover:bg-white/10 transition-all duration-200 hidden sm:block">Log In</Link>
            <Link to="/register" className="px-6 py-2 rounded-full bg-white text-black font-medium text-xs transition-all duration-300 hover:bg-white/90">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
