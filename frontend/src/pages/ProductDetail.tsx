import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { ShoppingCart, ArrowLeft, CheckCircle, XCircle, Minus, Plus } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await fetchApi(`/api/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAdd = async () => {
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        quantity
      });
      alert('Product added to cart successfully!');
    } catch (err) {
      alert('Error adding to cart, please log in.');
      navigate('/login');
    }
  };

  if (loading) return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-t-2 border-r-2 border-white animate-spin"></div>
    </div>
  );
  
  if (!product) return (
    <div className="bg-black min-h-screen flex items-center justify-center text-white/50 text-xl font-light">
      Product not found.
    </div>
  );

  return (
    <div className="bg-black min-h-screen text-white pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 font-light text-sm p-2 rounded-full hover:bg-white/5 w-fit"
        >
          <ArrowLeft size={16} /> Back to Shop
        </button>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row backdrop-blur-sm relative">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>
          
          {/* Image */}
          <div className="w-full md:w-1/2 bg-black/40 flex items-center justify-center p-12 relative overflow-hidden group">
            <img 
              src={product.imageUrl || UNSPLASH_IMAGES[product.id?.charCodeAt(0) % UNSPLASH_IMAGES.length || 0]} 
              alt={product.name} 
              className="w-full h-auto max-h-[600px] object-contain transition-transform duration-700 group-hover:scale-105 z-10" 
            />
          </div>
          
          {/* Details */}
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col relative z-10">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-white/10 text-white/80 rounded-full text-[10px] uppercase tracking-widest font-medium border border-white/5">
                {product.category.replace(/_/g, ' ')}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6">
              {product.name}
            </h1>
            
            <p className="text-3xl md:text-4xl font-light text-white mb-8">
              ${product.price.toFixed(2)}
            </p>
            
            <div className={`flex gap-3 items-center mb-10 text-sm font-medium ${product.inStock ? 'text-green-400' : 'text-red-400'}`}>
              {product.inStock ? <CheckCircle size={18} /> : <XCircle size={18} />}
              <span>
                {product.inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            <div className="prose prose-invert max-w-none mb-12 flex-1">
              <p className="text-white/60 font-light leading-relaxed text-lg">
                {product.description || "No specific description available for this premium item. Experience unparalleled quality and design with this exclusive product."}
              </p>
            </div>

            {product.inStock && (
              <div className="flex flex-col sm:flex-row gap-4 items-center w-full mt-auto">
                <div className="flex items-center justify-between border border-white/20 rounded-xl overflow-hidden bg-black/50 w-full sm:w-auto self-stretch">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-6 py-4 hover:bg-white/10 text-white transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-6 font-medium text-lg w-16 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-6 py-4 hover:bg-white/10 text-white transition-colors border-l border-white/10"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={handleAdd} 
                  className="flex-1 w-full bg-white text-black pl-6 pr-8 py-4 rounded-xl flex items-center justify-center gap-3 font-medium text-lg hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 transform active:scale-[0.98]"
                >
                  <ShoppingCart size={20} /> Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
