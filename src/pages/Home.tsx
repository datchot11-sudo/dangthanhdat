import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AppSettings, Product, Article, FlashSale } from '../types';
import ProductCard from '../components/ProductCard';
import CountdownTimer from '../components/CountdownTimer';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowRight, Gamepad2, Monitor, Cpu, Headphones, Timer, Zap, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { usePageTitle } from '../hooks/usePageTitle';

interface HomeProps {
  addToCart: (product: Product, selectedVariant?: any, quantity?: number) => void;
  settings: AppSettings;
}

export default function Home({ addToCart, settings }: HomeProps) {
  usePageTitle('Trang chủ');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [activeFlashSale, setActiveFlashSale] = useState<FlashSale | null>(null);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Combine default banner with additional banners
  const banners = settings.banners && settings.banners.length > 0 
    ? settings.banners 
    : [{ url: settings.bannerUrl, title: settings.bannerTitle, subtitle: settings.bannerSubtitle }];

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = Timestamp.now();
        
        // Fetch products without complex query to avoid index errors
        const pSnap = await getDocs(collection(db, 'products'));
        const allProducts = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setFeaturedProducts(allProducts.slice(0, 8));

        // Fetch Flash Sales
        const fsSnap = await getDocs(collection(db, 'flashsales'));
        const allFlashSales = fsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashSale));
        
        const active = allFlashSales.find(fs => {
          const startTime = fs.startTime?.toDate();
          const endTime = fs.endTime?.toDate();
          return startTime && endTime && startTime <= now.toDate() && endTime >= now.toDate();
        });

        if (active) {
          setActiveFlashSale(active);
          // Get products in this flash sale
          const fsProductIds = (active.products || []).map(p => p.productId);
          const fsProds = allProducts.filter(p => fsProductIds.includes(p.id));
          setFlashSaleProducts(fsProds);
        }

        // Fetch articles and sort in memory to avoid index errors
        const aSnap = await getDocs(collection(db, 'articles'));
        const allArticles = aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        allArticles.sort((a, b) => {
          const timeA = (a.createdAt as any)?.seconds || 0;
          const timeB = (b.createdAt as any)?.seconds || 0;
          return timeB - timeA;
        });
        setLatestArticles(allArticles.slice(0, 3));
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
      {/* Hero Banner Carousel */}
      <section className="relative h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 opacity-60">
              <img 
                src={banners[currentBanner].url} 
                alt={banners[currentBanner].title || "Banner"} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center relative z-10 ${
              settings.bannerAlignment === 'center' ? 'justify-center text-center' : 
              settings.bannerAlignment === 'right' ? 'justify-end text-right' : 
              'justify-start text-left'
            }`}>
              <motion.div 
                initial={{ opacity: 0, x: settings.bannerAlignment === 'center' ? 0 : settings.bannerAlignment === 'right' ? 50 : -50, y: settings.bannerAlignment === 'center' ? 50 : 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className={`max-w-2xl text-white flex flex-col ${
                  settings.bannerAlignment === 'center' ? 'items-center' : 
                  settings.bannerAlignment === 'right' ? 'items-end' : 
                  'items-start'
                }`}
              >
                <span className="inline-block bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                  Ưu đãi giới hạn
                </span>
                <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none mb-6 uppercase">
                  {banners[currentBanner].title || settings.bannerTitle}
                </h1>
                <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-lg font-medium">
                  {banners[currentBanner].subtitle || settings.bannerSubtitle}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    to={banners[currentBanner].link || "/products"} 
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
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`w-12 h-1.5 rounded-full transition-all ${
                  i === currentBanner ? 'bg-red-600 w-16' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Flash Sale Notification Section */}
      <AnimatePresence>
        {activeFlashSale && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-30 mb-8"
          >
            <div className="bg-white rounded-[32px] shadow-2xl shadow-red-600/20 border border-red-100 overflow-hidden">
              <div className="bg-red-600 px-8 py-6 sm:py-8 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-white">
                  <div className="p-3 bg-white/20 rounded-2xl animate-pulse">
                    <Zap size={32} fill="white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic flex items-center gap-2">
                      FLASH SALE <Flame size={24} className="text-amber-400" />
                    </h2>
                    <p className="text-sm font-bold text-red-100 uppercase tracking-widest">{activeFlashSale.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-red-200 uppercase tracking-widest mr-2">Kết thúc sau:</span>
                  <CountdownTimer endTime={activeFlashSale.endTime.toDate()} />
                </div>

                <Link 
                  to="/products"
                  className="px-8 py-4 bg-white text-red-600 font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 shadow-xl"
                >
                  XEM TẤT CẢ <ChevronRight size={18} />
                </Link>
              </div>

              <div className="p-8 bg-white overflow-x-auto no-scrollbar">
                <div className="flex gap-6 min-w-max pb-2">
                  {flashSaleProducts.map((product) => {
                    const fsData = activeFlashSale.products.find(p => p.productId === product.id);
                    if (!fsData) return null;
                    const discount = Math.round((1 - (fsData.salePrice / product.price)) * 100);
                    
                    return (
                      <Link 
                        key={product.id} 
                        to={`/products/${product.id}`}
                        className="w-48 group"
                      >
                        <div className="relative aspect-square bg-gray-50 rounded-2xl p-4 overflow-hidden mb-4 group-hover:scale-105 transition-transform">
                          <img 
                            src={product.imageUrls?.[0] || product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} 
                            alt={product.name} 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`;
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                            -{discount}%
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 truncate mb-1 group-hover:text-red-600 transition-colors">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-red-600">{formatCurrency(fsData.salePrice)}</span>
                          <span className="text-[10px] font-bold text-gray-300 line-through decoration-red-400/50">{formatCurrency(product.price)}</span>
                        </div>
                        <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(10, (fsData.soldCount / (activeFlashSale.id.length * 10)) * 100))}%` }}
                            className="h-full bg-red-600"
                          />
                        </div>
                        <p className="text-[9px] font-black text-gray-400 mt-1 uppercase tracking-tighter">Đã bán {fsData.soldCount || 0}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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
              <Link key={article.id} to={`/news/${article.id}`} className="block group">
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 h-full flex flex-col"
                >
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={article.imageUrl || `https://picsum.photos/seed/${article.id}/800/400`} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/800x400?text=${encodeURIComponent(article.title)}`;
                      }}
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2 block">Tin tức</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-6 font-medium">
                      {article.content.replace(/[#*`]/g, '')}
                    </p>
                    <div className="mt-auto flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>{article.author}</span>
                      <span>{new Date((article.createdAt as any)?.seconds * 1000).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
