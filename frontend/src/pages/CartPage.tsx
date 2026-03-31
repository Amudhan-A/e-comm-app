import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { Trash2, ShoppingBag } from 'lucide-react';

const CartPage = () => {
  const { items, totalAmount, updateQuantity, removeFromCart } = useCartStore();
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1000px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="card center-flex" style={{ padding: '4rem', flexDirection: 'column', color: 'var(--text-muted)' }}>
          <ShoppingBag size={64} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Your cart is empty</h2>
          <p style={{ marginBottom: '2rem' }}>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <ul style={{ listStyle: 'none' }}>
              {items.map((item, index) => (
                <li key={item.productId} style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  padding: '1.5rem 0', 
                  borderBottom: index !== items.length - 1 ? '1px solid var(--border-color)' : 'none' 
                }}>
                  <div style={{ width: '100px', height: '100px', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{item.productName}</h3>
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '1rem' }}>${item.price.toFixed(2)}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-secondary)' }}
                        >-</button>
                        <span style={{ padding: '0 1rem', fontSize: '0.875rem', fontWeight: 500 }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-secondary)' }}
                        >+</button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.125rem' }}>
                    ${item.subtotal.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <div className="card" style={{ padding: '2rem', position: 'sticky', top: 'calc(var(--nav-height) + 2rem)' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>Order Summary</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2rem 0', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '1.25rem', fontWeight: 700 }}>
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              
              <button 
                onClick={() => navigate('/checkout')}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
