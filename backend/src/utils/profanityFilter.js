const Filter = require('badwords-ko');
const filter = new Filter();

class ProfanityFilter {
  static containsProfanity(text) {
    if (!text) return false;
    // badwords-ko checks for profanity
    return filter.isProfane(text);
  }

  static filterText(text) {
    if (!text) return text;
    // Replace profanity with asterisks
    return filter.clean(text);
  }

  static validate(text) {
    if (this.containsProfanity(text)) {
      throw new Error('부적절한 언어가 포함되어 있습니다.');
    }
    return true;
  }
}

module.exports = ProfanityFilter;
