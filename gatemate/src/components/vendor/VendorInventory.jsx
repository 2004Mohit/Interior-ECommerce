import React, { useState, useEffect } from "react";
import { Boxes, Check } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorInventory = () => {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [stockVal, setStockVal] = useState(0);

  useEffect(() => {
    vendorService.getProducts().then(setProducts);
  }, []);

  const handleUpdate = async (id) => {
    const updated = await vendorService.updateStock(id, stockVal);
    setProducts(updated);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Inventory & Stock Management
        </h1>
        <p className="text-xs text-[#606460]">
          Live stock quantities updated directly for customer checkout
          availability.
        </p>
      </div>

      <div className="gm-panel rounded-2xl overflow-hidden border border-[#D9E2EA]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#E4EEF3] text-[#173885] font-bold border-b border-[#D9E2EA]">
            <tr>
              <th className="p-3.5">Product Name</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Current Stock</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Update Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9E2EA]">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-[#F4F6FA]">
                <td className="p-3.5 font-bold text-[#282926]">{p.name}</td>
                <td className="p-3.5 text-[#606460]">{p.category}</td>
                <td className="p-3.5 font-mono font-bold text-[#173885]">
                  {editingId === p.id ? (
                    <input
                      type="number"
                      value={stockVal}
                      onChange={(e) => setStockVal(e.target.value)}
                      className="w-20 gm-input px-2 py-1 rounded text-xs font-mono"
                    />
                  ) : (
                    `${p.stock} ${p.unit}s`
                  )}
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stock > 0 ? "bg-[#E1F2D9] text-[#3F7D20]" : "bg-[#FBE3DE] text-[#B43D20]"}`}
                  >
                    {p.stock > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  {editingId === p.id ? (
                    <button
                      onClick={() => handleUpdate(p.id)}
                      className="btn-gm-primary px-3 py-1 rounded-lg text-xs font-bold"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setStockVal(p.stock);
                      }}
                      className="btn-gm-secondary px-3 py-1 rounded-lg text-xs font-bold"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
