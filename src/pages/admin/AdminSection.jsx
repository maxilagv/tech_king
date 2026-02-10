import React from "react";
import { useParams } from "react-router-dom";
import { Image, Package, Tags, Users, ShoppingCart, Warehouse, BadgeDollarSign, FileText } from "lucide-react";

const sectionMeta = {
  productos: {
    title: "Productos",
    description: "Alta, baja y modificacion de productos con imagen obligatoria.",
    icon: Package,
  },
  categorias: {
    title: "Categorias",
    description: "Gestiona categorias con nombre e imagen obligatoria.",
    icon: Tags,
  },
  clientes: {
    title: "Clientes",
    description: "Registro manual y gestion de clientes con datos completos.",
    icon: Users,
  },
  pedidos: {
    title: "Pedidos",
    description: "Seguimiento y control de pedidos internos y online.",
    icon: ShoppingCart,
  },
  stock: {
    title: "Stock",
    description: "Control de stock y movimientos de ingreso/egreso.",
    icon: Warehouse,
  },
  finanzas: {
    title: "Finanzas",
    description: "Ingresos, egresos y reportes diarios.",
    icon: BadgeDollarSign,
  },
  remitos: {
    title: "Remitos",
    description: "Generacion de remitos listos para imprimir.",
    icon: FileText,
  },
};

export default function AdminSection() {
  const { section } = useParams();
  const meta = sectionMeta[section] || {
    title: "Modulo",
    description: "Seccion en construccion.",
    icon: Image,
  };
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Administracion</p>
            <h2 className="text-2xl font-semibold">{meta.title}</h2>
            <p className="text-sm text-white/50 mt-1">{meta.description}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-sm text-white/60">
        Este modulo esta listo para conectar con Firestore y Cloudinary. Decime si queres
        que armemos los formularios y la tabla de datos.
      </div>
    </div>
  );
}
