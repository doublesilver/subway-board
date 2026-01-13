import React, { useEffect } from 'react';

function SessionExpiredModal({ onConfirm }) {
    // 모달이 떠있을 때 배경 스크롤 방지
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-icon">👋</div>
                <h2>운영 시간이 종료되었어요</h2>
                <p>
                    지금은 지하철 운행 시간이 아니에요.<br />
                    내일 아침 7시에 다시 만나요!
                </p>
                <p className="modal-subtext">
                    운영 시간: 평일 07:00 ~ 09:00
                </p>
                <button className="modal-button" onClick={onConfirm}>
                    홈으로 돌아가기
                </button>
            </div>
        </div>
    );
}

export default SessionExpiredModal;
