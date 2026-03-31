import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Shop = React.lazy(() => import('./pages/Shop'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const OrderHistory = React.lazy(() => import('./pages/OrderHistory'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="center-flex" style={{ height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

function App() {
  const { loading } = useAuth();
  
  if (loading) {
    return <div className="center-flex" style={{ height: '100vh' }}>Loading application...</div>;
  }

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <React.Suspense fallback={<div className="center-flex" style={{ padding: '2rem' }}>Loading...</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Customer Routes */}
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />

              {/* Protected Admin Routes */}
              <Route path="/admin/*" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </React.Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
