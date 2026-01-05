import { X, UserCircle, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (type: 'anonymous' | 'kakao') => void;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl p-8"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100/50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Content */}
              <div className="text-center mb-8">
                <h2 className="text-gray-900 mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  대화에 참여하세요
                </h2>
                <p className="text-gray-600">
                  출퇴근 노선의 익명 채팅에 참여하여<br />
                  소통하고 정보를 나누세요
                </p>
              </div>
              
              {/* Login Buttons */}
              <div className="space-y-3">
                {/* Anonymous Login */}
                <button
                  onClick={() => onLogin('anonymous')}
                  className="w-full py-4 px-6 rounded-2xl bg-white/70 backdrop-blur-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-3 group"
                >
                  <UserCircle className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-900">익명으로 시작하기</span>
                </button>
                
                {/* Kakao Login */}
                <button
                  onClick={() => onLogin('kakao')}
                  className="w-full py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #FEE500 0%, #FFEB3B 100%)",
                  }}
                >
                  <MessageCircle className="w-5 h-5 text-gray-900 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-900">카카오로 시작하기</span>
                </button>
              </div>
              
              {/* Info Text */}
              <p className="text-center text-sm text-gray-500 mt-6">
                🔒 익명 · ⏰ 매일 오전 9시 초기화
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
