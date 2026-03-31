import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/fetchApi';
import { ShoppingCart, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

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
        productId: product.productId,
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

  if (loading) return <div className="center-flex" style={{ height: '50vh' }}>Loading...</div>;
  if (!product) return <div className="center-flex" style={{ height: '50vh' }}>Product not found.</div>;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> Back
      </button>

      <div className="card" style={{ display: 'flex', overflow: 'hidden', padding: '0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 50%', minWidth: '300px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={product.imageUrl} alt={product.name} style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
        </div>
        
        <div style={{ flex: '1 1 50%', padding: '3rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span className="product-category" style={{ fontSize: '0.875rem' }}>
              {product.category.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{product.name}</h1>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
            ${product.price.toFixed(2)}
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem', color: product.inStock ? 'var(--success-color)' : 'var(--error-color)' }}>
            {product.inStock ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span style={{ fontWeight: 500 }}>
              {product.inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            {product.description}
          </p>

          {product.inStock && (
            <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
                >-</button>
                <span style={{ padding: '0 1.5rem', fontWeight: 600 }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)' }}
                >+</button>
              </div>
              <button 
                onClick={handleAdd} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '1rem' }}
              >
                <ShoppingCart size={20} /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
