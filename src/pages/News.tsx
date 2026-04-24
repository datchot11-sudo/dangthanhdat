import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, User } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export default function News() {
  usePageTitle('Tin tức Gaming');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const aSnap = await getDocs(collection(db, 'articles'));
        const allArticles = aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        
        // Sort by date
        allArticles.sort((a, b) => {
          const timeA = (a.createdAt as any)?.seconds || 0;
          const timeB = (b.createdAt as any)?.seconds || 0;
          return timeB - timeA;
        });
        
        setArticles(allArticles);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Phòng truyền thông Dshop đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block bg-red-100 text-red-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              Blog & Tin tức
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-gray-900 uppercase mb-6">
              Dshop Gaming News
            </h1>
            <p className="max-w-2xl mx-auto text-gray-500 font-medium">
              Cập nhật những thông tin mới nhất về thế giới máy chơi game, các tựa game bom tấn và mẹo vặt hữu ích từ cộng đồng Dshop.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-20">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-100 flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-gray-900 uppercase tracking-widest shadow-sm">
                      Mới nhất
                    </span>
                  </div>
                </div>
                
                <div className="p-8 flex flex-grow flex-col">
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date((article.createdAt as any)?.seconds * 1000).toLocaleDateString('vi-VN')}</span>
                    <span className="flex items-center gap-1.5"><User size={12} /> {article.author || "Dshop Team"}</span>
                  </div>
                  
                  <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tight group-hover:text-red-600 transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  
                  <p className="text-sm text-gray-500 line-clamp-3 mb-8 font-medium leading-relaxed">
                    {article.content.replace(/[#*`]/g, '')}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-gray-50">
                    <Link
                      to={`/news/${article.id}`}
                      className="inline-flex items-center gap-2 text-xs font-black text-red-600 uppercase tracking-widest group/btn"
                    >
                      Đọc chi tiết <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <Calendar size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4">Chưa có bài viết nào</h3>
              <p className="text-gray-500 font-medium">Phòng biên tập đang chuẩn bị những bản tin sốt dẻo nhất. Quay lại sau nhé!</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
