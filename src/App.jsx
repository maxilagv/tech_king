import React, { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import Layout from "./Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import { getPageNameFromPath } from "./utils";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import RequireAdmin from "./components/admin/RequireAdmin";
import RequireAdminModule from "./components/admin/RequireAdminModule";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import CustomersAdmin from "./pages/admin/CustomersAdmin";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import StockAdmin from "./pages/admin/StockAdmin";
import FinanceAdmin from "./pages/admin/FinanceAdmin";
import RemitosAdmin from "./pages/admin/RemitosAdmin";
import SuppliersAdmin from "./pages/admin/SuppliersAdmin";
import PurchaseCostsAdmin from "./pages/admin/PurchaseCostsAdmin";
import OffersAdmin from "./pages/admin/OffersAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import AdminHome from "./components/admin/AdminHome";
import { auth } from "@/api/firebase";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const routes = [
  { path: "/", name: "Home", element: <Home /> },
  { path: "/products", name: "Products", element: <Products /> },
  { path: "/checkout", name: "Checkout", element: <Checkout /> },
  { path: "/about", name: "About", element: <About /> },
  { path: "/contact", name: "Contact", element: <Contact /> },
];

function AppContent() {
  const location = useLocation();
  const currentPageName =
    getPageNameFromPath(location.pathname) ||
    (location.pathname.startsWith("/products/") ? "Products" : "Home");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { isAdmin, checking, authLoading } = useAdminAccess();

  useEffect(() => {
    if (isAdminRoute) return;
    if (!checking && !authLoading && isAdmin) {
      signOut(auth);
    }
  }, [isAdminRoute, isAdmin, checking, authLoading]);

  const moduleElement = (moduleId, element) => (
    <RequireAdminModule moduleId={moduleId}>{element}</RequireAdminModule>
  );

  const content = (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="/products/:productId" element={<ProductDetail />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="dashboard" element={moduleElement("users", <AdminDashboard />)} />
        <Route path="productos" element={moduleElement("products", <ProductsAdmin />)} />
        <Route path="categorias" element={moduleElement("categories", <CategoriesAdmin />)} />
        <Route path="ofertas" element={moduleElement("offers", <OffersAdmin />)} />
        <Route path="pedidos" element={moduleElement("orders", <OrdersAdmin />)} />
        <Route path="clientes" element={moduleElement("customers", <CustomersAdmin />)} />
        <Route path="remitos" element={moduleElement("remitos", <RemitosAdmin />)} />
        <Route path="proveedores" element={moduleElement("suppliers", <SuppliersAdmin />)} />
        <Route path="costos" element={moduleElement("costs", <PurchaseCostsAdmin />)} />
        <Route path="stock" element={moduleElement("stock", <StockAdmin />)} />
        <Route path="finanzas" element={moduleElement("finance", <FinanceAdmin />)} />
        <Route path="usuarios" element={moduleElement("users", <UsersAdmin />)} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
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
