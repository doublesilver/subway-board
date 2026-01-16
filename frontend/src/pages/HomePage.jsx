import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subwayLineAPI } from '../services/api';
import { initSocket, onLineUsersUpdate, offLineUsersUpdate } from '../utils/socket';
import ClosedAlertModal from '../components/ClosedAlertModal';
import { checkIsOperatingHours } from '../utils/operatingHours';

// 이용량 순서 (실제 서울 지하철 이용 통계 기반)
const usageOrder = [2, 5, 7, 3, 4, 6, 1, 8, 9];

function HomePage() {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState('line');
  const [isOperatingHours, setIsOperatingHours] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 스크롤을 최상단으로 이동
    window.scrollTo(0, 0);

    // 운영 시간 체크
    const checkTime = () => {
      const isOpen = checkIsOperatingHours();
      setIsOperatingHours(isOpen);
    };
    checkTime();
    // 1분마다 체크 (홈 화면에 오래 켜두는 경우 대비)
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // WebSocket 초기화
    initSocket();

    // 최초 1회 호선 목록 로드
    fetchSubwayLines();

    // WebSocket으로 실시간 참여자 수 업데이트
    const handleLineUsersUpdate = (data) => {
      setLines(prevLines =>
        prevLines.map(line =>
          line.id === data.lineId
            ? { ...line, activeUsers: data.count }
            : line
        )
      );
    };

    onLineUsersUpdate(handleLineUsersUpdate);

    return () => {
      offLineUsersUpdate(handleLineUsersUpdate);
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

  const sortedLines = React.useMemo(() => {
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
  }, [lines, sortType]);

  const handleLineClick = (lineId) => {
    // 자동 익명 로그인이 이루어지므로 바로 입장
    navigate(`/line/${lineId}`);
  };

  // 로딩 중이거나 에러 발생 시 빈 페이지 표시 (헤더+콘텐츠 통일)
  if (loading || error) return <div className="home-container"></div>;



  return (
    <div className="home-container">
      {/* 운영 시간이 아닐 때 모달 표시 */}
      {!isOperatingHours && <ClosedAlertModal />}

      {/* 메인 헤더 (Centered & Gradient) */}
      <div className="home-header">
        <p className="home-subtitle">
          🔒 익명 채팅 · ⏰ 평일 오전 7–9시 · 🚫 주말·공휴일 제외
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
              <div className="active-users-group">
                {line.activeUsers > 0 && <div className="pulse-dot"></div>}
                <span className={line.activeUsers > 0 ? "active-users-text" : "inactive-users"}>
                  {line.activeUsers > 0 ? `${line.activeUsers}명 참여중` : '대화가 시작되길 기다리고 있어요'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
