import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, AppSettings } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Gamepad2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { usePageTitle } from '../hooks/usePageTitle';

interface GameCategoryProps {
  settings: AppSettings;
  onAddToCart: (product: Product, selectedVariant?: any, quantity?: number) => void;
}

export default function GameCategory({ settings, onAddToCart }: GameCategoryProps) {
  usePageTitle('Kho trò chơi');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', name: 'Tất cả' },
    { id: 'nintendo', name: 'Nintendo Switch' },
    { id: 'playstation', name: 'PlayStation 5' }
  ];

  useEffect(() => {
    const fetchGameProducts = async () => {
      try {
        const q = query(collection(db, 'products'));
        const snap = await getDocs(q);
        const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        // Filter products that ONLY have "Game" or "Trò chơi" category
        const gameProducts = allProducts.filter(p => {
          return p.categories?.some(cat => {
            const lowerCat = cat.toLowerCase().trim();
            // Check both ID 'games' and Name 'Trò chơi'
            return lowerCat === 'game' || 
                   lowerCat === 'games' ||
                   lowerCat === 'trò chơi' || 
                   lowerCat === 'trò choi';
          });
        });
        
        setProducts(gameProducts);
      } catch (error) {
        console.error("Error fetching game products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameProducts();
  }, []);

  const filteredProducts = activeFilter === 'all' 
    ? products 
    : products.filter(p => {
        const platformKey = activeFilter.toLowerCase();
        
        // Match specific platforms
        if (platformKey === 'nintendo') {
          return p.categories?.some(cat => cat.toLowerCase().includes('nintendo')) || 
                 p.name.toLowerCase().includes('switch');
        }
        if (platformKey === 'playstation') {
          return p.categories?.some(cat => cat.toLowerCase().includes('playstation') || cat.toLowerCase().includes('ps5')) ||
                 p.name.toLowerCase().includes('ps5') || p.name.toLowerCase().includes('playstation');
        }
        
        return p.categories?.some(cat => cat.toLowerCase().includes(platformKey));
      });

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner */}
        <div className="relative h-64 md:h-80 rounded-[40px] overflow-hidden mb-12 bg-gray-900 border border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/40 via-red-900/40 to-black/80" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="relative h-full z-10 flex flex-col justify-center px-8 md:px-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="p-3 bg-red-600 rounded-2xl shadow-xl shadow-red-600/20">
                <Gamepad2 className="text-white" size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 font-sans">Official Gaming Store</p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic font-sans leading-none">Game Hub</h1>
              </div>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-300 font-medium max-w-lg mb-8 leading-relaxed font-sans"
            >
              Khám phá thế giới trò chơi đỉnh cao. Bản quyền chính hãng, giao hàng siêu tốc, hỗ trợ tận tâm 24/7.
            </motion.p>
          </div>
          
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none hidden lg:block">
             <Gamepad2 size={400} className="text-white rotate-12 -mr-20 -mb-20" />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2",
                activeFilter === f.id 
                  ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20" 
                  : "bg-white border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-500"
              )}
            >
              {f.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white border border-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addToCart={onAddToCart} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Gamepad2 className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase font-sans">CHƯA CÓ SẢN PHẨM</h3>
            <p className="text-gray-500 mb-8 font-medium font-sans">Hiện tại chưa có sản phẩm nào trong danh mục này.</p>
            <Link 
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-red-700 transition-all shadow-lg"
            >
              Xem tất cả sản phẩm
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
