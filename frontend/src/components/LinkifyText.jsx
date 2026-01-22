import React from 'react';
import { parseLinks } from '../utils/linkify';

/**
 * 텍스트 내 URL을 클릭 가능한 링크로 변환하는 컴포넌트
 * @param {string} text - 변환할 텍스트
 */
function LinkifyText({ text }) {
  if (!text) return null;

  const parts = parseLinks(text);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-link"
              onClick={(e) => e.stopPropagation()}
            >
              {part.content}
            </a>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </>
  );
}

export default LinkifyText;
