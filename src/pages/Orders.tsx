import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Order } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

interface OrdersProps {
  user: UserProfile | null;
}

export default function Orders({ user }: OrdersProps) {
  usePageTitle('Đơn hàng của tôi');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort in memory to avoid index requirement
      ordersData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Orders snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Đã đặt hàng', icon: <Clock size={16} />, color: 'text-amber-600 bg-amber-50 border-amber-100' };
      case 'received':
        return { label: 'Đã tiếp nhận', icon: <Package size={16} />, color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'shipping':
        return { label: 'Đang vận chuyển', icon: <Truck size={16} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
      case 'completed':
        return { label: 'Thành công', icon: <CheckCircle2 size={16} />, color: 'text-green-600 bg-green-50 border-green-100' };
      case 'cancelled':
        return { label: 'Đã hủy', icon: <XCircle size={16} />, color: 'text-red-600 bg-red-50 border-red-100' };
      default:
        return { label: 'Không xác định', icon: <Clock size={16} />, color: 'text-gray-600 bg-gray-50 border-gray-100' };
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-black uppercase mb-4">Vui lòng đăng nhập</h2>
        <p className="text-gray-500 mb-8">Bạn cần đăng nhập để xem lịch sử đơn hàng.</p>
        <Link to="/" className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl">Quay lại trang chủ</Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-10 bg-gray-50 text-gray-300 rounded-full">
            <ShoppingBag size={64} />
          </div>
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Chưa có đơn hàng</h2>
        <p className="text-gray-500 mb-10 font-medium max-w-md mx-auto">
          Bạn chưa thực hiện đơn hàng nào. Hãy bắt đầu mua sắm ngay!
        </p>
        <Link to="/products" className="px-10 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase mb-10">Đơn hàng của tôi</h1>
      
      <div className="space-y-6">
        {orders.map((order) => {
  const getItemImage = (item: any) => {
    // Priority order for image fields
    const imageUrls = item.imageUrls;
    const firstImageUrl = Array.isArray(imageUrls) ? imageUrls[0] : (typeof imageUrls === 'string' ? imageUrls : null);
    
    const url = firstImageUrl || 
                item.imageUrl || 
                item.image || 
                (item.product && Array.isArray(item.product.imageUrls) ? item.product.imageUrls[0] : item.product?.imageUrl) ||
                (item.product && typeof item.product.imageUrls === 'string' ? item.product.imageUrls : null) ||
                item.product?.image;
                
    if (url && typeof url === 'string' && url.startsWith('http')) return url;
    
    // Fallback to a generic box photo from Unsplash instead of a random seed which can look like other products
    return `https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=200&auto=format&fit=crop`;
  };

  const status = getStatusInfo(order.status);
          const isExpanded = expandedOrder === order.id;

          return (
            <motion.div 
              key={order.id}
              layout
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div 
                className="p-6 sm:p-8 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã đơn hàng: #{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'Đang xử lý...'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest", status.color)}>
                      {status.icon}
                      {status.label}
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-end">
                  <div className="flex -space-x-3 overflow-hidden">
                    {(order.items || []).slice(0, 4).map((item, idx) => (
                      <div key={idx} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-white p-0.5 border border-gray-100 overflow-hidden shadow-sm">
                        <img 
                          src={getItemImage(item)} 
                          alt="" 
                          className="h-full w-full object-contain" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=200&auto=format&fit=crop`;
                          }}
                        />
                      </div>
                    ))}
                    {(order.items?.length || 0) > 4 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white text-[10px] font-black text-gray-500">
                        +{(order.items?.length || 0) - 4}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng thanh toán</p>
                    <p className="text-xl font-black text-red-600 tracking-tight">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-50 bg-gray-50/30 overflow-hidden"
                  >
                    <div className="p-6 sm:p-8 space-y-8">
                      {/* Items List */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chi tiết sản phẩm</p>
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                              <img 
                                src={getItemImage(item)} 
                                alt="" 
                                className="max-w-full max-h-full object-contain " 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=200&auto=format&fit=crop`;
                                }}
                              />
                            </div>
                            <div className="flex-grow">
                              <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {item.selectedVariant ? `${item.selectedVariant.name} | ` : ''} SL: {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-black text-gray-900">
                              {formatCurrency((item.selectedVariant?.price || item.price) * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thông tin giao hàng</p>
                          <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Package size={14} /></div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Người nhận</p>
                                <p className="text-sm font-bold text-gray-900">{order.customerInfo.name}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Truck size={14} /></div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Địa chỉ</p>
                                <p className="text-sm font-bold text-gray-900">{order.customerInfo.address}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Clock size={14} /></div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Số điện thoại</p>
                                <p className="text-sm font-bold text-gray-900">{order.customerInfo.phone}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thanh toán</p>
                          <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] font-black text-gray-400 uppercase">Phương thức</p>
                              <p className="text-xs font-bold text-gray-900 uppercase">
                                {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 
                                 order.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 'Ví điện tử'}
                              </p>
                            </div>
                            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                              <p className="text-sm font-black text-gray-900 uppercase">Tổng cộng</p>
                              <p className="text-xl font-black text-red-600 tracking-tight">{formatCurrency(order.total)}</p>
                            </div>
                          </div>
                          {order.customerInfo.note && (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                              <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Ghi chú</p>
                              <p className="text-xs font-medium text-amber-800 italic">"{order.customerInfo.note}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
