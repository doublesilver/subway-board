import { useState } from 'react';

export const useSwipeReply = (currentUser, onReply) => {
    const [swipedMessageId, setSwipedMessageId] = useState(null);
    const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
    const [touchOffset, setTouchOffset] = useState(0);

    const handleTouchStart = (e, message) => {
        setTouchStart({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        });
        setSwipedMessageId(message.id);
    };

    const handleTouchMove = (e, message) => {
        if (swipedMessageId !== message.id) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - touchStart.x;
        const deltaY = touchY - touchStart.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if ((Math.abs(deltaX) > 10)) { // Small threshold to start claim
                e.preventDefault();
            }

            const isMyMessage = currentUser && message.anonymous_id === currentUser.sessionId;

            if (isMyMessage) {
                // My message: swipe left to reply (negative deltaX)
                if (deltaX < 0 && deltaX > -80) {
                    setTouchOffset(deltaX);
                }
            } else {
                // Other's message: swipe right to reply (positive deltaX)
                if (deltaX > 0 && deltaX < 80) {
                    setTouchOffset(deltaX);
                }
            }
        }
    };

    const handleTouchEnd = (message) => {
        const isMyMessage = currentUser && message.anonymous_id === currentUser.sessionId;

        if (isMyMessage && touchOffset < -40) {
            onReply(message);
        } else if (!isMyMessage && touchOffset > 40) {
            onReply(message);
        }

        setTouchOffset(0);
        setSwipedMessageId(null);
    };

    return {
        swipedMessageId,
        touchOffset,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    };
};
