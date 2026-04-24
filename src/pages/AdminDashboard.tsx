import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Plus, Trash2, Edit2, Package, FileText, X, Save, Image as ImageIcon, Search, ChevronRight, Boxes, AlertTriangle, Settings as SettingsIcon, Minus, Download, Filter, ArrowUpDown, Upload, CheckCircle2, ClipboardList, Clock, Truck, XCircle, Star, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn, removeUndefined } from '../lib/utils';
import { AppSettings, Product, Article, ProductVariant, Order, PolicyPage, Coupon, FlashSale } from '../types';
import { toast } from '../components/Toast';
import { useState, useEffect, useRef } from 'react';

interface AdminDashboardProps {
  settings: AppSettings;
}

export default function AdminDashboard({ settings }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'articles' | 'inventory' | 'settings' | 'orders' | 'pages' | 'analytics' | 'coupons' | 'flashsales'>('analytics');
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pages, setPages] = useState<PolicyPage[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [settingsData, setSettingsData] = useState<AppSettings>(settings);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  
  // New state for product features
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [fsProductSearch, setFsProductSearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoriesList = [
    { id: 'nintendo', name: 'Nintendo Switch' },
    { id: 'playstation', name: 'PlayStation 5' },
    { id: 'xbox', name: 'Xbox Series' },
    { id: 'accessories', name: 'Phụ kiện' },
    { id: 'games', name: 'Trò chơi' },
    { id: 'limited', name: 'Phiên bản giới hạn' }
  ];

  const predefinedPages = [
    { id: 'about', title: 'Về Dshop (Giới thiệu)' },
    { id: 'warranty', title: 'Chính sách bảo hành' },
    { id: 'returns', title: 'Chính sách đổi trả' },
    { id: 'payment', title: 'Phương thức thanh toán' },
    { id: 'shipping', title: 'Vận chuyển & Giao hàng' },
    { id: 'faq', title: 'Câu hỏi thường gặp' },
    { id: 'support', title: 'Hỗ trợ khách hàng' }
  ];

  useEffect(() => {
    setSettingsData(settings);
  }, [settings]);

  useEffect(() => {
    if (activeTab !== 'settings') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  const seedReviews = async () => {
    if (!products.length) return;
    setLoading(true);
    try {
      const mockReviews = [
        "Sản phẩm quá tuyệt vời, đóng gói rất kỹ.",
        "Giao hàng nhanh, máy mới 100% đúng như mô tả.",
        "Chủ shop nhiệt tình, tư vấn rất có tâm.",
        "Trải nghiệm chơi game cực đỉnh, không có gì để chê.",
        "Đáng đồng tiền bát gạo, sẽ ủng hộ shop dài dài.",
        "Phụ kiện đi kèm đầy đủ, bảo hành chính hãng yên tâm.",
        "Thiết kế đẹp, cầm chắc tay, chơi game mượt mà.",
        "Dịch vụ của Dshop luôn làm mình hài lòng."
      ];
      const names = ["Quốc Anh", "Minh Thư", "Hoàng Long", "Thu Hà", "Đức Phúc", "Lan Hương", "Thành Đạt"];
      
      for (const product of products.slice(0, 10)) {
        // Add 2-3 reviews per product
        const count = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < count; i++) {
          await addDoc(collection(db, 'reviews'), removeUndefined({
            productId: product.id,
            userId: 'mock-user-' + Math.random().toString(36).substr(2, 5),
            userName: names[Math.floor(Math.random() * names.length)],
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
            content: mockReviews[Math.floor(Math.random() * mockReviews.length)],
            createdAt: serverTimestamp()
          }));
        }
      }
      toast('success', "Đã tạo đánh giá ảo thành công cho các sản phẩm!");
    } catch (error) {
      console.error("Error seeding reviews:", error);
      toast('error', "Lỗi khi tạo đánh giá ảo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const collectionName = activeTab === 'inventory' || activeTab === 'analytics' ? 'products' : activeTab;
      
      // If analytics or flashsales, we need products
      if (activeTab === 'analytics' || activeTab === 'flashsales') {
        const fetchPromises: Promise<any>[] = [
          getDocs(query(collection(db, 'products')))
        ];
        
        if (activeTab === 'analytics') {
          fetchPromises.push(getDocs(query(collection(db, 'orders'))));
          fetchPromises.push(getDocs(query(collection(db, 'coupons'))));
        } else {
          fetchPromises.push(getDocs(query(collection(db, 'flashsales'))));
        }

        const results = await Promise.all(fetchPromises);
        setProducts(results[0].docs.map((d: any) => ({ id: d.id, ...d.data() } as Product)));
        
        if (activeTab === 'analytics') {
          setOrders(results[1].docs.map((d: any) => ({ id: d.id, ...d.data() } as Order)));
          setCoupons(results[2].docs.map((d: any) => ({ id: d.id, ...d.data() } as Coupon)));
        } else {
          const fsData = results[1].docs.map((d: any) => ({ id: d.id, ...d.data() } as FlashSale));
          fsData.sort((a, b) => (b.startTime?.seconds || 0) - (a.startTime?.seconds || 0));
          setFlashSales(fsData);
        }
      } else {
        const q = query(collection(db, collectionName));
        const snap = await getDocs(q);
        let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Use Type Assertion if needed to avoid TS exhaustive check errors
        const currentTab = activeTab as string;
        if (['orders', 'products', 'inventory', 'articles', 'coupons', 'flashsales'].includes(currentTab)) {
          data.sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds || a.startTime?.seconds || 0;
            const timeB = b.createdAt?.seconds || b.startTime?.seconds || 0;
            return timeB - timeA;
          });
        }

        if (activeTab === 'products' || activeTab === 'inventory') setProducts(data as Product[]);
        else if (activeTab === 'articles') setArticles(data as Article[]);
        else if (activeTab === 'orders') setOrders(data as Order[]);
        else if (activeTab === 'pages') setPages(data as PolicyPage[]);
        else if (activeTab === 'coupons') setCoupons(data as Coupon[]);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), removeUndefined(settingsData));
      toast('success', "Cài đặt đã được lưu thành công!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast('error', "Lỗi khi lưu cài đặt.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), removeUndefined({ status: newStatus }));
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  const deleteFlashSale = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa chương trình Flash Sale này?')) return;
    try {
      await deleteDoc(doc(db, 'flashsales', id));
      setFlashSales(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error("Error deleting flash sale:", error);
    }
  };

  const dashboardStats = {
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.total, 0),
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    avgOrderValue: orders.length ? orders.reduce((acc, o) => acc + o.total, 0) / orders.length : 0,
    topProducts: products.sort((a, b) => (b as any).soldCount - (a as any).soldCount).slice(0, 5),
    lowStock: products.filter(p => p.stock <= 5).length
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      await updateDoc(doc(db, 'products', productId), removeUndefined({ stock: newStock }));
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Tên sản phẩm', 'Danh mục', 'Giá', 'Tồn kho'];
    const rows = products.map(p => [p.id, p.name, p.category, p.price, p.stock]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || 
        p.category === filterCategory || 
        (p.categories && p.categories.includes(filterCategory));
      
      let matchesInventory = true;
      if (activeTab === 'inventory') {
        if (inventoryFilter === 'low') matchesInventory = p.stock <= 5 && p.stock > 0;
        else if (inventoryFilter === 'out') matchesInventory = p.stock === 0;
      }
      
      return matchesSearch && matchesCategory && matchesInventory;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inventoryStats = {
    totalProducts: products.length,
    totalStock: products.reduce((acc, p) => acc + p.stock, 0),
    lowStockItems: products.filter(p => p.stock <= 5).length,
    outOfStockItems: products.filter(p => p.stock === 0).length,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      color: '',
      price: formData.price || 0,
      stock: 0
    };
    setVariants(prev => [...prev, newVariant]);
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setExistingImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const formatInputDate = (date: any) => {
    if (!date) return '';
    let d = date;
    if (d.seconds) d = new Date(d.seconds * 1000);
    if (!(d instanceof Date)) d = new Date(d);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatInputDateTime = (date: any) => {
    if (!date) return '';
    let d = date;
    if (d.seconds) d = new Date(d.seconds * 1000);
    if (!(d instanceof Date)) d = new Date(d);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrls = [...existingImages];

      // Upload new images (if any)
      if (selectedFiles.length > 0) {
        try {
          const uploadPromises = selectedFiles.map(async (file) => {
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            return getDownloadURL(storageRef);
          });
          const newUrls = await Promise.all(uploadPromises);
          imageUrls = [...imageUrls, ...newUrls];
        } catch (storageError) {
          console.error("Firebase Storage error:", storageError);
          toast('warning', "Không thể tải ảnh trực tiếp lên. Vui lòng sử dụng tính năng 'Thêm ảnh bằng Link'.");
          // We continue because they might have added links
        }
      }

      const data: any = { 
        ...formData, 
        categories: selectedCategories,
        variants: variants.length > 0 ? variants : null,
        createdAt: serverTimestamp() 
      };

      if (activeTab === 'products') {
        data.imageUrls = imageUrls.filter(url => url && url.trim() !== '');
        delete data.imageUrl;
        delete data.category;
      } else if (activeTab === 'articles') {
        // For articles, we use singular imageUrl
        if (imageUrls.length > 0) {
          data.imageUrl = imageUrls[0];
        }
        delete data.imageUrls;
      } else if (activeTab === 'pages') {
        data.updatedAt = serverTimestamp();
        // For pages, the ID is the slug (e.g., 'warranty')
        await setDoc(doc(db, 'pages', data.id), removeUndefined(data));
        setShowModal(false);
        setEditingItem(null);
        setFormData({});
        fetchData();
        return;
      } else if (activeTab === 'coupons') {
        delete data.categories;
        delete data.variants;
        if (data.code) data.code = data.code.toUpperCase().trim();
        data.isActive = data.isActive ?? true;
        if (!editingItem) data.usageCount = 0;
      } else if (activeTab === 'flashsales') {
        delete data.categories;
        delete data.variants;
        data.isActive = data.isActive ?? true;
      }

      if (editingItem) {
        await updateDoc(doc(db, activeTab, editingItem.id), removeUndefined(data));
      } else {
        await addDoc(collection(db, activeTab), removeUndefined(data));
      }
      
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      setSelectedFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      setSelectedCategories([]);
      setVariants([]);
      fetchData();
      toast('success', 'Đã lưu thành công!');
    } catch (error) {
      console.error("Error saving item:", error);
      toast('error', 'Lỗi khi lưu: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
      toast('success', 'Đã xóa thành công!');
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const openModal = (item: any = null) => {
    setEditingItem(item);
    setFormData(item || {});
    setSelectedFiles([]);
    setImagePreviews([]);
    setImageUrlInput('');
    
    if (item) {
      if (activeTab === 'products') {
        setExistingImages(item.imageUrls || (item.imageUrl ? [item.imageUrl] : []));
        setSelectedCategories(item.categories || (item.category ? [item.category] : []));
        setVariants(item.variants || []);
      } else if (activeTab === 'articles') {
        setExistingImages(item.imageUrl ? [item.imageUrl] : []);
        setSelectedCategories([]);
        setVariants([]);
      }
    } else {
      setExistingImages([]);
      setSelectedCategories([]);
      setVariants([]);
    }
    
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">Bảng điều khiển</h1>
          <div className="h-1.5 w-20 bg-red-600 mt-2 rounded-full"></div>
        </div>
        
        <div className="flex flex-wrap bg-white p-1 rounded-2xl shadow-sm border border-gray-100 gap-1">
          {[
            { id: 'analytics', label: 'Thống kê', icon: <ArrowUpDown size={18} /> },
            { id: 'products', label: 'Sản phẩm', icon: <Package size={18} /> },
            { id: 'inventory', label: 'Kho hàng', icon: <Boxes size={18} /> },
            { id: 'orders', label: 'Đơn hàng', icon: <ClipboardList size={18} /> },
            { id: 'coupons', label: 'Giảm giá', icon: <ArrowUpDown size={18} /> },
            { id: 'flashsales', label: 'Flash Sale', icon: <Clock size={18} /> },
            { id: 'articles', label: 'Bài viết', icon: <FileText size={18} /> },
            { id: 'pages', label: 'Trang', icon: <FileText size={18} /> },
            { id: 'settings', label: 'Cài đặt', icon: <SettingsIcon size={18} /> },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 xl:px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'analytics' && activeTab !== 'inventory' && activeTab !== 'settings' && (
          <button 
            onClick={() => openModal()}
            className="px-8 py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-black/10 active:scale-95"
          >
            <Plus size={20} /> Thêm {activeTab === 'products' ? 'sản phẩm' : activeTab === 'articles' ? 'bài viết' : activeTab === 'pages' ? 'trang' : activeTab === 'coupons' ? 'mã giảm giá' : 'Flash Sale'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-64 rounded-3xl"></div>
          ))}
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="space-y-12">
          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Tổng doanh thu', value: formatCurrency(dashboardStats.totalRevenue), icon: <ArrowUpDown size={24} />, color: 'bg-green-50 text-green-600', sub: `${dashboardStats.completedOrders} đơn thành công` },
              { label: 'Tổng đơn hàng', value: dashboardStats.totalOrders, icon: <ClipboardList size={24} />, color: 'bg-blue-50 text-blue-600', sub: 'Tất cả trạng thái' },
              { label: 'Giá trị TB', value: formatCurrency(dashboardStats.avgOrderValue), icon: <Star size={24} />, color: 'bg-indigo-50 text-indigo-600', sub: 'Trên mỗi đơn hàng' },
              { label: 'Cần xử lý', value: dashboardStats.pendingOrders, icon: <Clock size={24} />, color: 'bg-amber-50 text-amber-600', sub: 'Đơn đang chờ' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all"
              >
                <div className={cn("p-4 rounded-2xl w-fit mb-6", stat.color)}>
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-2xl font-black text-gray-900 mb-1">{stat.value}</h4>
                <p className="text-[10px] text-gray-400 font-bold">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-red-50 border-2 border-red-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="p-6 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-600/20">
              <User size={40} />
            </div>
            <div className="text-center md:text-left flex-grow">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2 italic">Cấu hình Quản trị viên</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">
                Để thêm quản trị viên mới, hãy sao chép UID của người dùng trong Authentication, sau đó truy cập 
                <a href="https://console.firebase.google.com" target="_blank" className="font-bold text-red-600 hover:underline mx-1">Firebase Console</a>, 
                vào Firestore và tạo 1 document mới trong bộ sưu tập <code className="bg-red-100 px-2 py-0.5 rounded text-red-600 font-black">admins</code> với ID là UID của người dùng đó.
              </p>
            </div>
            <a 
              href="https://console.firebase.google.com" 
              target="_blank"
              className="px-8 py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center gap-2"
            >
              Mở Firebase
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Products */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                <Star size={20} className="text-amber-500" /> Sản phẩm HOT
              </h3>
              <div className="space-y-6">
                {dashboardStats.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                        <img src={p.imageUrls?.[0] || p.imageUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800 line-clamp-1 group-hover:text-red-600 transition-colors">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-red-600">{formatCurrency(p.price)}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tồn: {p.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                <ClipboardList size={20} className="text-blue-500" /> Đơn hàng mới nhất
              </h3>
              <div className="space-y-6">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center font-black text-[10px] text-gray-400 border border-gray-100">
                        #{o.id.slice(-4).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800 line-clamp-1">{o.customerInfo.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-green-600">{formatCurrency(o.total)}</p>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                        o.status === 'completed' ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'coupons' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loại</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Giá trị</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hạn dùng</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lượt dùng</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-gray-900 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {coupon.type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
                    </td>
                    <td className="px-8 py-5 text-xs font-black text-gray-900">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {coupon.expiryDate?.seconds ? new Date(coupon.expiryDate.seconds * 1000).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {coupon.usageCount} / {coupon.usageLimit || '∞'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-2">
                        <button onClick={() => openModal(coupon)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'flashsales' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Chương trình</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bắt đầu</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kết thúc</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {flashSales.map((fs) => (
                  <tr key={fs.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                    <td className="px-8 py-5 text-xs font-black text-gray-900">{fs.title}</td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {fs.startTime?.seconds ? new Date(fs.startTime.seconds * 1000).toLocaleString('vi-VN') : ''}
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {fs.endTime?.seconds ? new Date(fs.endTime.seconds * 1000).toLocaleString('vi-VN') : ''}
                    </td>
                    <td className="px-8 py-5 text-xs font-black text-red-600">{(fs.products?.length || 0)} SP</td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                        fs.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {fs.isActive ? 'Đang chạy' : 'Đã dừng'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-2">
                        <button onClick={() => openModal(fs)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => deleteFlashSale(fs.id)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn hàng</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Khách hàng</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng tiền</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-xs font-black text-gray-900">#{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : ''}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex -space-x-3 overflow-hidden">
                          {(order.items || []).slice(0, 3).map((item, idx) => {
                            const imageUrls = item.imageUrls;
                            const firstImageUrl = Array.isArray(imageUrls) ? imageUrls[0] : (typeof imageUrls === 'string' ? imageUrls : null);
                            const displayUrl = firstImageUrl || 
                                               item.imageUrl || 
                                               (item as any).image || 
                                               (item as any).product?.imageUrls?.[0] || 
                                               (item as any).product?.imageUrl ||
                                               `https://picsum.photos/seed/${idx}/100/100`;

                            return (
                              <div key={idx} className="inline-block h-10 w-10 rounded-xl ring-2 ring-white bg-white overflow-hidden border border-gray-100 shadow-md">
                                <img 
                                  src={displayUrl} 
                                  alt={item.name} 
                                  className="h-full w-full object-cover" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/100x100?text=${encodeURIComponent(item.name?.slice(0,1) || 'P')}`;
                                  }}
                                />
                              </div>
                            );
                          })}
                          {(order.items?.length || 0) > 3 && (
                            <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-50 text-[10px] font-black text-gray-400 border border-gray-100">
                              +{(order.items?.length || 0) - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-gray-900">{order.customerInfo.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{order.customerInfo.phone}</p>
                        <p className="text-[10px] text-gray-400 mt-1 italic line-clamp-1" title={order.customerInfo.address}>{order.customerInfo.address}</p>
                        {order.customerInfo.note && (
                          <p className="text-[9px] text-amber-600 font-bold mt-1">Ghi chú: {order.customerInfo.note}</p>
                        )}
                      </td>
                      <td className="px-8 py-5 text-xs font-black text-red-600">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-8 py-5">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border outline-none",
                            order.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                            order.status === 'received' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            order.status === 'shipping' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                            order.status === 'completed' ? "bg-green-50 text-green-600 border-green-100" :
                            "bg-red-50 text-red-600 border-red-100"
                          )}
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="received">Đã tiếp nhận</option>
                          <option value="shipping">Đang giao</option>
                          <option value="completed">Thành công</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => {
                            const items = (order.items || []).map(i => `${i.name} (x${i.quantity})`).join('\n');
                            toast('info', `Sản phẩm: ${items}`);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <FileText size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'pages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {predefinedPages.map((prePage) => {
            const existingPage = pages.find(p => p.id === prePage.id);
            return (
              <motion.div 
                key={prePage.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all group"
              >
                <div>
                  <div className="p-5 bg-red-50 text-red-600 rounded-[1.5rem] w-fit mb-8 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                    <FileText size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-3 leading-tight">{prePage.title}</h3>
                  <div className="flex items-center gap-2 mb-8">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Slug: {prePage.id}</span>
                  </div>
                  
                  {existingPage ? (
                    <div className="text-sm text-gray-500 line-clamp-3 mb-10 font-medium leading-relaxed">
                      {existingPage.content.replace(/<[^>]*>?/gm, '').slice(0, 120)}...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-amber-600 mb-10 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <AlertTriangle size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Nội dung trống</span>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => openModal(existingPage || { id: prePage.id, title: prePage.title, content: '' })}
                  className="w-full h-14 bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-red-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95"
                >
                  <Edit2 size={16} /> Chỉnh sửa ngay
                </button>
              </motion.div>
            )
          })}
        </div>
      ) : activeTab === 'inventory' ? (
        <div className="space-y-8">
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Tổng sản phẩm', value: inventoryStats.totalProducts, icon: <Package size={20} />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Tổng tồn kho', value: inventoryStats.totalStock, icon: <Boxes size={20} />, color: 'bg-green-50 text-green-600' },
              { label: 'Sắp hết hàng', value: inventoryStats.lowStockItems, icon: <AlertTriangle size={20} />, color: 'bg-amber-50 text-amber-600' },
              { label: 'Hết hàng', value: inventoryStats.outOfStockItems, icon: <Trash2 size={20} />, color: 'bg-red-50 text-red-600' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4"
              >
                <div className={cn("p-3 rounded-2xl", stat.color)}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50">
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm sản phẩm..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                  />
                </div>
                
                <div className="flex bg-white rounded-xl p-1 border border-gray-100">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'low', label: 'Sắp hết' },
                    { id: 'out', label: 'Hết hàng' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setInventoryFilter(f.id as any)}
                      className={cn(
                        "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                        inventoryFilter === f.id ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-48">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm appearance-none"
                  >
                    <option value="all">Tất cả danh mục</option>
                    <option value="nintendo">Nintendo Switch</option>
                    <option value="playstation">PlayStation 5</option>
                    <option value="xbox">Xbox Series</option>
                    <option value="accessories">Phụ kiện</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={exportToCSV}
                className="w-full md:w-auto px-6 py-3 bg-white border border-gray-100 text-gray-600 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={16} /> Xuất báo cáo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">Sản phẩm <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-2">Danh mục <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('stock')}>
                      <div className="flex items-center gap-2">Số lượng <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('price')}>
                      <div className="flex items-center gap-2">Giá tiền <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode='popLayout'>
                    {filteredProducts.map((p) => (
                      <motion.tr 
                        key={p.id} 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl p-1 shrink-0 border border-gray-100 group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden">
                              <img 
                                src={p.imageUrls?.[0] || p.imageUrl || 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=100&auto=format&fit=crop'} 
                                alt={p.name} 
                                className="w-full h-full object-contain" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=100&auto=format&fit=crop';
                                }}
                              />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 line-clamp-1 text-sm">{p.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">ID: {p.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-1">
                            {(p.categories || [p.category]).map((cat, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase tracking-widest">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleUpdateStock(p.id, p.stock - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all font-black"
                            >-</button>
                            <span className={cn("w-10 text-center font-black text-lg", p.stock <= 5 ? "text-red-600" : "text-gray-900")}>
                              {p.stock}
                            </span>
                            <button 
                              onClick={() => handleUpdateStock(p.id, p.stock + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all font-black"
                            >+</button>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-black text-red-600 tracking-tight">
                            {formatCurrency(p.price)}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {p.stock === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest">
                              <X size={12} /> Hết hàng
                            </span>
                          ) : p.stock <= 5 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                              <AlertTriangle size={12} /> Sắp hết
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-600 text-[10px] font-black uppercase tracking-widest">
                              <Package size={12} /> Ổn định
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => openModal(p)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-lg"
                            title="Sửa chi tiết"
                          >
                            <Edit2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Không tìm thấy sản phẩm</h3>
                  <p className="text-gray-500">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={`Tìm kiếm ${activeTab === 'products' ? 'sản phẩm' : 'bài viết'}...`} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
              />
            </div>
            {activeTab === 'products' && (
              <div className="relative w-full md:w-64">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm appearance-none"
                >
                  <option value="all">Tất cả danh mục</option>
                  <option value="nintendo">Nintendo Switch</option>
                  <option value="playstation">PlayStation 5</option>
                  <option value="xbox">Xbox Series</option>
                  <option value="accessories">Phụ kiện</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeTab as string) === 'flashsales' ? (
              flashSales.map((sale) => (
                <motion.div 
                  key={sale.id}
                  className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn(
                      "p-4 rounded-2xl",
                      sale.isActive ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"
                    )}>
                      <Clock size={24} />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => openModal(sale)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18}/></button>
                       <button onClick={() => handleDelete(sale.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase mb-4">{sale.title}</h3>
                  <div className="space-y-2 text-sm text-gray-500 font-medium mb-6">
                    <p>Bắt đầu: {new Date(sale.startTime.seconds * 1000).toLocaleString()}</p>
                    <p>Kết thúc: {new Date(sale.endTime.seconds * 1000).toLocaleString()}</p>
                    <p>Sản phẩm: {sale.products.length}</p>
                  </div>
                  <div className={cn(
                    "inline-block px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                    sale.isActive ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
                  )}>
                    {sale.isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
                  </div>
                </motion.div>
              ))
            ) : (activeTab === 'products' ? filteredProducts : filteredArticles).map((item: any) => (
              <motion.div 
                key={item.id}
                layout
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative"
              >
                <div className="aspect-video bg-gray-50 rounded-2xl mb-6 overflow-hidden flex items-center justify-center p-4">
                  <img 
                    src={activeTab === 'products' ? (item.imageUrls?.[0] || item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`) : (item.imageUrl || `https://picsum.photos/seed/${item.id}/800/400`)} 
                    alt={item.name || item.title} 
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name || item.title || 'Image')}`;
                    }}
                  />
                </div>
                
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2 block">
                    {activeTab === 'products' ? (item.categories?.[0] || item.category || 'Chưa phân loại') : (item.category || 'Tin tức')}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-2">
                    {item.name || item.title}
                  </h3>
                  {activeTab === 'products' && (
                    <p className="text-xl font-black text-gray-900 tracking-tight">
                      {formatCurrency(item.price)}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-50">
                  <button 
                    onClick={() => openModal(item)}
                    className="flex-1 h-12 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} /> Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 h-12 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {(activeTab === 'products' ? filteredProducts : filteredArticles).length === 0 && (
            <div className="p-20 text-center bg-white rounded-3xl border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Không tìm thấy mục nào</h3>
              <p className="text-gray-500">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {activeTab === 'settings' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gray-900 text-white rounded-2xl">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">Cài đặt hệ thống</h2>
              <p className="text-gray-500 text-sm">Quản lý thông tin liên hệ, banner và thanh toán.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">Thông tin liên hệ</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Địa chỉ</label>
                    <input 
                      type="text" 
                      value={settingsData.address} 
                      onChange={(e) => setSettingsData({...settingsData, address: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Số điện thoại</label>
                    <input 
                      type="text" 
                      value={settingsData.phone} 
                      onChange={(e) => setSettingsData({...settingsData, phone: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={settingsData.email} 
                      onChange={(e) => setSettingsData({...settingsData, email: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Số điện thoại Zalo</label>
                    <input 
                      type="text" 
                      value={settingsData.zaloNumber || ''} 
                      onChange={(e) => setSettingsData({...settingsData, zaloNumber: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                      placeholder="Ví dụ: 0123456789"
                    />
                  </div>
                </div>
              </div>

              {/* Banner Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">Banner Mặc định (Nếu không có danh sách)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">URL Hình ảnh Banner</label>
                    <input 
                      type="text" 
                      value={settingsData.bannerUrl} 
                      onChange={(e) => setSettingsData({...settingsData, bannerUrl: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tiêu đề Banner</label>
                    <input 
                      type="text" 
                      value={settingsData.bannerTitle} 
                      onChange={(e) => setSettingsData({...settingsData, bannerTitle: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Mô tả Banner</label>
                    <textarea 
                      value={settingsData.bannerSubtitle} 
                      onChange={(e) => setSettingsData({...settingsData, bannerSubtitle: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Căn lề Nội dung Banner</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => setSettingsData({...settingsData, bannerAlignment: align})}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            settingsData.bannerAlignment === align 
                              ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                              : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {align === 'left' ? 'Trái' : align === 'center' ? 'Giữa' : 'Phải'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Banner Section */}
              <div className="space-y-6 md:col-span-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-bold">Danh sách Banner Chạy vòng (Nên có 3-5 banner)</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      const currentBanners = settingsData.banners || [];
                      setSettingsData({...settingsData, banners: [...currentBanners, { url: '', title: '', subtitle: '', link: '' }]});
                    }}
                    className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Thêm Banner
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(settingsData.banners || []).map((banner, index) => (
                    <div key={index} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4 relative group hover:shadow-xl transition-all">
                      <button 
                        type="button"
                        onClick={() => {
                          const newBanners = settingsData.banners?.filter((_, i) => i !== index);
                          setSettingsData({...settingsData, banners: newBanners});
                        }}
                        className="absolute top-4 right-4 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded-full shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banner # {index + 1}</p>
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="URL Hình ảnh"
                          value={banner.url}
                          onChange={(e) => {
                            const newBanners = [...(settingsData.banners || [])];
                            newBanners[index].url = e.target.value;
                            setSettingsData({...settingsData, banners: newBanners});
                          }}
                          className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <input 
                          type="text" 
                          placeholder="Tiêu đề"
                          value={banner.title}
                          onChange={(e) => {
                            const newBanners = [...(settingsData.banners || [])];
                            newBanners[index].title = e.target.value;
                            setSettingsData({...settingsData, banners: newBanners});
                          }}
                          className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <input 
                          type="text" 
                          placeholder="Link khi nhấn vào"
                          value={banner.link}
                          onChange={(e) => {
                            const newBanners = [...(settingsData.banners || [])];
                            newBanners[index].link = e.target.value;
                            setSettingsData({...settingsData, banners: newBanners});
                          }}
                          className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  ))}
                  {(settingsData.banners || []).length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 font-bold uppercase tracking-widest text-xs">
                      Chưa có banner nào trong danh sách chạy vòng.
                    </div>
                  )}
                </div>
              </div>

              {/* Side Banners */}
              <div className="space-y-6 md:col-span-2">
                <h3 className="text-lg font-bold border-b pb-2">Banner Dọc 2 Bên (Chỉ hiển thị trên máy tính màn hình lớn)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">URL Banner Trái</label>
                      <input 
                        type="text" 
                        value={settingsData.leftBannerUrl || ''} 
                        onChange={(e) => setSettingsData({...settingsData, leftBannerUrl: e.target.value})}
                        className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                        placeholder="Link ảnh dọc (Pixel gợi ý: 180x600)"
                      />
                    </div>
                    {settingsData.leftBannerUrl && (
                      <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                        <img src={settingsData.leftBannerUrl} alt="Left Preview" className="h-[200px] object-contain rounded-lg shadow-md" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">URL Banner Phải</label>
                      <input 
                        type="text" 
                        value={settingsData.rightBannerUrl || ''} 
                        onChange={(e) => setSettingsData({...settingsData, rightBannerUrl: e.target.value})}
                        className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                        placeholder="Link ảnh dọc (Pixel gợi ý: 180x600)"
                      />
                    </div>
                    {settingsData.rightBannerUrl && (
                      <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                        <img src={settingsData.rightBannerUrl} alt="Right Preview" className="h-[200px] object-contain rounded-lg shadow-md" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-6 md:col-span-2">
                <h3 className="text-lg font-bold border-b pb-2">Thanh toán</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">URL Mã QR Ngân hàng</label>
                    <input 
                      type="text" 
                      value={settingsData.bankQrUrl} 
                      onChange={(e) => setSettingsData({...settingsData, bankQrUrl: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                      placeholder="Dán link ảnh mã QR tại đây"
                    />
                  </div>
                  {settingsData.bankQrUrl && (
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Xem trước QR Ngân hàng</p>
                        <img src={settingsData.bankQrUrl} alt="QR Preview" className="h-32 object-contain mx-auto" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">URL Mã QR Ví điện tử (Momo/ZaloPay)</label>
                    <input 
                      type="text" 
                      value={settingsData.momoQrUrl} 
                      onChange={(e) => setSettingsData({...settingsData, momoQrUrl: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                      placeholder="Dán link ảnh mã QR Ví điện tử tại đây"
                    />
                  </div>
                  {settingsData.momoQrUrl && (
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Xem trước QR Ví</p>
                        <img src={settingsData.momoQrUrl} alt="QR Preview" className="h-32 object-contain mx-auto" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Default Stock Status */}
              <div className="space-y-6 md:col-span-2">
                <h3 className="text-lg font-bold border-b pb-2">Trạng thái Cửa hàng (Mặc định cho toàn bộ sản phẩm)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Dòng chữ chính (Ví dụ: Sẵn hàng tại kho)</label>
                    <input 
                      type="text" 
                      value={settingsData.defaultStockStatus || ''} 
                      onChange={(e) => setSettingsData({...settingsData, defaultStockStatus: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                      placeholder="Mặc định: Sẵn hàng tại kho"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Dòng chú thích chi tiết (Ví dụ: Giao hàng hỏa tốc...)</label>
                    <input 
                      type="text" 
                      value={settingsData.defaultStockStatusDetail || ''} 
                      onChange={(e) => setSettingsData({...settingsData, defaultStockStatusDetail: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                      placeholder="Mặc định: Giao hàng hỏa tốc trong 2h..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Dòng chữ chính khi HẾT HÀNG</label>
                    <input 
                      type="text" 
                      value={settingsData.defaultOutOfStockStatus || ''} 
                      onChange={(e) => setSettingsData({...settingsData, defaultOutOfStockStatus: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                      placeholder="Mặc định: Hết hàng"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Dòng chú thích khi HẾT HÀNG</label>
                    <input 
                      type="text" 
                      value={settingsData.defaultOutOfStockStatusDetail || ''} 
                      onChange={(e) => setSettingsData({...settingsData, defaultOutOfStockStatusDetail: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                      placeholder="Mặc định: Vui lòng liên hệ để đặt trước"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <button 
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'Đang lưu...' : 'Lưu tất cả cài đặt'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">
                  {editingItem ? 'Cập nhật' : 'Thêm mới'} {
                    activeTab === 'products' ? 'sản phẩm' : 
                    activeTab === 'articles' ? 'bài viết' : 
                    activeTab === 'pages' ? 'trang' : 
                    activeTab === 'coupons' ? 'mã giảm giá' : 
                    'Flash Sale'
                  }
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {activeTab === 'pages' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tên trang</label>
                      <input 
                        type="text" 
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nội dung (HTML mượt mà)</label>
                      <textarea 
                        required
                        rows={12}
                        value={formData.content || ''}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium font-mono text-sm min-h-[300px]"
                        placeholder="Có thể sử dụng thẻ <h3>, <p>, <ul>, <li> để trình bày đẹp mắt..."
                      />
                    </div>
                  </div>
                ) : activeTab === 'coupons' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mã giảm giá</label>
                        <input 
                          type="text" 
                          required
                          value={formData.code || ''}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-black"
                          placeholder="FREE50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loại</label>
                        <select 
                          value={formData.type || 'percentage'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        >
                          <option value="percentage">Phần trăm (%)</option>
                          <option value="fixed">Số tiền cố định (đ)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giá trị giảm</label>
                        <input 
                          type="number" 
                          required
                          value={formData.value || ''}
                          onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hạn dùng</label>
                        <input 
                          type="date" 
                          required
                          value={formatInputDate(formData.expiryDate)}
                          onChange={(e) => setFormData({ ...formData, expiryDate: new Date(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đơn tối thiểu (đ)</label>
                        <input 
                          type="number" 
                          value={formData.minOrderValue || ''}
                          onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                          placeholder="Ví dụ: 100000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giới hạn số lần dùng</label>
                        <input 
                          type="number" 
                          value={formData.usageLimit || ''}
                          onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                          placeholder="Bỏ trống nếu vô hạn"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trạng thái mã</label>
                        <select 
                          value={formData.isActive === false ? 'inactive' : 'active'}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        >
                          <option value="active">Đang hoạt động</option>
                          <option value="inactive">Tạm dừng (Vô hiệu hóa)</option>
                        </select>
                      </div>
                      {formData.type === 'percentage' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-red-600 uppercase tracking-widest">Giảm tối đa (đ)</label>
                          <input 
                            type="number" 
                            value={formData.maxDiscount || ''}
                            onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) })}
                            className="w-full px-4 py-3 bg-red-50/50 border border-red-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-black text-red-600"
                            placeholder="Tối đa giảm bao nhiêu?"
                          />
                        </div>
                      )}
                    </div>
                    {formData.type === 'percentage' && formData.maxDiscount && (
                      <p className="text-[10px] text-gray-400 font-medium italic text-right">* Mã sẽ giảm {formData.value}%, nhưng không vượt quá {formatCurrency(formData.maxDiscount)}</p>
                    )}
                  </div>
                ) : activeTab === 'flashsales' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tiêu đề chương trình</label>
                      <input 
                        type="text" 
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bắt đầu</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={formatInputDateTime(formData.startTime)}
                          onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kết thúc</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={formatInputDateTime(formData.endTime)}
                          onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm tham gia ({ (formData.products || []).length })</label>
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="Tìm sản phẩm..."
                            value={fsProductSearch}
                            onChange={(e) => setFsProductSearch(e.target.value)}
                            className="w-full sm:w-48 pl-8 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500 transition-all"
                          />
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                        {products
                          .filter(p => !fsProductSearch || p.name.toLowerCase().includes(fsProductSearch.toLowerCase()))
                          .map(product => {
                            const fsProd = (formData.products || []).find((p: any) => p.productId === product.id);
                            const isSelected = !!fsProd;
                            
                            return (
                              <div key={product.id} className={cn(
                                "p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                                isSelected ? "bg-white border-red-200 shadow-sm" : "bg-white/50 border-transparent hover:border-gray-200"
                              )}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const currentProducts = formData.products || [];
                                      if (isSelected) {
                                        setFormData({ ...formData, products: currentProducts.filter((p: any) => p.productId !== product.id) });
                                      } else {
                                        setFormData({ ...formData, products: [...currentProducts, { productId: product.id, salePrice: Math.round(product.price * 0.9) }] });
                                      }
                                    }}
                                    className={cn(
                                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                                      isSelected ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20" : "bg-white border-gray-200"
                                    )}
                                  >
                                    {isSelected ? <CheckCircle2 size={14} /> : <Plus size={14} className="text-gray-300" />}
                                  </button>
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                    <img src={product.imageUrls?.[0] || product.imageUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatCurrency(product.price)}</p>
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="flex flex-wrap items-center gap-2 shrink-0 bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                                    <div className="flex items-center gap-1 border-r border-red-100 pr-2">
                                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Giảm:</span>
                                      <input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={Math.round((1 - (fsProd.salePrice / product.price)) * 100)}
                                        onChange={(e) => {
                                          const percent = parseInt(e.target.value) || 0;
                                          const newPrice = Math.round(product.price * (1 - percent / 100));
                                          setFormData({
                                            ...formData,
                                            products: (formData.products || []).map((p: any) => 
                                              p.productId === product.id ? { ...p, salePrice: newPrice } : p
                                            )
                                          });
                                        }}
                                        className="w-12 px-1 py-1 bg-white border border-red-100 rounded text-center text-xs font-black text-red-600 outline-none focus:ring-2 focus:ring-red-500"
                                      />
                                      <span className="text-[9px] font-black text-red-600">%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Giá:</span>
                                      <input 
                                        type="number"
                                        value={fsProd.salePrice}
                                        onChange={(e) => {
                                          const newValue = parseInt(e.target.value) || 0;
                                          setFormData({
                                            ...formData,
                                            products: (formData.products || []).map((p: any) => 
                                              p.productId === product.id ? { ...p, salePrice: newValue } : p
                                            )
                                          });
                                        }}
                                        className="w-28 px-3 py-1.5 bg-white border border-red-100 rounded-lg text-xs font-black text-red-600 outline-none focus:ring-2 focus:ring-red-500 text-right"
                                      />
                                      <span className="text-[9px] font-black text-red-600">đ</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {products.length === 0 && !loading && (
                          <div className="text-center py-10">
                            <Package size={32} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Không tìm thấy sản phẩm nào</p>
                          </div>
                        )}
                        {loading && (
                          <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-red-600 mx-auto"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'products' ? (
                  <>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tên sản phẩm</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Danh mục (Chọn nhiều)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          {categoriesList.map(cat => (
                            <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                              <div 
                                onClick={() => toggleCategory(cat.id)}
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                  selectedCategories.includes(cat.id) ? "bg-red-600 border-red-600" : "bg-white border-gray-200 group-hover:border-red-400"
                                )}
                              >
                                {selectedCategories.includes(cat.id) && <CheckCircle2 size={12} className="text-white" />}
                              </div>
                              <span className="text-xs font-bold text-gray-600">{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giá bán hiện tại (VND)</label>
                        <input 
                          type="number" 
                          required
                          placeholder="Ví dụ: 8000000"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giá gốc (Để tính % giảm)</label>
                        <input 
                          type="number" 
                          placeholder="Ví dụ: 10000000"
                          value={formData.originalPrice || ''}
                          onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng tồn kho</label>
                        <input 
                          type="number" 
                          required
                          value={formData.stock || ''}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trạng thái kho (Tùy chỉnh)</label>
                        <input 
                          type="text" 
                          placeholder="Mặc định: Sẵn hàng tại kho"
                          value={formData.customStatus || ''}
                          onChange={(e) => setFormData({ ...formData, customStatus: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chi tiết trạng thái</label>
                        <input 
                          type="text" 
                          placeholder="Mặc định: Giao hàng hỏa tốc trong 2h..."
                          value={formData.customStatusDetail || ''}
                          onChange={(e) => setFormData({ ...formData, customStatusDetail: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hình ảnh sản phẩm</label>
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Khuyên dùng: Sử dụng Link ảnh</span>
                      </div>
                      
                      {/* URL Input Method */}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Dán link ảnh tại đây (ví dụ: https://imgur.com/abc.jpg)"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                        />
                        <button 
                          type="button"
                          onClick={addImageUrl}
                          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
                        >
                          Thêm Link
                        </button>
                      </div>

                      {/* Existing Images */}
                      {existingImages.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                          {existingImages.map((url, idx) => (
                            <div key={idx} className="relative aspect-square bg-white rounded-xl border border-gray-100 p-1 group flex items-center justify-center overflow-hidden shadow-sm">
                              <img src={url} alt="Existing" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeExistingImage(url)}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                          {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative aspect-square bg-red-50 rounded-xl border border-red-100 p-1 group">
                              <img src={preview} alt="New Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeSelectedFile(idx)}
                                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow-lg"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all group"
                      >
                        <Upload className="text-gray-400 group-hover:text-red-500 transition-colors" />
                        <div className="text-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block group-hover:text-red-600 transition-colors">Tải lên hình ảnh</span>
                          <p className="text-[9px] text-gray-300 font-medium mt-1 uppercase tracking-tighter">(Yêu cầu gói Firebase Blaze)</p>
                        </div>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phiên bản & Màu sắc</label>
                        <button 
                          type="button"
                          onClick={addVariant}
                          className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                        >
                          <Plus size={12} /> Thêm phiên bản
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {variants.map((variant, idx) => (
                          <div key={variant.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase"># {idx + 1}</span>
                              <button 
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tên phiên bản</label>
                                <input 
                                  type="text"
                                  placeholder="Ví dụ: Standard, Pro..."
                                  value={variant.name}
                                  onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Màu sắc</label>
                                <input 
                                  type="text"
                                  placeholder="Ví dụ: Đỏ, Xanh..."
                                  value={variant.color}
                                  onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Giá hiện tại</label>
                                <input 
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value))}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Giá gốc (Giảm giá)</label>
                                <input 
                                  type="number"
                                  value={variant.originalPrice || ''}
                                  onChange={(e) => updateVariant(variant.id, 'originalPrice', parseFloat(e.target.value))}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium"
                                  placeholder="Ví dụ: 12000000"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tồn kho</label>
                                <input 
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium"
                                />
                              </div>
                              <div className="lg:col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Trạng thái (Tùy chỉnh)</label>
                                <input 
                                  type="text"
                                  value={variant.customStatus || ''}
                                  onChange={(e) => updateVariant(variant.id, 'customStatus', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium"
                                  placeholder="Ví dụ: Sẵn sàng giao"
                                />
                              </div>
                              <div className="lg:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Chi tiết trạng thái</label>
                                <input 
                                  type="text"
                                  value={variant.customStatusDetail || ''}
                                  onChange={(e) => updateVariant(variant.id, 'customStatusDetail', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium"
                                  placeholder="Ví dụ: Giao ngay trong ngày"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mô tả sản phẩm</label>
                      <textarea 
                        rows={4}
                        required
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                      ></textarea>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tiêu đề bài viết</label>
                      <input 
                        type="text" 
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tác giả</label>
                        <input 
                          type="text" 
                          required
                          value={formData.author || ''}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Danh mục bài viết</label>
                        <input 
                          type="text" 
                          placeholder="Ví dụ: Tin tức, Khuyến mãi..."
                          value={formData.category || ''}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hình ảnh bài viết</label>
                      
                      {/* URL Input Method */}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Dán link ảnh tại đây"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                        />
                        <button 
                          type="button"
                          onClick={addImageUrl}
                          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
                        >
                          Thêm Link
                        </button>
                      </div>

                      {/* Existing Images */}
                      {existingImages.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                          {existingImages.map((url, idx) => (
                            <div key={idx} className="relative aspect-square bg-white rounded-xl border border-gray-100 p-1 group flex items-center justify-center overflow-hidden shadow-sm">
                              <img src={url} alt="Existing" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeExistingImage(url)}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                          {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative aspect-square bg-red-50 rounded-xl border border-red-100 p-1 group">
                              <img src={preview} alt="New Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeSelectedFile(idx)}
                                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow-lg"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all group"
                      >
                        <Upload className="text-gray-400 group-hover:text-red-500 transition-colors" />
                        <div className="text-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block group-hover:text-red-600 transition-colors">Tải lên hình ảnh</span>
                          <p className="text-[9px] text-gray-300 font-medium mt-1 uppercase tracking-tighter">(Yêu cầu gói Firebase Blaze)</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nội dung (Markdown)</label>
                      <textarea 
                        rows={8}
                        required
                        value={formData.content || ''}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium font-mono text-sm"
                      ></textarea>
                    </div>
                  </>
                )}

                <div className="pt-8 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-14 bg-gray-100 text-gray-600 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 h-14 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/20"
                  >
                    <Save size={20} /> Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
