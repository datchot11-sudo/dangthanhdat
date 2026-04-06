export interface ProductVariant {
  id: string;
  name: string; // e.g., "Standard", "Pro"
  color?: string; // e.g., "Red", "Blue"
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string; // Deprecated, use categories
  categories: string[];
  imageUrl?: string; // Deprecated, use imageUrls
  imageUrls: string[];
  variants?: ProductVariant[];
  stock: number;
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

export interface AppSettings {
  address: string;
  phone: string;
  email: string;
  bankQrUrl: string;
  bannerUrl: string;
  bannerTitle: string;
  bannerSubtitle: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant;
}
