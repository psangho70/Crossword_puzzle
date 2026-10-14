// verify_100_stages.js
const fs = require('fs');
const puzzles = JSON.parse(fs.readFileSync('scripts/puzzles_100.json', 'utf8'));

let errors = 0;
console.log(`총 ${puzzles.length}개 퍼즐 검증 시작...`);

puzzles.forEach((p, idx) => {
  const grid = Array.from({ length: 7 }, () => Array(7).fill(null));

  p.words.forEach(w => {
    for (let i = 0; i < w.len; i++) {
      const r = w.dir === 'across' ? w.r : w.r + i;
      const c = w.dir === 'across' ? w.c + i : w.c;
      const ch = w.word[i];

      if (r < 0 || r >= 7 || c < 0 || c >= 7) {
        console.error(`[Error] Puzzle ${p.stage}-${p.level}: out of bounds (${r}, ${c}) for "${w.word}"`);
        errors++;
      } else if (grid[r][c] !== null && grid[r][c] !== ch) {
        console.error(`[Error] Puzzle ${p.stage}-${p.level}: clash at (${r}, ${c})! existing='${grid[r][c]}' vs new='${ch}' in "${w.word}"`);
        errors++;
      } else {
        grid[r][c] = ch;
      }
    }
  });
});

if (errors === 0) {
  console.log(`[PASS] 100단계 퍼즐 전체 검증 완료! 충돌 오류 0건! 모든 단어가 완벽히 일치합니다.`);
} else {
  console.error(`[FAIL] ${errors}건의 오류가 발견되었습니다.`);
}
