import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  Building2,
} from "lucide-react";
import {
  productAttributeService,
  ATTRIBUTE_SUGGESTION_STATUS,
} from "../../services/productAttributeService";

export const AdminAttributeReviewPanel = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const loadSuggestions = async () => {
    setLoading(true);
    const data = await productAttributeService.getAllSuggestions();
    setSuggestions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleReviewAction = async (suggestionId, status) => {
    await productAttributeService.updateSuggestionReviewState(suggestionId, {
      status,
      reviewerNotes:
        status === ATTRIBUTE_SUGGESTION_STATUS.APPROVED
          ? "Approved and merged into category attributes."
          : "Declined — attribute is redundant or non-standard.",
    });
    setNotice(`Suggestion marked as ${status}.`);
    loadSuggestions();
    setTimeout(() => setNotice(null), 3000);
  };

  if (loading)
    return (
      <div className="p-8 text-xs text-[#606460]">
        Loading attribute suggestions...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Category Attribute Suggestions Console
        </h1>
        <p className="text-xs text-[#606460]">
          Admin workspace to inspect, approve, or reject vendor-suggested
          construction product attributes.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F2D9] border border-[#3F7D20]/30 text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3F7D20]" />
          <span>{notice}</span>
        </div>
      )}

      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="gm-panel p-12 text-center text-xs text-[#606460]">
            No attribute suggestions pending review.
          </div>
        ) : (
          suggestions.map((sug) => (
            <div
              key={sug.id}
              className="gm-panel p-5 rounded-3xl border border-[#D9E2EA] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E2EA] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E4EEF3] flex items-center justify-center text-[#173885] font-black">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#282926]">
                      {sug.name}
                    </h3>
                    <span className="text-[10px] text-[#6F8A92] font-mono">
                      Category: {sug.categorySlug} • Type: {sug.type}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                    sug.status === ATTRIBUTE_SUGGESTION_STATUS.APPROVED
                      ? "bg-[#E1F2D9] text-[#3F7D20]"
                      : sug.status === ATTRIBUTE_SUGGESTION_STATUS.REJECTED
                        ? "bg-[#FBE3DE] text-[#B43D20]"
                        : "bg-[#FFF0D5] text-[#A66A08]"
                  }`}
                >
                  {sug.status}
                </span>
              </div>

              <div className="text-xs text-[#606460] space-y-1">
                <div>
                  <strong className="text-[#282926]">Suggested by:</strong>{" "}
                  {sug.vendorBusinessName}
                </div>
                {sug.reason && (
                  <div>
                    <strong className="text-[#282926]">
                      Vendor Justification:
                    </strong>{" "}
                    {sug.reason}
                  </div>
                )}
                {sug.allowedValues?.length > 0 && (
                  <div>
                    <strong className="text-[#282926]">
                      Dropdown Options:
                    </strong>{" "}
                    {sug.allowedValues.join(", ")}
                  </div>
                )}
              </div>

              {sug.status === ATTRIBUTE_SUGGESTION_STATUS.PENDING && (
                <div className="pt-2 border-t border-[#D9E2EA] flex justify-end gap-2">
                  <button
                    onClick={() =>
                      handleReviewAction(
                        sug.id,
                        ATTRIBUTE_SUGGESTION_STATUS.REJECTED,
                      )
                    }
                    className="btn-gm-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#B43D20] flex items-center gap-1 hover:bg-[#FBE3DE]"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() =>
                      handleReviewAction(
                        sug.id,
                        ATTRIBUTE_SUGGESTION_STATUS.APPROVED,
                      )
                    }
                    className="btn-gm-primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Merge Globally</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
