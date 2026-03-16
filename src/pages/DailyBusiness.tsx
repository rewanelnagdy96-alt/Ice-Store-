import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { Play, Square, Calculator, Package, DollarSign, TrendingUp } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { motion } from 'motion/react';

export function DailyBusiness() {
  const today = new Date();
  const startStr = startOfDay(today).toISOString();
  const endStr = endOfDay(today).toISOString();

  const currentBusiness = useLiveQuery(async () => {
    const records = await db.dailyBusiness
      .filter(b => b.date >= startStr && b.date <= endStr)
      .toArray();
    return records[0] || null;
  });

  const calculateToday = useLiveQuery(async () => {
    if (!currentBusiness) return null;

    const orders = await db.orders
      .filter(o => o.date >= startStr && o.date <= endStr)
      .toArray();
      
    const payments = await db.payments
      .filter(p => p.date >= startStr && p.date <= endStr)
      .toArray();

    let sales = 0;
    let profit = 0;
    let cashCollected = 0;

    orders.forEach(order => {
      sales += order.totalAmount;
      if (order.paymentType === 'paid') {
        cashCollected += order.totalAmount;
      } else if (order.paymentType === 'partial') {
        cashCollected += (order.paidAmount || 0);
      }
      order.items.forEach(item => {
        profit += (item.sellingPrice - item.purchasePrice) * item.quantity;
      });
    });

    const debtsCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    cashCollected += debtsCollected;

    return { sales, profit, debtsCollected, cashCollected };
  }, [currentBusiness]);

  const products = useLiveQuery(() => db.products.toArray());

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold dark:text-white">حساب اليوم</h2>

      {!currentBusiness ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 ml-1" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لم تبدأ يومك بعد</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">ابدأ يومك الآن لتسجيل البضاعة المستلمة ومتابعة مبيعاتك.</p>
          <Link to="/daily-business/start" className="inline-block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
            بداية اليوم
          </Link>
        </div>
      ) : currentBusiness.status === 'started' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 ml-2 animate-pulse"></span>
                اليوم قيد التشغيل
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي التكلفة</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{currentBusiness.totalTakenCost.toFixed(2)} ج</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">المبيعات المتوقعة</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{currentBusiness.expectedSales.toFixed(2)} ج</p>
              </div>
            </div>

            <div className="grid gap-3">
              <Link to="/daily-business/end" className="flex items-center justify-center w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors">
                <Square className="w-5 h-5 ml-2" />
                جرد نهاية اليوم
              </Link>
            </div>
          </div>

          {calculateToday && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calculator className="w-5 h-5 ml-2 text-blue-500" />
                ملخص حتى الآن
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">مبيعات اليوم (إجمالي)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{calculateToday.sales.toFixed(2)} ج</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">النقدية المحصلة (كاش + ديون)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{calculateToday.cashCollected.toFixed(2)} ج</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">أرباح اليوم</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{calculateToday.profit.toFixed(2)} ج</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">ديون محصلة</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{calculateToday.debtsCollected.toFixed(2)} ج</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <span className="w-3 h-3 rounded-full bg-gray-400 ml-2"></span>
              ملخص اليوم (منتهي)
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(currentBusiness.date).toLocaleDateString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">المبيعات الفعلية (بالجرد)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currentBusiness.realSales.toFixed(2)} ج</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">مبيعات الفواتير</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{calculateToday?.sales.toFixed(2) || '0.00'} ج</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">الأرباح الفعلية</span>
              <span className="font-bold text-green-600 dark:text-green-400">{currentBusiness.realProfit.toFixed(2)} ج</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">الفرق (عجز/زيادة)</span>
              <span className={`font-bold ${((calculateToday?.sales || 0) - currentBusiness.realSales) === 0 ? 'text-gray-600 dark:text-gray-400' : ((calculateToday?.sales || 0) - currentBusiness.realSales) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {((calculateToday?.sales || 0) - currentBusiness.realSales) < 0 ? 'عجز ' : ((calculateToday?.sales || 0) - currentBusiness.realSales) > 0 ? 'زيادة ' : ''}
                {Math.abs((calculateToday?.sales || 0) - currentBusiness.realSales).toFixed(2)} ج
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">النقدية المحصلة (كاش + ديون)</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{calculateToday?.cashCollected.toFixed(2) || '0.00'} ج</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">ديون محصلة</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{currentBusiness.debtsCollected.toFixed(2)} ج</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">إجمالي التكلفة</span>
              <span className="font-bold text-gray-900 dark:text-white">{currentBusiness.totalTakenCost.toFixed(2)} ج</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">تفاصيل الجرد</h4>
            <div className="space-y-3">
              {currentBusiness.items.map(item => {
                const product = products?.find(p => p.id === item.productId);
                return (
                  <div key={item.productId} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">{product?.name || `منتج #${item.productId}`}</span>
                      <span className="text-gray-500 dark:text-gray-400">مستلم: {item.takenCartons}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>متبقي: {item.remainingCartons}</span>
                      <span>مباع: {item.takenCartons - item.remainingCartons - item.returnedCartons}</span>
                      <span className="text-red-500 dark:text-red-400">تالف: {item.returnedCartons}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
