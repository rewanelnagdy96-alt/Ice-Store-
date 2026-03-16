import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { Plus, FileText, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export function Distribution() {
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [shopFilter, setShopFilter] = useState('');

  const orders = useLiveQuery(async () => {
    let allOrders = await db.orders.orderBy('date').reverse().toArray();
    const shops = await db.shops.toArray();
    const shopMap = new Map(shops.map(s => [s.id, s.name]));
    
    // Apply Date Filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      if (dateFilter === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateFilter === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }
      allOrders = allOrders.filter(o => new Date(o.date) >= startDate);
    }

    // Apply Payment Filter
    if (paymentFilter !== 'all') {
      allOrders = allOrders.filter(o => o.paymentType === paymentFilter);
    }

    let mappedOrders = allOrders.map(order => ({
      ...order,
      shopName: shopMap.get(order.shopId) || 'محل غير معروف'
    }));

    // Apply Shop Filter
    if (shopFilter.trim() !== '') {
      mappedOrders = mappedOrders.filter(o => o.shopName.toLowerCase().includes(shopFilter.toLowerCase()));
    }

    return mappedOrders;
  }, [dateFilter, paymentFilter, shopFilter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">التوزيع والطلبيات</h2>
        <Link to="/distribution/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium">
          <Plus className="w-4 h-4 ml-1" />
          طلب جديد
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold mb-2">
          <Filter className="w-5 h-5 text-blue-500" />
          تصفية الطلبيات
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input 
            type="text" 
            placeholder="ابحث باسم المحل..." 
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="all">جميع طرق الدفع</option>
            <option value="paid">مدفوع فقط</option>
            <option value="debt">آجل (دين) فقط</option>
            <option value="partial">دفع جزئي فقط</option>
          </select>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="all">كل الأوقات</option>
            <option value="today">اليوم</option>
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {orders?.map(order => (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{order.shopName}</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Calendar className="w-3 h-3 ml-1" />
                    {format(new Date(order.date), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg dark:text-white">{order.totalAmount.toFixed(2)} ج</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                    order.paymentType === 'paid' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 
                    order.paymentType === 'partial' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300' :
                    'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                  }`}>
                    {order.paymentType === 'paid' ? 'مدفوع' : 
                     order.paymentType === 'partial' ? `مدفوع ${order.paidAmount} ج` : 'آجل (دين)'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{order.items.length} أصناف</span>
                {/* <button className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center">
                  <FileText className="w-4 h-4 ml-1" />
                  عرض الفاتورة
                </button> */}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {orders?.length === 0 && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            لا توجد طلبيات بعد.
          </div>
        )}
      </div>
    </motion.div>
  );
}
