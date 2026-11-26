
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, Target, TrendingUp, Zap,
  Search, RefreshCw, Trash2, Menu, X, Activity,
  CircleAlert, CheckCircle2, Clock3, UserRound,
  ArrowUpRight, Sparkles, Plus, Mail, MessageSquare,
  LoaderCircle
} from "lucide-react";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid
} from "recharts";

import {
  getAllLeads,
  createLead,
  updateLeadStatus,
  deleteLead
} from "./services/api";

import LeadDetails from "./LeadDetails";
import AdvancedAnalytics from "./AdvancedAnalytics";
import "./App.css";

const STATUSES = ["new", "contacted", "qualified", "converted", "lost"];

function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [updatingLead, setUpdatingLead] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Stores the ID of the lead whose details are open
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    message: ""
  });

  const fetchLeads = async () => {
    try {
      setError("");
      const data = await getAllLeads();
      setLeads(data.leads || []);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load leads. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const stats = useMemo(() => ({
    total: leads.length,
    qualified: leads.filter(lead => lead.status === "qualified").length,
    converted: leads.filter(lead => lead.status === "converted").length,
    highPriority: leads.filter(
      lead => lead.ai_analysis?.priority === "High"
    ).length
  }), [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const term = search.toLowerCase();

      const matchesSearch =
        lead.name?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.message?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        lead.ai_analysis?.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [leads, search, statusFilter, priorityFilter]);

  const statusChartData = useMemo(() => (
    STATUSES.map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      total: leads.filter(lead => lead.status === status).length
    }))
  ), [leads]);

  const handleCreateLead = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const result = await createLead(newLead);

      setLeads(current => [
        result.lead,
        ...current.filter(
          lead => lead.lead_id !== result.lead.lead_id
        )
      ]);

      setNewLead({
        name: "",
        email: "",
        message: ""
      });

      setFormSuccess(
        "Lead created successfully! Gemini has analyzed it."
      );

      setTimeout(() => {
        setShowForm(false);
        setFormSuccess("");
      }, 1800);

    } catch (err) {
      console.error("Lead creation failed:", err);

      setFormError(
        err.response?.data?.detail ||
        "Could not create lead. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      setUpdatingLead(leadId);
      await updateLeadStatus(leadId, newStatus);

      setLeads(current =>
        current.map(lead =>
          lead.lead_id === leadId
            ? { ...lead, status: newStatus }
            : lead
        )
      );
    } catch (err) {
      console.error(err);
      alert("Could not update lead status.");
    } finally {
      setUpdatingLead(null);
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    try {
      await deleteLead(leadId);
      setLeads(current =>
        current.filter(lead => lead.lead_id !== leadId)
      );

      // Close the details panel if the deleted lead was open
      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
      }
    } catch (err) {
      console.error(err);
      alert("Could not delete lead.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "Recently added";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Recently added";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Sparkles size={21} /></div>
          <div>
            <h2>LeadPilot</h2>
            <span>AI MANAGEMENT</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          <button className="nav-item active">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className="nav-item"
            onClick={() => {
              document.getElementById("leads-section")
                ?.scrollIntoView({ behavior: "smooth" });
              setSidebarOpen(false);
            }}
          >
            <Users size={19} />
            <span>All Leads</span>
            <span className="nav-count">{leads.length}</span>
          </button>

          <button
            className="nav-item"
            onClick={() => {
              setPriorityFilter("High");
              document.getElementById("leads-section")
                ?.scrollIntoView({ behavior: "smooth" });
              setSidebarOpen(false);
            }}
          >
            <Zap size={19} />
            <span>High Priority</span>
          </button>

          <button
            className="nav-item"
            onClick={() => {
              setStatusFilter("qualified");
              document.getElementById("leads-section")
                ?.scrollIntoView({ behavior: "smooth" });
              setSidebarOpen(false);
            }}
          >
            <Target size={19} />
            <span>Qualified Leads</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="online-dot"></span>
            <span>Backend connected</span>
          </div>
          <p>AI Lead Agent · Version 1.0</p>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="breadcrumb">Workspace / Overview</p>
              <h1>Dashboard</h1>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-indicator">
              <span className="online-dot"></span>
              System online
            </div>

            <button
              className="icon-button"
              onClick={fetchLeads}
              title="Refresh leads"
              aria-label="Refresh leads"
            >
              <RefreshCw size={18} />
            </button>

            <div className="profile">
              <div className="profile-avatar">
                <UserRound size={19} />
              </div>
              <div className="profile-info">
                <strong>Administrator</strong>
                <span>Workspace owner</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <p className="eyebrow">YOUR BUSINESS AT A GLANCE</p>
              <h2>Welcome to your workspace</h2>
              <p>
                Track your leads, monitor AI insights, and manage
                your opportunities in one place.
              </p>
            </div>
            <div className="welcome-icon"><Sparkles size={30} /></div>
          </section>

          {error && (
            <div className="error-banner">
              <CircleAlert size={19} />
              <span>{error}</span>
              <button onClick={fetchLeads}>Try again</button>
            </div>
          )}

          <section className="stats-grid">
            <StatCard
              icon={<Users size={20} />}
              label="Total Leads"
              value={loading ? "—" : stats.total}
              description="All stored leads"
              color="blue"
            />
            <StatCard
              icon={<Target size={20} />}
              label="Qualified Leads"
              value={loading ? "—" : stats.qualified}
              description="Ready for opportunities"
              color="purple"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Converted Leads"
              value={loading ? "—" : stats.converted}
              description="Successfully converted"
              color="green"
            />
            <StatCard
              icon={<Zap size={20} />}
              label="High Priority"
              value={loading ? "—" : stats.highPriority}
              description="Flagged by AI analysis"
              color="orange"
            />
          </section>

          <section className="analytics-grid">
            <div className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h3>Lead Overview</h3>
                  <p>Distribution of leads by status</p>
                </div>
                <div className="heading-icon"><Activity size={19} /></div>
              </div>

              {loading ? (
                <div className="chart-placeholder">Loading chart...</div>
              ) : leads.length === 0 ? (
                <div className="chart-placeholder">
                  Add leads to see your analytics.
                </div>
              ) : (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusChartData}
                      margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#edf0f5"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#858da0", fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#858da0", fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="total"
                        name="Leads"
                        fill="#6558e8"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="panel ai-panel">
              <div className="panel-heading">
                <div>
                  <h3>AI Intelligence</h3>
                  <p>Insights generated for your leads</p>
                </div>
                <div className="ai-icon"><Sparkles size={19} /></div>
              </div>

              <div className="ai-summary">
                <SummaryRow
                  icon={<Zap size={17} />}
                  label="High priority"
                  description="Needs prompt attention"
                  value={loading ? "—" : stats.highPriority}
                  color="high"
                />
                <SummaryRow
                  icon={<CheckCircle2 size={17} />}
                  label="Qualified"
                  description="Potential opportunities"
                  value={loading ? "—" : stats.qualified}
                  color="qualified"
                />
                <SummaryRow
                  icon={<Clock3 size={17} />}
                  label="New leads"
                  description="Awaiting follow-up"
                  value={loading ? "—" :
                    leads.filter(lead => lead.status === "new").length}
                  color="new"
                />
              </div>

              <div className="ai-footer">
                <Sparkles size={15} />
                <span>Powered by Gemini AI</span>
              </div>
            </div>
          </section>

          {/* Advanced analytics powered by the existing lead data */}
          <AdvancedAnalytics leads={leads} />

          <section className="panel leads-panel" id="leads-section">
            <div className="leads-heading">
              <div>
                <h3>Recent Leads</h3>
                <p>View and manage your customer opportunities</p>
              </div>

              <button
                className="add-lead-button"
                onClick={() => {
                  setFormError("");
                  setFormSuccess("");
                  setShowForm(true);
                }}
              >
                <Plus size={16} />
                Add New Lead
              </button>
            </div>

            <div className="filters">
              <div className="search-box">
                <Search size={18} />
                <input
                  placeholder="Search by name, email or message..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />
                {search && (
                  <button
                    className="clear-search"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                {STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={event => setPriorityFilter(event.target.value)}
              >
                <option value="all">All priorities</option>
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>LEAD</th>
                    <th>AI QUALITY</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>DATE ADDED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="empty-state">
                      Loading your leads...
                    </td></tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr><td colSpan="6" className="empty-state">
                      No leads match your search or filters.
                    </td></tr>
                  ) : (
                    filteredLeads.map(lead => (
                      <tr key={lead.lead_id}>
                        <td>
                          <div className="lead-person">
                            <div className="lead-avatar">
                              {lead.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="lead-details">
                              <button
                                type="button"
                                onClick={() => setSelectedLeadId(lead.lead_id)}
                                title={`View ${lead.name}'s details`}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  font: "inherit",
                                  fontWeight: 700,
                                  color: "inherit",
                                  cursor: "pointer",
                                  textAlign: "left"
                                }}
                              >
                                {lead.name}
                              </button>
                              <span>{lead.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`quality-badge ${lead.ai_analysis?.lead_quality?.toLowerCase() || "unknown"}`}>
                            {lead.ai_analysis?.lead_quality || "N/A"}
                          </span>
                        </td>

                        <td>
                          <span className={`priority-badge ${lead.ai_analysis?.priority?.toLowerCase() || "unknown"}`}>
                            <span className="priority-dot"></span>
                            {lead.ai_analysis?.priority || "N/A"}
                          </span>
                        </td>

                        <td>
                          <select
                            className={`status-select ${lead.status}`}
                            value={lead.status}
                            disabled={updatingLead === lead.lead_id}
                            onChange={event =>
                              handleStatusChange(
                                lead.lead_id,
                                event.target.value
                              )
                            }
                          >
                            {STATUSES.map(status => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="date-cell">
                          {formatDate(lead.created_at)}
                        </td>

                        <td>
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(lead.lead_id)}
                            title="Delete lead"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing <strong>{filteredLeads.length}</strong> of{" "}
                <strong>{leads.length}</strong> leads
              </span>
              <span className="live-indicator">
                <span className="online-dot"></span>
                Live database data
              </span>
            </div>
          </section>

          <footer className="page-footer">
            <span>© 2026 LeadPilot · AI Lead Agent</span>
            <span>Built with React, FastAPI, MongoDB & Gemini AI</span>
          </footer>
        </div>
      </main>

      {/* Individual lead details panel */}
      {selectedLeadId && (
        <LeadDetails
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}

      {showForm && (
        <div
          className="modal-overlay"
          onClick={() => !submitting && setShowForm(false)}
        >
          <div
            className="lead-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-title-icon">
                  <Sparkles size={19} />
                </div>
                <h2>Add a new lead</h2>
                <p>Enter customer information for AI analysis.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form className="lead-form" onSubmit={handleCreateLead}>
              <label htmlFor="lead-name">Full name</label>
              <div className="form-input">
                <UserRound size={17} />
                <input
                  id="lead-name"
                  type="text"
                  placeholder="e.g. Ahmed Khan"
                  value={newLead.name}
                  onChange={event =>
                    setNewLead({ ...newLead, name: event.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>

              <label htmlFor="lead-email">Email address</label>
              <div className="form-input">
                <Mail size={17} />
                <input
                  id="lead-email"
                  type="email"
                  placeholder="e.g. ahmed@example.com"
                  value={newLead.email}
                  onChange={event =>
                    setNewLead({ ...newLead, email: event.target.value })
                  }
                  required
                />
              </div>

              <label htmlFor="lead-message">Message / Requirements</label>
              <div className="form-input textarea-input">
                <MessageSquare size={17} />
                <textarea
                  id="lead-message"
                  placeholder="Describe what the customer needs..."
                  value={newLead.message}
                  onChange={event =>
                    setNewLead({ ...newLead, message: event.target.value })
                  }
                  rows={4}
                  required
                  maxLength={3000}
                />
              </div>

              <div className="ai-notice">
                <Sparkles size={17} />
                <span>
                  Gemini AI will automatically analyze this lead and
                  generate its quality, priority, category and recommendations.
                </span>
              </div>

              {formError && (
                <div className="form-error">
                  <CircleAlert size={16} />
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="form-success">
                  <CheckCircle2 size={16} />
                  {formSuccess}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-lead-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="spin" size={17} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create Lead
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, description, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-description">
        <ArrowUpRight size={14} />
        {description}
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, description, value, color }) {
  return (
    <div className="ai-summary-row">
      <div className={`summary-icon ${color}`}>{icon}</div>
      <div className="summary-text">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <strong className="summary-number">{value}</strong>
    </div>
  );
}

export default App;
