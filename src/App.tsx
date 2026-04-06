import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile, CartItem, AppSettings } from './types';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Info from './pages/Info';
import Support from './pages/Support';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const DEFAULT_SETTINGS: AppSettings = {
  address: '123 Đường Game, Quận 1, TP. Hồ Chí Minh',
  phone: '0123 456 789',
  email: 'contact@dshop.vn',
  bankQrUrl: '',
  bannerUrl: 'https://picsum.photos/seed/gaming/1920/1080',
  bannerTitle: 'NÂNG TẦM TRẢI NGHIỆM GAMING',
  bannerSubtitle: 'Khám phá thế giới máy chơi game chính hãng, phụ kiện cao cấp và những tựa game đỉnh cao nhất tại Dshop.'
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          // New user or admin bootstrapping
          const isAdmin = firebaseUser.email === 'datchot11@gmail.com';
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            role: isAdmin ? 'admin' : 'user'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
        <Navbar user={user} cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} settings={settings} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} settings={settings} />} />
            <Route path="/products" element={<Products addToCart={addToCart} />} />
            <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} />} />
            <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} settings={settings} />} />
            <Route path="/info" element={<Info />} />
            <Route path="/support" element={<Support settings={settings} />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard settings={settings} /> : <AdminLogin />} />
          </Routes>
        </main>
        <Footer settings={settings} />
      </div>
    </Router>
  );
}
