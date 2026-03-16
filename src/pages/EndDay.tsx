import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DailyBusiness, DailyBusinessItem } from '../db';
import { Square, CheckCircle, PackageX, PackageCheck } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { motion } from 'motion/react';

export function EndDay() {
  const navigate = useNavigate();
  const today = new Date();
  const startStr = startOfDay(today).toISOString();
  const endStr = endOfDay(today).toISOString();

  const [remainingItems, setRemainingItems] = useState<Record<number, number>>({});
  const [returnedItems, setReturnedItems] = useState<Record<number, number>>({});

  const currentBusiness = useLiveQuery(async () => {
    const records = await db.dailyBusiness
      .filter(b => b.date >= startStr && b.date <= endStr)
      .toArray();
    return records[0] || null;
  });

  const products = useLiveQuery(() => db.products.toArray());

  useEffect(() => {
    if (currentBusiness && currentBusiness.status === 'started') {
      const initialRemaining: Record<number, number> = {};
      const initialReturned: Record<number, number> = {};
      currentBusiness.items.forEach(item => {
        initialRemaining[item.productId] = item.remainingCartons || 0;
        initialReturned[item.productId] = item.returnedCartons || 0;
      });
      setRemainingItems(initialRemaining);
      setReturnedItems(initialReturned);
    }
  }, [currentBusiness]);

  const handleQuantityChange = (productId: number, type: 'remaining' | 'returned', value: string) => {
    let qty = parseInt(value) || 0;
    if (qty < 0) qty = 0;
    
    if (type === 'remaining') {
      setRemainingItems(prev => ({ ...prev, [productId]: qty }));
    } else {
      setReturnedItems(prev => ({ ...prev, [productId]: qty }));
    }
  };

  const handleEndDay = async () => {
    if (!currentBusiness || !products) return;

    let realSales = 0;
    let realProfit = 0;

    const updatedItems = currentBusiness.items.map(item => {
      const remaining = remainingItems[item.productId] || 0;
      const returned = returnedItems[item.productId] || 0;
      const sold = item.takenCartons - remaining - returned;

      if (sold > 0) {
        realSales += sold * item.sellingPrice;
        realProfit += sold * (item.sellingPrice - item.purchasePrice);
      }

      return {
        ...item,
        remainingCartons: remaining,
        returnedCartons: returned
      };
    });

    // We also need to calculate debts collected today
    const payments = await db.payments
      .filter(p => p.date >= startStr && p.date <= endStr)
      .toArray();
    const debtsCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    await db.transaction('rw', [db.dailyBusiness, db.products, db.payments], async () => {
      await db.dailyBusiness.update(currentBusiness.id!, {
        status: 'ended',
        items: updatedItems,
        realSales,
        realProfit,
        debtsCollected
      });

      // Update product stock quantities
      for (const item of updatedItems) {
        const product = await db.products.get(item.productId);
        if (product) {
          const sold = item.takenCartons - item.remainingCartons - item.returnedCartons;
          // We subtract the sold items and the returned/damaged items from the stock
          // Because takenCartons were taken from stock, and remainingCartons are returned to stock
          // So the net change in stock is -(takenCartons - remainingCartons)
          const netStockChange = -(item.takenCartons - item.remainingCartons);
          
          await db.products.update(product.id!, {
            stockQuantity: product.stockQuantity + netStockChange
          });
        }
      }
    });

    navigate('/daily-business');
  };

  if (!currentBusiness || !products) return <div className="p-4 text-center dark:text-gray-400">جاري التحميل...</div>;

  if (currentBusiness.status === 'ended') {
    return (
      <div className="p-4 text-center dark:text-gray-400">
        لقد قمت بإنهاء هذا اليوم بالفعل.
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-white flex items-center">
          <Square className="w-6 h-6 ml-2 text-orange-500" />
          جرد نهاية اليوم
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">أدخل الكميات المتبقية والتالفة/المرتجعة لكل منتج.</p>
        
        <div className="space-y-4">
          {currentBusiness.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;

            return (
              <div key={item.productId} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">الكمية المستلمة: <span className="font-bold text-gray-900 dark:text-white">{item.takenCartons}</span></p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                      <PackageCheck className="w-3 h-3 ml-1 text-green-500" />
                      المتبقي السليم
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={remainingItems[item.productId] || ''}
                      onChange={(e) => handleQuantityChange(item.productId, 'remaining', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                      <PackageX className="w-3 h-3 ml-1 text-red-500" />
                      المرتجع / التالف
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={returnedItems[item.productId] || ''}
                      onChange={(e) => handleQuantityChange(item.productId, 'returned', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleEndDay}
          className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors shadow-sm flex items-center justify-center"
        >
          <CheckCircle className="w-5 h-5 ml-2" />
          تأكيد وإنهاء اليوم
        </button>
      </div>
    </motion.div>
  );
}
