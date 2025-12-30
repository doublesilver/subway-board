const profanityWords = [
  // 비속어 목록 (실제 운영시 더 확장 필요)
  '씨발', '시발', '개새', '새끼', '병신', '좆', '지랄', '닥쳐',
  '꺼져', '엿먹', '미친', '또라이', '개년', '년', '놈',
  // 성적 단어
  '섹스', '성교', '자위', '야동', '포르노', 'ㅅㅅ', 'ㅅㄱ',
  // 변형 방지 (자음/모음 분리)
  'ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'ㅈㄹ', 'ㄱㅅ', 'ㄲㅈ',
];

const profanityPatterns = [
  // 특수문자로 회피하는 경우 감지
  /[씨시][0-9!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>/?]*발/g,
  /개[0-9!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>/?]*새/g,
  /병[0-9!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>/?]*신/g,
  /[좆존][0-9!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>/?]*나/g,
  /지[0-9!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>/?]*랄/g,
];

class ProfanityFilter {
  static containsProfanity(text) {
    if (!text) return false;

    const lowerText = text.toLowerCase().replace(/\s/g, '');

    // 단어 목록 검사
    for (const word of profanityWords) {
      if (lowerText.includes(word)) {
        return true;
      }
    }

    // 패턴 검사
    for (const pattern of profanityPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  static filterText(text) {
    if (!text) return text;

    let filtered = text;

    // 단어 목록 필터링
    for (const word of profanityWords) {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    }

    // 패턴 필터링
    for (const pattern of profanityPatterns) {
      filtered = filtered.replace(pattern, (match) => '*'.repeat(match.length));
    }

    return filtered;
  }

  static validate(text) {
    if (this.containsProfanity(text)) {
      throw new Error('부적절한 언어가 포함되어 있습니다.');
    }
    return true;
  }
}

module.exports = ProfanityFilter;
