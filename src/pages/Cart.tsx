import { Link } from 'react-router-dom';
import { AppSettings, CartItem } from '../types';
import { formatCurrency } from '../lib/utils';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ChevronRight, Truck, CreditCard, Smartphone, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface CartProps {
  cart: CartItem[];
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  settings: AppSettings;
}

export default function Cart({ cart, removeFromCart, updateQuantity, settings }: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const total = cart.reduce((acc, item) => {
    const price = item.selectedVariant ? item.selectedVariant.price : item.price;
    return acc + price * item.quantity;
  }, 0);

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
              <Link to={`/product/${item.id}`} className="w-24 h-24 shrink-0 bg-gray-50 rounded-xl p-2 flex items-center justify-center">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
                  referrerPolicy="no-referrer"
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
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span className="text-gray-900 font-bold">{formatCurrency(total)}</span>
              </div>
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
              
              <AnimatePresence>
                {paymentMethod === 'bank' && settings.bankQrUrl && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-6 bg-white border-2 border-red-100 rounded-2xl text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quét mã QR để thanh toán</p>
                      <div className="aspect-square max-w-[200px] mx-auto bg-gray-50 rounded-xl p-2 border border-gray-100">
                        <img src={settings.bankQrUrl} alt="Bank QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <p className="mt-4 text-[10px] font-bold text-red-600 uppercase tracking-widest">Vui lòng nhập nội dung: [Mã đơn hàng]</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="w-full h-16 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95 mb-6">
              Tiến hành thanh toán <ChevronRight size={20} />
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
    </div>
  );
}
