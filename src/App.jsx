import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import Layout from "./Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import { getPageNameFromPath } from "./utils";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSection from "./pages/admin/AdminSection";
import AdminLayout from "./components/admin/AdminLayout";
import RequireAdmin from "./components/admin/RequireAdmin";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import CustomersAdmin from "./pages/admin/CustomersAdmin";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import StockAdmin from "./pages/admin/StockAdmin";
import FinanceAdmin from "./pages/admin/FinanceAdmin";
import RemitosAdmin from "./pages/admin/RemitosAdmin";
import SuppliersAdmin from "./pages/admin/SuppliersAdmin";
import PurchaseCostsAdmin from "./pages/admin/PurchaseCostsAdmin";
import { auth } from "@/api/firebase";
import { useAdminStatus } from "@/hooks/useAdminStatus";

const routes = [
  { path: "/", name: "Home", element: <Home /> },
  { path: "/products", name: "Products", element: <Products /> },
  { path: "/checkout", name: "Checkout", element: <Checkout /> },
  { path: "/about", name: "About", element: <About /> },
  { path: "/contact", name: "Contact", element: <Contact /> },
];

function AppContent() {
  const location = useLocation();
  const currentPageName = getPageNameFromPath(location.pathname) || "Home";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { isAdmin, checking } = useAdminStatus();

  useEffect(() => {
    if (isAdminRoute) return;
    if (!checking && isAdmin) {
      signOut(auth);
    }
  }, [isAdminRoute, isAdmin, checking]);

  const content = (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="productos" element={<ProductsAdmin />} />
        <Route path="categorias" element={<CategoriesAdmin />} />
        <Route path="proveedores" element={<SuppliersAdmin />} />
        <Route path="costos" element={<PurchaseCostsAdmin />} />
        <Route path="pedidos" element={<OrdersAdmin />} />
        <Route path="clientes" element={<CustomersAdmin />} />
        <Route path="stock" element={<StockAdmin />} />
        <Route path="finanzas" element={<FinanceAdmin />} />
        <Route path="remitos" element={<RemitosAdmin />} />
        <Route path=":section" element={<AdminSection />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );

  if (isAdminRoute) {
    return content;
  }

  return <Layout currentPageName={currentPageName}>{content}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
