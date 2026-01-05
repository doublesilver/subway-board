import { ArrowLeft, Users, Send } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
  isMine: boolean;
}

interface ChatRoomProps {
  lineId: number;
  lineName: string;
  lineColor: string;
  activeUsers: number;
  onBack: () => void;
  currentUser: string;
}

export function ChatRoom({ lineId, lineName, lineColor, activeUsers, onBack, currentUser }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      userId: "user1",
      username: "익명의 토끼",
      text: "오늘 지하철 많이 밀리네요",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      isMine: false,
    },
    {
      id: "2",
      userId: "user2",
      username: "익명의 펭귄",
      text: "사고 있었나봐요 ㅠㅠ",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      isMine: false,
    },
    {
      id: "3",
      userId: "me",
      username: currentUser,
      text: "빨리 복구되면 좋겠네요",
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      isMine: true,
    },
  ]);
  
  const [inputText, setInputText] = useState("");
  
  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        userId: "me",
        username: currentUser,
        text: inputText,
        timestamp: new Date(),
        isMine: true,
      };
      setMessages([...messages, newMessage]);
      setInputText("");
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-2xl border-b border-white/50 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100/50 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: lineColor }}
          >
            <span className="text-white font-bold">{lineId}</span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-gray-900">{lineName}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <Users className="w-4 h-4" />
              <span>{activeUsers}명</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Date Divider */}
          <div className="flex items-center justify-center my-6">
            <div className="px-4 py-1.5 rounded-full bg-gray-200/80 backdrop-blur-xl text-sm text-gray-600">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${message.isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!message.isMine && (
                  <span className="text-sm text-gray-600 px-2">{message.username}</span>
                )}
                <div className="flex items-end gap-2">
                  {message.isMine && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTime(message.timestamp)}
                    </span>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.isMine
                        ? 'rounded-br-md shadow-lg'
                        : 'rounded-bl-md bg-white/90 backdrop-blur-xl border border-white/50 shadow-md'
                    }`}
                    style={
                      message.isMine
                        ? {
                            background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                            color: "white",
                          }
                        : {}
                    }
                  >
                    <p className={message.isMine ? 'text-white' : 'text-gray-900'}>
                      {message.text}
                    </p>
                  </div>
                  {!message.isMine && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTime(message.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Input */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-2xl border-t border-white/50 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-5 py-3 rounded-full bg-gray-100 border-none outline-none focus:bg-gray-200 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={
                inputText.trim()
                  ? {
                      background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                    }
                  : { backgroundColor: "#e5e7eb" }
              }
            >
              <Send className={`w-5 h-5 ${inputText.trim() ? 'text-white' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
