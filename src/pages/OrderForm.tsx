import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product } from '../db';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OrderForm() {
  const navigate = useNavigate();
  const shops = useLiveQuery(() => db.shops.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  const [shopId, setShopId] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [paymentType, setPaymentType] = useState<'paid' | 'debt' | 'partial'>('paid');
  const [paidAmount, setPaidAmount] = useState('');
  const [items, setItems] = useState<{ productId: string, quantity: string }[]>([{ productId: '', quantity: '1' }]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: '1' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    if (!products) return 0;
    return items.reduce((sum, item) => {
      const product = products.find(p => p.id === Number(item.productId));
      if (product && item.quantity) {
        return sum + (product.sellingPrice * Number(item.quantity));
      }
      return sum;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || (shopId === 'new' && !newShopName.trim()) || items.some(i => !i.productId || !i.quantity)) {
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    const totalAmount = calculateTotal();
    const parsedPaidAmount = paymentType === 'partial' ? Number(paidAmount) : (paymentType === 'paid' ? totalAmount : 0);

    if (paymentType === 'partial' && (parsedPaidAmount <= 0 || parsedPaidAmount >= totalAmount)) {
      alert('الرجاء إدخال مبلغ مدفوع صحيح (أكبر من صفر وأقل من الإجمالي)');
      return;
    }

    const orderItems = items.map(item => {
      const product = products!.find(p => p.id === Number(item.productId))!;
      return {
        productId: product.id!,
        quantity: Number(item.quantity),
        sellingPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice
      };
    });

    try {
      await db.transaction('rw', db.orders, db.shops, db.products, async () => {
        let finalShopId: number;
        
        if (shopId === 'new') {
          // Find if shop already exists by name
          const existingShop = await db.shops.filter(s => s.name.toLowerCase() === newShopName.trim().toLowerCase()).first();
          
          if (existingShop) {
            finalShopId = existingShop.id!;
          } else {
            // Create new shop
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

        // 1. Add order
        await db.orders.add({
          shopId: finalShopId,
          date: new Date().toISOString(),
          totalAmount,
          paymentType,
          paidAmount: parsedPaidAmount,
          items: orderItems
        });

        // 2. Update shop balance if debt or partial
        if (paymentType === 'debt' || paymentType === 'partial') {
          const debtToAdd = paymentType === 'debt' ? totalAmount : (totalAmount - parsedPaidAmount);
          const shop = await db.shops.get(finalShopId);
          if (shop) {
            await db.shops.update(shop.id!, { balance: shop.balance + debtToAdd });
          }
        }

        // 3. Update product stock
        for (const item of orderItems) {
          const product = await db.products.get(item.productId);
          if (product) {
            await db.products.update(product.id!, { stockQuantity: product.stockQuantity - item.quantity });
          }
        }
      });
      navigate('/distribution');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ الطلب');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold dark:text-white">إنشاء طلب جديد</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المحل</label>
          <select 
            required={shopId !== 'new'}
            value={shopId} 
            onChange={(e) => setShopId(e.target.value)} 
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors mb-2"
          >
            <option value="">اختر المحل...</option>
            <option value="new" className="font-bold text-blue-600 dark:text-blue-400">+ إضافة محل جديد</option>
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
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors mt-2"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المنتجات</label>
            <button type="button" onClick={handleAddItem} className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              <Plus className="w-4 h-4 ml-1" /> إضافة صنف
            </button>
          </div>
          
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 items-start bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex-1">
                  <select required value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none mb-2 text-sm transition-colors">
                    <option value="">اختر المنتج...</option>
                    {products?.map(product => (
                      <option key={product.id} value={product.id} disabled={product.stockQuantity <= 0}>
                        {product.name} ({product.stockQuantity} متبقي) - {product.sellingPrice} ج
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">الكمية:</span>
                    <input required type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-24 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-1 text-center outline-none transition-colors" />
                  </div>
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-700 dark:text-gray-300">الإجمالي:</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateTotal().toFixed(2)} ج.م</span>
          </div>

          <div className="flex flex-col gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input type="radio" name="paymentType" value="paid" checked={paymentType === 'paid'} onChange={() => setPaymentType('paid')} className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">دفع نقدي بالكامل</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input type="radio" name="paymentType" value="debt" checked={paymentType === 'debt'} onChange={() => setPaymentType('debt')} className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">آجل بالكامل (يضاف للديون)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input type="radio" name="paymentType" value="partial" checked={paymentType === 'partial'} onChange={() => setPaymentType('partial')} className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">دفع جزء نقدي والباقي آجل</span>
            </label>
          </div>

          <AnimatePresence>
            {paymentType === 'partial' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800"
              >
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">المبلغ المدفوع كاش</label>
                <input 
                  type="number" 
                  min="1" 
                  max={calculateTotal() - 1}
                  value={paidAmount} 
                  onChange={(e) => setPaidAmount(e.target.value)} 
                  placeholder="أدخل المبلغ المدفوع..."
                  className="w-full border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                {paidAmount && Number(paidAmount) > 0 && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                    المتبقي (آجل): {(calculateTotal() - Number(paidAmount)).toFixed(2)} ج.م
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-4 flex gap-3">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
            حفظ الطلب
          </button>
          <button type="button" onClick={() => navigate('/distribution')} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}
