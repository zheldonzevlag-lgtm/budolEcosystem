import { AnimatePresence, motion } from 'framer-motion';

export default function FormSection({ children, isActive }) {
  if (!isActive) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-20"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
