import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Menu, User, LogOut } from 'lucide-react';
import { UserProfile, CartItem, AppSettings } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface NavbarProps {
  user: UserProfile | null;
  cartCount: number;
  settings: AppSettings;
}

export default function Navbar({ user, cartCount, settings }: NavbarProps) {
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
          <div className="hidden md:flex flex-grow max-w-xl relative">
            <input
              type="text"
              placeholder="Tìm kiếm máy chơi game, phụ kiện..."
              className="w-full pl-4 pr-10 py-2 border-2 border-red-600 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-700">
              <Search size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            {user ? (
              <div className="flex items-center gap-2 group relative">
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
                    className="absolute top-full right-0 mt-2 bg-white shadow-xl border border-gray-100 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-bold text-red-600"
                  >
                    Quản trị hệ thống
                  </Link>
                )}
              </div>
            ) : (
              <Link to="/admin" className="flex flex-col items-center text-gray-600 hover:text-red-600 transition-colors">
                <User size={24} />
                <span className="text-[10px] font-bold uppercase mt-1">Đăng nhập</span>
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
            
            <button className="md:hidden text-gray-600">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <nav className="bg-gray-100 border-b border-gray-200 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-8 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide overflow-x-auto no-scrollbar">
            <li className="hover:text-red-600 transition-colors whitespace-nowrap">
              <Link to="/products?cat=nintendo">Nintendo Switch</Link>
            </li>
            <li className="hover:text-red-600 transition-colors whitespace-nowrap">
              <Link to="/products?cat=playstation">PlayStation 5</Link>
            </li>
            <li className="hover:text-red-600 transition-colors whitespace-nowrap">
              <Link to="/products?cat=xbox">Xbox Series</Link>
            </li>
            <li className="hover:text-red-600 transition-colors whitespace-nowrap">
              <Link to="/products?cat=accessories">Phụ kiện</Link>
            </li>
            <li className="hover:text-red-600 transition-colors whitespace-nowrap">
              <Link to="/info">Thông tin</Link>
            </li>
            <li className="hover:text-red-600 transition-colors whitespace-nowrap">
              <Link to="/support">Hỗ trợ</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
