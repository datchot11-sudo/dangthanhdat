import { ShieldCheck, Truck, CreditCard, RefreshCw, Headphones, MapPin, Mail, Phone } from 'lucide-react';
import { motion } from 'motion/react';

export default function Info() {
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
          { icon: <Truck size={32} />, title: 'Giao hàng nhanh', desc: 'Nhận hàng trong vòng 2-4h tại HCM.' },
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
