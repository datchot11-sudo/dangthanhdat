import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserProfile, CartItem, AppSettings } from './types';
import { removeUndefined } from './lib/utils';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Info from './pages/Info';
import Support from './pages/Support';
import Orders from './pages/Orders';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Policy from './pages/Policy';
import News from './pages/News';
import ArticleDetail from './pages/ArticleDetail';
import GameCategory from './pages/GameCategory';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ZaloBubble from './components/ZaloBubble';
import ToastContainer, { toast } from './components/Toast';

const DEFAULT_SETTINGS: AppSettings = {
  address: 'Số 123 Lạch Tray, Quận Ngô Quyền, Hải Phòng',
  phone: '0123 456 789',
  email: 'contact@dshop.vn',
  bankQrUrl: '',
  momoQrUrl: '',
  bannerUrl: 'https://picsum.photos/seed/gaming/1920/1080',
  bannerTitle: 'NÂNG TẦM TRẢI NGHIỆM GAMING',
  bannerSubtitle: 'Khám phá thế giới máy chơi game chính hãng, phụ kiện cao cấp và những tựa game đỉnh cao nhất tại Dshop.',
  banners: [],
  zaloNumber: '0123456789',
  leftBannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=180&auto=format&fit=crop',
  rightBannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=180&auto=format&fit=crop',
  bannerAlignment: 'left',
  defaultStockStatus: 'Sẵn hàng tại kho',
  defaultStockStatusDetail: 'Giao hàng hỏa tốc trong 2h tại Hải Phòng',
  defaultOutOfStockStatus: 'Hết hàng',
  defaultOutOfStockStatusDetail: 'Vui lòng liên hệ để đặt trước'
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('dshop_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('dshop_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...doc.data() } as AppSettings);
      }
    });

    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'settings', 'general'));
        console.log("Firestore connection test successful");
      } catch (error: any) {
        console.error("Firestore connection test failed:", error.message);
        if (error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("== [AUTH DEBUG] Firebase Auth State Changed:", firebaseUser ? "User found: " + firebaseUser.email : "No user");
      
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = { uid: firebaseUser.uid, ...userDoc.data() } as UserProfile;
            console.log("== [AUTH DEBUG] User profile loaded from Firestore:", userData.name);
            setUser(userData);
            toast('success', `Chào mừng ${userData.name} quay trở lại!`);
          } else {
            console.log("== [AUTH DEBUG] User doc not found, creating new profile...");
            const isAdmin = firebaseUser.email === 'datchot11@gmail.com';
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Khách hàng',
              role: isAdmin ? 'admin' : 'user'
            };
            
            await setDoc(userRef, {
              email: newUser.email,
              name: newUser.name,
              role: newUser.role
            });
            setUser(newUser);
          }
        } catch (error: any) {
          console.error("== [AUTH DEBUG] Error fetching/creating user profile:", error.message);
          // Fallback to basic user info from firebase auth
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            role: firebaseUser.email === 'datchot11@gmail.com' ? 'admin' : 'user'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  const addToCart = (product: any, selectedVariant?: any, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && item.selectedVariant?.id === selectedVariant?.id
      );
      
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedVariant?.id === selectedVariant?.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, selectedVariant, quantity }];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && item.selectedVariant?.id === variantId)
    ));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      (item.id === productId && item.selectedVariant?.id === variantId)
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans relative">
        {/* Side Banner Left */}
        {settings.leftBannerUrl && (
          <div className="hidden xl:block fixed left-4 top-1/2 -translate-y-1/2 w-[180px] z-10 transition-transform hover:scale-105">
            <img 
              src={settings.leftBannerUrl} 
              alt="Side Banner" 
              className="w-full h-auto rounded-2xl shadow-2xl border border-white"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Side Banner Right */}
        {settings.rightBannerUrl && (
          <div className="hidden xl:block fixed right-4 top-1/2 -translate-y-1/2 w-[180px] z-10 transition-transform hover:scale-105">
            <img 
              src={settings.rightBannerUrl} 
              alt="Side Banner" 
              className="w-full h-auto rounded-2xl shadow-2xl border border-white"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <Navbar user={user} cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} settings={settings} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} settings={settings} />} />
            <Route path="/products" element={<Products addToCart={addToCart} />} />
            <Route path="/games" element={<GameCategory settings={settings} onAddToCart={(p) => addToCart(p, undefined, 1)} />} />
            <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} user={user} settings={settings} />} />
            <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} settings={settings} clearCart={clearCart} user={user} />} />
            <Route path="/orders" element={<Orders user={user} />} />
            <Route path="/info" element={<Info />} />
            <Route path="/support" element={<Support settings={settings} />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<ArticleDetail />} />
            <Route path="/policy/:slug" element={<Policy settings={settings} />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard settings={settings} /> : <AdminLogin />} />
          </Routes>
        </main>
        <Footer settings={settings} />
        
        {/* Chat Bubbles */}
        <ZaloBubble phone={settings.zaloNumber || settings.phone} />
        <ToastContainer />
      </div>
    </Router>
  );
}
