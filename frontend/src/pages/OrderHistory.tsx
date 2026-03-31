import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { Package } from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageInfo, setPageInfo] = useState({ pageNumber: 0, totalPages: 1, last: true });
  const [error, setError] = useState('');

  const page = parseInt(searchParams.get('page') || '0', 10);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data: any = await fetchApi(`/api/orders?page=${page}&size=10`);
      setOrders(data.content);
      setPageInfo({
        pageNumber: data.pageNumber,
        totalPages: data.totalPages,
        last: data.last
      });
    } catch (err: any) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await fetchApi(`/api/orders/${orderId}/cancel`, { method: 'PATCH' });
      // update state locally
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'CANCELLED' } : o));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PLACED': return 'var(--accent-primary)';
      case 'CONFIRMED': return 'var(--success-color)';
      case 'SHIPPED': return '#3b82f6';
      case 'DELIVERED': return '#10b981';
      case 'CANCELLED': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
    }
  };

  if (loading && orders.length === 0) return <div className="center-flex" style={{ height: '50vh' }}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1000px' }}>
      <h1 style={{ marginBottom: '2rem' }}>My Orders</h1>

      {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</div>}

      {orders.length === 0 ? (
        <div className="card center-flex" style={{ padding: '4rem', flexDirection: 'column', color: 'var(--text-muted)' }}>
          <Package size={64} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
          <h2>No orders found</h2>
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => (
            <div key={order.orderId} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Order #{order.orderId.substring(0, 8)}...</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-secondary)',
                    color: getStatusColor(order.status)
                  }}>
                    {order.status}
                  </span>
                  <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '1.125rem' }}>
                    ${order.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Items</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {order.items.map((item: any) => (
                    <div key={item.productId} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.25rem', overflow: 'hidden' }}>
                        <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{item.productName}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Qty: {item.quantity} • ${item.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.status === 'PLACED' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <button 
                    onClick={() => handleCancelOrder(order.orderId)} 
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn btn-secondary"
              disabled={page === 0}
              onClick={() => setSearchParams(prev => { prev.set('page', (page - 1).toString()); return prev; })}
            >
              Previous
            </button>
            <button 
              className="btn btn-secondary"
              disabled={pageInfo.last}
              onClick={() => setSearchParams(prev => { prev.set('page', (page + 1).toString()); return prev; })}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
