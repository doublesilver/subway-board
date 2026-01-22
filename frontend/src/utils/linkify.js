/**
 * URL 자동 링크 유틸리티 (Linkify)
 * 텍스트 내의 URL을 클릭 가능한 링크로 변환합니다.
 */

// URL 정규식 (http/https 포함 또는 www. 시작 또는 도메인.확장자 형태)
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|kr|co\.kr|io|dev|app|xyz|me|info|biz|tv|cc|gg)[^\s<]*/gi;

/**
 * 텍스트에서 URL을 찾아 파싱합니다.
 * @param {string} text - 원본 텍스트
 * @returns {Array} - [{type: 'text'|'link', content: string, href?: string}]
 */
export const parseLinks = (text) => {
  if (!text || typeof text !== 'string') return [{ type: 'text', content: '' }];

  const parts = [];
  let lastIndex = 0;
  let match;

  // 정규식 초기화 (global flag로 인해 lastIndex 유지됨)
  const regex = new RegExp(URL_REGEX.source, 'gi');

  while ((match = regex.exec(text)) !== null) {
    // 매치 이전의 일반 텍스트
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // URL 처리
    let url = match[0];
    let href = url;

    // 프로토콜이 없으면 https 추가
    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      href = 'https://' + href;
    }

    // 끝에 붙은 구두점 제거 (마침표, 쉼표, 느낌표, 물음표 등)
    const trailingPunctuation = /[.,!?;:'")\]}>]+$/;
    const trailingMatch = url.match(trailingPunctuation);
    if (trailingMatch) {
      url = url.slice(0, -trailingMatch[0].length);
      href = href.slice(0, -trailingMatch[0].length);
    }

    parts.push({
      type: 'link',
      content: url,
      href: href,
    });

    // 끝에서 제거된 구두점이 있으면 텍스트로 추가
    if (trailingMatch) {
      parts.push({
        type: 'text',
        content: trailingMatch[0],
      });
    }

    lastIndex = regex.lastIndex - (trailingMatch ? trailingMatch[0].length : 0);
  }

  // 마지막 매치 이후의 텍스트
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  // 결과가 없으면 원본 텍스트 반환
  if (parts.length === 0) {
    return [{ type: 'text', content: text }];
  }

  return parts;
};

/**
 * URL 여부 확인
 * @param {string} text - 검사할 텍스트
 * @returns {boolean}
 */
export const containsUrl = (text) => {
  if (!text) return false;
  return URL_REGEX.test(text);
};
