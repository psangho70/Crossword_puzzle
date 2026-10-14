// scripts/generator_10x10.js
// 10x10 가로세로 낱말퍼즐 100단계 생성 및 전역 비중복(Global Unique) 배치 엔진
const fs = require('fs');
const path = require('path');

// Mulberry32 결정론적 시드 난수 생성기
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// 1,000+개 어휘 사전 로드
const vocabPath = path.join(__dirname, 'vocabulary_1000.json');
const FULL_VOCAB = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

console.log(`[엔진 초기화] 전체 어휘 수: ${FULL_VOCAB.length}개 로드 완료`);

const GRID_SIZE = 10;

// 글자별 인덱스 구축 (문자 -> 단어 리스트)
function buildCharIndex(vocabList) {
  const charIndex = {};
  vocabList.forEach(item => {
    for (let i = 0; i < item.word.length; i++) {
      const ch = item.word[i];
      if (!charIndex[ch]) charIndex[ch] = [];
      charIndex[ch].push({ item, pos: i });
    }
  });
  return charIndex;
}

// 10x10 단일 퍼즐 생성기
function generate10x10Puzzle(seed, targetWordCount, allowedVocab, usedGlobalWords) {
  const rng = mulberry32(seed);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 아직 글로벌에서 사용되지 않은 후보 단어들
  const pool = allowedVocab.filter(v => !usedGlobalWords.has(v.word));
  if (pool.length < targetWordCount) return null;

  const charIndex = buildCharIndex(pool);

  for (let attempt = 0; attempt < 500; attempt++) {
    const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    const placed = [];
    const usedInStage = new Set();

    // 첫 번째 단어 선택 (길이 3~5인 단어, 중앙 부근에 배치)
    const firstCandidates = shuffle(pool.filter(v => v.word.length >= 3 && v.word.length <= 5));
    if (firstCandidates.length === 0) continue;
    const firstWord = firstCandidates[0];
    const dirFirst = rng() > 0.5 ? 'across' : 'down';
    const rFirst = dirFirst === 'across' ? 3 + Math.floor(rng() * 4) : Math.floor(rng() * (GRID_SIZE + 1 - firstWord.word.length));
    const cFirst = dirFirst === 'across' ? Math.floor(rng() * (GRID_SIZE + 1 - firstWord.word.length)) : 3 + Math.floor(rng() * 4);

    let canPlaceFirst = true;
    for (let i = 0; i < firstWord.word.length; i++) {
      const rr = dirFirst === 'across' ? rFirst : rFirst + i;
      const cc = dirFirst === 'across' ? cFirst + i : cFirst;
      if (rr < 0 || rr >= GRID_SIZE || cc < 0 || cc >= GRID_SIZE) { canPlaceFirst = false; break; }
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
    usedInStage.add(firstWord.word);

    // 단어 확장 반복
    for (let step = 0; step < 80; step++) {
      if (placed.length >= targetWordCount) break;

      const shuffledPlaced = shuffle(placed);
      let added = false;

      for (const p of shuffledPlaced) {
        if (added) break;
        const oppDir = p.dir === 'across' ? 'down' : 'across';

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

          const wordMatches = shuffle(charIndex[char] || []);
          for (const match of wordMatches) {
            const candidate = match.item;
            if (usedInStage.has(candidate.word)) continue;
            const charPosInCandidate = match.pos;

            const startR = oppDir === 'down' ? intersectR - charPosInCandidate : intersectR;
            const startC = oppDir === 'across' ? intersectC - charPosInCandidate : intersectC;
            const wordLen = candidate.word.length;

            if (startR < 0 || startC < 0) continue;
            if (oppDir === 'down' && startR + wordLen > GRID_SIZE) continue;
            if (oppDir === 'across' && startC + wordLen > GRID_SIZE) continue;

            // 단어 앞뒤 칸 공백 확인
            if (oppDir === 'down') {
              if (startR > 0 && grid[startR - 1][startC] !== null) continue;
              if (startR + wordLen < GRID_SIZE && grid[startR + wordLen][startC] !== null) continue;
            } else {
              if (startC > 0 && grid[startR][startC - 1] !== null) continue;
              if (startC + wordLen < GRID_SIZE && grid[startR][startC + wordLen] !== null) continue;
            }

            // 모든 칸 충돌 및 평행 인접 검사
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
                // 평행 인접 검사
                if (oppDir === 'down') {
                  if (curC > 0 && grid[curR][curC - 1] !== null) { valid = false; break; }
                  if (curC < GRID_SIZE - 1 && grid[curR][curC + 1] !== null) { valid = false; break; }
                } else {
                  if (curR > 0 && grid[curR - 1][curC] !== null) { valid = false; break; }
                  if (curR < GRID_SIZE - 1 && grid[curR + 1][curC] !== null) { valid = false; break; }
                }
              }
            }

            if (valid) {
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
              usedInStage.add(candidate.word);
              added = true;
              break;
            }
          }
        }
      }
    }

    if (placed.length >= targetWordCount) {
      // 십자말풀이 표준 번호 매기기 (행우선 정렬)
      const cellNumbers = {};
      let numCounter = 1;

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const startsWord = placed.some(p => p.r === r && p.c === c);
          if (startsWord) {
            cellNumbers[`${r},${c}`] = numCounter++;
          }
        }
      }

      const finalWords = placed.map(p => {
        const num = cellNumbers[`${p.r},${p.c}`];
        return {
          num,
          dir: p.dir,
          dirKo: p.dir === 'across' ? '가로' : '세로',
          r: p.r,
          c: p.c,
          len: p.len,
          word: p.word,
          clue: p.clue
        };
      });

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

// 100단계 전수 생성 파이프라인
function generateAll100Stages() {
  console.log("=================================================");
  console.log("10x10 100단계 전역 비중복 퍼즐 전수 생성 시작...");
  console.log("=================================================");

  const globalUsedWords = new Set();
  const allStages = [];

  for (let stage = 1; stage <= 10; stage++) {
    // 스테이지별 난이도 및 목표 문항 수 설정
    let targetWords = 8;
    let allowedLevels = [1, 2];

    if (stage <= 3) {
      targetWords = 8;
      allowedLevels = [1, 2];
    } else if (stage <= 7) {
      targetWords = 9;
      allowedLevels = [1, 2, 3, 4];
    } else {
      targetWords = 10;
      allowedLevels = [2, 3, 4, 5];
    }

    const stageVocab = FULL_VOCAB.filter(v => allowedLevels.includes(v.level));

    console.log(`[스테이지 ${stage}] 목표 문항: ${targetWords}개, 후보 어휘: ${stageVocab.length}개`);

    for (let level = 1; level <= 10; level++) {
      const globalLevel = (stage - 1) * 10 + level;
      let seed = globalLevel * 777 + 101;
      let puzzle = null;

      let tries = 0;
      while (!puzzle && tries < 80) {
        puzzle = generate10x10Puzzle(seed, targetWords, stageVocab, globalUsedWords);
        seed += 13;
        tries++;
      }

      // 혹시 목표 단어수 도달이 어려우면 전체 어휘에서 보충 시도
      if (!puzzle) {
        let fallbackTries = 0;
        while (!puzzle && fallbackTries < 100) {
          puzzle = generate10x10Puzzle(seed, Math.max(7, targetWords - 1), FULL_VOCAB, globalUsedWords);
          seed += 7;
          fallbackTries++;
        }
      }

      if (!puzzle) {
        throw new Error(`스테이지 ${stage}-${level}단계 생성 실패! (시드: ${seed})`);
      }

      puzzle.stage = stage;
      puzzle.level = level;
      puzzle.globalLevel = globalLevel;

      // 생성된 퍼즐의 단어들을 글로벌 세트에 등록 (중복 출제 원천 차단)
      puzzle.words.forEach(w => globalUsedWords.add(w.word));
      allStages.push(puzzle);

      process.stdout.write(`.` );
      if (level === 10) console.log(` [스테이지 ${stage} 완료, 누적 고유 단어: ${globalUsedWords.size}개]`);
    }
  }

  console.log("\n=================================================");
  console.log(`[생성 성공!] 100단계 전체 생성 완료!`);
  console.log(`총 배치된 고유 단어 수: ${globalUsedWords.size}개 (중복률 0.0%)`);
  console.log("=================================================");

  const outJson = path.join(__dirname, 'puzzles_100_10x10.json');
  fs.writeFileSync(outJson, JSON.stringify(allStages, null, 2), 'utf8');
  console.log(`퍼즐 데이터 저장 완료: ${outJson}`);

  return allStages;
}

if (require.main === module) {
  generateAll100Stages();
}

module.exports = { generateAll100Stages };
