import { Headphones, MapPin, Mail, Phone, MessageSquare, ChevronRight, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PolicyPage, AppSettings } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

interface SupportProps {
  settings: AppSettings;
}

export default function Support({ settings }: SupportProps) {
  usePageTitle('Hỗ trợ');
  const [page, setPage] = useState<PolicyPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const docRef = doc(db, 'pages', 'support');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPage({ id: docSnap.id, ...docSnap.data() } as PolicyPage);
        }
      } catch (error) {
        console.error("Error fetching support page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  if (page) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 sm:p-16 border border-gray-100 shadow-xl"
        >
          <div className="flex items-center gap-6 mb-12">
            <div className="p-5 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-600/20">
              <Headphones size={36} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 uppercase leading-none">{page.title}</h1>
              <div className="h-1.5 w-20 bg-red-600 mt-4 rounded-full" />
            </div>
          </div>
          
          <div 
            className="prose prose-red max-w-none 
              prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-lg
              prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:text-gray-900
              prose-img:rounded-[2rem] prose-img:shadow-2xl
              prose-li:text-gray-600 prose-li:font-medium"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
            <span>Trung tâm hỗ trợ Dshop</span>
            <span className="italic">
              Cập nhật: {page.updatedAt?.seconds ? new Date(page.updatedAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Mới'}
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-3xl mx-auto text-center mb-20">
        <h1 className="text-5xl font-black tracking-tighter text-gray-900 uppercase mb-6">Hỗ trợ khách hàng</h1>
        <div className="h-2 w-24 bg-red-600 mx-auto mb-8 rounded-full"></div>
        <p className="text-xl text-gray-500 font-medium leading-relaxed">
          Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn. Đừng ngần ngại liên hệ với Dshop.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-32">
        <div className="lg:col-span-1 space-y-8">
          {[
            { icon: <Phone size={24} />, title: 'Hotline', value: settings.phone, desc: 'Hỗ trợ 24/7' },
            { icon: <Mail size={24} />, title: 'Email', value: settings.email, desc: 'Phản hồi trong 24h' },
            { icon: <MapPin size={24} />, title: 'Địa chỉ', value: settings.address, desc: 'Mở cửa 8:00 - 21:00' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-6 hover:shadow-xl transition-all">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl shrink-0">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.title}</h4>
                <p className="text-lg font-black text-gray-900 tracking-tight mb-1">{item.value}</p>
                <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xl">
            <h3 className="text-2xl font-black tracking-tighter text-gray-900 uppercase mb-8 flex items-center gap-3">
              <MessageSquare size={24} className="text-red-600" /> Gửi tin nhắn cho chúng tôi
            </h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Họ và tên</label>
                  <input type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium" placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                  <input type="email" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium" placeholder="email@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chủ đề</label>
                <select className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium appearance-none">
                  <option>Tư vấn mua hàng</option>
                  <option>Hỗ trợ kỹ thuật</option>
                  <option>Bảo hành & Đổi trả</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nội dung</label>
                <textarea rows={6} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium" placeholder="Bạn cần chúng tôi giúp gì?"></textarea>
              </div>
              <button className="w-full h-16 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95">
                Gửi tin nhắn <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-[40px] p-12 sm:p-20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src="https://picsum.photos/seed/pattern/1920/1080" alt="Pattern" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white uppercase mb-8">Bạn là một game thủ chuyên nghiệp?</h2>
          <p className="text-xl text-gray-400 font-medium mb-12">
            Tham gia cộng đồng Dshop để nhận những ưu đãi đặc quyền và tin tức gaming sớm nhất.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input type="email" placeholder="Nhập email của bạn..." className="px-8 py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[300px]" />
            <button className="px-10 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95">
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
