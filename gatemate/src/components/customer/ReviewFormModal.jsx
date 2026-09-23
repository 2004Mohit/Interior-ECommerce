import React, { useEffect, useState } from "react";
import {
  X,
  Star,
  Upload,
  AlertCircle,
  ShieldCheck,
  MessageSquare,
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

  /*
   * Reset the form whenever the modal is opened.
   */
  useEffect(() => {
    if (!isOpen) return;

    setRating(5);
    setHoverRating(0);
    setHeadline("");
    setComment("");
    setSelectedFiles([]);
    setPreviews([]);
    setIsSubmitting(false);
    setFormError(null);
  }, [isOpen, product?.id]);

  /*
   * Clean up temporary browser preview URLs.
   */
  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore cleanup errors.
        }
      });
    };
  }, [previews]);

  if (!isOpen || !product) {
    return null;
  }

  /**
   * --------------------------------------------------------------------------
   * IMAGE SELECTION
   * --------------------------------------------------------------------------
   *
   * Review images are currently not persisted because the product_reviews
   * table has no image column. The selected files are therefore only used
   * for local preview and passed to reviewService for compatibility.
   */
  const handleFileChange = (event) => {
    const incomingFiles = Array.from(event.target.files || []);

    if (incomingFiles.length === 0) {
      return;
    }

    const remainingSlots = 3 - selectedFiles.length;

    if (remainingSlots <= 0) {
      setFormError("You can attach a maximum of 3 Product Images.");
      return;
    }

    const files = incomingFiles.slice(0, remainingSlots);

    const invalidFile = files.find((file) => !file.type?.startsWith("image/"));

    if (invalidFile) {
      setFormError("Only image files can be attached.");
      return;
    }

    const oversizedFile = files.find((file) => file.size > 5 * 1024 * 1024);

    if (oversizedFile) {
      setFormError("Each Product Image must be 5 MB or smaller.");
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setSelectedFiles((previous) => [...previous, ...files]);

    setPreviews((previous) => [...previous, ...newPreviews]);

    setFormError(null);

    /*
     * Reset input so selecting the same file again still triggers change.
     */
    event.target.value = "";
  };

  const removeFile = (index) => {
    const previewToRemove = previews[index];

    if (previewToRemove) {
      try {
        URL.revokeObjectURL(previewToRemove);
      } catch {
        // Ignore cleanup errors.
      }
    }

    setSelectedFiles((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );

    setPreviews((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );

    setFormError(null);
  };

  /**
   * --------------------------------------------------------------------------
   * SUBMIT REVIEW
   * --------------------------------------------------------------------------
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setFormError("Please sign in before submitting a Customer Review.");
      return;
    }

    if (!product?.id) {
      setFormError(
        "The Product could not be identified. Please refresh the page.",
      );
      return;
    }

    const cleanHeadline = headline.trim();
    const cleanComment = comment.trim();

    if (!rating || rating < 1 || rating > 5) {
      setFormError("Please select a Customer Rating.");
      return;
    }

    if (cleanComment.length < 10) {
      setFormError("Please write a Customer Review of at least 10 characters.");
      return;
    }

    if (cleanComment.length > 5000) {
      setFormError("Customer Review cannot exceed 5000 characters.");
      return;
    }

    if (cleanHeadline.length > 150) {
      setFormError("Review Headline cannot exceed 150 characters.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await reviewService.submitReview({
        productId: product.id,
        userId: user.id,

        userName:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Customer",

        userLocation: "Pune / PCMC Region",

        rating: Number(rating),

        headline: cleanHeadline || null,

        comment: cleanComment,

        imageFiles: selectedFiles,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to submit Customer Review.",
        );
      }

      /*
       * reviewService submits the review as PENDING_REVIEW.
       * It is not immediately published.
       */
      if (typeof onReviewSubmitted === "function") {
        await onReviewSubmitted(response.review);
      }

      /*
       * Parent component normally closes the modal.
       * Keep this as a fallback.
       */
      onClose?.();
    } catch (error) {
      console.error("ReviewFormModal: review submission failed", error);

      setFormError(
        error?.message || "Unable to submit Customer Review. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * --------------------------------------------------------------------------
   * RATING LABEL
   * --------------------------------------------------------------------------
   */
  const ratingLabel =
    rating === 5
      ? "Exceptional"
      : rating === 4
        ? "Very Good"
        : rating === 3
          ? "Average"
          : rating === 2
            ? "Below Average"
            : "Poor";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-[#FEFEFE] border border-[#D9E2EA] w-full max-w-lg rounded-3xl relative shadow-2xl overflow-hidden">
        {/* ---------------------------------------------------------------- */}
        {/* HEADER                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex items-start justify-between gap-4 p-6 sm:p-7 border-b border-[#D9E2EA]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare className="w-5 h-5 text-[#173885] shrink-0" />

              <h3
                id="review-modal-title"
                className="text-xl font-black text-[#173885]"
              >
                Write a Customer Review
              </h3>
            </div>

            <p className="text-xs text-[#606460] truncate">
              Reviewing Product:{" "}
              <span className="text-[#282926] font-semibold">
                {product.name}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6F8A92] hover:text-[#173885] hover:bg-[#F4F6FA] transition disabled:opacity-50 shrink-0"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* BODY                                                             */}
        {/* ---------------------------------------------------------------- */}

        <div className="p-6 sm:p-7 overflow-y-auto max-h-[75vh]">
          {formError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#FDECEC] border border-[#E5A7A7] text-[#9E2F2F] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#B43D20] shrink-0 mt-0.5" />

              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ------------------------------------------------------------ */}
            {/* CUSTOMER RATING                                              */}
            {/* ------------------------------------------------------------ */}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#282926] block">
                Overall Customer Rating *
              </label>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onFocus={() => setHoverRating(star)}
                      onBlur={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition focus:outline-none focus:ring-2 focus:ring-[#3C7DDA]/30 rounded-lg"
                      aria-label={`Rate ${star} out of 5`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          active
                            ? "text-[#3C7DDA] fill-[#3C7DDA]"
                            : "text-[#B8C5CF]"
                        }`}
                      />
                    </button>
                  );
                })}

                <span className="ml-2 text-xs font-bold text-[#173885]">
                  {ratingLabel}
                </span>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* HEADLINE                                                      */}
            {/* ------------------------------------------------------------ */}

            <div className="space-y-2">
              <label
                htmlFor="review-headline"
                className="text-xs font-bold text-[#282926] block"
              >
                Review Headline
                <span className="font-normal text-[#6F8A92]"> (Optional)</span>
              </label>

              <input
                id="review-headline"
                type="text"
                maxLength={150}
                placeholder="e.g. Good product quality and site delivery"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                disabled={isSubmitting}
                className="w-full bg-[#F4F6FA] border border-[#D9E2EA] text-[#282926] placeholder:text-[#9AA6AE] px-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#3C7DDA] focus:ring-2 focus:ring-[#3C7DDA]/10 transition disabled:opacity-60"
              />

              <div className="text-right text-[10px] text-[#8A969E]">
                {headline.length}/150
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* COMMENT                                                        */}
            {/* ------------------------------------------------------------ */}

            <div className="space-y-2">
              <label
                htmlFor="review-comment"
                className="text-xs font-bold text-[#282926] block"
              >
                Detailed Customer Review *
              </label>

              <textarea
                id="review-comment"
                rows={5}
                required
                minLength={10}
                maxLength={5000}
                placeholder="Share your experience with product quality, packaging, delivery, or site use..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                disabled={isSubmitting}
                className="w-full bg-[#F4F6FA] border border-[#D9E2EA] text-[#282926] placeholder:text-[#9AA6AE] p-3.5 rounded-xl text-xs leading-relaxed outline-none focus:border-[#3C7DDA] focus:ring-2 focus:ring-[#3C7DDA]/10 transition resize-y disabled:opacity-60"
              />

              <div className="flex justify-between text-[10px] text-[#8A969E]">
                <span>Minimum 10 characters</span>
                <span>{comment.length}/5000</span>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* PRODUCT IMAGE ATTACHMENTS                                    */}
            {/* ------------------------------------------------------------ */}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#282926] block">
                Attach Product Images
                <span className="font-normal text-[#6F8A92]">
                  {" "}
                  (Optional, Max 3)
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {previews.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D9E2EA] bg-[#F4F6FA]"
                  >
                    <img
                      src={src}
                      alt={`Selected Product Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full text-white flex items-center justify-center hover:bg-black transition disabled:opacity-50"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {selectedFiles.length < 3 && (
                  <label className="w-16 h-16 rounded-xl border border-dashed border-[#B8C5CF] bg-[#F4F6FA] flex flex-col items-center justify-center text-[#6F8A92] hover:text-[#173885] hover:border-[#3C7DDA] cursor-pointer transition">
                    <Upload className="w-4 h-4 mb-1" />

                    <span className="text-[9px] font-bold">Upload</span>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="text-[10px] text-[#8A969E]">
                Maximum 3 images. Each image must be 5 MB or smaller.
              </p>

              <p className="text-[10px] text-[#8A969E]">
                Review image storage will be enabled separately. Your written
                review and rating will still be submitted normally.
              </p>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* VERIFIED PURCHASE NOTICE                                     */}
            {/* ------------------------------------------------------------ */}

            <div className="p-3.5 rounded-2xl bg-[#E1F2D9]/60 border border-[#3F7D20]/20 flex items-start gap-2.5 text-[11px] text-[#3F7D20]">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />

              <div>
                <p className="font-bold">Verified Customer Review</p>

                <p className="mt-0.5 leading-relaxed">
                  Your review is linked to your delivered order and will carry a
                  Verified Purchase badge after publication.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* MODERATION NOTICE                                             */}
            {/* ------------------------------------------------------------ */}

            <div className="p-3.5 rounded-2xl bg-[#E3EBFA] border border-[#2E4D94]/20 text-[#2E4D94] text-[11px] leading-relaxed">
              Your Customer Review will be submitted for moderation. It will
              become publicly visible after it is approved.
            </div>

            {/* ------------------------------------------------------------ */}
            {/* ACTIONS                                                        */}
            {/* ------------------------------------------------------------ */}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-[#F4F6FA] border border-[#D9E2EA] hover:bg-[#E4EEF3] py-3 rounded-xl text-xs font-bold text-[#606460] transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#173885] hover:bg-[#21479D] py-3 rounded-xl text-xs font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Customer Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
