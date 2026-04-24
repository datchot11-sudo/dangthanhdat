import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppSettings } from '../types';

interface FooterProps {
  settings: AppSettings;
}

export default function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* About */}
        <div>
          <h3 className="text-2xl font-black text-white mb-6 tracking-tighter uppercase">DSHOP</h3>
          <p className="text-sm leading-relaxed mb-6 font-medium text-gray-400">
            Dshop là cửa hàng chuyên cung cấp các dòng máy chơi game chính hãng, phụ kiện gaming cao cấp và những trải nghiệm giải trí tuyệt vời nhất.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-red-600 hover:text-white transition-all">
              <Facebook size={18} />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-red-600 hover:text-white transition-all">
              <Instagram size={18} />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-red-600 hover:text-white transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-red-600 hover:text-white transition-all">
              <Youtube size={18} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Hỗ trợ khách hàng</h4>
          <ul className="space-y-3 text-sm font-medium">
            <li><Link to="/policy/warranty" className="hover:text-red-500 transition-colors">Chính sách bảo hành</Link></li>
            <li><Link to="/policy/returns" className="hover:text-red-500 transition-colors">Chính sách đổi trả</Link></li>
            <li><Link to="/policy/payment" className="hover:text-red-500 transition-colors">Phương thức thanh toán</Link></li>
            <li><Link to="/policy/shipping" className="hover:text-red-500 transition-colors">Giao nhận & Vận chuyển</Link></li>
            <li><Link to="/policy/faq" className="hover:text-red-500 transition-colors">Câu hỏi thường gặp</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-wider mb-6">Danh mục sản phẩm</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-red-500 transition-colors">Nintendo Switch</a></li>
            <li><a href="#" className="hover:text-red-500 transition-colors">PlayStation 5</a></li>
            <li><a href="#" className="hover:text-red-500 transition-colors">Xbox Series X/S</a></li>
            <li><a href="#" className="hover:text-red-500 transition-colors">Phụ kiện Gaming</a></li>
            <li><a href="#" className="hover:text-red-500 transition-colors">Máy chơi game Retro</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-wider mb-6">Liên hệ với chúng tôi</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin size={20} className="text-red-600 shrink-0" />
              <span>{settings.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone size={20} className="text-red-600 shrink-0" />
              <span>{settings.phone}</span>
            </li>
            <li className="flex gap-3">
              <Mail size={20} className="text-red-600 shrink-0" />
              <span>{settings.email}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
        <p>&copy; 2026 Dshop. All rights reserved. Designed with passion for gamers.</p>
      </div>
    </footer>
  );
}
