import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { feedbackAPI } from '../services/api';

const FeedbackModal = ({ onClose }) => {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim()) {
            setError('피드백 내용을 입력해주세요.');
            return;
        }

        if (content.length > 2000) {
            setError('피드백은 2000자를 초과할 수 없습니다.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await feedbackAPI.submit(content);
            onClose(true); // true = 성공
        } catch (err) {
            setError(err.response?.data?.error || '피드백 전송에 실패했습니다.');
            setSubmitting(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="feedback-modal-overlay" onClick={handleOverlayClick}>
            <div className="feedback-modal">
                <div className="feedback-modal-header">
                    <h2>피드백 보내기</h2>
                    <button
                        className="feedback-modal-close"
                        onClick={() => onClose(false)}
                        disabled={submitting}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="feedback-modal-body">
                        <p className="feedback-modal-description">
                            서비스 개선을 위한 소중한 의견을 들려주세요.
                        </p>
                        <textarea
                            className="feedback-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="불편한 점, 개선사항, 버그 등 자유롭게 작성해주세요."
                            maxLength={2000}
                            disabled={submitting}
                            autoFocus
                        />
                        <div className="feedback-char-count">
                            {content.length} / 2000
                        </div>
                        {error && <div className="feedback-error">{error}</div>}
                    </div>

                    <div className="feedback-modal-footer">
                        <button
                            type="button"
                            className="feedback-button feedback-button-cancel"
                            onClick={() => onClose(false)}
                            disabled={submitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="feedback-button feedback-button-submit"
                            disabled={submitting || !content.trim()}
                        >
                            {submitting ? '전송 중...' : '전송'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    , document.body);
};

export default FeedbackModal;
