import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { ShoppingCart, Search, SlidersHorizontal } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

const CATEGORIES = [
  'ALL', 'ELECTRONICS', 'CLOTHING', 'FOOTWEAR', 'BOOKS', 
  'HOME_AND_KITCHEN', 'SPORTS', 'BEAUTY', 'TOYS', 'GROCERIES', 'OTHER'
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
        productId: product.productId,
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
    <div className="container" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '2rem' }}>
      {/* Sidebar Filters */}
      <aside style={{ width: '250px', flexShrink: 0 }} className="shop-filters">
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <SlidersHorizontal size={20} /> Filters
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                  className={`btn-category ${category === cat ? 'active' : ''}`}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: category === cat ? 'var(--bg-secondary)' : 'transparent',
                    color: category === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: category === cat ? 600 : 400
                  }}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              name="keyword" 
              defaultValue={keyword}
              placeholder="Search products..." 
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {loading ? (
          <div className="center-flex" style={{ height: '200px' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div className="card center-flex" style={{ padding: '3rem', flexDirection: 'column', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No products found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map(product => (
                <Link to={`/products/${product.productId}`} key={product.productId} className="card product-card">
                  <div className="product-image-container">
                    <img src={product.imageUrl} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="product-category">{product.category}</span>
                      <button onClick={(e) => handleAddToCart(product, e)} className="btn btn-primary btn-icon">
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem' }}>
              <button 
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => setSearchParams(prev => { prev.set('page', (page - 1).toString()); return prev; })}
              >
                Previous
              </button>
              <span className="center-flex" style={{ padding: '0 1rem' }}>
                Page {page + 1} of {pageInfo.totalPages || 1}
              </span>
              <button 
                className="btn btn-secondary"
                disabled={pageInfo.last}
                onClick={() => setSearchParams(prev => { prev.set('page', (page + 1).toString()); return prev; })}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Shop;
