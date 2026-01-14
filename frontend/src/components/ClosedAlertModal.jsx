import React, { useEffect } from 'react';

// 테스트 기간용 모달 (원복 시 RESTORE.md 참고)
const ClosedAlertModal = () => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleEnterTestMode = () => {
        sessionStorage.setItem('test_mode_accepted', 'true');
        window.location.reload();
    };

    return (
        <div className="closed-modal-overlay">
            <div className="closed-modal">
                <div className="modal-icon">🎉</div>
                <h2 className="modal-title">서비스를 선보이는 기간이에요</h2>
                <p className="modal-desc">
                    입장하기 버튼을 통해서 이용해 보세요!<br /><br />
                    <span className="operating-hours-info">
                        정식 운영 시간: 평일 오전 7시 ~ 9시
                    </span>
                </p>
                <button className="enter-test-button" onClick={handleEnterTestMode}>
                    입장하기
                </button>
            </div>
        </div>
    );
};

export default ClosedAlertModal;
