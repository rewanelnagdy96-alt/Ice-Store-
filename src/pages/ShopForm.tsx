import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { motion } from 'motion/react';

export function ShopForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    balance: '0'
  });

  useEffect(() => {
    if (isEdit) {
      db.shops.get(Number(id)).then(shop => {
        if (shop) {
          setFormData({
            name: shop.name,
            ownerName: shop.ownerName,
            phone: shop.phone,
            address: shop.address,
            balance: shop.balance.toString()
          });
        }
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shopData = {
      name: formData.name,
      ownerName: formData.ownerName,
      phone: formData.phone,
      address: formData.address,
      balance: Number(formData.balance)
    };

    if (isEdit) {
      await db.shops.update(Number(id), shopData);
    } else {
      await db.shops.add(shopData);
    }
    navigate('/shops');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold dark:text-white">{isEdit ? 'تعديل محل' : 'إضافة محل جديد'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المحل <span className="text-red-500">*</span></label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المالك <span className="text-xs text-gray-400">(اختياري)</span></label>
          <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف <span className="text-xs text-gray-400">(اختياري)</span></label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان <span className="text-xs text-gray-400">(اختياري)</span></label>
          <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرصيد الافتتاحي (ديون سابقة) <span className="text-xs text-gray-400">(اختياري)</span></label>
          <input type="number" step="0.01" name="balance" value={formData.balance} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
        </div>
        
        <div className="pt-4 flex gap-3">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
            {isEdit ? 'حفظ التعديلات' : 'إضافة المحل'}
          </button>
          <button type="button" onClick={() => navigate('/shops')} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}
