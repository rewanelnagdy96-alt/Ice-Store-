import { useSearchParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Package, Store, Receipt, Truck } from 'lucide-react';
import { motion } from 'motion/react';

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const results = useLiveQuery(async () => {
    if (!query) return { products: [], shops: [], orders: [], purchases: [] };

    const lowerQuery = query.toLowerCase();

    const products = await db.products.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.brand.toLowerCase().includes(lowerQuery)).toArray();
    const shops = await db.shops.filter(s => s.name.toLowerCase().includes(lowerQuery) || s.ownerName.toLowerCase().includes(lowerQuery)).toArray();
    
    // For orders and purchases, we might search by shop name or supplier name
    const allOrders = await db.orders.toArray();
    const allShops = await db.shops.toArray();
    const shopMap = new Map(allShops.map(s => [s.id, s.name]));
    
    const orders = allOrders.filter(o => {
      const shopName = shopMap.get(o.shopId)?.toLowerCase() || '';
      return shopName.includes(lowerQuery);
    });

    const purchases = await db.purchaseInvoices.filter(p => p.supplierName.toLowerCase().includes(lowerQuery)).toArray();

    return { products, shops, orders, purchases };
  }, [query]);

  if (!results) return <div className="p-4 text-center dark:text-gray-400">جاري البحث...</div>;

  const hasResults = results.products.length > 0 || results.shops.length > 0 || results.orders.length > 0 || results.purchases.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold dark:text-white">نتائج البحث عن "{query}"</h2>

      {!hasResults ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 text-gray-500 dark:text-gray-400"
        >
          لا توجد نتائج مطابقة لبحثك.
        </motion.div>
      ) : (
        <div className="space-y-6">
          {results.products.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Package className="w-5 h-5 ml-2 text-blue-500 dark:text-blue-400" />
                المنتجات ({results.products.length})
              </h3>
              <div className="grid gap-2">
                {results.products.map((product, index) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (index * 0.05) }}
                  >
                    <Link to={`/products/edit/${product.id}`} className="block bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <p className="font-bold text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand} - {product.sellingPrice} ج</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {results.shops.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Store className="w-5 h-5 ml-2 text-green-500 dark:text-green-400" />
                المحلات ({results.shops.length})
              </h3>
              <div className="grid gap-2">
                {results.shops.map((shop, index) => (
                  <motion.div 
                    key={shop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (index * 0.05) }}
                  >
                    <Link to={`/shops/${shop.id}`} className="block bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <p className="font-bold text-gray-900 dark:text-white">{shop.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{shop.ownerName}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {results.orders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Truck className="w-5 h-5 ml-2 text-orange-500 dark:text-orange-400" />
                الطلبيات ({results.orders.length})
              </h3>
              <div className="grid gap-2">
                {results.orders.map((order, index) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.05) }}
                  >
                    <Link to="/distribution" className="block bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <p className="font-bold text-gray-900 dark:text-white">طلبية بقيمة {order.totalAmount} ج</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleDateString()}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {results.purchases.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Receipt className="w-5 h-5 ml-2 text-purple-500 dark:text-purple-400" />
                فواتير الشراء ({results.purchases.length})
              </h3>
              <div className="grid gap-2">
                {results.purchases.map((purchase, index) => (
                  <motion.div 
                    key={purchase.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (index * 0.05) }}
                  >
                    <Link to="/purchases" className="block bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <p className="font-bold text-gray-900 dark:text-white">{purchase.supplierName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(purchase.date).toLocaleDateString()}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
