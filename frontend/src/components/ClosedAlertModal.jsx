import React, { useEffect } from 'react';

const ClosedAlertModal = () => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // 현재 요일 확인
    const now = new Date();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;

    return (
        <div className="closed-modal-overlay">
            <div className="closed-modal">
                <div className="modal-icon">😴</div>
                <h2 className="modal-title">지금은 운영 시간이 아니에요</h2>
                <p className="modal-desc">
                    {isWeekend ? (
                        <>
                            주말에는 운영하지 않아요.<br />
                            평일 출근길에 다시 만나요!
                        </>
                    ) : (
                        <>
                            평일 오전 7시 ~ 9시에 운영해요.<br />
                            출근길에 다시 만나요!
                        </>
                    )}
                </p>
                <div className="operating-hours-badge">
                    <span>🚇 평일 07:00 ~ 09:00</span>
                </div>
            </div>
        </div>
    );
};

export default ClosedAlertModal;
