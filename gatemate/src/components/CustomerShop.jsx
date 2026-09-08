import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Star, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

// Mock catalog for instant preview before database seeding
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Handcrafted Blue Pottery Vase",
    category: "Decor",
    price: 1299,
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "2",
    name: "Jodhpur Royal Block-Print Curtain",
    category: "Furnishing",
    price: 2499,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "3",
    name: "Antique Brass Door Handle Set",
    category: "Hardware",
    price: 1850,
    rating: 4.6,
    img: "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "4",
    name: "Cobalt Ceramic Dining Plates (Set of 4)",
    category: "Kitchen",
    price: 3199,
    rating: 4.7,
    img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "5",
    name: "Carved Sheesham Gate Latch",
    category: "Hardware",
    price: 950,
    rating: 4.5,
    img: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "6",
    name: "Indigo Mandala Tapestry",
    category: "Decor",
    price: 1100,
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
  },
];

const CATEGORIES = ["All", "Decor", "Furnishing", "Hardware", "Kitchen"];

export const CustomerShop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const { addToCart } = useCart();

  useEffect(() => {
    // Simulating smooth Supabase fetch loading state
    const timer = setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === "All" || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search & Category Filter Section */}
      <div className="glass-panel p-4 md:p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-sky-300" />
          <input
            type="text"
            placeholder="Search gate accessories, decor, crafts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-sm placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
          <Filter className="w-4 h-4 text-sky-300 shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedCat === cat
                  ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white font-semibold"
                  : "glass-card text-blue-100 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {filtered.map((product) => (
            <div
              key={product.id}
              className="glass-card rounded-2xl overflow-hidden flex flex-col group hover:border-sky-400/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-900/40">
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs text-sky-200 border border-white/10">
                  {product.category}
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-white font-semibold text-base line-clamp-1 group-hover:text-cyan-300 transition-colors">
                  {product.name}
                </h3>

                <div className="flex items-center gap-1 mt-1 text-amber-300 text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{product.rating}</span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <span className="text-xl font-bold text-white">
                    ₹{product.price}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
