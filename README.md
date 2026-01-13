# 출퇴근길 익명 게시판 🚇

> **"오늘 아침, 당신의 출근길은 어땠나요?"**
>
> 같은 호선, 같은 방향으로 향하는 수많은 사람들. 하지만 서로의 표정은 읽을 수 없어 더욱 삭막한 아침.
> 이 프로젝트는 **'가장 붐비는 시간, 가장 외로운 사람들'**을 연결하기 위해 시작된 **디지털 대나무 숲**입니다.

[![Deploy Status](https://img.shields.io/badge/status-live-brightgreen)](https://subway-board.vercel.app)
[![Tech Stack](https://img.shields.io/badge/stack-React_19_%7C_Node.js_18_%7C_Socket.io-blue)](https://subway-board.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

🔗 **Live Demo**: [https://subway-board.vercel.app](https://subway-board.vercel.app) (평일 07:00 ~ 09:00 운영)

---

## 👨‍💻 Developer's Journey (Why & How)

단순한 익명 게시판은 많습니다. 하지만 **'시간'과 '공간'의 맥락을 공유하는 커뮤니티**는 드뭅니다.
저는 이 프로젝트를 통해 기술이 어떻게 사회적 고립감을 해소할 수 있는지, 그리고 **제약(Constraint)**이 어떻게 사용자 경험을 극대화할 수 있는지를 실험했습니다.

### 💡 "왜 평일 아침 7~9시에만 열릴까요?"
사용자 밀집도가 가장 높은 시간에만 서비스를 운영함으로써 두 가지 효과를 노렸습니다.
1.  **실시간성 극대화**: 짧은 시간에 사용자가 몰리며 '지금 내 옆사람도 보고 있을까?' 하는 실재감을 부여합니다.
2.  **디지털 디톡스**: 출근 시간이 지나면 앱은 문을 닫습니다. 업무 시간에는 일상으로 돌아가라는 메시지입니다.

### 🛠️ Technical Challenges & Solutions

#### 1. Global Access Guard: "깜빡임 없는 완벽한 차단"
`App.js` 로딩 시점에 즉시 운영 시간을 검증하여, 비운영시간에는 **렌더링 트리 자체를 교체**하는 전략을 택했습니다.
- **Problem**: 기존에는 페이지 진입 후 리다이렉트하는 방식이라 찰나의 순간 헤더나 푸터가 노출되는 'Flash of Unstyled Content' 문제가 있었습니다.
- **Solution**: 라우터 진입 전 `isOperatingHours` 상태를 체크하여, `false`일 경우 `ClosedAlertModal` 외의 어떤 컴포넌트도 마운트되지 않도록 차단했습니다. 이를 통해 완벽한 'Shut Down' 경험을 제공합니다.

#### 2. Real-time Synchronization: "살아있는 지하철 노선"
정적인 데이터가 아닌, **지금 이 순간**의 활성 사용자 수를 시각화하기 위해 `Socket.io`를 적극 활용했습니다.
- **Implementation**: 사용자가 특정 호선(Room)에 입장하는 순간 소켓 이벤트를 발생시키고, 서버는 메모리 내에서 호선별 세션을 카운팅하여 1초 단위로 브로드캐스트합니다.
- **UX Detail**: 단순 숫자가 아닌 CSS `pulse` 애니메이션을 통해 노선이 마치 '숨 쉬는 듯한' 생명력을 불어넣었습니다.

#### 3. Mobile-First & Glassmorphism
흔들리는 지하철 안, 한 손으로 조작해야 하는 환경을 고려했습니다.
- **Thumb Zone Design**: 주요 인터랙션 버튼을 화면 하단 1/3 영역에 배치했습니다.
- **Vibrant Aesthetics**: 삭막한 지하철 톤 대신 채도 높은 그라디언트와 Glassmorphism(배경 블러)을 적용하여, 앱을 켜는 순간만큼은 환상적인 기분을 느낄 수 있도록 디자인했습니다.

---

## ✨ Key Features

- **🚇 9개 호선별 독립 채널**: 1호선부터 9호선까지, 나의 출근길에 맞는 방에 입장합니다.
- **⏱️ Time-Limited Service**: 평일 07:00 ~ 09:00에만 접속 가능 (Client/Server 이중 검증).
- **💥 Ephemeral Data**: 매일 오전 9시, 스케줄러(Cron)에 의해 모든 대화 내용이 영구 삭제됩니다.
- **🔒 Complete Anonymity**: 로그인 없이 즉시 참여. 카카오 로그인을 해도 작성자 정보는 남지 않습니다.

---

## 🛠 Technology Stack

| Category | Stacks | Features |
|----------|--------|----------|
| **Frontend** | ![React](https://img.shields.io/badge/-React_19-61DAFB?logo=react&logoColor=black) | `Suspense`, `Hooks`, Custom Design System |
| **Backend** | ![Node.js](https://img.shields.io/badge/-Node.js_18-339933?logo=node.js&logoColor=white) | `Express`, `Worker Threads` |
| **Real-time** | ![Socket.io](https://img.shields.io/badge/-Socket.io-010101?logo=socket.io&logoColor=white) | Bi-directional Events, Namespace management |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) | Relational Data, Complex Queries |
| **Infra** | ![Vercel](https://img.shields.io/badge/-Vercel-000000?logo=vercel&logoColor=white) ![Railway](https://img.shields.io/badge/-Railway-0B0D0E?logo=railway&logoColor=white) | CI/CD Automation |

---

## 🚀 Installation & Run

### Backend
```bash
cd backend
npm install
npm run dev # localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start # localhost:3000
```

---

## 📬 Contact
- **Email**: (이력서 내 이메일 참조)
- **GitHub**: [https://github.com/doublesilver/subway-board](https://github.com/doublesilver/subway-board)

> *이 프로젝트는 개발자의 사이드 프로젝트로서, 지하철의 실제 운영 주체와는 무관합니다.*
