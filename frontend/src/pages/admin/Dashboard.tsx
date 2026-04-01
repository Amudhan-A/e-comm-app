import { useState, useEffect } from 'react';
import { fetchApi } from '../../api/fetchApi';
import { Plus, Save, Edit, Trash2, AlertCircle } from 'lucide-react';
import { TwoLevelSidebar } from '../../components/ui/sidebar-component';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  
  // States
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    setError(null);
    try {
      const data: any = await fetchApi('/api/products?size=100');
      setProducts(data.content);
    } catch (err) {
      setError('Failed to fetch products');
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await fetchApi('/api/orders/all?size=100');
      setOrders(data.content);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(`Failed to fetch orders: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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
    <div className="bg-black min-h-screen text-white pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Global Two-Level Sidebar Integration */}
          <div className="fixed inset-y-0 left-0 z-50 lg:relative lg:z-0">
            <TwoLevelSidebar onTabChange={(tab) => setActiveTab(tab)} />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-light tracking-tight">
                {activeTab === 'products' ? 'Product Management' : 'Order Management'}
              </h2>
              
              {activeTab === 'products' && !showProductForm && (
                <button 
                  className="bg-white text-black px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  onClick={() => {
                    setProductForm({ name: '', description: '', price: 0, stock: 10, category: 'ELECTRONICS', imageUrl: '' });
                    setEditingProductId(null);
                    setShowProductForm(true);
                  }}
                >
                  <Plus size={18} /> Add Product
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-start gap-3 backdrop-blur-sm">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-light">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-24 flex items-center justify-center backdrop-blur-sm">
                <div className="h-8 w-8 rounded-full border-t-2 border-r-2 border-white animate-spin"></div>
              </div>
            ) : activeTab === 'products' ? (
              showProductForm ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                   {/* Ambient Glow */}
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
                   
                  <h3 className="text-xl font-medium mb-8 pb-4 border-b border-white/10">
                    {editingProduciId ? 'Edit Product Details' : 'Initialize New Product'}
                  </h3>
                  <form onSubmit={handeProductSubmit} className="flex flex-col gap-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm text-white/50 ml-1">Product Name</label>
                        <input 
                          type="text" 
                          value={productForm.name} 
                          onChange={e => setProductForm({...productForm, name: e.target.value})} 
                          required 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/50 ml-1">Category</label>
                        <select 
                          value={productForm.category} 
                          onChange={e => setProductForm({...productForm, category: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-white/30 outline-none transition-all font-light appearance-none"
                        >
                          {['ELECTRONICS', 'CLOTHING', 'FOOTWEAR', 'BOOKS', 'HOME_AND_KITCHEN', 'SPORTS', 'BEAUTY', 'TOYS', 'GROCERIES', 'OTHER'].map(c => (
                            <option key={c} value={c} className="bg-zinc-900">{c.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/50 ml-1">Description</label>
                      <textarea 
                        value={productForm.description} 
                        onChange={e => setProductForm({...productForm, description: e.target.value})} 
                        required 
                        rows={3} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all font-light resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm text-white/50 ml-1">Price ($)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={productForm.price} 
                          onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} 
                          required 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-white/30 outline-none transition-all font-light"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/50 ml-1">Initial Stock</label>
                        <input 
                          type="number" 
                          value={productForm.stock} 
                          onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value)})} 
                          required 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-white/30 outline-none transition-all font-light"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/50 ml-1">Image URL</label>
                        <input 
                          type="url" 
                          value={productForm.imageUrl} 
                          onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} 
                          required 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/20 focus:border-white/30 outline-none transition-all font-light"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-white/10">
                      <button 
                        type="submit" 
                        className="bg-white text-black px-8 py-3.5 rounded-xl font-medium tracking-wide hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all flex items-center gap-2"
                      >
                        <Save size={18} /> {editingProduciId ? 'Update Product' : 'Create Product'}
                      </button>
                      <button 
                        type="button" 
                        className="text-white/40 hover:text-white px-6 py-3.5 rounded-xl transition-colors font-light"
                        onClick={() => setShowProductForm(false)}
                      >
                        Discard Changes
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/[0.02] border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest">Product</th>
                          <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest">Category</th>
                          <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest">Price</th>
                          <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest">Stock</th>
                          <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {products.map(p => (
                          <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black/40">
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-medium text-white/90 group-hover:text-white transition-colors">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-medium tracking-wider text-white/60">
                                {p.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white/80 font-light">${p.price.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,44,44,0.5)]'}`}></div>
                                <span className={`text-sm font-light ${p.inStock ? 'text-green-400' : 'text-red-400'}`}>{p.stock}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setProductForm(p); setEditingProductId(p.id); setShowProductForm(true); }} className="p-2 rounded-lg bg-white/5 hover:bg-white hover:text-black transition-all border border-white/10" title="Edit"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title="Delete"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.02] border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest text-center">User</th>
                        <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest">Total</th>
                        <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 font-medium text-white/40 text-xs uppercase tracking-widest text-right">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map(o => (
                        <tr key={o.orderId} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-white/60">#{o.orderId.substring(0, 8)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-[10px] text-white/50 border border-white/10">
                              {o.userId.substring(0, 2).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-white">${o.totalAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-white/40 text-sm font-light">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest bg-white/5 border border-white/10">
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <select 
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/30 transition-all appearance-none cursor-pointer"
                            >
                              <option value="PLACED" className="bg-zinc-900 uppercase">PLACED</option>
                              <option value="CONFIRMED" className="bg-zinc-900 uppercase">CONFIRMED</option>
                              <option value="SHIPPED" className="bg-zinc-900 uppercase">SHIPPED</option>
                              <option value="DELIVERED" className="bg-zinc-900 uppercase">DELIVERED</option>
                              <option value="CANCELLED" className="bg-zinc-900 uppercase">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
