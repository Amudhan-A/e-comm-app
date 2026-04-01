import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { useCartStore } from '../store/useCartStore';
import { MapPin, CreditCard, AlertCircle, ShoppingBag } from 'lucide-react';

const Checkout = () => {
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { items, totalAmount, clearCartState } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="bg-black min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 pt-24">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center backdrop-blur-sm max-w-lg w-full">
          <ShoppingBag size={64} className="mb-6 text-white/20" />
          <h2 className="text-2xl font-light text-white mb-4">Your cart is empty</h2>
          <button onClick={() => navigate('/shop')} className="mt-4 bg-white text-black px-8 py-3 rounded-full font-medium text-sm hover:bg-white/90 transition-colors">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('Shipping address is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = await fetchApi('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ shippingAddress })
      });
      clearCartState();
      alert(`Order placed successfully! Order ID: ${(orderData as any).orderId}`);
      navigate('/orders');
    } catch (err: any) {
      if (err.data?.errors) {
        setError(Object.values(err.data.errors).join(', '));
      } else {
        setError(err.message || 'Checkout failed. Ensure items are in stock.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-[calc(100vh-80px)] text-white pt-24 pb-20 px-6">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-10">Checkout</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-start gap-3 backdrop-blur-sm">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-light">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden">
            {/* Ambient Background Glow for aesthetics */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            
            <form onSubmit={handleCheckout} className="relative z-10">
              <h2 className="text-xl font-medium mb-8 pb-4 border-b border-white/10 flex items-center gap-2">
                <MapPin size={20} className="text-white/70" /> Shipping Information
              </h2>
              
              <div className="mb-8">
                <label htmlFor="shippingAddress" className="block text-white/70 text-sm font-light mb-3 ml-1">
                  Full Shipping Address
                </label>
                <div className="relative group">
                  <textarea 
                    id="shippingAddress" 
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="123 Main St, Apt 4B&#10;City, State, ZIP&#10;Country"
                    rows={4}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all resize-y text-sm font-light"
                  />
                </div>
              </div>
              
              <div className="mb-8 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <CreditCard size={16} className="text-white/50" /> Payment Details
                </h3>
                <p className="text-xs text-white/50 font-light">
                  This demo application currently processes all orders securely without requiring direct payment gateway interaction.
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || items.length === 0} 
                className="w-full bg-white text-black py-4 rounded-xl font-medium tracking-wide hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
              >
                {loading ? 'Processing Order...' : `Place Order • $${totalAmount.toFixed(2)}`}
              </button>
            </form>
          </div>

          <div className="w-full lg:w-[380px] flex-shrink-0">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 sticky top-28 backdrop-blur-sm">
              <h3 className="text-xl font-medium mb-6 pb-4 border-b border-white/10">Order Summary</h3>
              <ul className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <li key={item.productId} className="flex justify-between items-start gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-white/80 font-light line-clamp-2">{item.productName}</span>
                      <span className="text-white/40 text-xs">Qty: {item.quantity}</span>
                    </div>
                    <span className="text-white font-medium whitespace-nowrap">${item.subtotal.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex justify-between text-white/60 font-light text-sm">
                  <span>Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60 font-light text-sm">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="flex justify-between pt-6 mt-6 border-t border-white/10">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-light">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
