import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import './Home.css';

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
    <div>
      <section className="hero">
        <div className="container hero-content">
          <h1>Welcome to Premium E-Commerce</h1>
          <p>Discover our curated collection of high-quality products.</p>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: '2rem' }}>
            Shop Now
          </Link>
        </div>
      </section>

      <section className="container" style={{ padding: '4rem 1.5rem' }}>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Featured Products</h2>
        <div className="product-grid">
          {featuredProducts.map(product => (
            <Link to={`/products/${product.productId}`} key={product.productId} className="card product-card">
              <div className="product-image-container">
                <img src={product.imageUrl} alt={product.name} />
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-price">${product.price.toFixed(2)}</p>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="product-category">{product.category}</span>
                  <button onClick={(e) => handleAddToCart(product, e)} className="btn btn-primary btn-icon" title="Add to Cart">
                    <ShoppingCart size={18} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
