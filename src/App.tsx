/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductForm } from './pages/ProductForm';
import { Shops } from './pages/Shops';
import { ShopForm } from './pages/ShopForm';
import { ShopDetails } from './pages/ShopDetails';
import { Distribution } from './pages/Distribution';
import { OrderForm } from './pages/OrderForm';
import { MoreMenu } from './pages/MoreMenu';
import { Debts } from './pages/Debts';
import { Profits } from './pages/Profits';
import { Reports } from './pages/Reports';
import { Purchases } from './pages/Purchases';
import { PurchaseForm } from './pages/PurchaseForm';
import { SearchResults } from './pages/SearchResults';
import { DailyBusiness } from './pages/DailyBusiness';
import { StartDay } from './pages/StartDay';
import { EndDay } from './pages/EndDay';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/add" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          <Route path="shops" element={<Shops />} />
          <Route path="shops/add" element={<ShopForm />} />
          <Route path="shops/edit/:id" element={<ShopForm />} />
          <Route path="shops/:id" element={<ShopDetails />} />
          <Route path="distribution" element={<Distribution />} />
          <Route path="distribution/new" element={<OrderForm />} />
          <Route path="more" element={<MoreMenu />} />
          <Route path="debts" element={<Debts />} />
          <Route path="profits" element={<Profits />} />
          <Route path="reports" element={<Reports />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="purchases/new" element={<PurchaseForm />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="daily-business" element={<DailyBusiness />} />
          <Route path="daily-business/start" element={<StartDay />} />
          <Route path="daily-business/end" element={<EndDay />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
