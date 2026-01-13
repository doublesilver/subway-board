import React, { useEffect } from 'react';

const ClosedAlertModal = () => {
    // 모달이 열릴 때 body 스크롤 막기
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="closed-modal-overlay">
            <div className="closed-modal">
                <div className="modal-icon">⏰</div>
                <h2 className="modal-title">운영 시간이 아니에요</h2>
                <p className="modal-desc">
                    지하철 채팅은 출근 시간인<br />
                    <strong>평일 오전 07:00 ~ 09:00</strong>에만 운영됩니다.
                </p>
                <div className="modal-footer-text">
                    Copyright 2026. gagisiro, Co., Ltd. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default ClosedAlertModal;
