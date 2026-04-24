import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, X } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

interface ProductsProps {
  addToCart: (product: Product, selectedVariant?: any, quantity?: number) => void;
}

export default function Products({ addToCart }: ProductsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramSearch = searchParams.get('search') || '';
  const category = searchParams.get('cat') || 'all';

  usePageTitle(paramSearch ? `Tìm kiếm: ${paramSearch}` : (category !== 'all' ? `Danh mục: ${category.toUpperCase()}` : 'Sản phẩm'));

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'products'));
        let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        // Filter by category
        if (category !== 'all') {
          results = results.filter(p => 
            (p.categories && p.categories.includes(category)) || 
            (p.category === category)
          );
        }

        // Filter by text (internal or param)
        const activeSearch = searchTerm || paramSearch;
        if (activeSearch) {
          results = results.filter(p => 
            p.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
            p.description?.toLowerCase().includes(activeSearch.toLowerCase())
          );
        }

        // Sort
        results.sort((a, b) => {
          if (sortBy === 'newest') {
            const dateA = (a.createdAt as any)?.seconds || 0;
            const dateB = (b.createdAt as any)?.seconds || 0;
            return dateB - dateA;
          } else if (sortBy === 'price-asc') {
            return a.price - b.price;
          } else if (sortBy === 'price-desc') {
            return b.price - a.price;
          } else if (sortBy === 'oldest') {
            const dateA = (a.createdAt as any)?.seconds || 0;
            const dateB = (b.createdAt as any)?.seconds || 0;
            return dateA - dateB;
          }
          return 0;
        });

        setProducts(results);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, sortBy, searchTerm, paramSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-10">
          <div>
            <h3 className="text-xl font-black tracking-tighter text-gray-900 uppercase mb-6 flex items-center gap-2">
              <Filter size={20} className="text-red-600" /> Danh mục
            </h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 no-scrollbar">
              {[
                { name: 'Tất cả', id: 'all' },
                { name: 'Nintendo', id: 'nintendo' },
                { name: 'PlayStation', id: 'playstation' },
                { name: 'Xbox', id: 'xbox' },
                { name: 'Phụ kiện', id: 'accessories' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSearchParams({ cat: cat.id })}
                  className={`whitespace-nowrap lg:w-full text-left px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    category === cat.id 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black tracking-tighter text-gray-900 uppercase mb-6 flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-red-600" /> Sắp xếp
            </h3>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
            <h2 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">
              {category === 'all' ? 'Tất cả sản phẩm' : category.toUpperCase()}
            </h2>
            
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Tìm trong danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse h-80 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <>
              {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} addToCart={addToCart} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="mb-6 flex justify-center">
                    <div className="p-6 bg-gray-50 rounded-full text-gray-300">
                      <Search size={48} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-gray-500 font-medium">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                  <button 
                    onClick={() => { setSearchParams({ cat: 'all' }); setSearchTerm(''); }}
                    className="mt-8 px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all"
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
