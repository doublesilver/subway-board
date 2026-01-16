import { v4 as uuidv4 } from 'uuid';

// 호선별 형용사 + 명사 조합 (호선 테마에 맞춤)
const lineThemes = {
  1: { adjectives: ['빠른', '정확한', '성실한'], nouns: ['통근러', '직장인', '출퇴근러'] },
  2: { adjectives: ['활기찬', '즐거운', '행복한'], nouns: ['여행자', '모험가', '탐험가'] },
  3: { adjectives: ['차분한', '평온한', '조용한'], nouns: ['승객', '이용자', '탑승객'] },
  4: { adjectives: ['용감한', '씩씩한', '당당한'], nouns: ['라이더', '워커', '러너'] },
  5: { adjectives: ['멋진', '훌륭한', '근사한'], nouns: ['시민', '주민', '이웃'] },
  6: { adjectives: ['똑똑한', '영리한', '현명한'], nouns: ['학생', '수험생', '청춘'] },
  7: { adjectives: ['친절한', '따뜻한', '다정한'], nouns: ['친구', '동료', '벗'] },
  8: { adjectives: ['신나는', '흥미로운', '재미있는'], nouns: ['구경꾼', '관광객', '나그네'] },
  9: { adjectives: ['든든한', '믿음직한', '튼튼한'], nouns: ['워커', '통근러', '직장인'] },
};

// 기본 테마 (호선이 정의되지 않은 경우)
const defaultTheme = {
  adjectives: ['활기찬', '즐거운', '행복한', '평온한', '차분한', '용감한', '씩씩한', '당당한', '멋진', '훌륭한'],
  nouns: ['통근러', '출퇴근러', '직장인', '샐러리맨', '워커', '러너', '라이더', '여행자', '모험가', '탐험가'],
};

/**
 * 호선별 임시 닉네임 생성
 * @param {string|number} lineId - 호선 ID
 * @returns {string} 생성된 닉네임
 */
export const generateLineNickname = (lineId) => {
  const theme = lineThemes[lineId] || defaultTheme;
  const adj = theme.adjectives[Math.floor(Math.random() * theme.adjectives.length)];
  const noun = theme.nouns[Math.floor(Math.random() * theme.nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj} ${noun}${num}`;
};

/**
 * 호선 채팅방 입장 - 임시 사용자 생성
 * @param {string|number} lineId - 호선 ID
 * @returns {object} { sessionId, nickname }
 */
export const enterChatRoom = (lineId) => {
  const sessionKey = `line_${lineId}_session`;
  const nicknameKey = `line_${lineId}_nickname`;

  // 이미 해당 호선에 세션이 있는지 확인
  let sessionId = sessionStorage.getItem(sessionKey);
  let nickname = sessionStorage.getItem(nicknameKey);

  // 세션이 없으면 새로 생성
  if (!sessionId || !nickname) {
    sessionId = `session_${uuidv4()}`;
    nickname = generateLineNickname(lineId);

    sessionStorage.setItem(sessionKey, sessionId);
    sessionStorage.setItem(nicknameKey, nickname);
  }

  return { sessionId, nickname };
};

/**
 * 호선 채팅방 퇴장 - 임시 사용자 삭제
 * @param {string|number} lineId - 호선 ID
 */
export const leaveChatRoom = (lineId) => {
  const sessionKey = `line_${lineId}_session`;
  const nicknameKey = `line_${lineId}_nickname`;

  // 세션 스토리지에서 제거 (휘발성)
  sessionStorage.removeItem(sessionKey);
  sessionStorage.removeItem(nicknameKey);
};

/**
 * 현재 호선의 임시 사용자 정보 가져오기
 * @param {string|number} lineId - 호선 ID
 * @returns {object|null} { sessionId, nickname } 또는 null
 */
export const getCurrentLineUser = (lineId) => {
  const sessionKey = `line_${lineId}_session`;
  const nicknameKey = `line_${lineId}_nickname`;

  const sessionId = sessionStorage.getItem(sessionKey);
  const nickname = sessionStorage.getItem(nicknameKey);

  if (!sessionId || !nickname) {
    return null;
  }

  return { sessionId, nickname };
};

/**
 * 모든 호선 세션 정리 (앱 종료 시)
 */
export const clearAllSessions = () => {
  const keysToRemove = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key.startsWith('line_')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => sessionStorage.removeItem(key));
};

export const getLineSignature = (lineId) => {
  return sessionStorage.getItem(`line_${lineId}_signature`);
};

export const setLineSignature = (lineId, signature) => {
  sessionStorage.setItem(`line_${lineId}_signature`, signature);
};
