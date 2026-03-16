import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2, Camera, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PurchaseForm() {
  const navigate = useNavigate();
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<{ productId: string, newProductName: string, quantity: string, purchasePrice: string }[]>([{ productId: '', newProductName: '', quantity: '1', purchasePrice: '' }]);
  const [image, setImage] = useState<string | null>(null);

  const products = useLiveQuery(() => db.products.toArray());

  const handleAddItem = () => {
    setItems([...items, { productId: '', newProductName: '', quantity: '1', purchasePrice: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'newProductName' | 'quantity' | 'purchasePrice', value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill purchase price if an existing product is selected
    if (field === 'productId' && value !== 'new' && value !== '') {
      const selectedProduct = products?.find(p => p.id === Number(value));
      if (selectedProduct) {
        newItems[index].purchasePrice = selectedProduct.purchasePrice.toString();
      }
    }
    
    setItems(newItems);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      if (item.quantity && item.purchasePrice) {
        return sum + (Number(item.purchasePrice) * Number(item.quantity));
      }
      return sum;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || items.some(i => !i.productId || (i.productId === 'new' && !i.newProductName.trim()) || !i.quantity || !i.purchasePrice)) {
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    try {
      await db.transaction('rw', [db.purchaseInvoices, db.products], async () => {
        const invoiceItems = [];
        
        for (const item of items) {
          let finalProductName = '';
          
          if (item.productId === 'new') {
            finalProductName = item.newProductName.trim();
            // Create a new product with default values if it doesn't exist
            await db.products.add({
              name: finalProductName,
              brand: 'غير محدد',
              flavor: 'غير محدد',
              size: 'غير محدد',
              purchasePrice: Number(item.purchasePrice),
              sellingPrice: Number(item.purchasePrice) * 1.2, // Default 20% markup
              stockQuantity: Number(item.quantity),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
              lowStockThreshold: 10
            });
          } else {
            const existingProduct = await db.products.get(Number(item.productId));
            if (existingProduct) {
              finalProductName = existingProduct.name;
              await db.products.update(existingProduct.id!, {
                stockQuantity: existingProduct.stockQuantity + Number(item.quantity),
                purchasePrice: Number(item.purchasePrice) // optionally update the purchase price to the latest one
              });
            }
          }
          
          invoiceItems.push({
            productName: finalProductName,
            quantity: Number(item.quantity),
            purchasePrice: Number(item.purchasePrice)
          });
        }

        await db.purchaseInvoices.add({
          supplierName,
          date: new Date(date).toISOString(),
          items: invoiceItems,
          image: image || undefined
        });
      });
      navigate('/purchases');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold dark:text-white">تسجيل فاتورة شراء</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المورد / الشركة</label>
          <input required type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الفاتورة</label>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الأصناف</label>
            <button type="button" onClick={handleAddItem} className="text-purple-600 dark:text-purple-400 text-sm font-medium flex items-center hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
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
                className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">صنف {index + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <select 
                  required 
                  value={item.productId} 
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)} 
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                >
                  <option value="">اختر المنتج...</option>
                  <option value="new" className="font-bold text-purple-600 dark:text-purple-400">+ إضافة منتج جديد</option>
                  {products?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <AnimatePresence>
                  {item.productId === 'new' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <input 
                        required 
                        type="text" 
                        placeholder="اكتب اسم المنتج الجديد..." 
                        value={item.newProductName} 
                        onChange={(e) => handleItemChange(index, 'newProductName', e.target.value)} 
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors mt-2" 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الكمية</label>
                    <input required type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">سعر الشراء (للوحدة)</label>
                    <input required type="number" step="0.01" min="0" value={item.purchasePrice} onChange={(e) => handleItemChange(index, 'purchasePrice', e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صورة الفاتورة (اختياري)</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {image ? (
                  <img src={image} alt="Invoice preview" className="h-24 object-contain" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">اضغط لرفع صورة</span> أو التقط صورة</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-700 dark:text-gray-300">إجمالي الفاتورة:</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{calculateTotal().toFixed(2)} ج.م</span>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors">
            حفظ الفاتورة
          </button>
          <button type="button" onClick={() => navigate('/purchases')} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}
