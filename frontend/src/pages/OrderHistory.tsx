import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { Package, ChevronRight, ChevronLeft } from 'lucide-react';

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
];

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
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'CANCELLED' } : o));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PLACED': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'CONFIRMED': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'SHIPPED': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'DELIVERED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  if (loading && orders.length === 0) return (
    <div className="bg-black min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-t-2 border-r-2 border-white animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-black min-h-[calc(100vh-80px)] text-white pt-24 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-10">My Orders</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 backdrop-blur-sm">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center backdrop-blur-sm min-h-[400px]">
            <Package size={64} className="mb-6 text-white/20" />
            <h2 className="text-2xl font-light text-white mb-2">No orders found</h2>
            <p className="text-white/50 font-light max-w-md">You haven't placed any orders yet. Once you make a purchase, your history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.orderId} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm overflow-hidden relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 mb-6 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">
                      Order <span className="text-white/60 font-mono tracking-wider text-sm">#{order.orderId.substring(0, 8)}...</span>
                    </h3>
                    <p className="text-white/40 text-sm font-light">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-left md:text-right flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 md:gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <div className="text-xl font-light text-white">
                      ${order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm text-white/60 font-light mb-4 tracking-wide uppercase">Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {order.items.map((item: any, idx: number) => (
                      <div key={item.productId} className="flex gap-4 items-center bg-black/40 p-4 rounded-xl border border-white/5">
                        <div className="w-14 h-14 bg-white/5 rounded-lg border border-white/5 overflow-hidden flex-shrink-0">
                          <img 
                            src={item.imageUrl || UNSPLASH_IMAGES[idx % UNSPLASH_IMAGES.length]} 
                            alt={item.productName} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate pr-2 mb-1">{item.productName}</div>
                          <div className="text-white/50 text-xs font-light tracking-wide">Qty: {item.quantity} &times; ${item.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.status === 'PLACED' && (
                  <div className="flex justify-end border-t border-white/10 pt-6 mt-2">
                    <button 
                      onClick={() => handleCancelOrder(order.orderId)} 
                      className="px-6 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl transition-colors text-sm font-medium"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {pageInfo.totalPages > 1 && (
              <div className="flex justify-center flex-wrap gap-4 mt-12 bg-white/5 border border-white/10 py-4 px-6 rounded-2xl w-fit mx-auto backdrop-blur-sm">
                <button 
                  disabled={page === 0}
                  onClick={() => setSearchParams(prev => { prev.set('page', (page - 1).toString()); return prev; })}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white text-sm"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <div className="flex items-center text-white/50 font-light text-sm px-2">
                  Page <span className="text-white mx-1">{pageInfo.pageNumber + 1}</span> of {pageInfo.totalPages}
                </div>
                <button 
                  disabled={pageInfo.last}
                  onClick={() => setSearchParams(prev => { prev.set('page', (page + 1).toString()); return prev; })}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white text-sm"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
