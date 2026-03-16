import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Phone, MapPin } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { motion, AnimatePresence } from 'motion/react';

export function Shops() {
  const shops = useLiveQuery(() => db.shops.toArray());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const confirmDelete = async () => {
    if (deleteId) {
      await db.shops.delete(deleteId);
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
        <h2 className="text-xl font-bold dark:text-white">المحلات</h2>
        <Link to="/shops/add" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium">
          <Plus className="w-4 h-4 ml-1" />
          إضافة محل
        </Link>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {shops?.map(shop => (
            <motion.div 
              key={shop.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
            >
              <div className="flex-1">
                <Link to={`/shops/${shop.id}`} className="block hover:opacity-80">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{shop.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">المالك: {shop.ownerName}</p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <Phone className="w-3 h-3 ml-1" /> {shop.phone}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3 h-3 ml-1" /> {shop.address}
                  </div>
                </Link>
                <div className="mt-3">
                  <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${shop.balance > 0 ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'}`}>
                    الديون: {shop.balance.toFixed(2)} ج.م
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 mr-4">
                <Link to={`/shops/edit/${shop.id}`} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Edit className="w-5 h-5" />
                </Link>
                <button onClick={() => setDeleteId(shop.id!)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {shops?.length === 0 && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            لا توجد محلات مضافة بعد.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="حذف المحل"
        message="هل أنت متأكد من حذف هذا المحل؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}
