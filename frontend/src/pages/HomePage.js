import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subwayLineAPI } from '../services/api';

// 이용량 순서 (실제 서울 지하철 이용 통계 기반)
const usageOrder = [2, 5, 7, 3, 4, 6, 1, 8, 9];

function HomePage() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState('line');
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
    // 자동 익명 로그인이 이루어지므로 바로 입장
    navigate(`/line/${lineId}`);
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const sortedLines = getSortedLines();

  return (
    <div>
      {/* 메인 헤더 (Centered & Gradient) */}
      <div className="home-header">
        <p className="home-subtitle">
          🔒 익명 · ⏰ 매일 오전 9시 초기화
        </p>
      </div>

      {/* 정렬 탭 */}
      <div className="sort-tabs">
        <button
          className={`sort-tab ${sortType === 'line' ? 'active' : ''}`}
          onClick={() => setSortType('line')}
        >
          호선 순
        </button>
        <button
          className={`sort-tab ${sortType === 'active' || sortType === 'usage' ? 'active' : ''}`}
          onClick={() => setSortType(sortType === 'usage' ? 'active' : 'usage')}
        >
          인기 순
        </button>
      </div>

      <div className="subway-lines-list">
        {sortedLines.map((line) => (
          <div
            key={line.id}
            className="subway-line-item"
            style={{
              '--line-color': line.color,
              boxShadow: `0 8px 32px rgba(${parseInt(line.color.slice(1, 3), 16)}, ${parseInt(line.color.slice(3, 5), 16)}, ${parseInt(line.color.slice(5, 7), 16)}, 0.15)`
            }}
            onClick={() => handleLineClick(line.id)}
          >
            <div className="line-indicator" style={{ backgroundColor: line.color }}>
              {line.line_number}
            </div>
            <div className="line-info">
              <h3 className="line-name">{line.line_name}</h3>
              {line.activeUsers > 0 ? (
                <div className="active-users-group">
                  <div className="pulse-dot"></div>
                  <span className="active-users-text">{line.activeUsers}명 참여중</span>
                </div>
              ) : (
                <span className="inactive-users">대화 시작하기</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
