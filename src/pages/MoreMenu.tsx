import { Link } from 'react-router-dom';
import { Users, DollarSign, BarChart3, Receipt, Settings, Database, Download, Upload, Moon, Sun, Play } from 'lucide-react';
import { db } from '../db';
import { useRef, useState, useEffect } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { motion } from 'motion/react';

export function MoreMenu() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus(null);
    try {
      const products = await db.products.toArray();
      const shops = await db.shops.toArray();
      const orders = await db.orders.toArray();
      const payments = await db.payments.toArray();
      const purchaseInvoices = await db.purchaseInvoices.toArray();
      const dailyBusiness = await db.dailyBusiness.toArray();

      const backupData = {
        products,
        shops,
        orders,
        payments,
        purchaseInvoices,
        dailyBusiness,
        timestamp: new Date().toISOString()
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const fileName = `icecream_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      // Try to use the Web Share API if available (great for mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'نسخة احتياطية - موزع الآيس كريم',
              text: 'ملف النسخة الاحتياطية لبيانات التطبيق',
              files: [file]
            });
            setBackupStatus({ type: 'success', message: 'تم مشاركة النسخة الاحتياطية بنجاح' });
            setIsBackingUp(false);
            return; // Shared successfully
          } catch (shareError) {
            console.log('Share failed or was cancelled', shareError);
            // Fallback to download
          }
        }
      }

      // Fallback to standard download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setBackupStatus({ type: 'success', message: 'تم تنزيل النسخة الاحتياطية بنجاح' });
    } catch (error) {
      console.error(error);
      setBackupStatus({ type: 'error', message: 'حدث خطأ أثناء إنشاء النسخة الاحتياطية' });
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupStatus(null), 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.timestamp) {
          alert('هذا الملف لا يبدو كملف نسخة احتياطية صالح.');
          return;
        }
        setPendingRestoreData(data);
        setShowRestoreConfirm(true);
      } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء قراءة الملف. تأكد من صحة الملف.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executeRestore = async () => {
    if (!pendingRestoreData) return;
    
    try {
      const data = pendingRestoreData;
      await db.transaction('rw', [db.products, db.shops, db.orders, db.payments, db.purchaseInvoices, db.dailyBusiness], async () => {
        await db.products.clear();
        await db.shops.clear();
        await db.orders.clear();
        await db.payments.clear();
        await db.purchaseInvoices.clear();
        await db.dailyBusiness.clear();

        if (data.products) await db.products.bulkAdd(data.products);
        if (data.shops) await db.shops.bulkAdd(data.shops);
        if (data.orders) await db.orders.bulkAdd(data.orders);
        if (data.payments) await db.payments.bulkAdd(data.payments);
        if (data.purchaseInvoices) await db.purchaseInvoices.bulkAdd(data.purchaseInvoices);
        if (data.dailyBusiness) await db.dailyBusiness.bulkAdd(data.dailyBusiness);
      });
      setShowRestoreConfirm(false);
      setPendingRestoreData(null);
      alert('تمت استعادة البيانات بنجاح');
      window.location.reload(); // Reload to reflect changes globally
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء استعادة البيانات.');
      setShowRestoreConfirm(false);
      setPendingRestoreData(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold mb-6 dark:text-white">المزيد من الخيارات</h2>
      
      <div className="grid gap-3">
        <MenuLink to="/daily-business" icon={<Play className="w-6 h-6 text-green-500" />} title="حساب اليوم" description="بداية اليوم، جرد نهاية اليوم، وملخص المبيعات" />
        <MenuLink to="/debts" icon={<Users className="w-6 h-6 text-orange-500" />} title="إدارة الديون" description="متابعة ديون المحلات وتسجيل الدفعات" />
        <MenuLink to="/profits" icon={<DollarSign className="w-6 h-6 text-green-500" />} title="حساب الأرباح" description="عرض الأرباح اليومية والأسبوعية والشهرية" />
        <MenuLink to="/reports" icon={<BarChart3 className="w-6 h-6 text-blue-500" />} title="التقارير والإحصائيات" description="تقارير المبيعات وحركة المخزون" />
        <MenuLink to="/purchases" icon={<Receipt className="w-6 h-6 text-purple-500" />} title="فواتير الشراء" description="تسجيل فواتير الشراء من الشركات" />
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">الإعدادات</h3>
        <div className="grid gap-3">
          <button onClick={toggleDarkMode} className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-right">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg ml-4">
              {isDarkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-gray-600" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">تغيير مظهر التطبيق</p>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">النسخ الاحتياطي والاستعادة</h3>
        <div className="grid gap-3">
          <button onClick={handleBackup} className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-right">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg ml-4">
              <Download className={`w-6 h-6 text-blue-600 dark:text-blue-400 ${isBackingUp ? 'animate-bounce' : ''}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white">نسخ احتياطي للبيانات</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">حفظ نسخة من بيانات التطبيق في ملف</p>
              {backupStatus && (
                <p className={`text-xs mt-1 font-bold ${backupStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {backupStatus.message}
                </p>
              )}
            </div>
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-right">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg ml-4">
              <Upload className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">استعادة البيانات</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">استعادة البيانات من ملف نسخ احتياطي</p>
            </div>
          </button>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        </div>
      </div>

      <ConfirmModal
        isOpen={showRestoreConfirm}
        title="تحذير: استعادة البيانات"
        message="استعادة البيانات ستمسح جميع البيانات الحالية وتستبدلها ببيانات الملف. هل أنت متأكد من المتابعة؟"
        onConfirm={executeRestore}
        onCancel={() => {
          setShowRestoreConfirm(false);
          setPendingRestoreData(null);
        }}
      />
    </motion.div>
  );
}

function MenuLink({ to, icon, title, description }: { to: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <Link to={to} className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg ml-4">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
