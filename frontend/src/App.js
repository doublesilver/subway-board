import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import LinePage from './pages/LinePage';
import KakaoCallback from './pages/KakaoCallback';
import { AuthProvider } from './contexts/AuthContext';
import AuthButton from './components/AuthButton';
import AnimatedBackground from './components/AnimatedBackground';

function App() {
  return (
    <AuthProvider>
      <AnimatedBackground />
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/auth/kakao/success" element={<KakaoCallback />} />
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/line/:lineId" element={<LinePage />} />
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

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1 onClick={() => navigate('/')}>출퇴근길 익명 채팅</h1>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container">
        <p>모든 메시지는 매일 오전 9시에 자동 삭제됩니다.</p>
        <p>익명으로 가볍게 출퇴근길 이야기를 나눠보세요.</p>
      </div>
    </footer>
  );
}

export default App;
