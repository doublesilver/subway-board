import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';

const SUBWAY_COLORS = {
  '1': '#0052A4',
  '2': '#00A84D',
  '3': '#EF7C1C',
  '4': '#00A5DE',
  '5': '#996CAC',
  '6': '#CD7C2F',
  '7': '#747F00',
  '8': '#E6186C',
  '9': '#BDB092',
};

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await dashboardAPI.login(password);
      localStorage.setItem('admin_token', response.data.token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>Admin Dashboard</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subValue, color }) {
  return (
    <div className="summary-card" style={{ borderLeftColor: color }}>
      <div className="summary-title">{title}</div>
      <div className="summary-value">{value?.toLocaleString() || 0}</div>
      {subValue && <div className="summary-sub">{subValue}</div>}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');
  const [customQuery, setCustomQuery] = useState('SELECT * FROM unique_visitors LIMIT 10');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getData(days);
      setData(response.data);
      setError('');
    } catch (err) {
      setError('데이터 로드 실패');
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.reload();
  };

  const executeCustomQuery = async () => {
    setQueryLoading(true);
    try {
      const response = await dashboardAPI.executeQuery(customQuery);
      setQueryResult(response.data);
    } catch (err) {
      setQueryResult({ error: err.response?.data?.error || err.message });
    } finally {
      setQueryLoading(false);
    }
  };

  if (loading && !data) {
    return <div className="admin-loading">Loading...</div>;
  }

  if (error && !data) {
    return <div className="admin-error">{error}</div>;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Dashboard</h1>
        <div className="header-controls">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>7일</option>
            <option value={14}>14일</option>
            <option value={30}>30일</option>
            <option value={90}>90일</option>
          </select>
          <button onClick={loadData} className="refresh-btn">Refresh</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={activeTab === 'lines' ? 'active' : ''} onClick={() => setActiveTab('lines')}>
          Lines
        </button>
        <button className={activeTab === 'hourly' ? 'active' : ''} onClick={() => setActiveTab('hourly')}>
          Hourly
        </button>
        <button className={activeTab === 'query' ? 'active' : ''} onClick={() => setActiveTab('query')}>
          Query
        </button>
      </nav>

      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Summary Cards */}
          <div className="summary-grid">
            <SummaryCard title="DAU (Today)" value={data?.summary?.dau} color="#00A84D" />
            <SummaryCard title="WAU (7days)" value={data?.summary?.wau} color="#0052A4" />
            <SummaryCard title="MAU (30days)" value={data?.summary?.mau} color="#996CAC" />
            <SummaryCard
              title="Retention"
              value={`${data?.summary?.retentionRate || 0}%`}
              subValue="Week over Week"
              color="#EF7C1C"
            />
          </div>

          {/* Daily Trend Chart */}
          <div className="chart-card">
            <h3>Daily Visitors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.dailyTrend?.map(d => ({ ...d, date: formatDate(d.date) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="unique_visitors" stroke="#00A84D" name="UV" />
                <Line type="monotone" dataKey="total_visits" stroke="#0052A4" name="PV" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Content Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <h4>Posts</h4>
              <div className="stat-value">{data?.content?.totalPosts || 0}</div>
              <div className="stat-sub">Today: {data?.content?.todayPosts || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Comments</h4>
              <div className="stat-value">{data?.content?.totalComments || 0}</div>
              <div className="stat-sub">Today: {data?.content?.todayComments || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Feedback</h4>
              <div className="stat-value">{data?.feedback?.total || 0}</div>
              <div className="stat-sub">Today: {data?.feedback?.today || 0}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lines' && (
        <div className="tab-content">
          {/* Line Stats Bar Chart */}
          <div className="chart-card">
            <h3>Visits by Line</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.lineStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="line_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_visits" name="Visits">
                  {data?.lineStats?.map((entry, index) => (
                    <Cell key={index} fill={SUBWAY_COLORS[entry.line_number] || '#666'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Today by Line */}
          <div className="chart-card">
            <h3>Today by Line</h3>
            <div className="line-grid">
              {data?.todayByLine?.map((line) => (
                <div
                  key={line.line_number}
                  className="line-card"
                  style={{ borderColor: line.color }}
                >
                  <div className="line-name" style={{ color: line.color }}>
                    {line.line_name}
                  </div>
                  <div className="line-value">{line.today_visits}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="chart-card">
            <h3>Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.lineStats?.filter(l => l.total_visits > 0)}
                  dataKey="total_visits"
                  nameKey="line_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data?.lineStats?.map((entry, index) => (
                    <Cell key={index} fill={SUBWAY_COLORS[entry.line_number] || '#666'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'hourly' && (
        <div className="tab-content">
          {/* Hourly Distribution */}
          <div className="chart-card">
            <h3>Hourly Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}시`} />
                <YAxis />
                <Tooltip labelFormatter={(h) => `${h}시`} />
                <Bar dataKey="total_visits" fill="#00A84D" name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Table */}
          <div className="chart-card">
            <h3>Hourly Data</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Visits</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {data?.hourlyStats?.map((row) => {
                  const total = data.hourlyStats.reduce((sum, r) => sum + parseInt(r.total_visits), 0);
                  const percent = total > 0 ? ((parseInt(row.total_visits) / total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={row.hour}>
                      <td>{row.hour}:00</td>
                      <td>{parseInt(row.total_visits).toLocaleString()}</td>
                      <td>{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'query' && (
        <div className="tab-content">
          <div className="chart-card">
            <h3>Custom SQL Query (SELECT only)</h3>
            <textarea
              className="query-input"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              rows={4}
              placeholder="SELECT * FROM unique_visitors LIMIT 10"
            />
            <button
              onClick={executeCustomQuery}
              disabled={queryLoading}
              className="execute-btn"
            >
              {queryLoading ? 'Executing...' : 'Execute'}
            </button>

            {queryResult && (
              <div className="query-result">
                {queryResult.error ? (
                  <div className="query-error">{queryResult.error}</div>
                ) : (
                  <>
                    <div className="query-info">
                      Rows: {queryResult.rowCount} | Fields: {queryResult.fields?.join(', ')}
                    </div>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {queryResult.fields?.map((f) => (
                              <th key={f}>{f}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.data?.slice(0, 100).map((row, i) => (
                            <tr key={i}>
                              {queryResult.fields?.map((f) => (
                                <td key={f}>{String(row[f] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Preset Queries */}
          <div className="chart-card">
            <h3>Preset Queries</h3>
            <div className="preset-btns">
              <button onClick={() => setCustomQuery('SELECT * FROM unique_visitors ORDER BY created_at DESC LIMIT 50')}>
                Recent Visitors
              </button>
              <button onClick={() => setCustomQuery('SELECT line_name, SUM(visit_count) as total FROM daily_visits dv JOIN subway_lines sl ON dv.subway_line_id = sl.id GROUP BY line_name ORDER BY total DESC')}>
                Line Totals
              </button>
              <button onClick={() => setCustomQuery('SELECT visit_date, COUNT(*) as uv FROM unique_visitors GROUP BY visit_date ORDER BY visit_date DESC LIMIT 30')}>
                Daily UV
              </button>
              <button onClick={() => setCustomQuery('SELECT visit_hour, SUM(visit_count) as visits FROM hourly_visits GROUP BY visit_hour ORDER BY visit_hour')}>
                Hourly Total
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="admin-footer">
        Generated at: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : '-'}
      </footer>
    </div>
  );
}

function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('admin_token'));

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return <Dashboard />;
}

export default AdminDashboard;
