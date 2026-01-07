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
    <div className="home-container">
      {/* 상단 헤더 바 (샘플 디자인) */}
      <div className="home-top-bar">
        <button className="icon-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="logo-text">출근길</span>
        <button className="icon-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
      </div>

      {/* 메인 헤더 */}
      <div className="home-header">
        <h1 className="home-title-sample">
          출퇴근하는<br/>
          <span className="highlight-text">노선 챗팅방</span>에<br/>
          참여하세요
        </h1>
        <p className="home-subtitle-sample">
          🔒 익명 · 매일 오전 9시에 초기화
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

      {/* 호선 리스트 */}
      <div className="subway-lines-list">
        {sortedLines.map((line) => (
          <div
            key={line.id}
            className="subway-line-card"
            onClick={() => handleLineClick(line.id)}
          >
            <div className="line-number-badge" style={{ backgroundColor: line.color }}>
              {line.line_number}
            </div>
            <div className="line-content">
              <h3 className="line-title">{line.line_name} <span className="line-subtitle">({line.line_number}호선)</span></h3>
              <p className="line-description">
                {line.line_number === '2' && '강남 · 역삼 · 삼성 · 서울대'}
                {line.line_number === '4' && '서울 · 동대문 · 사당 방면'}
                {line.line_number === '신분당' && '강남 · 양재 · 판교 · 정자'}
                {line.line_number === '9' && '신논현 · 여의도 · 김포공항'}
                {line.line_number === '5' && '광화문 · 종로 · 왕십리 방면'}
                {line.line_number === '1' && '서울역 · 종각 · 회기 방면'}
                {line.line_number === '3' && '압구정 · 옥수 · 신사 방면'}
                {line.line_number === '6' && '상수 · 합정 · 새절 방면'}
                {line.line_number === '7' && '논현 · 반포 · 강남구청 방면'}
                {line.line_number === '8' && '암사 · 천호 · 잠실 방면'}
              </p>
            </div>
            <div className="line-active-badge" style={{
              backgroundColor: line.activeUsers > 0 ? line.color : '#e9ecef',
              color: line.activeUsers > 0 ? 'white' : '#868e96'
            }}>
              {line.activeUsers > 0 ? `${line.activeUsers}` : '0'}
            </div>
          </div>
        ))}
      </div>

      {/* 플로팅 액션 버튼 */}
      <button className="fab">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  );
}

export default HomePage;
