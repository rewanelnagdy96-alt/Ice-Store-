import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product } from '../db';
import { Play, Search, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';

export function StartDay() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [takenItems, setTakenItems] = useState<Record<number, number>>({});

  const products = useLiveQuery(() => db.products.toArray());

  const handleQuantityChange = (productId: number, value: string) => {
    // Handle "10 x 5" logic if needed, but for simplicity let's just parse int
    let qty = parseInt(value) || 0;
    if (qty < 0) qty = 0;
    setTakenItems(prev => ({ ...prev, [productId]: qty }));
  };

  const addQuantity = (productId: number, amount: number) => {
    setTakenItems(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + amount
    }));
  };

  const handleStartDay = async () => {
    if (!products) return;

    const items = Object.entries(takenItems)
      .filter(([_, qty]) => qty > 0)
      .map(([idStr, qty]) => {
        const productId = parseInt(idStr);
        const product = products.find(p => p.id === productId)!;
        return {
          productId,
          takenCartons: qty,
          remainingCartons: 0,
          returnedCartons: 0,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice
        };
      });

    if (items.length === 0) {
      alert('الرجاء إدخال كمية لمنتج واحد على الأقل');
      return;
    }

    let totalTakenCost = 0;
    let expectedSales = 0;
    let expectedProfit = 0;

    items.forEach(item => {
      totalTakenCost += item.purchasePrice * item.takenCartons;
      expectedSales += item.sellingPrice * item.takenCartons;
      expectedProfit += (item.sellingPrice - item.purchasePrice) * item.takenCartons;
    });

    await db.dailyBusiness.add({
      date: new Date().toISOString(),
      status: 'started',
      items,
      totalTakenCost,
      expectedSales,
      expectedProfit,
      realSales: 0,
      realProfit: 0,
      debtsCollected: 0
    });

    navigate('/daily-business');
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!products) return <div className="p-4 text-center dark:text-gray-400">جاري التحميل...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-white flex items-center">
          <Play className="w-6 h-6 ml-2 text-blue-500" />
          بداية اليوم
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl py-3 px-4 pr-10 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
          <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {filteredProducts.map(product => (
            <div key={product.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand} - {product.size}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{product.sellingPrice} ج</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">شراء: {product.purchasePrice} ج</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  <button onClick={() => addQuantity(product.id!, 5)} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-bold hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">+5</button>
                  <button onClick={() => addQuantity(product.id!, 10)} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-bold hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">+10</button>
                  <button onClick={() => addQuantity(product.id!, 20)} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-bold hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">+20</button>
                </div>
                
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => addQuantity(product.id!, -1)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={takenItems[product.id!] || ''}
                    onChange={(e) => handleQuantityChange(product.id!, e.target.value)}
                    className="w-16 text-center py-2 bg-transparent text-gray-900 dark:text-white font-bold outline-none"
                    placeholder="0"
                  />
                  <button 
                    onClick={() => addQuantity(product.id!, 1)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleStartDay}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          تأكيد بدء اليوم
        </button>
      </div>
    </motion.div>
  );
}
