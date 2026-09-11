import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { vendorService } from "../../services/vendorService";
import { CATALOGUE_CATEGORIES } from "../../data/categories";

export const VendorProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== "new");

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Cement",
    categorySlug: "cement",
    unit: "Bag",
    sku: "",
    price: 350,
    originalPrice: 400,
    stock: 100,
    moq: 10,
    isExpress30MinAvailable: true,
    description: "",
    img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      vendorService.getProductById(id).then((prod) => {
        if (prod) setFormData(prod);
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await vendorService.saveProduct(formData);
    navigate("/vendor/products");
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          {isEditing
            ? "Edit Construction Product"
            : "Add New Construction Product"}
        </h1>
        <p className="text-xs text-[#606460]">
          Configure technical specifications, unit prices, and MOQ.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="gm-panel p-6 sm:p-8 rounded-3xl space-y-4"
      >
        <div>
          <label className="text-xs font-semibold text-[#282926] block mb-1">
            Product Title *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. UltraTech Super Weather-Shield PPC Cement (50 kg Bag)"
            className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Brand *
            </label>
            <input
              type="text"
              required
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              placeholder="e.g. UltraTech"
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Product Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                  categorySlug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-"),
                })
              }
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
            >
              {CATALOGUE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Unit of Supply *
            </label>
            <input
              type="text"
              required
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              placeholder="e.g. Bag, Piece, Brass"
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Unit Price (₹) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              MRP / Strikethrough
            </label>
            <input
              type="number"
              value={formData.originalPrice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  originalPrice: Number(e.target.value),
                })
              }
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              Available Stock *
            </label>
            <input
              type="number"
              required
              min={0}
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: Number(e.target.value) })
              }
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#282926] block mb-1">
              MOQ *
            </label>
            <input
              type="number"
              required
              min={1}
              value={formData.moq}
              onChange={(e) =>
                setFormData({ ...formData, moq: Number(e.target.value) })
              }
              className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#282926] block mb-1">
            Product Description *
          </label>
          <textarea
            rows={3}
            required
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full gm-input p-3 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/vendor/products")}
            className="flex-1 btn-gm-secondary py-2.5 rounded-xl text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-gm-primary py-2.5 rounded-xl text-xs font-bold"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
};
