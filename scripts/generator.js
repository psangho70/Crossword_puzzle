// generator.js - 7x7 십자말풀이 100단계 생성기
const fs = require('fs');

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// test_engine.js에서 VOCABULARY 읽어오기
const testEngineCode = fs.readFileSync('scripts/test_engine.js', 'utf8');
const match = testEngineCode.match(/const VOCABULARY = (\[[\s\S]*?\]);\s*console/);
const VOCABULARY = eval(match[1]);

console.log("단어 수: " + VOCABULARY.length);

// 글자별 인덱스
const charIndex = {};
VOCABULARY.forEach(item => {
  for (let i = 0; i < item.word.length; i++) {
    const ch = item.word[i];
    if (!charIndex[ch]) charIndex[ch] = [];
    charIndex[ch].push({ item, pos: i });
  }
});

// 퍼즐 생성기
function generatePuzzle(seed, targetWordCount = 7) {
  const rng = mulberry32(seed);

  // 셔플 함수
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 7x7 그리드 (null: 빈칸)
  // 배치된 단어 목록: [{ id, word, clue, dir: 'across'|'down', r, c, len }]
  for (let attempt = 0; attempt < 300; attempt++) {
    const grid = Array.from({ length: 7 }, () => Array(7).fill(null));
    const placed = [];
    const usedWords = new Set();

    // 첫 번째 단어 선택 (길이 3~5인 단어, 가로 또는 세로로 중앙 부근에 배치)
    const candidates = VOCABULARY.filter(v => v.word.length >= 3 && v.word.length <= 6);
    const firstWord = candidates[Math.floor(rng() * candidates.length)];
    const dirFirst = rng() > 0.5 ? 'across' : 'down';
    const rFirst = dirFirst === 'across' ? 2 + Math.floor(rng() * 3) : Math.floor(rng() * (8 - firstWord.word.length));
    const cFirst = dirFirst === 'across' ? Math.floor(rng() * (8 - firstWord.word.length)) : 2 + Math.floor(rng() * 3);

    // 첫 단어 배치
    let canPlaceFirst = true;
    for (let i = 0; i < firstWord.word.length; i++) {
      const rr = dirFirst === 'across' ? rFirst : rFirst + i;
      const cc = dirFirst === 'across' ? cFirst + i : cFirst;
      if (rr < 0 || rr >= 7 || cc < 0 || cc >= 7) { canPlaceFirst = false; break; }
    }
    if (!canPlaceFirst) continue;

    for (let i = 0; i < firstWord.word.length; i++) {
      const rr = dirFirst === 'across' ? rFirst : rFirst + i;
      const cc = dirFirst === 'across' ? cFirst + i : cFirst;
      grid[rr][cc] = firstWord.word[i];
    }
    placed.push({
      word: firstWord.word,
      clue: firstWord.clue,
      dir: dirFirst,
      r: rFirst,
      c: cFirst,
      len: firstWord.word.length
    });
    usedWords.add(firstWord.word);

    // 단어 확장 반복
    for (let step = 0; step < 40; step++) {
      if (placed.length >= targetWordCount) break;

      // 이미 배치된 단어들 중 교차 가능한 글자 위치 찾기
      const shuffledPlaced = shuffle(placed);
      let added = false;

      for (const p of shuffledPlaced) {
        if (added) break;
        const oppDir = p.dir === 'across' ? 'down' : 'across';

        // p의 각 글자 위치
        const indices = shuffle(Array.from({ length: p.len }, (_, i) => i));
        for (const idx of indices) {
          if (added) break;
          const char = p.word[idx];
          const intersectR = p.dir === 'across' ? p.r : p.r + idx;
          const intersectC = p.dir === 'across' ? p.c + idx : p.c;

          // 이미 교차하는 다른 단어가 oppDir 방향으로 있는지 확인
          const alreadyCrossed = placed.some(other => {
            if (other.dir !== oppDir) return false;
            if (oppDir === 'down') {
              return other.c === intersectC && intersectR >= other.r && intersectR < other.r + other.len;
            } else {
              return other.r === intersectR && intersectC >= other.c && intersectC < other.c + other.len;
            }
          });
          if (alreadyCrossed) continue;

          // 해당 글자를 포함하는 후보 단어들
          const wordMatches = shuffle(charIndex[char] || []);
          for (const match of wordMatches) {
            const candidate = match.item;
            if (usedWords.has(candidate.word)) continue;
            const charPosInCandidate = match.pos;

            // 시작 좌표 계산
            const startR = oppDir === 'down' ? intersectR - charPosInCandidate : intersectR;
            const startC = oppDir === 'across' ? intersectC - charPosInCandidate : intersectC;
            const wordLen = candidate.word.length;

            // 경계 검사
            if (startR < 0 || startC < 0) continue;
            if (oppDir === 'down' && startR + wordLen > 7) continue;
            if (oppDir === 'across' && startC + wordLen > 7) continue;

            // 단어 앞뒤 칸이 비어있어야 함 (단어가 더 길어지는 것 방지)
            if (oppDir === 'down') {
              if (startR > 0 && grid[startR - 1][startC] !== null) continue;
              if (startR + wordLen < 7 && grid[startR + wordLen][startC] !== null) continue;
            } else {
              if (startC > 0 && grid[startR][startC - 1] !== null) continue;
              if (startC + wordLen < 7 && grid[startR][startC + wordLen] !== null) continue;
            }

            // 모든 칸 검사:
            // 1. 교차점(intersectR, intersectC)은 글자 일치
            // 2. 다른 칸이 비어있으면 양옆(인접)에 다른 글자가 있으면 평행 충돌 위험 검사
            // 3. 다른 칸에 이미 글자가 있으면 그 글자와 일치해야 함
            let valid = true;
            for (let k = 0; k < wordLen; k++) {
              const curR = oppDir === 'down' ? startR + k : startR;
              const curC = oppDir === 'across' ? startC + k : startC;
              const curChar = candidate.word[k];

              if (grid[curR][curC] !== null) {
                if (grid[curR][curC] !== curChar) {
                  valid = false;
                  break;
                }
              } else {
                // 인접 칸에 글자가 있어서 평행으로 달라붙지 않는지 검사
                if (oppDir === 'down') {
                  if (curC > 0 && grid[curR][curC - 1] !== null) { valid = false; break; }
                  if (curC < 6 && grid[curR][curC + 1] !== null) { valid = false; break; }
                } else {
                  if (curR > 0 && grid[curR - 1][curC] !== null) { valid = false; break; }
                  if (curR < 6 && grid[curR + 1][curC] !== null) { valid = false; break; }
                }
              }
            }

            if (valid) {
              // 배치 성공!
              for (let k = 0; k < wordLen; k++) {
                const curR = oppDir === 'down' ? startR + k : startR;
                const curC = oppDir === 'across' ? startC + k : startC;
                grid[curR][curC] = candidate.word[k];
              }
              placed.push({
                word: candidate.word,
                clue: candidate.clue,
                dir: oppDir,
                r: startR,
                c: startC,
                len: wordLen
              });
              usedWords.add(candidate.word);
              added = true;
              break;
            }
          }
        }
      }
    }

    if (placed.length >= 7) {
      // 십자말풀이 표준 번호 매기기
      // 행우선(r, c) 순서로 시작점 정렬
      const cellNumbers = {};
      let numCounter = 1;

      // 7x7 그리드 순회하면서 단어의 시작점 찾기
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const startsWord = placed.some(p => p.r === r && p.c === c);
          if (startsWord) {
            cellNumbers[`${r},${c}`] = numCounter++;
          }
        }
      }

      // 각 단어에 번호 부여
      const finalWords = placed.map(p => {
        const num = cellNumbers[`${p.r},${p.c}`];
        return {
          num,
          dir: p.dir, // 'across' 또는 'down'
          dirKo: p.dir === 'across' ? '가로' : '세로',
          r: p.r,
          c: p.c,
          len: p.len,
          word: p.word,
          clue: p.clue
        };
      });

      // 가로/세로 번호순 정렬
      finalWords.sort((a, b) => a.num - b.num || (a.dir === 'across' ? -1 : 1));

      return {
        seed,
        grid,
        words: finalWords,
        wordCount: finalWords.length
      };
    }
  }

  return null;
}

// 100개 단계 생성 테스트
console.log("100개 단계 생성 시작...");
const allPuzzles = [];
for (let stage = 1; stage <= 10; stage++) {
  for (let level = 1; level <= 10; level++) {
    const globalLevel = (stage - 1) * 10 + level;
    let seed = globalLevel * 1000 + 42;
    let puzzle = null;
    while (!puzzle) {
      puzzle = generatePuzzle(seed, 7);
      seed++;
    }
    puzzle.stage = stage;
    puzzle.level = level;
    puzzle.globalLevel = globalLevel;
    allPuzzles.push(puzzle);
  }
}

console.log(`성공적으로 생성된 퍼즐 수: ${allPuzzles.length}개!`);
console.log(`첫 번째 퍼즐 단어 수: ${allPuzzles[0].words.length}개`);
allPuzzles[0].words.forEach(w => {
  console.log(`- [${w.dirKo} ${w.num}번] (${w.r}, ${w.c}) ${w.word} : ${w.clue}`);
});

// JSON 저장
fs.writeFileSync('scripts/puzzles_100.json', JSON.stringify(allPuzzles, null, 2), 'utf8');
console.log("scripts/puzzles_100.json 저장 완료!");
