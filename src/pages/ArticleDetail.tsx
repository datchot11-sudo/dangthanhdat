import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Article } from '../types';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, Calendar, User, Share2, Clock } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  usePageTitle(article?.title || 'Bài viết');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'articles', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() } as Article);
          
          // Fetch some related articles
          const q = query(collection(db, 'articles'), limit(4));
          const rSnap = await getDocs(q);
          const related = rSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Article))
            .filter(a => a.id !== id)
            .slice(0, 3);
          setRelatedArticles(related);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

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

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">Bài viết không tồn tại</h2>
        <p className="text-gray-500 mb-8 font-medium">Có lẽ bài viết này đã được gỡ bỏ hoặc đường dẫn không chính xác.</p>
        <Link 
          to="/news" 
          className="px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-red-600/20"
        >
          Quay lại tin tức
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Article Navigation */}
      <div className="sticky top-16 sm:top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            to="/news" 
            className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            <ChevronLeft size={16} /> Quay lại tin tức
          </Link>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-red-600 transition-colors">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 pt-12">
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 text-[10px] font-black text-red-600 uppercase tracking-widest mb-6">
            <span className="bg-red-50 px-3 py-1 rounded-full">Góc Gaming</span>
            <span className="flex items-center gap-1.5 text-gray-400"><Clock size={12} /> 5 phút đọc</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-gray-900 leading-tight uppercase mb-8">
            {article.title}
          </h1>

          <div className="flex items-center gap-6 border-y border-gray-100 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                {article.author?.charAt(0) || "D"}
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">{article.author || "Dshop Editor"}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phóng viên Dshop</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-100"></div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <Calendar size={14} /> 
              <span>{new Date((article.createdAt as any)?.seconds * 1000).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-auto rounded-[3rem] shadow-2xl mb-12"
            referrerPolicy="no-referrer"
          />

          <div className="prose prose-lg max-w-none prose-red font-medium leading-relaxed text-gray-700">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </motion.div>

        {/* Article Footer */}
        <footer className="pt-12 border-t border-gray-100 mb-20">
          <div className="bg-gray-50 rounded-[3rem] p-8 sm:p-12">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4">Bạn yêu thích nội dung này?</h3>
            <p className="text-gray-500 mb-8 font-medium">Theo dõi Fanpage Dshop để không bỏ lỡ những tin tức gaming hấp dẫn nhất được cập nhật hàng ngày.</p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl text-xs shadow-lg shadow-red-600/20">
                Chia sẻ lên Facebook
              </button>
              <button className="px-8 py-3 bg-white border border-gray-200 text-gray-900 font-black uppercase tracking-widest rounded-xl text-xs">
                Sao chép liên kết
              </button>
            </div>
          </div>
        </footer>

        {/* Related News */}
        {relatedArticles.length > 0 && (
          <section>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-10 border-l-4 border-red-600 pl-4">Bài viết liên quan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map(rel => (
                <Link key={rel.id} to={`/news/${rel.id}`} className="group block">
                  <div className="aspect-video rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all">
                    <img 
                      src={rel.imageUrl} 
                      alt={rel.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-red-600 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
