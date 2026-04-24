import { ShieldCheck, Truck, CreditCard, RefreshCw, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PolicyPage } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Info() {
  usePageTitle('Giới thiệu');
  const [page, setPage] = useState<PolicyPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const docRef = doc(db, 'pages', 'about');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPage({ id: docSnap.id, ...docSnap.data() } as PolicyPage);
        }
      } catch (error) {
        console.error("Error fetching about page:", error);
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

  if (!page) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 uppercase mb-6">Về Dshop</h1>
          <div className="h-2 w-24 bg-red-600 mx-auto mb-8 rounded-full"></div>
          <p className="text-xl text-gray-500 font-medium leading-relaxed">
            Dshop là điểm đến tin cậy cho cộng đồng game thủ Việt Nam, nơi cung cấp những thiết bị chơi game chính hãng và dịch vụ hậu mãi tận tâm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl overflow-hidden shadow-2xl"
          >
            <img src="https://picsum.photos/seed/shop/800/600" alt="Dshop Store" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Sứ mệnh của chúng tôi</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Chúng tôi tin rằng mỗi game thủ đều xứng đáng có được những trải nghiệm tốt nhất. Đó là lý do Dshop luôn nỗ lực mang về những dòng máy chơi game mới nhất từ Nintendo, Sony, Microsoft với mức giá cạnh tranh và chế độ bảo hành uy tín.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-2xl font-black text-red-600 mb-1">10k+</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Khách hàng tin dùng</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-2xl font-black text-red-600 mb-1">500+</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sản phẩm đa dạng</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <ShieldCheck size={32} />, title: 'Chính hãng 100%', desc: 'Cam kết sản phẩm nguồn gốc rõ ràng.' },
            { icon: <Truck size={32} />, title: 'Giao hàng nhanh', desc: 'Nhận hàng trong vòng 2-4h tại Hải Phòng.' },
            { icon: <CreditCard size={32} />, title: 'Thanh toán an toàn', desc: 'Hỗ trợ nhiều phương thức hiện đại.' },
            { icon: <RefreshCw size={32} />, title: 'Hỗ trợ đổi trả', desc: 'Linh hoạt trong vòng 7 ngày đầu.' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all text-center group">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">{item.title}</h4>
              <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-8 sm:p-16 border border-gray-100 shadow-xl"
      >
        <div className="flex items-center gap-6 mb-12">
          <div className="p-5 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-600/20">
            <FileText size={36} />
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
          <span>&copy; {new Date().getFullYear()} Dshop Vietnam</span>
          <span className="italic">
            Cập nhật: {page.updatedAt?.seconds ? new Date(page.updatedAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Mới'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
