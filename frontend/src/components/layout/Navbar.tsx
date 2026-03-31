import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCartStore } from '../../store/useCartStore';
import { useTheme } from '../../contexts/ThemeContext';
import { ShoppingCart, User, LogOut, Sun, Moon, Package } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="nav-logo">
          <Package size={24} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>E-Commerce</span>
        </Link>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/shop" className="nav-link">Shop</Link>
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="nav-icon-btn" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <Link to="/cart" className="nav-cart-btn" aria-label="Cart">
            <ShoppingCart size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          {user ? (
            <div className="nav-user-menu">
              <Link to={user.role === 'ADMIN' ? '/admin' : '/orders'} className="nav-user-info">
                <User size={20} />
                <span>{user.firstName}</span>
              </Link>
              <button onClick={handleLogout} className="nav-icon-btn" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-links">
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
