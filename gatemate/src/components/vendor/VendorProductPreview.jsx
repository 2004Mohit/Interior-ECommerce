import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Check,
  MapPin,
  Clock,
  Edit2,
  ExternalLink,
  Package,
} from "lucide-react";
import { useVendorAuth } from "../../context/VendorAuthContext";
import { vendorProductService } from "../../services/vendorProductService";
import { SeoHead } from "../common/SeoHead";

export const VendorProductPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendorUser } = useVendorAuth();
  const vendorId = vendorUser?.id || "vnd-pune-001";

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorProductService.getVendorProductById(vendorId, id).then((p) => {
      setProduct(p);
      if (p?.images?.[0] || p?.img) {
        setSelectedImage(p.images?.[0] || p.img);
      }
      setLoading(false);
    });
  }, [vendorId, id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-4 animate-pulse">
        <div className="h-6 bg-[#E4EEF3] rounded w-1/3" />
        <div className="h-96 bg-[#FEFEFE] rounded-3xl border border-[#D9E2EA]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 font-sans">
        <Package className="w-12 h-12 text-[#6F8A92] mx-auto" />
        <h2 className="text-xl font-black text-[#173885]">Product Not Found</h2>
        <Link
          to="/vendor/products"
          className="btn-gm-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#FEFEFE]" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const gallery = product.images?.length > 0 ? product.images : [product.img];

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 pb-24 font-sans">
      <SeoHead
        title={`Guest Storefront Preview - ${product.name} | GateMate Vendor`}
        description="Inspect how your construction product listing appears to guest customers."
        canonicalUrl={`/vendor/products/${product.id}/preview`}
        noIndex={true}
      />

      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E2EA] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/vendor/products")}
            className="p-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>
          <div>
            <span className="badge-gm-info px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Guest Storefront Preview Mode
            </span>
            <h1 className="text-lg sm:text-xl font-black text-[#173885] mt-0.5">
              Guest Buyer View
            </h1>
          </div>
        </div>

        <Link
          to={`/vendor/products/${product.id}`}
          className="btn-gm-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Product</span>
        </Link>
      </div>

      {/* Guest View Banner */}
      <div className="p-3.5 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-xs text-[#173885] flex items-center justify-between">
        <span>
          This is an exact preview of how your product appears to
          unauthenticated guest buyers in Pune & PCMC.
        </span>
        <span className="font-bold text-[#3C7DDA]">
          Status: {product.status}
        </span>
      </div>

      {/* Product Display Canvas */}
      <div className="gm-panel p-6 sm:p-8 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE] grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xs">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden border border-[#D9E2EA] bg-[#F4F6FA]">
            <img
              src={selectedImage || product.img}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImage === imgUrl
                      ? "border-[#3C7DDA]"
                      : "border-[#D9E2EA]"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Technical Specs & Guest Buy Box */}
        <div className="space-y-5">
          <div>
            <span className="text-xs font-bold text-[#3C7DDA] uppercase tracking-wider">
              {product.category}
            </span>
            <h2 className="text-xl font-black text-[#282926] mt-1">
              {product.name}
            </h2>
            <p className="text-xs text-[#606460] mt-0.5 font-mono">
              Brand: {product.brand} • SKU: {product.sku}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-[#D9E2EA] space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#173885] font-mono">
                ₹{product.price}
              </span>
              <span className="text-xs text-[#606460]">/ {product.unit}</span>
              {product.originalPrice && (
                <span className="text-xs text-[#6F8A92] line-through font-mono">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#3F7D20] font-bold block">
              In Stock: {product.stock} {product.unit}s available (MOQ:{" "}
              {product.moq} {product.unit}s)
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
              Technical Specifications
            </h3>
            <p className="text-xs text-[#282926] leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.features?.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#D9E2EA]">
              <h3 className="text-xs font-bold text-[#173885] uppercase tracking-wider">
                Key Product Features
              </h3>
              <ul className="space-y-1 text-xs text-[#282926]">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#3F7D20] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
