import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Search, Eye, PackageX } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorService.getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#173885]">
            Product Catalogue Management
          </h1>
          <p className="text-xs text-[#606460]">
            Add, update specifications, and adjust pricing on your construction
            products.
          </p>
        </div>
        <Link
          to="/vendor/products/new"
          className="btn-gm-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92]" />
        <input
          type="text"
          placeholder="Search products by title, category, or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full gm-input pl-10 pr-4 py-2 rounded-xl text-xs"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="gm-panel p-4 rounded-2xl h-16 animate-pulse bg-[#E4EEF3]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="gm-panel p-12 text-center space-y-3">
          <PackageX className="w-10 h-10 text-[#6F8A92] mx-auto" />
          <p className="text-xs text-[#606460]">
            No products match your query.
          </p>
        </div>
      ) : (
        <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Unit Price</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">MOQ</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EA]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F4F6FA] transition">
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={p.img}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-[#F4F6FA] border border-[#D9E2EA]"
                      />
                      <div>
                        <div className="font-bold text-[#282926]">{p.name}</div>
                        <div className="text-[10px] text-[#6F8A92] font-mono">
                          SKU: {p.sku}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-[#606460]">
                      {p.category}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#173885]">
                      ₹{p.price} / {p.unit}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stock > 10 ? "bg-[#E1F2D9] text-[#3F7D20]" : "bg-[#FFF0D5] text-[#A66A08]"}`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[#606460]">
                      {p.moq || 1}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/vendor/products/${p.id}`}
                          className="p-1.5 rounded-lg text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3]"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/products/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-[#606460] hover:text-[#3C7DDA] hover:bg-[#E4EEF3]"
                          title="View Live Product"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
