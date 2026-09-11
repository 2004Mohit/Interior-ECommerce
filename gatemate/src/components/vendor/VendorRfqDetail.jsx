import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorRfqDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    vendorService.getRfqs().then((list) => {
      const match = list.find((r) => r.id === id);
      if (match) {
        setRfq(match);
        if (match.quotedRate) setRate(match.quotedRate);
      }
    });
  }, [id]);

  if (!rfq)
    return (
      <div className="p-8 text-xs text-[#606460]">
        RFQ loading or not found...
      </div>
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await vendorService.submitRfqQuote(rfq.id, { quotedRate: rate, notes });
    navigate("/vendor/quotations");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-[#D9E2EA] pb-4">
        <Link to="/vendor/rfqs" className="btn-gm-secondary p-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#173885]">
            {rfq.projectName}
          </h1>
          <p className="text-xs text-[#606460]">RFQ ID: {rfq.id}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="gm-panel p-6 rounded-3xl space-y-4"
      >
        <div className="text-xs text-[#606460] space-y-1 pb-3 border-b border-[#D9E2EA]">
          <div>
            <strong className="text-[#282926]">Product:</strong>{" "}
            {rfq.productName}
          </div>
          <div>
            <strong className="text-[#282926]">Volume:</strong> {rfq.quantity}{" "}
            {rfq.unit}s
          </div>
          <div>
            <strong className="text-[#282926]">Site Drop:</strong>{" "}
            {rfq.siteLocation}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#282926] block mb-1">
            Your Quoted Rate per {rfq.unit} (₹) *
          </label>
          <input
            type="number"
            required
            min={1}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full gm-input px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold"
          />
        </div>

        {rate && (
          <div className="p-3 bg-[#E4EEF3] rounded-xl text-xs font-bold text-[#173885]">
            Estimated Project Total: ₹
            {(Number(rate) * rfq.quantity).toLocaleString("en-IN")} (Excl. 18%
            GST)
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[#282926] block mb-1">
            Stockist Notes / Mill Certificate Guarantee
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Batch test cert included, 24-hr flatbed delivery guaranteed."
            className="w-full gm-input p-3 rounded-xl text-xs"
          />
        </div>

        <button
          type="submit"
          className="w-full btn-gm-primary py-3 rounded-xl text-xs font-bold"
        >
          Submit Commercial Bid
        </button>
      </form>
    </div>
  );
};
