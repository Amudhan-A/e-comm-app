import React from 'react';
import { Package } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="footer-logo">
            <Package size={24} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>E-Commerce</span>
          </div>
          <p className="footer-desc">
            Your one-stop shop for everything you need. Quality products at the best prices.
          </p>
        </div>
        
        <div className="footer-links">
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/shop?category=ELECTRONICS">Electronics</a></li>
              <li><a href="/shop?category=CLOTHING">Clothing</a></li>
              <li><a href="/shop?category=HOME_AND_KITCHEN">Home & Kitchen</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping & Returns</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container center-flex">
          <p>&copy; {new Date().getFullYear()} E-Commerce App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
