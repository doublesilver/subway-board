import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { SubwayLineCard } from "./components/SubwayLineCard";
import { LoginModal } from "./components/LoginModal";
import { ChatRoom } from "./components/ChatRoom";
import { motion, AnimatePresence } from "motion/react";

interface SubwayLine {
  id: number;
  name: string;
  color: string;
  activeUsers: number;
}

const subwayLines: SubwayLine[] = [
  { id: 1, name: "1호선", color: "#0052A4", activeUsers: 127 },
  { id: 2, name: "2호선", color: "#009D3E", activeUsers: 243 },
  { id: 3, name: "3호선", color: "#EF7C1C", activeUsers: 89 },
  { id: 4, name: "4호선", color: "#00A5DE", activeUsers: 156 },
  { id: 5, name: "5호선", color: "#996CAC", activeUsers: 98 },
  { id: 6, name: "6호선", color: "#CD7C2F", activeUsers: 67 },
  { id: 7, name: "7호선", color: "#747F00", activeUsers: 134 },
  { id: 8, name: "8호선", color: "#E6186C", activeUsers: 45 },
  { id: 9, name: "9호선", color: "#BDB092", activeUsers: 112 },
];

export default function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; type: 'anonymous' | 'kakao' } | null>(null);
  const [selectedLine, setSelectedLine] = useState<SubwayLine | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogin = (type: 'anonymous' | 'kakao') => {
    const username = type === 'anonymous' 
      ? `익명의 ${['토끼', '펭귄', '고양이', '강아지', '판다'][Math.floor(Math.random() * 5)]}`
      : '카카오사용자';
    setUser({ name: username, type });
    setIsLoginModalOpen(false);
  };
  
  const handleLogout = () => {
    setUser(null);
    setShowUserMenu(false);
  };
  
  const handleLineClick = (line: SubwayLine) => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      setSelectedLine(line);
    }
  };
  
  if (selectedLine && user) {
    return (
      <ChatRoom
        lineId={selectedLine.id}
        lineName={selectedLine.name}
        lineColor={selectedLine.color}
        activeUsers={selectedLine.activeUsers}
        onBack={() => setSelectedLine(null)}
        currentUser={user.name}
      />
    );
  }
  
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Subway Board
          </h1>
          <p className="text-gray-700 mb-2">
            출퇴근하는 노선의 채팅방에 참여하세요
          </p>
          <p className="text-sm text-gray-600">
            🔒 익명 · ⏰ 매일 오전 9시 초기화
          </p>
        </motion.div>
        
        {/* User Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end mb-8"
        >
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <span className="text-gray-900">{user.name}</span>
                <span className="text-sm text-gray-600">({user.type === 'anonymous' ? '익명' : '카카오'})</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100/50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-gray-700" />
                      <span className="text-gray-900">로그아웃</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                color: "white",
              }}
            >
              로그인
            </button>
          )}
        </motion.div>
        
        {/* Subway Lines Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {subwayLines.map((line, index) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SubwayLineCard
                id={line.id}
                name={line.name}
                color={line.color}
                activeUsers={line.activeUsers}
                onClick={() => handleLineClick(line)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
