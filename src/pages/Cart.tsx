import { Link } from 'react-router-dom';
import { AppSettings, CartItem, UserProfile, Coupon } from '../types';
import { formatCurrency, removeUndefined } from '../lib/utils';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ChevronRight, Truck, CreditCard, Smartphone, QrCode, CheckCircle2, User, MapPin, Phone, FileText, Tag, Ticket, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, runTransaction, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { usePageTitle } from '../hooks/usePageTitle';
import { toast } from '../components/Toast';

interface CartProps {
  cart: CartItem[];
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  settings: AppSettings;
  clearCart: () => void;
  user: UserProfile | null;
}

export default function Cart({ cart, removeFromCart, updateQuantity, settings, clearCart, user }: CartProps) {
  usePageTitle('Giỏ hàng');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = cart.reduce((acc, item) => {
    const price = item.selectedVariant ? item.selectedVariant.price : item.price;
    return acc + price * item.quantity;
  }, 0);

  const discountAmount = appliedCoupon ? (
    appliedCoupon.type === 'percentage' 
      ? Math.min(subtotal * (appliedCoupon.value / 100), appliedCoupon.maxDiscount || Infinity)
      : appliedCoupon.value
  ) : 0;

  const total = subtotal - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplying(true);
    setCouponError('');
    
    try {
      const inputCode = couponCode.trim().toUpperCase();
      const q = query(
        collection(db, 'coupons'), 
        where('code', '==', inputCode),
        limit(1)
      );
      
      const snap = await getDocs(q);
      
      if (snap.empty) {
        // Try searching without uppercase just in case (though we should enforce uppercase in admin)
        const q2 = query(
          collection(db, 'coupons'),
          where('code', '==', couponCode.trim()),
          limit(1)
        );
        const snap2 = await getDocs(q2);
        
        if (snap2.empty) {
          setCouponError('Mã giảm giá này không tồn tại.');
          setAppliedCoupon(null);
          setIsApplying(false);
          return;
        }
        
        // If found in snap2, continue with that doc
        processCoupon(snap2.docs[0]);
      } else {
        processCoupon(snap.docs[0]);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError('Có lỗi xảy ra khi áp dụng mã.');
    } finally {
      setIsApplying(false);
    }
  };

  const processCoupon = (doc: any) => {
    const couponData = { id: doc.id, ...doc.data() } as Coupon;
    
    // Detailed validations
    if (couponData.isActive === false) {
      setCouponError('Mã giảm giá này hiện đang bị tạm dừng.');
      setAppliedCoupon(null);
    } else if (couponData.expiryDate && couponData.expiryDate.toDate() < new Date()) {
      setCouponError('Mã giảm giá này đã hết hạn sử dụng.');
      setAppliedCoupon(null);
    } else if (couponData.minOrderValue && subtotal < couponData.minOrderValue) {
      setCouponError(`Giá trị đơn hàng tối thiểu để dùng mã này là ${formatCurrency(couponData.minOrderValue)}.`);
      setAppliedCoupon(null);
    } else if (couponData.usageLimit && (couponData.usageCount || 0) >= couponData.usageLimit) {
      setCouponError('Mã giảm giá này đã hết lượt sử dụng.');
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(couponData);
      setCouponError('');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast('warning', 'Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }

    if (!user) {
      toast('warning', 'Vui lòng đăng nhập để đặt hàng!');
      return;
    }

    try {
      // Create a snapshot of items with explicit imageUrl for history
      const snapshottedItems = cart.map(item => ({
        ...item,
        // Ensure we have a flattened imageUrl/imageUrls for the order record
        imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
        imageUrl: item.imageUrls?.[0] || item.imageUrl || ''
      }));

      const orderData = {
        userId: user?.uid || 'guest',
        customerInfo,
        items: snapshottedItems,
        subtotal,
        discountAmount,
        couponId: appliedCoupon?.id || null,
        couponCode: appliedCoupon?.code || null,
        total,
        paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      console.log("Current User:", auth.currentUser);
      console.log("Attempting to place order with data:", orderData);

      // Perform stock reduction in a transaction
      await runTransaction(db, async (transaction) => {
        // Read all product docs first (required for transactions)
        const productReads = await Promise.all(cart.map(item => 
          transaction.get(doc(db, 'products', item.id))
        ));

        // Check stock levels and prepare updates
        for (let i = 0; i < cart.length; i++) {
          const item = cart[i];
          const productDoc = productReads[i];
          
          if (!productDoc.exists()) throw new Error(`Sản phẩm ${item.name} không tồn tại!`);
          
          const productData = productDoc.data();
          
          if (item.selectedVariant) {
            // Update specific variant stock
            const variants = [...(productData.variants || [])];
            const variantIdx = variants.findIndex(v => v.id === item.selectedVariant?.id);
            
            if (variantIdx === -1) throw new Error(`Phiên bản của ${item.name} không còn tồn tại!`);
            if (variants[variantIdx].stock < item.quantity) {
              throw new Error(`Sản phẩm ${item.name} (${item.selectedVariant.name}) chỉ còn ${variants[variantIdx].stock} sản phẩm!`);
            }
            
            variants[variantIdx].stock -= item.quantity;
            transaction.update(doc(db, 'products', item.id), { variants });
          } else {
            // Update main stock
            if (productData.stock < item.quantity) {
              throw new Error(`Sản phẩm ${item.name} chỉ còn ${productData.stock} sản phẩm!`);
            }
            transaction.update(doc(db, 'products', item.id), { stock: productData.stock - item.quantity });
          }
        }

        // Add the order
        transaction.set(doc(collection(db, 'orders')), removeUndefined(orderData));
        
        // If coupon applied, increment usageCount
        if (appliedCoupon) {
          const couponRef = doc(db, 'coupons', appliedCoupon.id);
          const couponDoc = await transaction.get(couponRef);
          if (couponDoc.exists()) {
             transaction.update(couponRef, { usageCount: (couponDoc.data().usageCount || 0) + 1 });
          }
        }
      });

      if (paymentMethod === 'bank' || paymentMethod === 'momo') {
        setShowQRModal(true);
        toast('success', 'Đơn hàng đã được tạo! Vui lòng hoàn tất thanh toán qua QR.');
      } else {
        setOrderSuccess(true);
        clearCart();
        toast('success', 'Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại Dshop.');
      }
    } catch (error: any) {
      console.error("FULL ERROR OBJECT:", error);
      let errorMsg = 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.';
      
      if (error.message?.includes('stock')) {
        errorMsg = error.message;
      } else if (error.code === 'permission-denied') {
        errorMsg = 'Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.';
      }
      
      toast('error', errorMsg);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex justify-center"
        >
          <div className="p-10 bg-green-50 text-green-600 rounded-full">
            <CheckCircle2 size={64} />
          </div>
        </motion.div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Đặt hàng thành công!</h2>
        <p className="text-gray-500 mb-10 font-medium max-w-md mx-auto">
          Cảm ơn bạn đã tin tưởng Dshop. Đơn hàng của bạn đang được xử lý và sẽ sớm được giao đến bạn.
        </p>
        <Link to="/" className="px-10 py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl shadow-black/10 inline-flex items-center gap-2">
          Quay lại trang chủ <ChevronRight size={20} />
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-10 bg-red-50 text-red-600 rounded-full animate-pulse">
            <ShoppingBag size={64} />
          </div>
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-10 font-medium max-w-md mx-auto">
          Bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy khám phá các sản phẩm gaming đỉnh cao của chúng tôi ngay!
        </p>
        <Link to="/products" className="px-10 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 inline-flex items-center gap-2">
          Tiếp tục mua sắm <ArrowRight size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase mb-10">Giỏ hàng của bạn</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 group hover:shadow-md transition-shadow"
            >
              <Link to={`/product/${item.id}`} className="w-24 h-24 shrink-0 bg-white rounded-xl p-2 flex items-center justify-center border border-gray-100 overflow-hidden">
                <img 
                  src={item.imageUrls?.[0] || item.imageUrl || 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=200&auto=format&fit=crop'} 
                  alt={item.name} 
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=200&auto=format&fit=crop';
                  }}
                />
              </Link>
              
              <div className="flex-grow text-center sm:text-left">
                <Link to={`/product/${item.id}`} className="block mb-1">
                  <h3 className="text-lg font-bold text-gray-900 hover:text-red-600 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                </Link>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-2">
                  {(item.categories || [item.category]).map((cat, idx) => (
                    <span key={idx} className="text-[9px] font-black text-red-600 uppercase tracking-widest px-2 py-0.5 bg-red-50 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
                {item.selectedVariant && (
                  <div className="mb-2 p-2 bg-gray-50 rounded-lg inline-block text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phiên bản: {item.selectedVariant.name}</p>
                    {item.selectedVariant.color && (
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Màu: {item.selectedVariant.color}</p>
                    )}
                  </div>
                )}
                <div className="block mt-1">
                  <span className="text-xl font-black text-gray-900 tracking-tight">
                    {formatCurrency(item.selectedVariant ? item.selectedVariant.price : item.price)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden bg-gray-50 p-1">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 font-black transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-black text-lg">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 font-black transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                  className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Xóa khỏi giỏ hàng"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl sticky top-32">
            <h3 className="text-2xl font-black tracking-tighter text-gray-900 uppercase mb-8">Tổng đơn hàng</h3>
            
            <div className="space-y-4 mb-8 text-sm font-medium">
              {/* Promo Code Input */}
              <div className="pt-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Mã giảm giá</p>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Nhập mã..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon || isApplying}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-xs uppercase"
                    />
                  </div>
                  {appliedCoupon ? (
                    <button 
                      onClick={removeCoupon}
                      className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isApplying}
                      className="px-4 py-2.5 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      {isApplying ? '...' : 'Áp dụng'}
                    </button>
                  )}
                </div>
                {couponError && <p className="mt-1 text-[10px] font-bold text-red-600">{couponError}</p>}
                {appliedCoupon && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 p-2 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-green-700">
                      <Ticket size={14} />
                      <span className="text-[10px] font-black uppercase tracking-tight">Đã áp dụng: {appliedCoupon.code}</span>
                    </div>
                    <span className="text-[10px] font-black text-green-700">-{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : formatCurrency(appliedCoupon.value)}</span>
                  </motion.div>
                )}
              </div>

              <div className="flex justify-between text-gray-500 pt-4 border-t border-gray-100">
                <span>Tạm tính</span>
                <span className="text-gray-900 font-bold">{formatCurrency(subtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-bold">Miễn phí</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                <span className="text-lg font-black text-gray-900 uppercase">Tổng cộng</span>
                <span className="text-3xl font-black text-red-600 tracking-tight">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Hình thức thanh toán</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: <Truck size={18} /> },
                  { id: 'bank', name: 'Chuyển khoản ngân hàng', icon: <CreditCard size={18} /> },
                  { id: 'momo', name: 'Ví điện tử MoMo / ZaloPay', icon: <Smartphone size={18} /> },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-sm font-bold",
                      paymentMethod === method.id
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
                    )}
                  >
                    <span className={paymentMethod === method.id ? "text-red-600" : "text-gray-400"}>
                      {method.icon}
                    </span>
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Thông tin giao hàng</p>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Họ và tên"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="tel" 
                    placeholder="Số điện thoại"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Địa chỉ giao hàng"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                  />
                </div>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-gray-400" size={16} />
                  <textarea 
                    placeholder="Ghi chú đơn hàng (không bắt buộc)"
                    value={customerInfo.note}
                    onChange={(e) => setCustomerInfo({...customerInfo, note: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm h-24 resize-none"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              className="w-full h-16 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95 mb-6"
            >
              Đặt hàng ngay <ChevronRight size={20} />
            </button>

            <div className="space-y-4">
              <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Phương thức thanh toán</p>
              <div className="flex justify-center gap-4 opacity-50 grayscale">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="Paypal" className="h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showQRModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-sm w-full overflow-hidden relative shadow-2xl"
            >
              <div className="p-8 pb-4 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Quét mã thanh toán</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Đơn hàng: {total.toLocaleString()}đ</p>
                
                <div className="aspect-square bg-gray-50 rounded-3xl p-4 border-2 border-dashed border-gray-100 flex items-center justify-center mb-6">
                  {paymentMethod === 'bank' ? (
                    settings.bankQrUrl ? (
                      <img src={settings.bankQrUrl} alt="Bank QR" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chưa cấu hình QR Ngân hàng</div>
                    )
                  ) : (
                    settings.momoQrUrl ? (
                      <img src={settings.momoQrUrl} alt="Momo QR" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chưa cấu hình QR Ví điện tử</div>
                    )
                  )}
                </div>

                <div className="bg-red-50 p-4 rounded-2xl mb-8">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Nội dung chuyển khoản</p>
                  <p className="text-sm font-black text-red-600 uppercase tracking-wider">
                    {customerInfo.name} {customerInfo.phone}
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowQRModal(false);
                    setOrderSuccess(true);
                    clearCart();
                    toast('success', 'Thanh toán thành công! Đơn hàng đang được xác nhận.');
                  }}
                  className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-black/10"
                >
                  Tôi đã thanh toán
                </button>
                <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Hệ thống sẽ xác nhận ngay sau khi nhận được tiền</p>
              </div>
              <div className="h-2 bg-gradient-to-r from-red-600 to-red-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
