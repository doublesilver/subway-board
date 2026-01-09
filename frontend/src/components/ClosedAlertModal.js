import React, { useState } from 'react';
import { getDailyTrivia } from '../utils/trivia';

const ClosedAlertModal = () => {
    const [showAnswer, setShowAnswer] = useState(false);
    const trivia = getDailyTrivia();

    return (
        <div className="closed-modal-overlay">
            <div className="closed-modal">
                <div className="modal-icon">🌙</div>
                <h2 className="modal-title">운영 시간이 끝났어요</h2>
                <p className="modal-desc">
                    지하철 채팅은 출근 시간인<br />
                    <strong>오전 07:00 ~ 09:00</strong>에만 운영됩니다.
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

                <p className="modal-footer-text">내일 아침 7시에 다시 만나요!</p>
            </div>
        </div>
    );
};

export default ClosedAlertModal;
