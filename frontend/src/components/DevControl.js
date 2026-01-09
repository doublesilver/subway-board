import React, { useState, useEffect } from 'react';

const DevControl = () => {
    const [mode, setMode] = useState(sessionStorage.getItem('app_mode') || 'auto');
    const [isOpen, setIsOpen] = useState(false);

    // 개발 환경이 아니면 렌더링하지 않음 (선택 사항, 여기서는 테스트를 위해 항상 표시하거나 숨김 기능 추가)
    // if (process.env.NODE_ENV !== 'development') return null;

    const handleModeChange = (newMode) => {
        setMode(newMode);
        sessionStorage.setItem('app_mode', newMode);
        window.location.reload(); // 변경 사항 적용을 위해 새로고침
    };

    if (!isOpen) {
        return (
            <button
                className="dev-control-trigger"
                onClick={() => setIsOpen(true)}
            >
                🔧
            </button>
        );
    }

    return (
        <div className="dev-control-panel">
            <div className="dev-control-header">
                <span>Developer Mode</span>
                <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <div className="dev-control-content">
                <label className={`mode-option ${mode === 'auto' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="app_mode"
                        value="auto"
                        checked={mode === 'auto'}
                        onChange={() => handleModeChange('auto')}
                    />
                    Auto (Env Default)
                </label>
                <label className={`mode-option ${mode === 'development' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="app_mode"
                        value="development"
                        checked={mode === 'development'}
                        onChange={() => handleModeChange('development')}
                    />
                    Force Open (Dev)
                </label>
                <label className={`mode-option ${mode === 'production' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="app_mode"
                        value="production"
                        checked={mode === 'production'}
                        onChange={() => handleModeChange('production')}
                    />
                    Force Strict (Prod)
                </label>
            </div>
            <div className="dev-control-footer">
                <small>* Toggling reloads page</small>
            </div>
        </div>
    );
};

export default DevControl;
