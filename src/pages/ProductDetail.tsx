import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { ShoppingCart, Heart, Share2, ShieldCheck, Truck, RefreshCw, ChevronRight, Star, CheckCircle2, Info, MessageSquare, List, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailProps {
  addToCart: (product: Product, selectedVariant?: any, quantity?: number) => void;
}

type TabType = 'description' | 'specs' | 'reviews';

export default function ProductDetail({ addToCart }: ProductDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const pData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(pData);
          if (pData.variants && pData.variants.length > 0) {
            setSelectedVariant(pData.variants[0]);
          }

          // Fetch related - handle multiple categories
          const cat = pData.categories?.[0] || pData.category;
          const q = query(collection(db, 'products'), where('categories', 'array-contains', cat), limit(4));
          const rSnap = await getDocs(q);
          setRelatedProducts(rSnap.docs.filter(d => d.id !== id).map(d => ({ id: d.id, ...d.data() } as Product)));
        }
      } catch (error) {
        console.error("Error fetching product detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
          <Info size={48} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Sản phẩm không tồn tại</h2>
        <p className="text-gray-500 mb-8 font-medium max-w-md">Sản phẩm bạn đang tìm kiếm có thể đã bị xóa hoặc không còn kinh doanh tại Dshop.</p>
        <Link to="/products" className="px-10 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm self-start inline-flex">
          <Link to="/" className="hover:text-red-600 transition-colors">Trang chủ</Link>
          <ChevronRight size={12} />
          <Link to={`/products?cat=${product.categories?.[0] || product.category}`} className="hover:text-red-600 transition-colors">{product.categories?.[0] || product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div 
              key={activeImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] p-12 border border-gray-100 shadow-sm flex items-center justify-center aspect-square relative overflow-hidden group"
            >
              <div className="absolute top-8 left-8 z-10 flex flex-wrap gap-2">
                {(product.categories || [product.category]).map((cat, i) => (
                  <span key={i} className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">
                    {cat}
                  </span>
                ))}
              </div>
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            {/* Thumbnail list */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {images.map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "aspect-square bg-white rounded-2xl p-3 border-2 cursor-pointer transition-all hover:shadow-md",
                      activeImage === i ? "border-red-600 shadow-lg shadow-red-600/10" : "border-gray-100 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={`Thumbnail ${i}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm sticky top-32">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">(128 đánh giá)</span>
              </div>

              <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-4 leading-tight uppercase">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-5xl font-black text-red-600 tracking-tighter">
                  {formatCurrency(currentPrice)}
                </span>
                <span className="text-gray-400 line-through font-bold text-lg">
                  {formatCurrency(currentPrice * 1.2)}
                </span>
              </div>

              <div className="space-y-6 mb-10">
                {/* Variants Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chọn phiên bản</p>
                    <div className="grid grid-cols-2 gap-3">
                      {product.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all text-left",
                            selectedVariant?.id === v.id 
                              ? "border-red-600 bg-red-50" 
                              : "border-gray-100 hover:border-gray-200"
                          )}
                        >
                          <p className="text-xs font-black uppercase tracking-widest mb-1">{v.name}</p>
                          {v.color && <p className="text-[10px] text-gray-500 font-bold">Màu: {v.color}</p>}
                          <p className="text-sm font-black text-red-600 mt-2">{formatCurrency(v.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border",
                  currentStock > 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                )}>
                  {currentStock > 0 ? (
                    <>
                      <CheckCircle2 size={20} className="text-green-600" />
                      <div>
                        <p className="text-xs font-black text-green-600 uppercase tracking-widest">Sẵn hàng tại kho</p>
                        <p className="text-[10px] text-green-600/70 font-bold">Giao hàng hỏa tốc trong 2h tại TP.HCM</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <X size={20} className="text-red-600" />
                      <div>
                        <p className="text-xs font-black text-red-600 uppercase tracking-widest">Hết hàng</p>
                        <p className="text-[10px] text-red-600/70 font-bold">Vui lòng liên hệ để đặt trước</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Số lượng</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden p-1 bg-gray-50">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-red-600 font-black text-xl transition-colors"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 text-center font-black text-lg bg-transparent focus:outline-none"
                      />
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-red-600 font-black text-xl transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => addToCart(product, selectedVariant, quantity)}
                      disabled={currentStock === 0}
                      className="flex-grow h-14 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
                    >
                      <ShoppingCart size={20} /> {currentStock > 0 ? 'Mua ngay' : 'Hết hàng'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <button className="h-14 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-600 hover:border-red-600 hover:text-red-600 transition-all flex items-center justify-center gap-2">
                  <Heart size={18} /> Yêu thích
                </button>
                <button className="h-14 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-600 hover:border-red-600 hover:text-red-600 transition-all flex items-center justify-center gap-2">
                  <Share2 size={18} /> Chia sẻ
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 gap-4 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-red-50 group-hover:text-red-600 rounded-xl transition-colors">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Miễn phí vận chuyển</p>
                    <p className="text-[10px] text-gray-400 font-bold">Cho đơn hàng từ 2.000.000đ</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-red-50 group-hover:text-red-600 rounded-xl transition-colors">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Bảo hành chính hãng</p>
                    <p className="text-[10px] text-gray-400 font-bold">Cam kết 100% hàng thật</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mb-24">
          <div className="flex border-b border-gray-100 mb-10 overflow-x-auto custom-scrollbar">
            {[
              { id: 'description', label: 'Mô tả chi tiết', icon: <Info size={18} /> },
              { id: 'specs', label: 'Thông số kỹ thuật', icon: <List size={18} /> },
              { id: 'reviews', label: 'Đánh giá khách hàng', icon: <MessageSquare size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "px-10 py-6 text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all relative whitespace-nowrap",
                  activeTab === tab.id ? "text-red-600" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[40px] p-12 border border-gray-100 shadow-sm min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="prose prose-red max-w-none"
                >
                  <p className="text-gray-600 leading-loose text-lg whitespace-pre-line">
                    {product.description}
                  </p>
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 p-8 rounded-3xl">
                      <h4 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Đặc điểm nổi bật</h4>
                      <ul className="space-y-4">
                        {['Thiết kế hiện đại, sang trọng', 'Hiệu năng mạnh mẽ vượt trội', 'Trải nghiệm gaming đỉnh cao', 'Hỗ trợ đa nền tảng'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-600 font-medium">
                            <CheckCircle2 size={18} className="text-red-600 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-3xl">
                      <h4 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Bộ sản phẩm gồm</h4>
                      <ul className="space-y-4">
                        {['Thân máy chính', 'Cáp nguồn tiêu chuẩn', 'Sách hướng dẫn sử dụng', 'Thẻ bảo hành Dshop'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-600 font-medium">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'specs' && (
                <motion.div
                  key="specs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto"
                >
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: 'Thương hiệu', value: product.category.toUpperCase() },
                      { label: 'Model', value: product.name },
                      { label: 'Tình trạng', value: 'Mới 100% Fullbox' },
                      { label: 'Bảo hành', value: '12 tháng chính hãng' },
                      { label: 'Xuất xứ', value: 'Chính hãng' },
                      { label: 'Màu sắc', value: 'Tiêu chuẩn' },
                    ].map((spec, i) => (
                      <div key={i} className="grid grid-cols-2 py-6">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{spec.label}</span>
                        <span className="text-sm font-bold text-gray-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                    <div className="text-center p-10 bg-gray-50 rounded-[40px] border border-gray-100 min-w-[240px]">
                      <p className="text-7xl font-black text-gray-900 tracking-tighter mb-2">4.9</p>
                      <div className="flex justify-center text-amber-400 mb-4">
                        {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dựa trên 128 đánh giá</p>
                    </div>
                    <div className="flex-grow space-y-4 w-full">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-4">
                          <span className="text-xs font-black text-gray-400 w-4">{star}</span>
                          <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${star === 5 ? 90 : star === 4 ? 8 : 2}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-gray-400 w-8">{star === 5 ? '90%' : star === 4 ? '8%' : '2%'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-red-600 border border-gray-100">
                              {i === 1 ? 'ND' : 'HM'}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 uppercase text-xs tracking-widest">{i === 1 ? 'Nguyễn Duy' : 'Hoàng Minh'}</p>
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, j) => <Star key={j} size={10} fill="currentColor" />)}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2 ngày trước</span>
                        </div>
                        <p className="text-gray-600 font-medium leading-relaxed">
                          Sản phẩm tuyệt vời, đóng gói cẩn thận. Giao hàng cực nhanh, mình đặt sáng chiều đã nhận được rồi. Shop tư vấn rất nhiệt tình. Sẽ tiếp tục ủng hộ Dshop!
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pt-24 border-t border-gray-100">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">Sản phẩm liên quan</h2>
                <div className="h-1.5 w-20 bg-red-600 mt-2 rounded-full"></div>
              </div>
              <Link to="/products" className="text-xs font-black text-red-600 uppercase tracking-widest hover:translate-x-2 transition-transform flex items-center gap-2">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} addToCart={addToCart} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
