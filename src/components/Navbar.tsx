import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, User, LogOut, ClipboardList, X } from 'lucide-react';
import { UserProfile, CartItem, AppSettings } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { toast } from '../components/Toast';

interface NavbarProps {
  user: UserProfile | null;
  cartCount: number;
  settings: AppSettings;
}

export default function Navbar({ user, cartCount, settings }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Bar */}
      <div className="bg-red-600 text-white py-1 text-xs text-center font-medium">
        Miễn phí vận chuyển cho đơn hàng từ 1.000.000đ
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="text-3xl font-black text-red-600 tracking-tighter">DSHOP</span>
            <span className="ml-1 text-xs font-bold text-gray-400 uppercase hidden sm:block">Gaming Store</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-grow max-w-xl relative">
            <input
              type="text"
              placeholder="Tìm kiếm máy chơi game, phụ kiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 border-2 border-red-600 rounded-full focus:outline-none focus:ring-4 focus:ring-red-100 transition-all text-sm font-medium"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-700 p-1">
              <Search size={22} strokeWidth={3} />
            </button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            {user ? (
              <div className="hidden sm:flex items-center gap-2 group relative">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 font-medium">Xin chào,</span>
                  <span className="text-sm font-bold text-gray-800">{user.name}</span>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut size={20} />
                </button>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="absolute top-full right-0 mt-2 bg-white shadow-xl border border-gray-100 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap text-xs font-black text-red-600 z-[60]"
                  >
                    Quản trị hệ thống
                  </Link>
                )}
              </div>
            ) : (
              <Link to="/admin" className="hidden sm:flex flex-col items-center text-gray-600 hover:text-red-600 transition-colors">
                <User size={24} />
                <span className="text-[10px] font-bold uppercase mt-1">Đăng nhập</span>
              </Link>
            )}

            {user && (
              <Link to="/orders" className="hidden sm:flex flex-col items-center text-gray-600 hover:text-red-600 transition-colors">
                <ClipboardList size={24} />
                <span className="text-[10px] font-bold uppercase mt-1">Đơn hàng</span>
              </Link>
            )}

            <Link to="/cart" className="relative flex flex-col items-center text-gray-600 hover:text-red-600 transition-colors">
              <ShoppingCart size={24} />
              <span className="text-[10px] font-bold uppercase mt-1">Giỏ hàng</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Categories Bar (Desktop) */}
      <nav className="bg-gray-100 border-b border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-8 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide overflow-x-auto no-scrollbar">
            {[
              { to: "/products?cat=nintendo", label: "Nintendo Switch" },
              { to: "/products?cat=playstation", label: "PlayStation 5" },
              { to: "/products?cat=xbox", label: "Xbox Series" },
              { to: "/products?cat=accessories", label: "Phụ kiện" },
              { to: "/products?cat=games", label: "Game", live: true },
              { to: "/news", label: "Tin tức" },
              { to: "/info", label: "Thông tin" },
              { to: "/support", label: "Hỗ trợ" },
            ].map((link, i) => (
              <li key={i} className="hover:text-red-600 transition-colors whitespace-nowrap flex items-center gap-1.5">
                {link.live && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>}
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-2xl transition-all duration-300 transform ${isMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'}`}>
        <div className="p-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-red-500"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
              <Search size={20} />
            </button>
          </form>

          <ul className="grid grid-cols-2 gap-2">
            {[
              { to: "/products?cat=nintendo", label: "Nintendo" },
              { to: "/products?cat=playstation", label: "PlayStation" },
              { to: "/products?cat=xbox", label: "Xbox" },
              { to: "/products?cat=accessories", label: "Phụ kiện" },
              { to: "/news", label: "Tin tức" },
              { to: "/info", label: "Giới thiệu" },
              { to: "/support", label: "Hỗ trợ" },
              { to: "/orders", label: "Đơn hàng" },
            ].map((link, i) => (
              <li key={i}>
                <Link 
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 bg-gray-50 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          
          {!user ? (
            <Link 
              to="/admin" 
              onClick={() => setIsMenuOpen(false)}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-center block text-xs"
            >
              Đăng nhập / Quản trị
            </Link>
          ) : (
            <button 
              onClick={() => { signOut(auth); setIsMenuOpen(false); toast('info', 'Bạn đã đăng xuất tài khoản.'); }}
              className="w-full py-4 bg-gray-100 text-red-600 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 text-xs"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
