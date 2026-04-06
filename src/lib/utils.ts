import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  if (isNaN(amount)) return '0đ';
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "đ";
}
