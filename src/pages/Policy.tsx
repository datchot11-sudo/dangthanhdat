import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PolicyPage } from '../types';
import { motion } from 'motion/react';
import { ChevronRight, FileText, Phone, Mail, MapPin } from 'lucide-react';
import { AppSettings } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

interface PolicyProps {
  settings: AppSettings;
}

export default function Policy({ settings }: PolicyProps) {
  const { slug } = useParams<{ slug: string }>();
  usePageTitle(slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Chính sách');
  const [page, setPage] = useState<PolicyPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'pages', slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPage({ id: docSnap.id, ...docSnap.data() } as PolicyPage);
        }
      } catch (error) {
        console.error("Error fetching policy page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Trang không tồn tại</h2>
        <p className="text-gray-500 mb-8">Nội dung bạn đang tìm kiếm hiện chưa có hoặc đã bị xóa.</p>
        <Link to="/" className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-10">
        <Link to="/" className="hover:text-red-600 transition-colors">Trang chủ</Link>
        <ChevronRight size={12} />
        <span className="text-gray-900">{page.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                <FileText size={32} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900 uppercase">{page.title}</h1>
            </div>
            
            <div 
              className="prose prose-red max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />

            <div className="mt-16 pt-8 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic text-right">
                Cập nhật lần cuối: {page.updatedAt?.seconds ? new Date(page.updatedAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Đang xử lý...'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6">Liên hệ hỗ trợ</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 text-red-600 rounded-xl"><Phone size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Hotline</p>
                  <p className="text-sm font-bold text-gray-900">{settings.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 text-red-600 rounded-xl"><Mail size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                  <p className="text-sm font-bold text-gray-900">{settings.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 text-red-600 rounded-xl"><MapPin size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Địa chỉ</p>
                  <p className="text-sm font-bold text-gray-900">{settings.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-600 rounded-3xl p-8 text-white shadow-xl shadow-red-600/20">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Bạn chưa hài lòng?</h3>
            <p className="text-sm text-red-50 font-medium mb-6">Liên hệ trực tiếp với bộ phận kỹ thuật để được hỗ trợ tức thì.</p>
            <Link to="/support" className="block w-full py-3 bg-white text-red-600 rounded-xl text-center text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
              Tới trang hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
