import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subwayLineAPI } from '../services/api';

// 호선 데이터 캐싱
let cachedLines = null;

function HomePage() {
  const [lines, setLines] = useState(cachedLines || []);
  const [loading, setLoading] = useState(!cachedLines);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!cachedLines) {
      fetchSubwayLines();
    }
  }, []);

  const fetchSubwayLines = async () => {
    try {
      setLoading(true);
      const response = await subwayLineAPI.getAll();
      setLines(response.data);
      cachedLines = response.data; // 캐시 저장
    } catch (err) {
      setError('호선 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLineClick = (lineId) => {
    navigate(`/line/${lineId}`);
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <h2 style={{
        marginBottom: '2rem',
        color: '#333',
        fontSize: '1.8rem',
        fontWeight: '700'
      }}>
        출퇴근 호선을 선택해주세요
      </h2>
      <div className="subway-lines-grid">
        {lines.map((line) => (
          <div
            key={line.id}
            className="subway-line-card"
            style={{ color: line.color }}
            onClick={() => handleLineClick(line.id)}
          >
            <h3>{line.line_name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
