import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api/fetchApi';
import { Package, ShoppingBag, Plus, Save, Edit, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  
  // States
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Product Form State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduciId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: 0, stock: 10, category: 'ELECTRONICS', imageUrl: ''
  });

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    else fetchOrders();
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data: any = await fetchApi('/api/products?size=100');
      setProducts(data.content);
    } catch (err) { }
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data: any = await fetchApi('/api/orders?size=100');
      setOrders(data.content);
    } catch (err) { }
    setLoading(false);
  };

  const handeProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduciId) {
        await fetchApi(`/api/products/${editingProduciId}`, {
          method: 'PUT',
          body: JSON.stringify(productForm)
        });
      } else {
        await fetchApi('/api/products', {
          method: 'POST',
          body: JSON.stringify(productForm)
        });
      }
      setShowProductForm(false);
      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await fetchApi(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {}
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await fetchApi(`/api/orders/${id}/status?status=${status}`, { method: 'PATCH' });
      fetchOrders();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '2rem' }}>
      <aside style={{ width: '250px' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Admin Menu</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('products')}
              style={{
                display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', 
                borderRadius: '0.5rem', width: '100%', textAlign: 'left',
                backgroundColor: activeTab === 'products' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'products' ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: activeTab === 'products' ? 600 : 400
              }}
            >
              <Package size={20} /> Products
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              style={{
                display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', 
                borderRadius: '0.5rem', width: '100%', textAlign: 'left',
                backgroundColor: activeTab === 'orders' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'orders' ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: activeTab === 'orders' ? 600 : 400
              }}
            >
              <ShoppingBag size={20} /> Orders
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>{activeTab === 'products' ? 'Manage Products' : 'Manage Orders'}</h2>
          
          {activeTab === 'products' && !showProductForm && (
            <button className="btn btn-primary" onClick={() => {
              setProductForm({ name: '', description: '', price: 0, stock: 10, category: 'ELECTRONICS', imageUrl: '' });
              setEditingProductId(null);
              setShowProductForm(true);
            }}>
              <Plus size={20} /> Add Product
            </button>
          )}
        </div>

        {loading ? (
          <div className="center-flex" style={{ height: '300px' }}>Loading...</div>
        ) : activeTab === 'products' ? (
          showProductForm ? (
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>{editingProduciId ? 'Edit Product' : 'New Product'}</h3>
              <form onSubmit={handeProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>Name</label>
                  <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
                </div>
                <div>
                  <label>Description</label>
                  <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} required rows={3} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Price ($)</label>
                    <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} required />
                  </div>
                  <div>
                    <label>Stock</label>
                    <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value)})} required />
                  </div>
                  <div>
                    <label>Category</label>
                    <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                      {['ELECTRONICS', 'CLOTHING', 'FOOTWEAR', 'BOOKS', 'HOME_AND_KITCHEN', 'SPORTS', 'BEAUTY', 'TOYS', 'GROCERIES', 'OTHER'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label>Image URL</label>
                  <input type="url" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary"><Save size={20} /> Save Product</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProductForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <tr>
                    <th style={{ padding: '1rem' }}>Product</th>
                    <th style={{ padding: '1rem' }}>Category</th>
                    <th style={{ padding: '1rem' }}>Price</th>
                    <th style={{ padding: '1rem' }}>Stock</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.productId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <img src={p.imageUrl} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem' }} />
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>{p.category}</td>
                      <td style={{ padding: '1rem' }}>${p.price.toFixed(2)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ color: p.inStock ? 'var(--success-color)' : 'var(--error-color)' }}>{p.stock}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => { setProductForm(p); setEditingProductId(p.productId); setShowProductForm(true); }} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} title="Edit"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteProduct(p.productId)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} title="Delete"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>Order ID</th>
                  <th style={{ padding: '1rem' }}>User ID</th>
                  <th style={{ padding: '1rem' }}>Total</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{o.orderId.substring(0, 8)}</td>
                    <td style={{ padding: '1rem' }}>{o.userId}</td>
                    <td style={{ padding: '1rem' }}>${o.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{o.status}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <select 
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value)}
                        style={{ padding: '0.25rem', width: 'auto' }}
                      >
                        <option value="PLACED">PLACED</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
