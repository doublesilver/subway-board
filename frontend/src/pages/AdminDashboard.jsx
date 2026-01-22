import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { enableAdminMode, disableAdminMode } from '../utils/operatingHours';
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
      enableAdminMode(); // 관리자 모드 활성화 (24시간 접속 가능)
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>관리자 대시보드</h1>
        <p className="login-subtitle">접근 권한이 필요합니다</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            autoFocus
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? '확인 중...' : '로그인'}
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
  const navigate = useNavigate();
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
      setError('데이터를 불러오는데 실패했습니다');
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
    disableAdminMode(); // 관리자 모드 비활성화
    window.location.reload();
  };

  const handleTestService = () => {
    enableAdminMode(); // 관리자 모드 활성화 (비운영시간 접속 가능)
    navigate('/');
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
    return <div className="admin-loading">데이터를 불러오는 중...</div>;
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
        <h1>관리자 대시보드</h1>
        <div className="header-controls">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>최근 7일</option>
            <option value={14}>최근 14일</option>
            <option value={30}>최근 30일</option>
            <option value={90}>최근 90일</option>
          </select>
          <button onClick={loadData} className="refresh-btn">새로고침</button>
          <button onClick={handleTestService} className="test-btn">서비스 테스트</button>
          <button onClick={handleLogout} className="logout-btn">로그아웃</button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          전체 현황
        </button>
        <button className={activeTab === 'lines' ? 'active' : ''} onClick={() => setActiveTab('lines')}>
          호선별 통계
        </button>
        <button className={activeTab === 'hourly' ? 'active' : ''} onClick={() => setActiveTab('hourly')}>
          시간대별 분석
        </button>
        <button className={activeTab === 'query' ? 'active' : ''} onClick={() => setActiveTab('query')}>
          커스텀 쿼리
        </button>
      </nav>

      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Summary Cards */}
          <div className="summary-grid">
            <SummaryCard title="오늘 방문자 (DAU)" value={data?.summary?.dau} color="#00A84D" />
            <SummaryCard title="주간 방문자 (WAU)" value={data?.summary?.wau} color="#0052A4" />
            <SummaryCard title="월간 방문자 (MAU)" value={data?.summary?.mau} color="#996CAC" />
            <SummaryCard
              title="재방문율"
              value={`${data?.summary?.retentionRate || 0}%`}
              subValue="주간 대비"
              color="#EF7C1C"
            />
          </div>

          {/* Daily Trend Chart */}
          <div className="chart-card">
            <h3>일별 방문자 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.dailyTrend?.map(d => ({ ...d, date: formatDate(d.date) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="unique_visitors" stroke="#00A84D" name="순방문자" />
                <Line type="monotone" dataKey="total_visits" stroke="#0052A4" name="총방문" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Content Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <h4>전체 게시글</h4>
              <div className="stat-value">{data?.content?.totalPosts || 0}</div>
              <div className="stat-sub">오늘: {data?.content?.todayPosts || 0}개</div>
            </div>
            <div className="stat-card">
              <h4>전체 댓글</h4>
              <div className="stat-value">{data?.content?.totalComments || 0}</div>
              <div className="stat-sub">오늘: {data?.content?.todayComments || 0}개</div>
            </div>
            <div className="stat-card">
              <h4>피드백</h4>
              <div className="stat-value">{data?.feedback?.total || 0}</div>
              <div className="stat-sub">오늘: {data?.feedback?.today || 0}건</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lines' && (
        <div className="tab-content">
          {/* Line Stats Bar Chart */}
          <div className="chart-card">
            <h3>호선별 방문 현황</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.lineStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="line_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_visits" name="방문수">
                  {data?.lineStats?.map((entry, index) => (
                    <Cell key={index} fill={SUBWAY_COLORS[entry.line_number] || '#666'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Today by Line */}
          <div className="chart-card">
            <h3>오늘의 호선별 현황</h3>
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
            <h3>호선별 방문 비율</h3>
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
            <h3>시간대별 방문 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}시`} />
                <YAxis />
                <Tooltip labelFormatter={(h) => `${h}시`} />
                <Bar dataKey="total_visits" fill="#00A84D" name="방문수" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Table */}
          <div className="chart-card">
            <h3>시간대별 상세</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>방문수</th>
                  <th>비율</th>
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
            <h3>커스텀 SQL 쿼리 (SELECT만 가능)</h3>
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
              {queryLoading ? '실행 중...' : '쿼리 실행'}
            </button>

            {queryResult && (
              <div className="query-result">
                {queryResult.error ? (
                  <div className="query-error">{queryResult.error}</div>
                ) : (
                  <>
                    <div className="query-info">
                      결과: {queryResult.rowCount}행 | 컬럼: {queryResult.fields?.join(', ')}
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
            <h3>자주 사용하는 쿼리</h3>
            <div className="preset-btns">
              <button onClick={() => setCustomQuery('SELECT * FROM unique_visitors ORDER BY created_at DESC LIMIT 50')}>
                최근 방문자
              </button>
              <button onClick={() => setCustomQuery('SELECT line_name, SUM(visit_count) as total FROM daily_visits dv JOIN subway_lines sl ON dv.subway_line_id = sl.id GROUP BY line_name ORDER BY total DESC')}>
                호선별 총합
              </button>
              <button onClick={() => setCustomQuery('SELECT visit_date, COUNT(*) as uv FROM unique_visitors GROUP BY visit_date ORDER BY visit_date DESC LIMIT 30')}>
                일별 순방문자
              </button>
              <button onClick={() => setCustomQuery('SELECT visit_hour, SUM(visit_count) as visits FROM hourly_visits GROUP BY visit_hour ORDER BY visit_hour')}>
                시간대별 총합
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="admin-footer">
        데이터 생성: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString('ko-KR') : '-'}
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
