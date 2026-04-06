import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Plus, Trash2, Edit2, Package, FileText, X, Save, Image as ImageIcon, Search, ChevronRight, Boxes, AlertTriangle, Settings as SettingsIcon, Minus, Download, Filter, ArrowUpDown, Upload, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { AppSettings, Product, Article, ProductVariant } from '../types';
import { useState, useEffect, useRef } from 'react';

interface AdminDashboardProps {
  settings: AppSettings;
}

export default function AdminDashboard({ settings }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'articles' | 'inventory' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoriesList = [
    { id: 'nintendo', name: 'Nintendo Switch' },
    { id: 'playstation', name: 'PlayStation 5' },
    { id: 'xbox', name: 'Xbox Series' },
    { id: 'accessories', name: 'Phụ kiện' },
    { id: 'games', name: 'Trò chơi' },
    { id: 'limited', name: 'Phiên bản giới hạn' }
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const collectionName = activeTab === 'inventory' ? 'products' : activeTab;
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (activeTab === 'products' || activeTab === 'inventory') setProducts(data as Product[]);
      else if (activeTab === 'articles') setArticles(data as Article[]);
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
      await setDoc(doc(db, 'settings', 'general'), settingsData);
      alert('Cài đặt đã được lưu thành công!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Lỗi khi lưu cài đặt.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      await updateDoc(doc(db, 'products', productId), { stock: newStock });
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
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrls = [...existingImages];

      // Upload new images
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });
        const newUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newUrls];
      }

      const data = { 
        ...formData, 
        imageUrls,
        categories: selectedCategories,
        variants: variants.length > 0 ? variants : null,
        createdAt: serverTimestamp() 
      };

      // Remove old fields if they exist
      delete data.imageUrl;
      delete data.category;

      if (editingItem) {
        await updateDoc(doc(db, activeTab, editingItem.id), data);
      } else {
        await addDoc(collection(db, activeTab), data);
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
      alert('Đã lưu thành công!');
    } catch (error) {
      console.error("Error saving item:", error);
      alert('Lỗi khi lưu: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
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
    
    if (item && activeTab === 'products') {
      setExistingImages(item.imageUrls || (item.imageUrl ? [item.imageUrl] : []));
      setSelectedCategories(item.categories || (item.category ? [item.category] : []));
      setVariants(item.variants || []);
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
        
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Package size={18} /> Sản phẩm
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Boxes size={18} /> Kho hàng
          </button>
          <button 
            onClick={() => setActiveTab('articles')}
            className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'articles' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText size={18} /> Bài viết
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <SettingsIcon size={18} /> Cài đặt
          </button>
        </div>

        <button 
          onClick={() => openModal()}
          className="px-8 py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-black/10 active:scale-95"
        >
          <Plus size={20} /> Thêm {activeTab === 'products' ? 'sản phẩm' : 'bài viết'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-64 rounded-3xl"></div>
          ))}
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
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
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
                            <div className="w-12 h-12 bg-gray-50 rounded-xl p-1 shrink-0 border border-gray-100 group-hover:scale-110 transition-transform">
                              <img 
                                src={p.imageUrls?.[0] || p.imageUrl} 
                                alt={p.name} 
                                className="w-full h-full object-contain" 
                                referrerPolicy="no-referrer" 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(activeTab === 'products' ? products : articles).map((item: any) => (
            <motion.div 
              key={item.id}
              layout
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative"
            >
              <div className="aspect-video bg-gray-50 rounded-2xl mb-6 overflow-hidden flex items-center justify-center p-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.name || item.title} 
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="mb-6">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2 block">
                  {item.category || 'Tin tức'}
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
                </div>
              </div>

              {/* Banner Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">Banner Trang chủ</h3>
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
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Xem trước QR</p>
                        <img src={settingsData.bankQrUrl} alt="QR Preview" className="h-32 object-contain mx-auto" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  )}
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
                  {editingItem ? 'Cập nhật' : 'Thêm mới'} {activeTab === 'products' ? 'sản phẩm' : 'bài viết'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {activeTab === 'products' ? (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giá cơ bản (VND)</label>
                        <input 
                          type="number" 
                          required
                          placeholder="Ví dụ: 10000000 cho 10 triệu"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
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

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hình ảnh sản phẩm</label>
                      
                      {/* Existing Images */}
                      {existingImages.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                          {existingImages.map((url, idx) => (
                            <div key={idx} className="relative aspect-square bg-gray-50 rounded-xl border border-gray-100 p-1 group">
                              <img src={url} alt="Existing" className="w-full h-full object-contain" />
                              <button 
                                type="button"
                                onClick={() => removeExistingImage(url)}
                                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <X size={12} />
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
                              <img src={preview} alt="New Preview" className="w-full h-full object-contain" />
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
                        className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all"
                      >
                        <Upload className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tải lên hình ảnh</span>
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
                            <div className="grid grid-cols-2 gap-4">
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Giá riêng</label>
                                <input 
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value))}
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium"
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
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">URL Hình ảnh</label>
                        <input 
                          type="url" 
                          required
                          value={formData.imageUrl || ''}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
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
