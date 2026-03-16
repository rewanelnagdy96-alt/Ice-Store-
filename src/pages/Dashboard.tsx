import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { startOfDay, endOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { PlusCircle, AlertTriangle, TrendingUp, DollarSign, Users, Play } from 'lucide-react';
import { motion } from 'motion/react';

export function Dashboard() {
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const stats = useLiveQuery(async () => {
    const todayOrders = await db.orders
      .where('date')
      .between(todayStart, todayEnd)
      .toArray();

    const todaySales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    let todayProfit = 0;
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        todayProfit += (item.sellingPrice - item.purchasePrice) * item.quantity;
      });
    });

    const shops = await db.shops.toArray();
    const totalDebts = shops.reduce((sum, shop) => sum + shop.balance, 0);

    const products = await db.products.toArray();
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.lowStockThreshold);

    return { todaySales, todayProfit, totalDebts, lowStockProducts };
  });

  if (!stats) return <div className="p-4 text-center">جاري التحميل...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <StatCard 
            title="مبيعات اليوم" 
            value={`${stats.todaySales.toFixed(2)} ج.م`} 
            icon={<TrendingUp className="text-blue-500 dark:text-blue-400" />} 
            color="bg-blue-50 dark:bg-blue-900/20" 
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <StatCard 
            title="أرباح اليوم" 
            value={`${stats.todayProfit.toFixed(2)} ج.م`} 
            icon={<DollarSign className="text-green-500 dark:text-green-400" />} 
            color="bg-green-50 dark:bg-green-900/20" 
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="col-span-2">
          <StatCard 
            title="إجمالي الديون" 
            value={`${stats.totalDebts.toFixed(2)} ج.م`} 
            icon={<Users className="text-orange-500 dark:text-orange-400" />} 
            color="bg-orange-50 dark:bg-orange-900/20" 
            className="w-full"
          />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-lg font-bold mb-3 dark:text-white">إجراءات سريعة</h2>
        <div className="grid grid-cols-4 gap-3">
          <QuickAction to="/daily-business" icon={<Play className="w-6 h-6" />} label="حساب اليوم" color="bg-green-600 dark:bg-green-700" />
          <QuickAction to="/distribution/new" icon={<PlusCircle />} label="طلب جديد" color="bg-blue-600 dark:bg-blue-700" />
          <QuickAction to="/products/add" icon={<PlusCircle />} label="إضافة منتج" color="bg-indigo-600 dark:bg-indigo-700" />
          <QuickAction to="/shops/add" icon={<PlusCircle />} label="إضافة محل" color="bg-purple-600 dark:bg-purple-700" />
        </div>
      </motion.div>

      {/* Low Stock Alerts */}
      {stats.lowStockProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-lg font-bold mb-3 flex items-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 ml-2" />
            تنبيهات نقص المخزون
          </h2>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 overflow-hidden">
            {stats.lowStockProducts.map(product => (
              <div key={product.id} className="p-3 border-b border-red-100 dark:border-red-900/30 last:border-0 flex justify-between items-center">
                <div>
                  <p className="font-medium text-red-900 dark:text-red-300">{product.name}</p>
                  <p className="text-xs text-red-700 dark:text-red-400">{product.brand} - {product.flavor}</p>
                </div>
                <div className="text-left">
                  <span className="inline-block bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded-full font-bold">
                    متبقي: {product.stockQuantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({ title, value, icon, color, className = '' }: { title: string, value: string, icon: React.ReactNode, color: string, className?: string }) {
  return (
    <div className={`p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-800 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function QuickAction({ to, icon, label, color }: { to: string, icon: React.ReactNode, label: string, color: string }) {
  return (
    <Link to={to} className={`${color} text-white p-3 rounded-xl flex flex-col items-center justify-center space-y-2 shadow-sm active:scale-95 transition-transform`}>
      <div className="w-6 h-6">{icon}</div>
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  );
}
