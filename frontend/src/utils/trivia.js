export const TRIVIA_DATA = [
    {
        question: "서울 지하철 2호선의 별명은 무엇일까요?",
        answer: "순환선",
        explanation: "서울을 크게 한 바퀴 도는 순환선이라서 붙여진 이름이에요! 서울의 주요 지역을 모두 지나가죠."
    },
    {
        question: "지하철 1호선은 언제 처음 개통되었을까요?",
        answer: "1974년",
        explanation: "1974년 8월 15일에 서울역에서 청량리 구간이 처음 개통되었습니다. 대한민국 최초의 지하철이죠!"
    },
    {
        question: "환승 음악으로 유명한 '얼씨구야'는 어떤 악기로 연주될까요?",
        answer: "국악기 (가야금 등)",
        explanation: "퓨전 국악으로, 흥겨운 우리 가락이 환승역의 시그니처 사운드가 되었답니다."
    },
    {
        question: "지하철 객실 내 적정 냉방 온도는 몇 도일까요?",
        answer: "24~26도",
        explanation: "여름철 일반적인 냉방 설정 온도입니다. 약냉방칸은 이보다 1~2도 높게 설정돼요."
    },
    {
        question: "세계에서 가장 이용객이 많은 지하철역 중 하나인 이 역은?",
        answer: "강남역",
        explanation: "출퇴근 시간 강남역 2호선 승강장은 그야말로 인산인해! 세계적으로도 붐비는 역으로 꼽혀요."
    },
    {
        question: "1호선 노선색인 남색(Dark Blue)의 의미는?",
        answer: "안전과 침착",
        explanation: "초기에는 빨간색이었으나, 2000년 통합 브랜드 작업 때 차분하고 안정적인 남색으로 변경되었어요."
    },
    {
        question: "지하철 임산부 배려석의 마스코트 이름은?",
        answer: "토닥이",
        explanation: "분홍색 좌석에 그려진 귀여운 캐릭터 곰인형 이름이 토닥이랍니다."
    },
    {
        question: "6호선은 응암역에서 독특한 운행 방식을 가집니다. 무엇일까요?",
        answer: "버뮤다 삼각지대 (루프선)",
        explanation: "응암 루프라고 불리며, 역촌 -> 불광 -> 독바위 -> 연신내 -> 구산 -> 응암 순으로 한 방향으로만 돌아요."
    }
];

export const getDailyTrivia = () => {
    // 날짜별로 고정된 퀴즈가 나오도록 (새로고침해도 동일하게)
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

    return TRIVIA_DATA[dayOfYear % TRIVIA_DATA.length];
};
