import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { BarChart3, TrendingUp, Package, Users } from 'lucide-react';
import { motion } from 'motion/react';

export function Reports() {
  const stats = useLiveQuery(async () => {
    const orders = await db.orders.toArray();
    const products = await db.products.toArray();
    const shops = await db.shops.toArray();

    // Best selling products
    const productSales = new Map<number, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const current = productSales.get(item.productId) || 0;
        productSales.set(item.productId, current + item.quantity);
      });
    });

    const bestSelling = Array.from(productSales.entries())
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          name: product?.name || 'منتج محذوف',
          brand: product?.brand || '',
          quantity
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Total stock value
    const totalStockValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0);
    const totalExpectedSales = products.reduce((sum, p) => sum + (p.stockQuantity * p.sellingPrice), 0);
    const expectedProfit = totalExpectedSales - totalStockValue;

    // Debt stats
    const totalDebts = shops.reduce((sum, s) => sum + s.balance, 0);
    const shopsWithDebtCount = shops.filter(s => s.balance > 0).length;

    return { bestSelling, totalStockValue, expectedProfit, totalDebts, shopsWithDebtCount };
  });

  if (!stats) return <div className="p-4 text-center dark:text-gray-400">جاري التحميل...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center dark:text-white">
          <BarChart3 className="w-6 h-6 ml-2 text-blue-500 dark:text-blue-400" />
          التقارير والإحصائيات
        </h2>
      </div>

      <div className="grid gap-4">
        {/* Stock Report */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Package className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" />
            تقرير المخزون
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">قيمة المخزون (سعر الشراء)</p>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.totalStockValue.toFixed(2)} ج.م</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
              <p className="text-xs font-bold text-green-800 dark:text-green-300 mb-1">الأرباح المتوقعة من المخزون</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400">{stats.expectedProfit.toFixed(2)} ج.م</p>
            </div>
          </div>
        </motion.div>

        {/* Debts Report */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 ml-2 text-orange-500 dark:text-orange-400" />
            تقرير الديون
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
              <p className="text-xs font-bold text-orange-800 dark:text-orange-300 mb-1">إجمالي الديون</p>
              <p className="text-xl font-black text-orange-600 dark:text-orange-400">{stats.totalDebts.toFixed(2)} ج.م</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-xs font-bold text-red-800 dark:text-red-300 mb-1">محلات عليها ديون</p>
              <p className="text-xl font-black text-red-600 dark:text-red-400">{stats.shopsWithDebtCount} محل</p>
            </div>
          </div>
        </motion.div>

        {/* Best Selling Products */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 ml-2 text-blue-500 dark:text-blue-400" />
            المنتجات الأكثر مبيعاً
          </h3>
          <div className="space-y-3">
            {stats.bestSelling.map((product, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (index * 0.1) }}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 flex items-center justify-center text-xs font-bold ml-3">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{product.quantity}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">وحدة مباعة</span>
                </div>
              </motion.div>
            ))}
            {stats.bestSelling.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">لا توجد مبيعات بعد.</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
