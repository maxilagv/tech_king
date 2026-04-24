import React, { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./Layout";
import { getPageNameFromPath } from "./utils";

// ─── Public pages — lazy loaded ────────────────────────────────────────────────
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Checkout = lazy(() => import("./pages/Checkout"));

// ─── Admin pages — lazy loaded (never in initial bundle) ───────────────────────
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const RequireAdmin = lazy(() => import("./components/admin/RequireAdmin"));
const RequireAdminModule = lazy(() => import("./components/admin/RequireAdminModule"));
const CategoriesAdmin = lazy(() => import("./pages/admin/CategoriesAdmin"));
const ProductsAdmin = lazy(() => import("./pages/admin/ProductsAdmin"));
const CustomersAdmin = lazy(() => import("./pages/admin/CustomersAdmin"));
const OrdersAdmin = lazy(() => import("./pages/admin/OrdersAdmin"));
const StockAdmin = lazy(() => import("./pages/admin/StockAdmin"));
const FinanceAdmin = lazy(() => import("./pages/admin/FinanceAdmin"));
const RemitosAdmin = lazy(() => import("./pages/admin/RemitosAdmin"));
const SuppliersAdmin = lazy(() => import("./pages/admin/SuppliersAdmin"));
const PurchaseCostsAdmin = lazy(() => import("./pages/admin/PurchaseCostsAdmin"));
const OffersAdmin = lazy(() => import("./pages/admin/OffersAdmin"));
const UsersAdmin = lazy(() => import("./pages/admin/UsersAdmin"));
const LandingAdmin = lazy(() => import("./pages/admin/LandingAdmin"));
const PricingAdmin = lazy(() => import("./pages/admin/PricingAdmin"));
const QRAdmin = lazy(() => import("./pages/admin/QRAdmin"));
const AdminHome = lazy(() => import("./components/admin/AdminHome"));

// ─── Route helpers ─────────────────────────────────────────────────────────────
const routes = [
  { path: "/", name: "Home", element: <Home /> },
  { path: "/products", name: "Products", element: <Products /> },
  { path: "/checkout", name: "Checkout", element: <Checkout /> },
  { path: "/about", name: "About", element: <About /> },
  { path: "/contact", name: "Contact", element: <Contact /> },
];

// Minimal fallback — no layout shift, no spinner flicker
function PageFallback() {
  return (
    <div
      aria-hidden="true"
      style={{ minHeight: "100vh", background: "var(--tk-bg, #020c1e)" }}
    />
  );
}

function AppContent() {
  const location = useLocation();
  const currentPageName =
    getPageNameFromPath(location.pathname) ||
    (location.pathname.startsWith("/products/") ? "Products" : "Home");
  const isAdminRoute = location.pathname.startsWith("/admin");

  const moduleElement = (moduleId, element) => (
    <Suspense fallback={<PageFallback />}>
      <RequireAdminModule moduleId={moduleId}>{element}</RequireAdminModule>
    </Suspense>
  );

  const content = (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<PageFallback />}>
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            </Suspense>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="dashboard" element={moduleElement("users", <AdminDashboard />)} />
          <Route path="productos" element={moduleElement("products", <ProductsAdmin />)} />
          <Route path="categorias" element={moduleElement("categories", <CategoriesAdmin />)} />
          <Route path="ofertas" element={moduleElement("offers", <OffersAdmin />)} />
          <Route path="landing" element={moduleElement("landing", <LandingAdmin />)} />
          <Route path="qr" element={moduleElement("qr", <QRAdmin />)} />
          <Route path="pedidos" element={moduleElement("orders", <OrdersAdmin />)} />
          <Route path="clientes" element={moduleElement("customers", <CustomersAdmin />)} />
          <Route path="remitos" element={moduleElement("remitos", <RemitosAdmin />)} />
          <Route path="proveedores" element={moduleElement("suppliers", <SuppliersAdmin />)} />
          <Route path="costos" element={moduleElement("costs", <PurchaseCostsAdmin />)} />
          <Route path="precios" element={moduleElement("pricing", <PricingAdmin />)} />
          <Route path="stock" element={moduleElement("stock", <StockAdmin />)} />
          <Route path="finanzas" element={moduleElement("finance", <FinanceAdmin />)} />
          <Route path="usuarios" element={moduleElement("users", <UsersAdmin />)} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
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
