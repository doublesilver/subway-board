import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatScroll } from './useChatScroll';

describe('useChatScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with showScrollButton as false', () => {
    const { result } = renderHook(() => useChatScroll([]));

    expect(result.current.showScrollButton).toBe(false);
  });

  it('should return refs for messages container and end element', () => {
    const { result } = renderHook(() => useChatScroll([]));

    expect(result.current.messagesEndRef).toBeDefined();
    expect(result.current.messagesContainerRef).toBeDefined();
  });

  it('should provide scrollToBottom function', () => {
    const { result } = renderHook(() => useChatScroll([]));

    expect(typeof result.current.scrollToBottom).toBe('function');
  });

  it('should provide handleScroll function', () => {
    const { result } = renderHook(() => useChatScroll([]));

    expect(typeof result.current.handleScroll).toBe('function');
  });

  it('should call scrollIntoView on initial load with messages', () => {
    const mockScrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    const messages = [
      { id: 1, content: 'Hello', created_at: new Date().toISOString() },
    ];

    const { result } = renderHook(() => useChatScroll(messages));

    // Set up the ref manually
    const mockElement = document.createElement('div');
    mockElement.scrollIntoView = mockScrollIntoView;

    act(() => {
      result.current.messagesEndRef.current = mockElement;
    });

    // Trigger rerender with messages
    const { rerender } = renderHook(
      ({ msgs }) => useChatScroll(msgs),
      { initialProps: { msgs: messages } }
    );

    rerender({ msgs: [...messages, { id: 2, content: 'World', created_at: new Date().toISOString() }] });
  });

  it('should detect scroll position and update showScrollButton', () => {
    const { result } = renderHook(() => useChatScroll([]));

    // Create a mock container element
    const mockContainer = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    };

    act(() => {
      result.current.messagesContainerRef.current = mockContainer;
    });

    // User scrolled up - should show scroll button
    mockContainer.scrollTop = 100; // Far from bottom (1000 - 100 - 500 = 400 > 200)

    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.showScrollButton).toBe(true);

    // User scrolled to near bottom - should hide scroll button
    mockContainer.scrollTop = 400; // Near bottom (1000 - 400 - 500 = 100 < 200)

    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.showScrollButton).toBe(false);
  });

  it('should not update when container ref is null', () => {
    const { result } = renderHook(() => useChatScroll([]));

    // Ensure container ref is null
    result.current.messagesContainerRef.current = null;

    // Should not throw
    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.showScrollButton).toBe(false);
  });

  it('should handle messages with client_id for deduplication', () => {
    const messages1 = [
      { id: 1, client_id: 'client-1', content: 'Hello', created_at: new Date().toISOString() },
    ];

    const messages2 = [
      { id: 1, client_id: 'client-1', content: 'Hello', created_at: new Date().toISOString() },
      { id: 2, client_id: 'client-2', content: 'World', created_at: new Date().toISOString() },
    ];

    const { result, rerender } = renderHook(
      ({ msgs }) => useChatScroll(msgs),
      { initialProps: { msgs: messages1 } }
    );

    // Should work without throwing
    rerender({ msgs: messages2 });

    expect(result.current.showScrollButton).toBe(false);
  });

  it('should handle empty messages array', () => {
    const { result, rerender } = renderHook(
      ({ msgs }) => useChatScroll(msgs),
      { initialProps: { msgs: [] } }
    );

    // Should not throw on empty array
    rerender({ msgs: [] });

    expect(result.current.showScrollButton).toBe(false);
  });

  it('should call scrollToBottom with smooth parameter', () => {
    const mockScrollIntoView = vi.fn();

    const { result } = renderHook(() => useChatScroll([]));

    const mockElement = document.createElement('div');
    mockElement.scrollIntoView = mockScrollIntoView;

    act(() => {
      result.current.messagesEndRef.current = mockElement;
    });

    // Call with smooth = true
    act(() => {
      result.current.scrollToBottom(true);
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    // Call with smooth = false
    act(() => {
      result.current.scrollToBottom(false);
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
  });
});
