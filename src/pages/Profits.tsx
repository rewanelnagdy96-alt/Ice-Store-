import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DollarSign, TrendingUp, Calendar, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';

export function Profits() {
  const now = new Date();

  const stats = useLiveQuery(async () => {
    const allOrders = await db.orders.toArray();

    const calculateProfit = (start: Date, end: Date) => {
      const startStr = start.toISOString();
      const endStr = end.toISOString();
      
      const periodOrders = allOrders.filter(o => o.date >= startStr && o.date <= endStr);
      let profit = 0;
      let sales = 0;

      periodOrders.forEach(order => {
        sales += order.totalAmount;
        order.items.forEach(item => {
          profit += (item.sellingPrice - item.purchasePrice) * item.quantity;
        });
      });

      return { profit, sales };
    };

    const daily = calculateProfit(startOfDay(now), endOfDay(now));
    const weekly = calculateProfit(startOfWeek(now, { weekStartsOn: 6 }), endOfWeek(now, { weekStartsOn: 6 })); // Week starts Saturday in Egypt
    const monthly = calculateProfit(startOfMonth(now), endOfMonth(now));
    
    // Total profit all time
    let totalProfit = 0;
    let totalSales = 0;
    allOrders.forEach(order => {
      totalSales += order.totalAmount;
      order.items.forEach(item => {
        totalProfit += (item.sellingPrice - item.purchasePrice) * item.quantity;
      });
    });

    return { daily, weekly, monthly, total: { profit: totalProfit, sales: totalSales } };
  });

  if (!stats) return <div className="p-4 text-center dark:text-gray-400">جاري التحميل...</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center dark:text-white">
          <DollarSign className="w-6 h-6 ml-2 text-green-500 dark:text-green-400" />
          حساب الأرباح
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <ProfitCard 
            title="أرباح اليوم" 
            profit={stats.daily.profit} 
            sales={stats.daily.sales} 
            icon={<Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />} 
            color="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-100" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ProfitCard 
            title="أرباح الأسبوع" 
            profit={stats.weekly.profit} 
            sales={stats.weekly.sales} 
            icon={<TrendingUp className="w-5 h-5 text-purple-500 dark:text-purple-400" />} 
            color="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30 text-purple-900 dark:text-purple-100" 
          />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-2">
          <ProfitCard 
            title="أرباح الشهر" 
            profit={stats.monthly.profit} 
            sales={stats.monthly.sales} 
            icon={<BarChart2 className="w-5 h-5 text-orange-500 dark:text-orange-400" />} 
            color="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30 text-orange-900 dark:text-orange-100" 
            className="col-span-2"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-2">
          <ProfitCard 
            title="إجمالي الأرباح (كل الوقت)" 
            profit={stats.total.profit} 
            sales={stats.total.sales} 
            icon={<DollarSign className="w-5 h-5 text-green-500 dark:text-green-400" />} 
            color="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-900 dark:text-green-100" 
            className="col-span-2"
          />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">كيف يتم حساب الأرباح؟</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          يتم حساب الأرباح تلقائياً بناءً على الفرق بين (سعر الشراء) و (سعر البيع) لكل منتج مباع في الطلبيات.
          <br /><br />
          <span className="font-bold text-gray-900 dark:text-white">المعادلة:</span><br />
          الربح = (سعر البيع - سعر الشراء) × الكمية المباعة
        </p>
      </motion.div>
    </motion.div>
  );
}

function ProfitCard({ title, profit, sales, icon, color, className = '' }: { title: string, profit: number, sales: number, icon: React.ReactNode, color: string, className?: string }) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm ${color} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{title}</h3>
        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{profit.toFixed(2)} <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ج.م</span></p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">المبيعات: {sales.toFixed(2)} ج.م</p>
      </div>
    </div>
  );
}
