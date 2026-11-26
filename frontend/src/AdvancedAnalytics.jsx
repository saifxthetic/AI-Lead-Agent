
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import "./AdvancedAnalytics.css";

function AdvancedAnalytics({ leads = [] }) {
  const total = leads.length;

  const converted = leads.filter(
    lead => lead.status === "converted"
  ).length;

  const conversionRate = total > 0
    ? ((converted / total) * 100).toFixed(1)
    : 0;

  const qualityData = ["High", "Medium", "Low"].map(quality => ({
    name: quality,
    value: leads.filter(
      lead => lead.ai_analysis?.lead_quality?.toLowerCase() === quality.toLowerCase()
    ).length
  }));

  const priorityData = ["High", "Medium", "Low"].map(priority => ({
    name: priority,
    total: leads.filter(
      lead => lead.ai_analysis?.priority?.toLowerCase() === priority.toLowerCase()
    ).length
  }));

  const categoryCounts = leads.reduce((counts, lead) => {
    const category = lead.ai_analysis?.category || "Uncategorized";

    counts[category] = (counts[category] || 0) + 1;

    return counts;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(
    ([name, value]) => ({ name, value })
  );

  const COLORS = ["#6558e8", "#20a779", "#f0a43a"];

  return (
    <section className="advanced-analytics">
      <div className="analytics-title">
        <div>
          <h2>Advanced Analytics</h2>
          <p>Detailed performance and AI-generated lead insights</p>
        </div>
      </div>

      <div className="analytics-metrics">
        <div className="analytics-metric-card">
          <span>Conversion Rate</span>
          <strong>{conversionRate}%</strong>
          <small>{converted} converted out of {total} leads</small>
        </div>

        <div className="analytics-metric-card">
          <span>High Quality Leads</span>
          <strong>{qualityData[0].value}</strong>
          <small>Identified by Gemini AI</small>
        </div>

        <div className="analytics-metric-card">
          <span>High Priority Leads</span>
          <strong>{priorityData[0].total}</strong>
          <small>Require attention</small>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="analytics-chart-card">
          <h3>Lead Quality Distribution</h3>

          {total === 0 ? (
            <p className="analytics-empty">No lead data available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={qualityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label
                >
                  {qualityData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="analytics-chart-card">
          <h3>Lead Priority Distribution</h3>

          {total === 0 ? (
            <p className="analytics-empty">No lead data available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="total"
                  name="Leads"
                  fill="#6558e8"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="analytics-chart-card category-chart">
          <h3>Lead Categories</h3>

          {categoryData.length === 0 ? (
            <p className="analytics-empty">No categories available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={65}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  name="Leads"
                  fill="#20a779"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdvancedAnalytics;
