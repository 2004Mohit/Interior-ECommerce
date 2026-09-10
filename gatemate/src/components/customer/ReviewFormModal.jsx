import React, { useState } from "react";
import {
  X,
  Star,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { reviewService } from "../../services/reviewService";

export const ReviewFormModal = ({
  isOpen,
  onClose,
  product,
  user,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  if (!isOpen || !product) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 3) {
      setFormError("You can upload a maximum of 3 Product Images.");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setFormError(null);
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setFormError("Please select a Customer Rating.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 10) {
      setFormError("Please write a Customer Review of at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await reviewService.submitReview({
        productId: product.id,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email?.split("@")[0],
        userLocation: "Pune / PCMC Region",
        rating,
        headline,
        comment,
        imageFiles: selectedFiles,
      });

      if (response.success) {
        onReviewSubmitted(response.review);
        onClose();
      }
    } catch (err) {
      setFormError(err.message || "Unable to submit Customer Review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a1424] border border-white/10 w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-black text-white">
            Write a Customer Review
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4 truncate">
          Reviewing Product:{" "}
          <span className="text-white font-semibold">{product.name}</span>
        </p>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Rating Stars Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Overall Customer Rating *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-600 hover:scale-110 transition"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-amber-400">
                {rating === 5
                  ? "Exceptional"
                  : rating === 4
                    ? "Very Good"
                    : rating === 3
                      ? "Average"
                      : rating === 2
                        ? "Below Average"
                        : "Poor"}
              </span>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Review Headline (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Fresh batch cement, fast site delivery in PCMC"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full premium-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          {/* Written Comment */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Detailed Customer Review *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Share details about test batch quality, compressive strength, rebar ductility, or site unloading speed..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full premium-input p-3 rounded-xl text-xs leading-relaxed"
            />
          </div>

          {/* Product Images Attachment */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Attach Product Images (Max 3)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-black/70 p-0.5 rounded text-white hover:text-rose-400"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {selectedFiles.length < 3 && (
                <label className="w-16 h-16 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400 cursor-pointer transition">
                  <Upload className="w-4 h-4 mb-0.5" />
                  <span className="text-[9px] font-bold">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              [Note: Image upload is prepared for Supabase Storage bucket
              `review-images`].
            </p>
          </div>

          {/* Verification Badge Notice */}
          <div className="p-3 rounded-xl bg-[#091526] border border-white/5 flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              Your review will appear with a verified purchaser badge for the
              Pune / PCMC region.
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 premium-card hover:bg-white/5 py-3 rounded-xl text-xs font-bold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 gold-gradient-btn py-3 rounded-xl text-xs font-bold transition disabled:opacity-50 text-slate-950"
            >
              {isSubmitting
                ? "Verifying & Submitting..."
                : "Submit Customer Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
