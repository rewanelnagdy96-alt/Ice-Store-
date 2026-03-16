import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Phone, MapPin, DollarSign, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export function ShopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shopId = Number(id);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'pay' | 'add'>('pay');

  const shop = useLiveQuery(() => db.shops.get(shopId));
  const payments = useLiveQuery(() => db.payments.where('shopId').equals(shopId).reverse().toArray());
  const orders = useLiveQuery(() => db.orders.where('shopId').equals(shopId).reverse().toArray());

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;

    if (shop) {
      if (transactionType === 'pay' && amount > shop.balance) {
        alert('المبلغ المدفوع أكبر من الدين الحالي!');
        return;
      }

      try {
        await db.transaction('rw', db.payments, db.shops, async () => {
          const finalAmount = transactionType === 'pay' ? amount : -amount;
          await db.payments.add({
            shopId,
            date: new Date().toISOString(),
            amount: finalAmount
          });
          const newBalance = transactionType === 'pay' ? shop.balance - amount : shop.balance + amount;
          await db.shops.update(shopId, { balance: newBalance });
        });
        setPaymentAmount('');
        alert(transactionType === 'pay' ? 'تم تسجيل الدفعة بنجاح' : 'تم إضافة الدين بنجاح');
      } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء تسجيل العملية');
      }
    }
  };

  if (!shop) return <div className="p-4 text-center dark:text-gray-300">جاري التحميل...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Shop Info Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{shop.name}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">المالك: {shop.ownerName}</p>
        
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Phone className="w-4 h-4 ml-2 text-blue-500 dark:text-blue-400" />
            <a href={`tel:${shop.phone}`} className="hover:underline">{shop.phone}</a>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 ml-2 text-blue-500 dark:text-blue-400" />
            <span>{shop.address}</span>
          </div>
        </div>
      </motion.div>

      {/* Debt & Payment Section */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/30"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-orange-800 dark:text-orange-400 font-bold text-lg">الرصيد الحالي (الدين)</h3>
          <p className="text-3xl font-black text-red-600 dark:text-red-400">{shop.balance.toFixed(2)} <span className="text-lg">ج.م</span></p>
        </div>

        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-900/30">
          <div className="flex gap-2 mb-3">
            <button 
              type="button"
              onClick={() => setTransactionType('pay')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${transactionType === 'pay' ? 'bg-orange-600 text-white' : 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300'}`}
            >
              تسديد دفعة
            </button>
            <button 
              type="button"
              onClick={() => setTransactionType('add')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${transactionType === 'add' ? 'bg-red-600 text-white' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}
            >
              إضافة دين
            </button>
          </div>
          <form onSubmit={handleTransaction}>
            <div className="flex gap-2">
              <input 
                type="number" 
                step="0.01" 
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(e.target.value)} 
                placeholder="المبلغ..." 
                className="flex-1 border border-orange-300 dark:border-orange-700/50 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors" 
              />
              <button type="submit" className={`${transactionType === 'pay' ? 'bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600' : 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600'} text-white px-6 py-3 rounded-lg font-bold transition-colors`}>
                {transactionType === 'pay' ? 'تسديد' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* History Tabs (Simplified as stacked lists for now) */}
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
            <DollarSign className="w-5 h-5 ml-2 text-green-500 dark:text-green-400" />
            سجل العمليات
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {payments?.length === 0 ? (
              <p className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">لا توجد عمليات مسجلة.</p>
            ) : (
              <AnimatePresence>
                {payments?.map(payment => (
                  <motion.div 
                    key={payment.id} 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 border-b border-gray-50 dark:border-gray-700/50 last:border-0 flex justify-between items-center"
                  >
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 ml-2" />
                      {format(new Date(payment.date), 'dd MMMM yyyy', { locale: ar })}
                    </div>
                    <span className={`font-bold ${payment.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {payment.amount > 0 ? '+' : ''}{payment.amount.toFixed(2)} ج
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
            <FileText className="w-5 h-5 ml-2 text-blue-500 dark:text-blue-400" />
            سجل الطلبيات
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {orders?.length === 0 ? (
              <p className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">لا توجد طلبيات مسجلة.</p>
            ) : (
              <AnimatePresence>
                {orders?.map(order => (
                  <motion.div 
                    key={order.id} 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 border-b border-gray-50 dark:border-gray-700/50 last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Calendar className="w-4 h-4 ml-2" />
                        {format(new Date(order.date), 'dd MMMM yyyy', { locale: ar })}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.paymentType === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                        order.paymentType === 'partial' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      }`}>
                        {order.paymentType === 'paid' ? 'مدفوع' : 
                         order.paymentType === 'partial' ? `مدفوع ${order.paidAmount} ج` : 'آجل (دين)'}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-gray-900 dark:text-white block">{order.totalAmount.toFixed(2)} ج</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{order.items.length} أصناف</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
