import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { ShoppingCart, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

const CATEGORIES = [
  'ALL', 'ELECTRONICS', 'CLOTHING', 'FOOTWEAR', 'BOOKS', 
  'HOME_AND_KITCHEN', 'SPORTS', 'BEAUTY', 'TOYS', 'GROCERIES', 'OTHER'
];

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1550029402-226115b7c579?auto=format&fit=crop&q=80&w=800"
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({ pageNumber: 0, totalPages: 1, last: true });
  
  const { addToCart } = useCartStore();

  const category = searchParams.get('category') || 'ALL';
  const keyword = searchParams.get('keyword') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  useEffect(() => {
    fetchProducts();
  }, [category, keyword, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = `?page=${page}&size=12`;
      if (category !== 'ALL') query += `&category=${category}`;
      if (keyword) query += `&keyword=${keyword}`;

      const data: any = await fetchApi(`/api/products${query}`);
      setProducts(data.content);
      setPageInfo({
        pageNumber: data.pageNumber,
        totalPages: data.totalPages,
        last: data.last
      });
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newKeyword = formData.get('keyword') as string;
    setSearchParams(prev => {
      prev.set('keyword', newKeyword);
      prev.set('page', '0');
      return prev;
    });
  };

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
    <div className="bg-black min-h-screen text-white pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl sticky top-28">
            <h3 className="flex items-center gap-2 mb-6 font-medium text-lg tracking-tight">
              <SlidersHorizontal size={20} className="text-white/70" /> 
              Categories
            </h3>
            
            <div className="flex flex-col gap-2">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => {
                    setSearchParams(prev => {
                      if (cat === 'ALL') prev.delete('category');
                      else prev.set('category', cat);
                      prev.set('page', '0');
                      return prev;
                    });
                  }}
                  className={`text-left px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
                    ${category === cat 
                      ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 mb-8 backdrop-blur-sm">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  name="keyword" 
                  defaultValue={keyword}
                  placeholder="Search premium collection..." 
                  className="w-full bg-transparent border-none outline-none text-white placeholder-white/40 pl-12 pr-4 py-3 text-sm focus:ring-0"
                />
                <Search size={20} className="text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              <button type="submit" className="bg-white text-black px-8 py-3 rounded-xl font-medium text-sm hover:bg-white/90 transition-colors">
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="h-8 w-8 rounded-full border-t-2 border-r-2 border-white animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center text-white/50 min-h-[400px]">
              <Search size={48} className="mb-6 text-white/20" />
              <h3 className="text-xl text-white mb-2 font-light tracking-tight">No products found</h3>
              <p className="text-sm font-light">Try adjusting your search criteria or explore different categories.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, idx) => (
                  <Link to={`/products/${product.id}`} key={product.id} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300">
                    <div className="aspect-[4/5] overflow-hidden relative">
                      <img 
                        src={product.imageUrl || UNSPLASH_IMAGES[idx % UNSPLASH_IMAGES.length]} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-[10px] uppercase tracking-wider text-white/40 mb-2">{product.category}</span>
                      <h3 className="text-base font-medium text-white mb-2 line-clamp-1">{product.name}</h3>
                      <div className="mt-auto flex justify-between items-center pt-3 border-t border-white/5">
                        <p className="text-white/90 text-lg font-light">${product.price.toFixed(2)}</p>
                        <button onClick={(e) => handleAddToCart(product, e)} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Pagination */}
              {pageInfo.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 bg-white/5 border border-white/10 border-solid py-4 px-6 rounded-2xl w-fit mx-auto backdrop-blur-sm">
                  <button 
                    disabled={page === 0}
                    onClick={() => setSearchParams(prev => { prev.set('page', (page - 1).toString()); return prev; })}
                    className="p-2 rounded-full border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-light text-white/70 px-4">
                    Page <span className="text-white font-medium">{page + 1}</span> of {pageInfo.totalPages}
                  </span>
                  <button 
                    disabled={pageInfo.last}
                    onClick={() => setSearchParams(prev => { prev.set('page', (page + 1).toString()); return prev; })}
                    className="p-2 rounded-full border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
