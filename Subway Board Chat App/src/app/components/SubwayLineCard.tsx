import { Users } from "lucide-react";
import { motion } from "motion/react";

interface SubwayLineCardProps {
  id: number;
  name: string;
  color: string;
  activeUsers: number;
  onClick: () => void;
}

export function SubwayLineCard({ id, name, color, activeUsers, onClick }: SubwayLineCardProps) {
  return (
    <motion.button
      className="w-full p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300"
      style={{
        boxShadow: `0 8px 32px rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.15)`,
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        backgroundColor: "rgba(255, 255, 255, 0.85)"
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Line Number Badge */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: color }}
        >
          <span className="text-white text-xl font-bold">{id}</span>
        </div>
        
        {/* Line Info */}
        <div className="flex-1 text-left">
          <h3 className="text-gray-900 mb-1">{name}</h3>
          <div className="flex items-center gap-2 text-gray-600">
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Users className="w-4 h-4" />
              <span className="text-sm">{activeUsers}명 참여중</span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
