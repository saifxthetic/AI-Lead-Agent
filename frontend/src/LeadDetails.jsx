import { useEffect, useState } from "react";
import {
  X,
  UserRound,
  Mail,
  CalendarDays,
  Tag,
  Zap,
  Sparkles,
  MessageSquare,
  LoaderCircle,
  CircleAlert,
  CheckCircle2,
  Hash
} from "lucide-react";

import { getLeadById } from "./services/api";
import "./LeadDetails.css";

function LeadDetails({ leadId, onClose }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchLeadDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getLeadById(leadId);

        if (isActive) {
          setLead(result.lead || result);
        }
      } catch (err) {
        console.error("Error fetching lead details:", err);

        if (isActive) {
          setError(
            err.response?.data?.detail ||
            "Unable to load this lead. Please try again."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (leadId) {
      fetchLeadDetails();
    }

    return () => {
      isActive = false;
    };
  }, [leadId]);

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString();
  };

  const analysis = lead?.ai_analysis || {};

  return (
    <div className="details-overlay" onClick={onClose}>
      <aside
        className="lead-details-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="details-header">
          <div>
            <span className="details-eyebrow">
              <Sparkles size={14} />
              LEAD INFORMATION
            </span>
            <h2>Lead Details</h2>
            <p>Complete customer information and AI analysis</p>
          </div>

          <button
            className="details-close-button"
            onClick={onClose}
            aria-label="Close lead details"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="details-state">
            <LoaderCircle className="spin" size={30} />
            <p>Loading lead information...</p>
          </div>
        ) : error ? (
          <div className="details-state details-error">
            <CircleAlert size={30} />
            <p>{error}</p>
            <button onClick={onClose}>Close</button>
          </div>
        ) : lead ? (
          <div className="details-content">
            <section className="details-profile">
              <div className="details-avatar">
                {lead.name?.charAt(0)?.toUpperCase() || "?"}
              </div>

              <div>
                <h3>{lead.name || "Unnamed lead"}</h3>
                <span className={`details-status ${lead.status || "new"}`}>
                  {lead.status || "new"}
                </span>
              </div>
            </section>

            <section className="details-section">
              <h4>Contact Information</h4>

              <div className="details-info-row">
                <Mail size={17} />
                <div>
                  <span>Email address</span>
                  <strong>{lead.email || "Not provided"}</strong>
                </div>
              </div>

              <div className="details-info-row">
                <CalendarDays size={17} />
                <div>
                  <span>Date created</span>
                  <strong>{formatDate(lead.created_at)}</strong>
                </div>
              </div>

              <div className="details-info-row">
                <Hash size={17} />
                <div>
                  <span>Lead ID</span>
                  <strong className="details-id">{lead.lead_id || leadId}</strong>
                </div>
              </div>
            </section>

            <section className="details-section">
              <h4>Customer Message</h4>

              <div className="details-message">
                <MessageSquare size={17} />
                <p>{lead.message || "No message provided."}</p>
              </div>
            </section>

            <section className="details-section">
              <h4>
                <Sparkles size={16} />
                Gemini AI Analysis
              </h4>

              <div className="details-analysis-grid">
                <div className="details-analysis-card">
                  <span>Lead Quality</span>
                  <strong>
                    {analysis.lead_quality || "Not available"}
                  </strong>
                </div>

                <div className="details-analysis-card">
                  <span>Priority</span>
                  <strong>
                    <Zap size={14} />
                    {analysis.priority || "Not available"}
                  </strong>
                </div>

                <div className="details-analysis-card">
                  <span>Category</span>
                  <strong>
                    <Tag size={14} />
                    {analysis.category || "Not available"}
                  </strong>
                </div>
              </div>

              <div className="details-ai-block">
                <span>AI Summary</span>
                <p>
                  {analysis.summary ||
                    analysis.lead_summary ||
                    "No AI summary available for this lead."}
                </p>
              </div>

              <div className="details-ai-block recommendation">
                <span>
                  <CheckCircle2 size={15} />
                  Suggested Next Action
                </span>
                <p>
                  {analysis.suggested_action ||
                    analysis.recommended_action ||
                    analysis.next_action ||
                    "No recommendation available."}
                </p>
              </div>
            </section>

            <div className="details-footer">
              <UserRound size={16} />
              <span>Lead record retrieved from your database</span>
            </div>
          </div>
        ) : (
          <div className="details-state">
            <p>No lead information was returned.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

export default LeadDetails;