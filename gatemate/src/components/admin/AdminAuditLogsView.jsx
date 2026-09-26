import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileCode,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  adminAuditService,
  AUDIT_ENTITIES,
} from "../../services/adminAuditService";
import { AdminPermissionGuard } from "./AdminPermissionGuard";
import { ADMIN_PERMISSIONS } from "../../services/adminPermissionService";
import { SeoHead } from "../common/SeoHead";

export const AdminAuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAuditService.getAuditLogs({
        entityType: selectedEntity,
        limit: 50,
      });
      setLogs(result.logs);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err.message || "Unable to retrieve platform audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity]);

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <AdminPermissionGuard permission={ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS}>
      <div className="space-y-6 pb-16 font-sans">
        <SeoHead
          title="Administrative Audit Logs | Ferrado Console"
          description="Tamper-evident operational audit trail of platform modifications, approvals, and financial overrides."
          canonicalUrl="/admin/audit-logs"
          noIndex={true}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
          <div>
            <span className="badge-gm-info px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Governance & Security
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173885] mt-1">
              Platform Audit Logs
            </h1>
            <p className="text-xs text-[#606460]">
              Immutable record of administrative decisions, product moderation,
              and financial ledger interventions.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-gm-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="gm-panel p-4 rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-[#6F8A92]" />
            <span className="text-xs font-bold text-[#282926]">
              Filter Entity:
            </span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="gm-input px-3 py-1.5 rounded-xl text-xs font-bold"
            >
              <option value="ALL">All Entities ({totalCount})</option>
              {Object.keys(AUDIT_ENTITIES).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono text-[#6F8A92]">
            Showing latest {logs.length} audit records
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#FBE3DE] border border-[#B43D20]/30 text-[#B43D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Logs Table / List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#FEFEFE] rounded-2xl border border-[#D9E2EA]"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="gm-panel p-12 rounded-3xl border border-[#D9E2EA] text-center space-y-2 bg-[#FEFEFE]">
            <ShieldCheck className="w-10 h-10 text-[#3F7D20] mx-auto" />
            <h2 className="text-sm font-bold text-[#173885]">
              No Audit Records Found
            </h2>
            <p className="text-xs text-[#606460]">
              No administrative events match the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className="gm-panel rounded-2xl border border-[#D9E2EA] bg-[#FEFEFE] overflow-hidden shadow-2xs transition"
                >
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-[#F4F6FA]/50"
                  >
                    <div className="flex items-start md:items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#E4EEF3] text-[#173885] flex items-center justify-center shrink-0 text-xs font-black">
                        {log.entity_type.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-[#173885]">
                            {log.action}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E4EEF3] text-[#3C7DDA] font-bold">
                            {log.entity_type} #{log.entity_id.slice(0, 8)}
                          </span>
                        </div>
                        {log.reason && (
                          <p className="text-xs text-[#606460] mt-0.5">
                            {log.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#6F8A92] self-end md:self-auto shrink-0">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(log.created_at).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#173885]" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON Diffs */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#D9E2EA] bg-[#F4F6FA] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#B43D20] block mb-1">
                          Previous State (Before)
                        </span>
                        <pre className="p-3 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[11px] overflow-x-auto max-h-48 text-[#282926]">
                          {log.previous_value
                            ? JSON.stringify(log.previous_value, null, 2)
                            : "// Null or Unspecified"}
                        </pre>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F7D20] block mb-1">
                          New State (After Action)
                        </span>
                        <pre className="p-3 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[11px] overflow-x-auto max-h-48 text-[#282926]">
                          {log.new_value
                            ? JSON.stringify(log.new_value, null, 2)
                            : "// Null or Unspecified"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
};
