import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, Eye } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { addItem } = useCart();

  const name = product.nombre ?? product.name;
  const price = product.precio ?? product.price;
  const image =
    product.imagenes?.[0] ??
    product.image_url ??
    "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80";
  const category = product.categoryLabel ?? product.categorySlug ?? product.category;
  const featured = product.destacado ?? product.featured;
  const brand = product.marca ?? product.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#F5F0EB] mb-4">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-[#0A0A0A]/30 flex items-center justify-center gap-3"
        >
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ delay: 0, duration: 0.3 }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 text-[#0A0A0A] shadow-lg"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            onClick={() => setIsLiked(!isLiked)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isLiked ? "bg-red-500 text-white" : "bg-white text-[#0A0A0A] hover:bg-red-500 hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </motion.button>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:bg-green-500 hover:text-white transition-all duration-300 text-[#0A0A0A] shadow-lg"
            onClick={() => addItem(product, 1)}
          >
            <ShoppingBag className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {category && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-[10px] tracking-[0.15em] uppercase text-[#0A0A0A] font-semibold shadow-sm">
              {category}
            </span>
          </div>
        )}

        {featured && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-[10px] tracking-[0.15em] uppercase text-white font-semibold shadow-lg shadow-blue-500/40">
              Destacado
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 px-1">
        <span className="text-blue-600 text-[10px] tracking-[0.2em] uppercase block font-semibold">
          {brand || category || "Tech"}
        </span>
        <h3 className="text-[#0A0A0A] text-base font-semibold leading-tight group-hover:text-blue-600 transition-colors duration-300">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-[#0A0A0A] text-xl font-bold">
            ${Number(price || 0).toFixed(2)}
          </p>
          {product.rating && (
            <div className="flex items-center gap-1 text-yellow-400">
              <span className="text-sm">*</span>
              <span className="text-sm text-[#0A0A0A] font-semibold">{product.rating}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
