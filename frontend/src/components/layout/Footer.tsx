import { Package } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black/80 backdrop-blur-md border-t border-white/5 py-12 px-6 mt-auto">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3 text-white group">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <Package size={20} className="text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight">E-Commerce</span>
            </div>
            <p className="text-white/60 text-sm font-light mt-2 leading-relaxed max-w-xs">
              Your one-stop shop for everything you need. Premium products at the best prices.
            </p>
          </div>
          
          {/* Links */}
          <div className="col-span-1">
            <h4 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-3">
              <li><a href="/shop?category=ELECTRONICS" className="text-white/60 hover:text-white transition-colors text-sm font-light">Electronics</a></li>
              <li><a href="/shop?category=CLOTHING" className="text-white/60 hover:text-white transition-colors text-sm font-light">Clothing</a></li>
              <li><a href="/shop?category=HOME_AND_KITCHEN" className="text-white/60 hover:text-white transition-colors text-sm font-light">Home & Kitchen</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-light">Contact Us</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-light">FAQ</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-light">Shipping & Returns</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-light">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-light">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm font-light">
            &copy; {new Date().getFullYear()} E-Commerce App. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
