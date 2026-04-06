import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AppSettings, Product, Article } from '../types';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { ChevronRight, ArrowRight, Gamepad2, Monitor, Cpu, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HomeProps {
  addToCart: (product: Product, selectedVariant?: any, quantity?: number) => void;
  settings: AppSettings;
}

export default function Home({ addToCart, settings }: HomeProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pQuery = query(collection(db, 'products'), limit(8));
        const pSnap = await getDocs(pQuery);
        setFeaturedProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

        const aQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(3));
        const aSnap = await getDocs(aQuery);
        setLatestArticles(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Banner */}
      <section className="relative h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-black flex items-center">
        <div className="absolute inset-0 opacity-60">
          <img 
            src={settings.bannerUrl} 
            alt="Hero Banner" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl text-white"
          >
            <span className="inline-block bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              Ưu đãi giới hạn
            </span>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none mb-6">
              {settings.bannerTitle}
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-lg font-medium">
              {settings.bannerSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/products" 
                className="px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 transition-all rounded-lg flex items-center gap-2 shadow-2xl shadow-red-600/30"
              >
                Mua ngay <ChevronRight size={20} />
              </Link>
              <Link 
                to="/info" 
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-black uppercase tracking-widest hover:bg-white/20 transition-all rounded-lg border border-white/20"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { name: 'Nintendo Switch', icon: <Gamepad2 size={32} />, color: 'bg-red-500', cat: 'nintendo' },
            { name: 'PlayStation 5', icon: <Monitor size={32} />, color: 'bg-blue-600', cat: 'playstation' },
            { name: 'Xbox Series', icon: <Cpu size={32} />, color: 'bg-green-600', cat: 'xbox' },
            { name: 'Phụ kiện', icon: <Headphones size={32} />, color: 'bg-gray-800', cat: 'accessories' },
          ].map((cat, i) => (
            <Link 
              key={i}
              to={`/products?cat=${cat.cat}`}
              className={`${cat.color} p-6 rounded-2xl text-white flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform shadow-lg group`}
            >
              <div className="p-4 bg-white/20 rounded-full group-hover:rotate-12 transition-transform">
                {cat.icon}
              </div>
              <span className="font-black uppercase tracking-widest text-xs sm:text-sm text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Sản phẩm nổi bật</h2>
            <div className="h-1.5 w-20 bg-red-600 mt-2 rounded-full"></div>
          </div>
          <Link to="/products" className="text-red-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Xem tất cả <ArrowRight size={18} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-80 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium italic">Chưa có sản phẩm nào được cập nhật.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* News Section */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Tin tức Gaming</h2>
              <div className="h-1.5 w-20 bg-red-600 mt-2 rounded-full"></div>
            </div>
            <Link to="/news" className="text-red-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
              Đọc thêm tin tức <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestArticles.map(article => (
              <motion.div 
                key={article.id}
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100"
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2 block">Tin tức</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 hover:text-red-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-6">
                    {article.content.replace(/[#*`]/g, '')}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{article.author}</span>
                    <span>{new Date(article.createdAt?.seconds * 1000).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
