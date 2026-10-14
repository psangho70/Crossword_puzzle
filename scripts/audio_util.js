// 문제 듣기 음성 파일 공통 유틸 (generate_audio.js / build_app.js 공용)
// - 동일 텍스트는 동일 파일명(해시)으로 매핑되어 중복 생성 방지
const crypto = require('crypto');

function prefixText(word) {
  return `${word.dirKo} ${word.num}번, ${word.len}글자 문제입니다.`;
}

function clueText(word) {
  return word.clue;
}

function audioFileName(text) {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex').slice(0, 12) + '.mp3';
}

module.exports = { prefixText, clueText, audioFileName };
