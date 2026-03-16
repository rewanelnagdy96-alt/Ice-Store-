import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { Plus, Receipt, Calendar, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export function Purchases() {
  const purchases = useLiveQuery(() => db.purchaseInvoices.orderBy('date').reverse().toArray());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center dark:text-white">
          <Receipt className="w-6 h-6 ml-2 text-purple-500 dark:text-purple-400" />
          فواتير الشراء
        </h2>
        <Link to="/purchases/new" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
          <Plus className="w-4 h-4 ml-1" />
          فاتورة جديدة
        </Link>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {purchases?.map((invoice, index) => {
            const totalAmount = invoice.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
            
            return (
              <motion.div 
                key={invoice.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{invoice.supplierName}</h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="w-3 h-3 ml-1" />
                      {format(new Date(invoice.date), 'dd MMMM yyyy', { locale: ar })}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg text-purple-600 dark:text-purple-400">{totalAmount.toFixed(2)} ج</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {invoice.items.length} أصناف
                    </span>
                  </div>
                </div>
                
                {invoice.image && (
                  <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                    <ImageIcon className="w-4 h-4 ml-1" />
                    يوجد صورة للفاتورة
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {purchases?.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 text-gray-500 dark:text-gray-400"
          >
            لا توجد فواتير شراء مسجلة.
          </motion.div>
        )}
      </div>
    </div>
  );
}
