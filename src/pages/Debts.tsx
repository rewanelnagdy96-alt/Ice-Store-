import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { Users, DollarSign, ChevronLeft, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Debts() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [shopId, setShopId] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');

  const shops = useLiveQuery(() => db.shops.toArray());
  const shopsWithDebts = useLiveQuery(async () => {
    const allShops = await db.shops.where('balance').above(0).toArray();
    return allShops.sort((a, b) => b.balance - a.balance);
  });

  const totalDebts = shopsWithDebts?.reduce((sum, shop) => sum + shop.balance, 0) || 0;

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!shopId && !newShopName.trim()) || !debtAmount || Number(debtAmount) <= 0) {
      alert('يرجى إدخال بيانات صحيحة');
      return;
    }

    try {
      await db.transaction('rw', db.shops, db.payments, async () => {
        let finalShopId: number;
        
        if (shopId === 'new') {
          const existingShop = await db.shops.filter(s => s.name.toLowerCase() === newShopName.trim().toLowerCase()).first();
          if (existingShop) {
            finalShopId = existingShop.id!;
          } else {
            finalShopId = await db.shops.add({
              name: newShopName.trim(),
              ownerName: '',
              phone: '',
              address: '',
              balance: 0
            });
          }
        } else {
          finalShopId = Number(shopId);
        }

        const shop = await db.shops.get(finalShopId);
        if (shop) {
          await db.shops.update(shop.id!, { balance: shop.balance + Number(debtAmount) });
          // Record this as a negative payment (debt added)
          await db.payments.add({
            shopId: shop.id!,
            date: new Date().toISOString(),
            amount: -Number(debtAmount)
          });
        }
      });
      setShowAddModal(false);
      setShopId('');
      setNewShopName('');
      setDebtAmount('');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إضافة الدين');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center dark:text-white">
          <Users className="w-6 h-6 ml-2 text-orange-500 dark:text-orange-400" />
          إدارة الديون
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4 ml-1" />
          إضافة دين
        </button>
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/30 text-center"
      >
        <h3 className="text-orange-800 dark:text-orange-300 font-medium mb-2">إجمالي الديون المستحقة</h3>
        <p className="text-4xl font-black text-orange-600 dark:text-orange-400">{totalDebts.toFixed(2)} <span className="text-xl">ج.م</span></p>
      </motion.div>

      <div className="space-y-3">
        <h3 className="font-bold text-gray-700 dark:text-gray-300">المحلات المديونة ({shopsWithDebts?.length || 0})</h3>
        
        <AnimatePresence>
          {shopsWithDebts?.map((shop, index) => (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/shops/${shop.id}`} className="block bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{shop.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{shop.ownerName} • {shop.phone}</p>
                  </div>
                  <div className="text-left flex items-center">
                    <div className="mr-3">
                      <p className="font-bold text-red-600 dark:text-red-400 text-lg">{shop.balance.toFixed(2)} ج</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">اضغط للتسديد</p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {shopsWithDebts?.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700"
          >
            <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">لا توجد ديون</h3>
            <p className="text-gray-500 dark:text-gray-400">جميع المحلات قامت بتسديد حساباتها.</p>
          </motion.div>
        )}
      </div>

      {/* Add Debt Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold dark:text-white">إضافة دين جديد</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddDebt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المحل</label>
                  <select 
                    required={shopId !== 'new'}
                    value={shopId} 
                    onChange={(e) => setShopId(e.target.value)} 
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-orange-500 transition-colors mb-2"
                  >
                    <option value="">اختر المحل...</option>
                    <option value="new" className="font-bold text-orange-600 dark:text-orange-400">+ إضافة محل جديد</option>
                    {shops?.map(shop => (
                      <option key={shop.id} value={shop.id}>{shop.name}</option>
                    ))}
                  </select>
                  
                  <AnimatePresence>
                    {shopId === 'new' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <input 
                          required 
                          type="text"
                          value={newShopName}
                          onChange={(e) => setNewShopName(e.target.value)}
                          placeholder="اكتب اسم المحل الجديد..."
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-orange-500 transition-colors mt-2"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ (ج.م)</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    step="0.01"
                    value={debtAmount} 
                    onChange={(e) => setDebtAmount(e.target.value)} 
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors">
                    إضافة الدين
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
