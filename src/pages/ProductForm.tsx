import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { motion } from 'motion/react';

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    flavor: '',
    size: '',
    purchasePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    expirationDate: '',
    lowStockThreshold: '10'
  });

  useEffect(() => {
    if (isEdit) {
      db.products.get(Number(id)).then(product => {
        if (product) {
          setFormData({
            name: product.name,
            brand: product.brand,
            flavor: product.flavor,
            size: product.size,
            purchasePrice: product.purchasePrice.toString(),
            sellingPrice: product.sellingPrice.toString(),
            stockQuantity: product.stockQuantity.toString(),
            expirationDate: product.expirationDate,
            lowStockThreshold: product.lowStockThreshold.toString()
          });
        }
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      brand: formData.brand,
      flavor: formData.flavor,
      size: formData.size,
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      stockQuantity: Number(formData.stockQuantity),
      expirationDate: formData.expirationDate,
      lowStockThreshold: Number(formData.lowStockThreshold)
    };

    if (isEdit) {
      await db.products.update(Number(id), productData);
    } else {
      await db.products.add(productData);
    }
    navigate('/products');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold dark:text-white">{isEdit ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المنتج <span className="text-red-500">*</span></label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الشركة/العلامة <span className="text-xs text-gray-400">(اختياري)</span></label>
            <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">النكهة <span className="text-xs text-gray-400">(اختياري)</span></label>
            <input type="text" name="flavor" value={formData.flavor} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحجم <span className="text-xs text-gray-400">(اختياري)</span></label>
            <input type="text" name="size" value={formData.size} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الصلاحية <span className="text-xs text-gray-400">(اختياري)</span></label>
            <input type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر الشراء <span className="text-xs text-gray-400">(اختياري)</span></label>
            <input type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر البيع <span className="text-xs text-gray-400">(اختياري)</span></label>
            <input type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكمية بالمخزن <span className="text-xs text-gray-400">(اختياري)</span></label>
            <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">حد التنبيه (نقص) <span className="text-xs text-gray-400">(اختياري)</span></label>
            <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
        </div>
        <div className="pt-4 flex gap-3">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
            {isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
          <button type="button" onClick={() => navigate('/products')} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}
