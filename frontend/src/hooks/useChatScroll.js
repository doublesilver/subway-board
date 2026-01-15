import { useState, useEffect, useRef } from 'react';

export const useChatScroll = (messages) => {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const isInitialLoad = useRef(true);

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    };

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        setShowScrollButton(!isNearBottom);
    };

    useEffect(() => {
        if (messages.length > 0) {
            if (isInitialLoad.current) {
                scrollToBottom(false);
                isInitialLoad.current = false;
            } else if (!showScrollButton) {
                scrollToBottom(true);
            }
        }
    }, [messages, showScrollButton]);

    return {
        messagesEndRef,
        messagesContainerRef,
        showScrollButton,
        handleScroll,
        scrollToBottom
    };
};
