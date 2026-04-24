export interface ProductVariant {
  id: string;
  name: string; // e.g., "Standard", "Pro"
  color?: string; // e.g., "Red", "Blue"
  price: number;
  originalPrice?: number;
  stock: number;
  customStatus?: string;
  customStatusDetail?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category?: string; // Deprecated, use categories
  categories: string[];
  imageUrl?: string; // Deprecated, use imageUrls
  imageUrls: string[];
  variants?: ProductVariant[];
  stock: number;
  customStatus?: string;
  customStatusDetail?: string;
  createdAt: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface BannerItem {
  url: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

export interface AppSettings {
  address: string;
  phone: string;
  email: string;
  bankQrUrl: string;
  momoQrUrl: string;
  bannerUrl: string; // Keep for backward compatibility or simple mode
  bannerTitle: string;
  bannerSubtitle: string;
  banners?: BannerItem[];
  leftBannerUrl?: string;
  rightBannerUrl?: string;
  zaloNumber?: string;
  bannerAlignment?: 'left' | 'center' | 'right';
  defaultStockStatus?: string;
  defaultStockStatusDetail?: string;
  defaultOutOfStockStatus?: string;
  defaultOutOfStockStatusDetail?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiryDate: any;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface FlashSale {
  id: string;
  title: string;
  startTime: any;
  endTime: any;
  isActive: boolean;
  products: {
    productId: string;
    salePrice: number;
    limit?: number;
    soldCount: number;
  }[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: any;
}

export interface PolicyPage {
  id: string; // slug like 'warranty'
  title: string;
  content: string;
  updatedAt: any;
}

export interface Order {
  id: string;
  userId: string;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    note: string;
  };
  items: any[]; // Changed to any[] to allow robust snapshotting
  total: number;
  paymentMethod: string;
  status: 'pending' | 'received' | 'shipping' | 'completed' | 'cancelled';
  createdAt: any;
}
