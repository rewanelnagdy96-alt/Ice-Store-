import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Home, Package, Store, Truck, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export function Layout() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors">
      {/* Top Bar */}
      <header className="bg-blue-600 dark:bg-blue-800 text-white p-4 shadow-md z-10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">موزع الآيس كريم</h1>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="ابحث عن منتج، محل، فاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-4 pr-10 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 transition-colors"
          />
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-white/70" />
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 pb-safe transition-colors">
        <div className="flex justify-around items-center h-16">
          <NavItem to="/" icon={<Home />} label="الرئيسية" />
          <NavItem to="/products" icon={<Package />} label="المنتجات" />
          <NavItem to="/shops" icon={<Store />} label="المحلات" />
          <NavItem to="/distribution" icon={<Truck />} label="التوزيع" />
          <NavItem to="/more" icon={<MoreHorizontal />} label="المزيد" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full space-y-1 ${
          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`
      }
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
