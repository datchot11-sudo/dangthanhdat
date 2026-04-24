import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface ZaloBubbleProps {
  phone: string;
}

export default function ZaloBubble({ phone }: ZaloBubbleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    // Format phone: remove spaces/dots. Usually Zalo links are https://zalo.me/phone
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://zalo.me/${cleanPhone}`, '_blank');
  };

  if (!phone) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white px-4 py-2 rounded-xl shadow-2xl border border-gray-100 text-xs font-bold text-gray-900 uppercase tracking-widest whitespace-nowrap mb-1"
          >
            Chat với Dshop qua Zalo
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleClick}
        className="w-16 h-16 bg-[#0068ff] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#0068ff]/40 relative group"
      >
        <div className="absolute inset-0 bg-[#0068ff] rounded-full animate-ping opacity-25 group-hover:block hidden"></div>
        {/* Simple Zalo-like icon or just Chat */}
        <MessageCircle size={32} fill="white" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
        </span>
      </motion.button>
    </div>
  );
}
