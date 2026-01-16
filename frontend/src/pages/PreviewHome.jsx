import React from 'react';

const PreviewHome = () => {
  return (
    <main className="preview-phone">
      <div className="preview-home-container">
        <div className="preview-home-header">
          <p className="preview-home-subtitle">
            익명 채팅 · 평일 07:00~09:00 운영 · 주말/공휴일 제외
          </p>
        </div>

        <div className="preview-sort-tabs">
          <button className="preview-sort-tab preview-active">노선 순</button>
          <button className="preview-sort-tab">인기 순</button>
        </div>

        <div className="preview-subway-lines-list">
          <div className="preview-subway-line-item">
            <div className="preview-line-indicator preview-line-1">1</div>
            <div className="preview-line-info">
              <h3 className="preview-line-name">1호선</h3>
              <div className="preview-active-users-group">
                <div className="preview-pulse-dot"></div>
                <span className="preview-active-users-text">86명 참여중</span>
              </div>
            </div>
          </div>
          <div className="preview-subway-line-item">
            <div className="preview-line-indicator preview-line-2">2</div>
            <div className="preview-line-info">
              <h3 className="preview-line-name">2호선</h3>
              <div className="preview-active-users-group">
                <div className="preview-pulse-dot"></div>
                <span className="preview-active-users-text">128명 참여중</span>
              </div>
            </div>
          </div>
          <div className="preview-subway-line-item">
            <div className="preview-line-indicator preview-line-3">3</div>
            <div className="preview-line-info">
              <h3 className="preview-line-name">3호선</h3>
              <div className="preview-active-users-group">
                <span className="preview-inactive-users">대화 시작을 기다리는 중</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PreviewHome;
