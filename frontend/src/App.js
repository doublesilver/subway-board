import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import LinePage from './pages/LinePage';
import PostPage from './pages/PostPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/line/:lineId" element={<LinePage />} />
              <Route path="/post/:postId" element={<PostPage />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="container">
        <h1 onClick={() => navigate('/')}>출퇴근길 게시판</h1>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '2rem 0',
      color: '#999',
      fontSize: '0.9rem'
    }}>
      <p>모든 게시글은 24시간 후 자동 삭제됩니다.</p>
      <p>익명으로 가볍게 이야기를 나눠보세요.</p>
    </footer>
  );
}

export default App;
