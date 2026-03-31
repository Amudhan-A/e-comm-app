import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { useCartStore } from '../store/useCartStore';

const Checkout = () => {
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { items, totalAmount, clearCartState } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container center-flex" style={{ height: '50vh', flexDirection: 'column' }}>
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/shop')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Shop
        </button>
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
      // Important rule: clear internal cart state after successful order placement
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
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Checkout</h1>
      
      {error && (
        <div style={{ backgroundColor: 'var(--error-color)', color: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px', gap: '2rem', alignItems: 'flex-start' }}>
        <form onSubmit={handleCheckout} className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Shipping Information</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="shippingAddress" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Shipping Address</label>
            <textarea 
              id="shippingAddress" 
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="123 Main St, Appt 4B&#10;City, State, ZIP&#10;Country"
              rows={4}
              required
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading || items.length === 0} style={{ width: '100%', padding: '1rem' }}>
            {loading ? 'Processing...' : `Place Order • $${totalAmount.toFixed(2)}`}
          </button>
        </form>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>Order Summary</h3>
          <ul style={{ listStyle: 'none', marginBottom: '1rem' }}>
            {items.map(item => (
              <li key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}x {item.productName}</span>
                <span style={{ fontWeight: 500 }}>${item.subtotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontWeight: 700, fontSize: '1.125rem' }}>
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
