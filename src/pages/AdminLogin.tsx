import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { LogIn, ShieldAlert, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-10 text-center overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
        
        <div className="mb-10 flex justify-center">
          <div className="p-6 bg-red-50 text-red-600 rounded-full">
            <ShieldAlert size={48} />
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase mb-4">Admin Portal</h1>
        <p className="text-gray-500 mb-10 font-medium">
          Khu vực dành riêng cho quản trị viên. Vui lòng đăng nhập bằng tài khoản Google được cấp quyền để tiếp tục.
        </p>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 animate-shake">
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-16 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
          ) : (
            <>
              <LogIn size={20} /> Đăng nhập với Google
            </>
          )}
        </button>

        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <span>Bảo mật bởi Dshop</span>
          <ChevronRight size={14} />
          <span>2026</span>
        </div>
      </motion.div>
    </div>
  );
}
