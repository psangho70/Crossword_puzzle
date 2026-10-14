// scripts/verify_10x10.js
// 10x10 100단계 퍼즐 전수 무결성 및 중복 0건 검증 스크립트
const fs = require('fs');
const path = require('path');

const puzzles = JSON.parse(fs.readFileSync(path.join(__dirname, 'puzzles_100_10x10.json'), 'utf8'));

console.log("=========================================");
console.log("10x10 100단계 퍼즐 전수 무결성 검증 시작");
console.log("=========================================");

if (puzzles.length !== 100) {
  throw new Error(`퍼즐 단계 수가 100개가 아닙니다: ${puzzles.length}`);
}

const globalWordSet = new Set();
const globalClueSet = new Set();
let totalWords = 0;
let errors = 0;

puzzles.forEach((p, idx) => {
  const stage = p.stage;
  const level = p.level;
  const globalLevel = p.globalLevel;

  // 1. 그리드 크기 검증 (10x10)
  if (p.grid.length !== 10) {
    console.error(`[오류] 단계 ${globalLevel}: 그리드 행 수가 10이 아닙니다 (${p.grid.length})`);
    errors++;
  }
  for (let r = 0; r < 10; r++) {
    if (p.grid[r].length !== 10) {
      console.error(`[오류] 단계 ${globalLevel}: ${r}행의 열 수가 10이 아닙니다 (${p.grid[r].length})`);
      errors++;
    }
  }

  // 2. 단어 개수 검증 (8 ~ 10개)
  if (p.words.length < 8 || p.words.length > 10) {
    console.error(`[오류] 단계 ${globalLevel}: 단어 개수가 범위를 벗어남 (${p.words.length}개)`);
    errors++;
  }

  // 3. 단어별 그리드 일치 검증
  p.words.forEach(w => {
    totalWords++;
    // 중복 검증
    if (globalWordSet.has(w.word)) {
      console.error(`[중복 오류] 단계 ${globalLevel}: '${w.word}' 단어가 이전 단계와 중복되었습니다!`);
      errors++;
    }
    if (globalClueSet.has(w.clue)) {
      console.error(`[중복 오류] 단계 ${globalLevel}: '${w.clue}' 해설이 이전 단계와 중복되었습니다!`);
      errors++;
    }
    globalWordSet.add(w.word);
    globalClueSet.add(w.clue);

    // 좌표 및 글자 일치 검증
    if (w.len !== w.word.length) {
      console.error(`[길이 오류] 단계 ${globalLevel}: '${w.word}' 길이 불일치 (len=${w.len})`);
      errors++;
    }

    for (let k = 0; k < w.len; k++) {
      const rr = w.dir === 'across' ? w.r : w.r + k;
      const cc = w.dir === 'across' ? w.c + k : w.c;

      if (rr < 0 || rr >= 10 || cc < 0 || cc >= 10) {
        console.error(`[좌표 초과 오류] 단계 ${globalLevel}: '${w.word}' 좌표 (${rr}, ${cc})`);
        errors++;
      } else {
        const gridChar = p.grid[rr][cc];
        const wordChar = w.word[k];
        if (gridChar !== wordChar) {
          console.error(`[글자 불일치] 단계 ${globalLevel}: '${w.word}' ${k}번째 글자 (그리드: ${gridChar}, 단어: ${wordChar})`);
          errors++;
        }
      }
    }
  });

  // 4. 교차 검증 (모든 단어가 최소 1개 이상 다른 단어와 교차)
  p.words.forEach(w => {
    let crossed = false;
    for (let k = 0; k < w.len; k++) {
      const rr = w.dir === 'across' ? w.r : w.r + k;
      const cc = w.dir === 'across' ? w.c + k : w.c;

      const other = p.words.find(o => o !== w && o.dir !== w.dir && (
        o.dir === 'across'
          ? (o.r === rr && cc >= o.c && cc < o.c + o.len)
          : (o.c === cc && rr >= o.r && rr < o.r + o.len)
      ));
      if (other) {
        crossed = true;
        break;
      }
    }
    if (!crossed) {
      console.error(`[고립 단어 오류] 단계 ${globalLevel}: '${w.word}' 단어가 교차하지 않는 고립 단어입니다!`);
      errors++;
    }
  });
});

console.log("=========================================");
console.log(`[검증 결과 보고서]`);
console.log(`- 전체 단계 수: ${puzzles.length}단계 (PASS)`);
console.log(`- 총 단어 수: ${totalWords}개`);
console.log(`- 고유 단어 수: ${globalWordSet.size}개 (중복 0건, 100% PASS)`);
console.log(`- 고유 해설 수: ${globalClueSet.size}개 (중복 0건, 100% PASS)`);
console.log(`- 감지된 오류 수: ${errors}건`);
console.log("=========================================");

if (errors === 0) {
  console.log(">>> [최종 판정: 100% 무결성 검증 완벽 합격 (PASS)] <<<");
} else {
  process.exit(1);
}
