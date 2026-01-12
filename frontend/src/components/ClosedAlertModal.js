import React, { useState } from 'react';
import { getDailyTrivia } from '../utils/trivia';

const ClosedAlertModal = () => {
    const [showAnswer, setShowAnswer] = useState(false);
    const trivia = getDailyTrivia();

    // 다음 운영 시간 계산 (평일 07:00 ~ 09:00)
    const getNextOperatingTime = () => {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일

        // 오늘 09시 이전이고 평일이면 오늘 오전 7시
        if (hour < 9 && day >= 1 && day <= 5) {
            return '오늘 오전 7시';
        }

        // 금요일 09시 이후면 월요일
        if (day === 5 && hour >= 9) {
            return '월요일 오전 7시';
        }

        // 토요일이면 월요일
        if (day === 6) {
            return '월요일 오전 7시';
        }

        // 일요일이면 월요일
        if (day === 0) {
            return '월요일 오전 7시';
        }

        // 평일 09시 이후면 내일
        return '내일 오전 7시';
    };

    return (
        <div className="closed-modal-overlay">
            <div className="closed-modal">
                <div className="modal-icon">⏰</div>
                <h2 className="modal-title">운영 시간이 아니에요</h2>
                <p className="modal-desc">
                    지하철 채팅은 출근 시간인<br />
                    <strong>평일 오전 07:00 ~ 09:00</strong>에만 운영됩니다.
                </p>

                <div className="trivia-card" onClick={() => setShowAnswer(!showAnswer)}>
                    <div className="trivia-header">
                        <span className="trivia-badge">오늘의 상식 퀴즈</span>
                        <span className="trivia-hint">{showAnswer ? '정답 확인!' : '터치해서 정답 보기'}</span>
                    </div>
                    <div className="trivia-content">
                        <p className="trivia-question">Q. {trivia.question}</p>
                        {showAnswer && (
                            <div className="trivia-answer-box">
                                <p className="trivia-answer">A. {trivia.answer}</p>
                                <p className="trivia-explanation">{trivia.explanation}</p>
                            </div>
                        )}
                    </div>
                </div>

                <p className="modal-footer-text">{getNextOperatingTime()}에 다시 만나요!</p>
            </div>
        </div>
    );
};

export default ClosedAlertModal;
