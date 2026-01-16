import React from 'react';

const PreviewChat = () => {
  return (
    <main className="preview-phone">
      <header className="preview-chat-header">
        <button className="preview-chat-back-btn">&#8592;</button>
        <div className="preview-chat-line-badge">2</div>
        <div className="preview-chat-title-group">
          <h1 className="preview-chat-title">2호선</h1>
          <div className="preview-chat-meta">
            <div className="preview-pulse-dot-small"></div>
            <span>128명 참여중</span>
            <span>· 성실한 출근러377</span>
          </div>
        </div>
      </header>

      <div className="preview-chat-messages">
        <div className="preview-welcome-notice">
          성실한 출근러377 님이 들어왔어요. 이 방을 나가면 이전 대화는 다시 볼 수 없어요.
        </div>
        <div className="preview-date-divider"><span>2026년 1월 16일</span></div>
        <div className="preview-message-wrapper">
          <div className="preview-message-content">
            <div className="preview-message-nickname">빠른 통근러214</div>
            <div className="preview-message-text">오늘 2호선 사람 많네요.</div>
            <div className="preview-message-meta">오전 8:01</div>
          </div>
        </div>
        <div className="preview-message-wrapper preview-my-message">
          <div className="preview-message-content">
            <div className="preview-message-nickname">나</div>
            <div className="preview-message-text">다들 조심하세요.</div>
            <div className="preview-message-meta">오전 8:02</div>
          </div>
        </div>
      </div>

      <div className="preview-chat-composer">
        <div className="preview-reply-bar">
          <span>답장: 오늘 2호선 사람 많네요.</span>
          <span>닫기</span>
        </div>
        <form className="preview-composer-form">
          <input className="preview-composer-input" placeholder="메시지 보내기" />
          <button className="preview-composer-send">→</button>
        </form>
      </div>
    </main>
  );
};

export default PreviewChat;
