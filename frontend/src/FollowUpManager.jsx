
import { useEffect, useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Clock3,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Target,
  Lightbulb
} from "lucide-react";

import {
  generateFollowup,
  getLeadFollowups,
  updateFollowupStatus
} from "./services/api";

import "./FollowUpManager.css";

function FollowUpManager({ leads }) {
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [followups, setFollowups] = useState([]);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Select the first available lead automatically.
  useEffect(() => {
    if (leads.length === 0) {
      setSelectedLeadId("");
      setFollowups([]);
      return;
    }

    const selectedLeadExists = leads.some(
      lead => lead.lead_id === selectedLeadId
    );

    if (!selectedLeadExists) {
      setSelectedLeadId(leads[0].lead_id);
    }
  }, [leads, selectedLeadId]);

  // Load follow-up history whenever the selected lead changes.
  useEffect(() => {
    if (!selectedLeadId) {
      setFollowups([]);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        setError("");
        setSuccess("");

        const data = await getLeadFollowups(selectedLeadId);

        if (!cancelled) {
          setFollowups(data.followups || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Could not load follow-ups:", err);
          setError(
            err.response?.data?.detail ||
            "Could not load follow-up history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedLeadId]);

  const selectedLead = leads.find(
    lead => lead.lead_id === selectedLeadId
  );

  const handleGenerate = async () => {
    if (!selectedLeadId) return;

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const result = await generateFollowup(selectedLeadId);

      setFollowups(current => [
        result.followup,
        ...current
      ]);

      setSuccess("AI follow-up generated and saved successfully!");
    } catch (err) {
      console.error("Follow-up generation failed:", err);

      setError(
        err.response?.data?.detail ||
        "Could not generate the follow-up. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (followup) => {
    try {
      await navigator.clipboard.writeText(
        followup.follow_up_message
      );

      setCopiedId(followup.followup_id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      setError("Could not copy the message. Please copy it manually.");
    }
  };

  const handleStatusUpdate = async (followup) => {
    const newStatus =
      followup.status === "completed" ? "pending" : "completed";

    try {
      setUpdatingId(followup.followup_id);
      setError("");
      setSuccess("");

      const result = await updateFollowupStatus(
        selectedLeadId,
        followup.followup_id,
        newStatus
      );

      setFollowups(current =>
        current.map(item =>
          item.followup_id === followup.followup_id
            ? result.followup
            : item
        )
      );

      setSuccess(
        newStatus === "completed"
          ? "Follow-up marked as completed."
          : "Follow-up moved back to pending."
      );
    } catch (err) {
      console.error("Status update failed:", err);

      setError(
        err.response?.data?.detail ||
        "Could not update follow-up status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString();
  };

  const pendingCount = followups.filter(
    item => item.status === "pending"
  ).length;

  const completedCount = followups.filter(
    item => item.status === "completed"
  ).length;

  return (
    <section className="panel followup-manager" id="followups-section">
      <div className="followup-heading">
        <div>
          <div className="followup-eyebrow">
            <Sparkles size={15} />
            GEMINI AI ASSISTANT
          </div>

          <h3>Follow-up Management</h3>

          <p>
            Generate personalized customer follow-ups and track
            your communication progress.
          </p>
        </div>

        <div className="followup-heading-icon">
          <MessageSquare size={23} />
        </div>
      </div>

      <div className="followup-controls">
        <div className="followup-select-group">
          <label htmlFor="followup-lead-select">
            Select a lead
          </label>

          <select
            id="followup-lead-select"
            value={selectedLeadId}
            onChange={event => setSelectedLeadId(event.target.value)}
            disabled={leads.length === 0 || generating}
          >
            {leads.length === 0 ? (
              <option value="">No leads available</option>
            ) : (
              leads.map(lead => (
                <option key={lead.lead_id} value={lead.lead_id}>
                  {lead.name} ({lead.email})
                </option>
              ))
            )}
          </select>
        </div>

        <button
          className="generate-followup-button"
          onClick={handleGenerate}
          disabled={!selectedLeadId || generating}
        >
          {generating ? (
            <>
              <RefreshCw className="followup-spin" size={17} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={17} />
              Generate AI Follow-up
            </>
          )}
        </button>
      </div>

      {selectedLead && (
        <div className="followup-selected-lead">
          <div className="followup-lead-avatar">
            {selectedLead.name?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div>
            <strong>{selectedLead.name}</strong>
            <span>{selectedLead.email}</span>
          </div>

          <span className={`followup-lead-status ${selectedLead.status}`}>
            {selectedLead.status}
          </span>
        </div>
      )}

      <div className="followup-stats">
        <div className="followup-stat">
          <span>Total follow-ups</span>
          <strong>{followups.length}</strong>
        </div>

        <div className="followup-stat pending-stat">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="followup-stat completed-stat">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      {error && (
        <div className="followup-message error">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {success && (
        <div className="followup-message success">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <div className="followup-history-heading">
        <div>
          <h4>Follow-up History</h4>
          <p>Saved AI recommendations for this lead</p>
        </div>

        <span>{followups.length} records</span>
      </div>

      {loadingHistory ? (
        <div className="followup-empty">
          <RefreshCw className="followup-spin" size={23} />
          <p>Loading follow-up history...</p>
        </div>
      ) : followups.length === 0 ? (
        <div className="followup-empty">
          <MessageSquare size={28} />
          <strong>No follow-ups yet</strong>
          <p>
            Generate an AI follow-up to see your first recommendation here.
          </p>
        </div>
      ) : (
        <div className="followup-list">
          {followups.map(followup => (
            <article
              className={`followup-card ${followup.status}`}
              key={followup.followup_id}
            >
              <div className="followup-card-top">
                <div className="followup-card-date">
                  <Clock3 size={15} />
                  {formatDate(followup.created_at)}
                </div>

                <span className={`followup-status-badge ${followup.status}`}>
                  {followup.status === "completed" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Clock3 size={14} />
                  )}
                  {followup.status}
                </span>
              </div>

              <div className="followup-message-content">
                <div className="followup-section-label">
                  <MessageSquare size={15} />
                  Suggested message
                </div>

                <p>{followup.follow_up_message}</p>

                <button
                  className="copy-followup-button"
                  onClick={() => handleCopy(followup)}
                >
                  {copiedId === followup.followup_id ? (
                    <>
                      <Check size={15} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      Copy message
                    </>
                  )}
                </button>
              </div>

              <div className="followup-details-grid">
                <div>
                  <div className="followup-section-label">
                    <Target size={15} />
                    Recommended action
                  </div>
                  <p>{followup.recommended_action}</p>
                </div>

                <div>
                  <div className="followup-section-label">
                    <Lightbulb size={15} />
                    Why this approach?
                  </div>
                  <p>{followup.reason}</p>
                </div>
              </div>

              <div className="followup-timing">
                <Clock3 size={16} />
                <span>
                  Suggested timing: <strong>{followup.suggested_timing}</strong>
                </span>
              </div>

              {followup.completed_at && (
                <div className="followup-completed-date">
                  Completed: {formatDate(followup.completed_at)}
                </div>
              )}

              <div className="followup-card-actions">
                <button
                  className={
                    followup.status === "completed"
                      ? "mark-pending-button"
                      : "mark-completed-button"
                  }
                  onClick={() => handleStatusUpdate(followup)}
                  disabled={updatingId === followup.followup_id}
                >
                  {updatingId === followup.followup_id ? (
                    <>
                      <RefreshCw className="followup-spin" size={15} />
                      Updating...
                    </>
                  ) : followup.status === "completed" ? (
                    "Mark as pending"
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Mark as completed
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default FollowUpManager;
