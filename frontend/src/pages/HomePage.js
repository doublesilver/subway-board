import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subwayLineAPI } from '../services/api';

// 이용량 순서 (실제 서울 지하철 이용 통계 기반)
const usageOrder = [2, 5, 7, 3, 4, 6, 1, 8, 9];

function HomePage() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState('line'); // 'line', 'active', 'usage'
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubwayLines();

    // 3초마다 갱신 (백그라운드 시에는 중지)
    let interval = setInterval(() => {
      if (!document.hidden) {
        fetchSubwayLines();
      }
    }, 3000);

    // Page Visibility API - 포그라운드 복귀 시 즉시 갱신
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSubwayLines();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchSubwayLines = async () => {
    try {
      const response = await subwayLineAPI.getAll();
      setLines(response.data);
      if (loading) setLoading(false);
    } catch (err) {
      setError('호선 목록을 불러오는데 실패했습니다.');
      console.error(err);
      setLoading(false);
    }
  };

  const getSortedLines = () => {
    const linesCopy = [...lines];

    switch (sortType) {
      case 'active':
        // 접속자 수 많은 순
        return linesCopy.sort((a, b) => (b.activeUsers || 0) - (a.activeUsers || 0));

      case 'usage':
        // 이용량 순
        return linesCopy.sort((a, b) => {
          const aIndex = usageOrder.indexOf(a.id);
          const bIndex = usageOrder.indexOf(b.id);
          return aIndex - bIndex;
        });

      case 'line':
      default:
        // 호선 번호 순
        return linesCopy.sort((a, b) => a.id - b.id);
    }
  };

  const handleLineClick = (lineId) => {
    navigate(`/line/${lineId}`);
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const sortedLines = getSortedLines();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{
          margin: 0,
          color: '#333',
          fontSize: '1.8rem',
          fontWeight: '700'
        }}>
          출퇴근 호선을 선택해주세요
        </h2>
        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
          className="sort-select"
        >
          <option value="line">호선 순</option>
          <option value="active">접속자 순</option>
          <option value="usage">이용량 순</option>
        </select>
      </div>

      <div className="subway-lines-list">
        {sortedLines.map((line) => (
          <div
            key={line.id}
            className="subway-line-item"
            onClick={() => handleLineClick(line.id)}
          >
            <div className="line-indicator" style={{ backgroundColor: line.color }}></div>
            <div className="line-info">
              <h3 className="line-name">{line.line_name}</h3>
              <span className="active-users">
                {line.activeUsers > 0 && `👤 ${line.activeUsers}명`}
              </span>
            </div>
            <div className="line-arrow">›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
