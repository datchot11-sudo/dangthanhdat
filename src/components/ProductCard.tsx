import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { toast } from './Toast';

interface ProductCardProps {
  product: Product;
  addToCart: (product: Product, selectedVariant?: any, quantity?: number) => void;
}

export default function ProductCard({ product, addToCart }: ProductCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variants && product.variants.length > 0) {
      addToCart(product, product.variants[0]);
    } else {
      addToCart(product);
    }
    toast('success', `Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-50">
        <img 
          src={product.imageUrls?.[0] || product.imageUrl || `https://picsum.photos/seed/${product.id}/400/500`} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x500?text=${encodeURIComponent(product.name)}`;
          }}
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-gray-400 hover:text-red-600 transition-colors">
            <Heart size={18} />
          </button>
        </div>
        {discountPercent > 0 && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-0.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/30 z-10 animate-bounce">
            -{discountPercent}%
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-black px-4 py-1 rounded-full font-bold text-xs uppercase tracking-widest">Hết hàng</span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.id}`} className="block mb-2">
          <div className="flex flex-wrap gap-1 mb-1">
            {(product.categories || [product.category]).map((cat, idx) => (
              <span key={idx} className="text-[9px] font-black text-red-600 uppercase tracking-widest px-1.5 py-0.5 bg-red-50 rounded">
                {cat}
              </span>
            ))}
          </div>
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-red-600 transition-colors h-10">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-lg font-black text-red-600 tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="text-[10px] text-gray-400 line-through font-bold">
                {formatCurrency(product.originalPrice)}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-bold opacity-0">
                -
              </span>
            )}
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl shadow-red-600/20"
            title="Thêm vào giỏ hàng"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
