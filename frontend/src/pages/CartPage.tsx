
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
];

const CartPage = () => {
  const { items, totalAmount, updateQuantity, removeFromCart } = useCartStore();
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-[calc(100vh-80px)] text-white pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-10">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center backdrop-blur-sm min-h-[400px]">
            <ShoppingBag size={64} className="mb-6 text-white/20" />
            <h2 className="text-2xl font-light text-white mb-4">Your cart is empty</h2>
            <p className="text-white/50 mb-8 font-light max-w-md">Looks like you haven't added anything to your cart yet. Discover our premium collection.</p>
            <Link to="/shop" className="bg-white text-black px-8 py-3 rounded-full font-medium text-sm hover:bg-white/90 transition-colors flex items-center gap-2">
              Start Shopping <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm h-fit">
              <ul className="space-y-6">
                {items.map((item, index) => (
                  <li key={item.productId} className={`flex flex-col sm:flex-row gap-6 pb-6 ${index !== items.length - 1 ? 'border-b border-white/10' : ''}`}>
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-xl border border-white/5 overflow-hidden flex-shrink-0 relative group">
                      <img 
                        src={item.imageUrl || UNSPLASH_IMAGES[index % UNSPLASH_IMAGES.length]} 
                        alt={item.productName} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium text-white line-clamp-2 pr-4">{item.productName}</h3>
                        <div className="text-right font-medium text-lg min-w-max">
                          ${item.subtotal.toFixed(2)}
                        </div>
                      </div>
                      
                      <p className="text-white/60 font-light mb-auto">${item.price.toFixed(2)} each</p>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="inline-flex items-center border border-white/10 rounded-full bg-black/40 p-1">
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.productId)}
                          className="text-white/40 hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm p-2"
                        >
                          <Trash2 size={16} /> <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Order Summary */}
            <div className="w-full lg:w-[340px] flex-shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 sticky top-28 backdrop-blur-sm">
                <h3 className="text-xl font-medium mb-6 pb-4 border-b border-white/10 text-white">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-white/70 font-light">
                    <span>Subtotal</span>
                    <span className="text-white">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/70 font-light">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-6 border-t border-white/10 mb-6">
                  <span className="text-lg font-medium text-white">Total</span>
                  <span className="text-2xl font-light text-white">${totalAmount.toFixed(2)}</span>
                </div>
                
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-white text-black py-4 rounded-xl font-medium tracking-wide hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
