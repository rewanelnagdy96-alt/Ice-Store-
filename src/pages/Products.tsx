import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { motion, AnimatePresence } from 'motion/react';

export function Products() {
  const products = useLiveQuery(() => db.products.toArray());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const confirmDelete = async () => {
    if (deleteId) {
      await db.products.delete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">المنتجات</h2>
        <Link to="/products/add" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium">
          <Plus className="w-4 h-4 ml-1" />
          إضافة منتج
        </Link>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {products?.map(product => (
            <motion.div 
              key={product.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand} - {product.flavor} ({product.size})</p>
                <div className="mt-2 flex gap-3 text-sm">
                  <span className="text-green-600 dark:text-green-400 font-medium">بيع: {product.sellingPrice} ج</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">شراء: {product.purchasePrice} ج</span>
                  <span className={`${product.stockQuantity <= product.lowStockThreshold ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'} font-medium`}>
                    مخزون: {product.stockQuantity}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link to={`/products/edit/${product.id}`} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Edit className="w-5 h-5" />
                </Link>
                <button onClick={() => setDeleteId(product.id!)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {products?.length === 0 && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            لا توجد منتجات مضافة بعد.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="حذف المنتج"
        message="هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}
