import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  if (isNaN(amount)) return '0đ';
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "đ";
}

export function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  
  // Handle Firestore special objects like ServerTimestamp/Timestamp
  if (obj.constructor?.name === 'Timestamp' || obj.constructor?.name === 'FieldValue') return obj;

  const newObj: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val !== undefined) {
        newObj[key] = removeUndefined(val);
      }
    }
  }
  return newObj;
}
