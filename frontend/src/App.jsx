import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import LinePage from './pages/LinePage';
import PreviewHome from './pages/PreviewHome';
import PreviewChat from './pages/PreviewChat';
import AdminDashboard from './pages/AdminDashboard';
import AnimatedBackground from './components/AnimatedBackground';
import FeedbackModal from './components/FeedbackModal';
import { AuthProvider } from './contexts/AuthContext';

import { checkIsOperatingHours } from './utils/operatingHours';
import ClosedAlertModal from './components/ClosedAlertModal';

function App() {
  // 앱 실행 시 최초 1회 운영 시간 체크
  const isOperatingHours = checkIsOperatingHours();
  const isPreview = typeof window !== 'undefined' && window.location.pathname.startsWith('/preview');
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // Admin 페이지는 별도 처리 (운영시간 체크 X, 배경 X)
  if (isAdmin) {
    return (
      <Router>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    );
  }

  return (
    <AuthProvider>
      <AnimatedBackground />
      <div className="app-shell">
        {!isOperatingHours && !isPreview ? (
          <ClosedAlertModal />
        ) : (
          <Router>
            <AppContent />
          </Router>
        )}
      </div>
    </AuthProvider>
  );
}

function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/line/:lineId" element={<LinePage />} />
        <Route path="/preview" element={<PreviewHome />} />
        <Route path="/preview/chat" element={<PreviewChat />} />
      </Routes>
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Header() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);

  const handleShare = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage('링크가 복사되었습니다!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  const handleFeedbackClose = (success) => {
    setShowFeedbackModal(false);
    if (success) {
      setToastMessage('피드백이 전송되었습니다!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1 onClick={() => navigate('/')}>
            어차피 같은 방향,<br />
            어쩌면 같은 호선
          </h1>
          <div className="header-buttons">
            <button className="feedback-button-icon" onClick={() => setShowFeedbackModal(true)} title="피드백 보내기">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <button className="share-button" onClick={handleShare} title="링크 공유">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {showToast && (
        <div className="toast-message">
          {toastMessage}
        </div>
      )}
      {showFeedbackModal && <FeedbackModal onClose={handleFeedbackClose} />}
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      Copyright 2026. gagisiro, Co., Ltd. All rights reserved.
    </footer>
  );
}

export default App;
