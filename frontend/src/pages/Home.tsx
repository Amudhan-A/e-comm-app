import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { ShaderBackground, HeroContent } from '../components/ui/shaders-hero-section';

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800", // minimal watch
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800", // headphones
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800", // sneakers
  "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=800"  // perfume
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const { addToCart } = useCartStore();

  useEffect(() => {
    fetchApi<any>('/api/products?size=4')
      .then(data => setFeaturedProducts(data.content))
      .catch(err => console.error(err));
  }, []);

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        quantity: 1
      });
      alert('Added to cart!');
    } catch (err) {
      alert('Must be logged in to add to cart!');
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <ShaderBackground>
        <HeroContent>
          <Link to="/shop" className="px-8 py-3 rounded-full bg-white text-black font-medium text-sm transition-all duration-300 hover:bg-white/90 cursor-pointer flex items-center gap-2 w-fit mx-auto">
            Shop Catalog <ArrowRight size={16} />
          </Link>
        </HeroContent>
      </ShaderBackground>

      <section className="container mx-auto px-6 py-24 sm:py-32 relative z-20 bg-black">
        <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white mb-12 text-center">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.length > 0 ? featuredProducts.map((product, idx) => (
            <Link to={`/products/${product.id}`} key={product.id} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300">
              <div className="aspect-[4/5] overflow-hidden relative">
                <img 
                  src={product.imageUrl || UNSPLASH_IMAGES[idx % UNSPLASH_IMAGES.length]} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="text-xs uppercase tracking-wider text-white/50 mb-2">{product.category}</span>
                <h3 className="text-lg font-medium text-white mb-2 line-clamp-1">{product.name}</h3>
                <div className="mt-auto flex justify-between items-center pt-4">
                  <p className="text-white/90 text-xl font-light">${product.price.toFixed(2)}</p>
                  <button onClick={(e) => handleAddToCart(product, e)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Add to Cart">
                    <ShoppingCart size={20} />
                  </button>
                </div>
              </div>
            </Link>
          )) : (
            // Skeletons / placeholders
            UNSPLASH_IMAGES.map((_, idx) => (
              <div key={idx} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/5] bg-white/10"></div>
                <div className="p-6 flex flex-col space-y-4">
                  <div className="h-3 w-1/3 bg-white/10 rounded"></div>
                  <div className="h-6 w-3/4 bg-white/10 rounded"></div>
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-6 w-1/4 bg-white/10 rounded"></div>
                    <div className="h-10 w-10 bg-white/10 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
