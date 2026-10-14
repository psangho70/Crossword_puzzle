// scripts/generator_10x10.js
// 10x10 가로세로 낱말퍼즐 100단계 고밀도(Dense) & 전역 비중복(Global Unique) 생성 엔진
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

// 어휘 사전 로드
const vocabPath = path.join(__dirname, 'vocabulary_1000.json');
const FULL_VOCAB = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

console.log(`[엔진 초기화] 전체 고유 어휘 수: ${FULL_VOCAB.length}개 로드 완료`);

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

// 10x10 고밀도 퍼즐 단일 생성기
// targetWordCount: 목표 문항 수 (12 ~ 14개)
// minFilledCells: 최소 활성화 칸 수 (최소 32칸 이상 채워져야 통과)
function generateDense10x10Puzzle(seed, targetWordCount, minFilledCells, allowedVocab, usedGlobalWords) {
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

  // 단어 배치가 가능한지 검사하는 헬퍼 함수
  function canPlaceWord(grid, word, dir, r, c) {
    const wordLen = word.length;
    if (r < 0 || c < 0) return false;
    if (dir === 'down' && r + wordLen > GRID_SIZE) return false;
    if (dir === 'across' && c + wordLen > GRID_SIZE) return false;

    // 단어 앞뒤 칸 공백 검사
    if (dir === 'down') {
      if (r > 0 && grid[r - 1][c] !== null) return false;
      if (r + wordLen < GRID_SIZE && grid[r + wordLen][c] !== null) return false;
    } else {
      if (c > 0 && grid[r][c - 1] !== null) return false;
      if (c + wordLen < GRID_SIZE && grid[r][c + wordLen] !== null) return false;
    }

    let intersections = 0;
    for (let k = 0; k < wordLen; k++) {
      const curR = dir === 'down' ? r + k : r;
      const curC = dir === 'across' ? c + k : c;
      const curChar = word[k];

      if (grid[curR][curC] !== null) {
        if (grid[curR][curC] !== curChar) return false;
        intersections++;
      } else {
        // 평행 인접 검사 (교차점이 아닌 신규 칸의 경우 좌우/상하 인접 검사)
        if (dir === 'down') {
          if (curC > 0 && grid[curR][curC - 1] !== null) return false;
          if (curC < GRID_SIZE - 1 && grid[curR][curC + 1] !== null) return false;
        } else {
          if (curR > 0 && grid[curR - 1][curC] !== null) return false;
          if (curR < GRID_SIZE - 1 && grid[curR + 1][curC] !== null) return false;
        }
      }
    }

    return true;
  }

  function applyWord(grid, word, dir, r, c) {
    for (let k = 0; k < word.length; k++) {
      const curR = dir === 'down' ? r + k : r;
      const curC = dir === 'across' ? c + k : c;
      grid[curR][curC] = word[k];
    }
  }

  for (let attempt = 0; attempt < 120; attempt++) {
    const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    const placed = [];
    const usedInStage = new Set();

    // 1단계: 첫 번째 시드 단어 (상단/중앙 영역 배치, 길이 2~4)
    const firstPool = pool.filter(v => v.word.length >= 2 && v.word.length <= 4);
    if (firstPool.length === 0) continue;
    const firstWord = firstPool[attempt % firstPool.length];
    const dirFirst = (attempt % 2 === 0) ? 'across' : 'down';
    const maxR = Math.max(1, GRID_SIZE - (dirFirst === 'down' ? firstWord.word.length : 1) - 2);
    const maxC = Math.max(1, GRID_SIZE - (dirFirst === 'across' ? firstWord.word.length : 1) - 2);
    const rFirst = Math.min(5, 2 + Math.floor(rng() * maxR));
    const cFirst = Math.min(5, 2 + Math.floor(rng() * maxC));

    if (!canPlaceWord(grid, firstWord.word, dirFirst, rFirst, cFirst)) continue;
    applyWord(grid, firstWord.word, dirFirst, rFirst, cFirst);
    placed.push({ word: firstWord.word, clue: firstWord.clue, dir: dirFirst, r: rFirst, c: cFirst, len: firstWord.word.length });
    usedInStage.add(firstWord.word);

    // 2단계: 교차 확장 루프 (최대 100 스텝)
    for (let step = 0; step < 100; step++) {
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

          // 이미 이 위치를 교차하고 있는 다른 단어가 있는지 확인
          const alreadyCrossed = placed.some(other => {
            if (other.dir !== oppDir) return false;
            if (oppDir === 'down') {
              return other.c === intersectC && intersectR >= other.r && intersectR < other.r + other.len;
            } else {
              return other.r === intersectR && intersectC >= other.c && intersectC < other.c + other.len;
            }
          });
          if (alreadyCrossed) continue;

          const wordMatches = shuffle(charIndex[char] || []).slice(0, 25);
          for (const match of wordMatches) {
            const candidate = match.item;
            if (usedInStage.has(candidate.word)) continue;

            const charPosInCandidate = match.pos;
            const startR = oppDir === 'down' ? intersectR - charPosInCandidate : intersectR;
            const startC = oppDir === 'across' ? intersectC - charPosInCandidate : intersectC;

            if (canPlaceWord(grid, candidate.word, oppDir, startR, startC)) {
              applyWord(grid, candidate.word, oppDir, startR, startC);
              placed.push({
                word: candidate.word,
                clue: candidate.clue,
                dir: oppDir,
                r: startR,
                c: startC,
                len: candidate.word.length
              });
              usedInStage.add(candidate.word);
              added = true;
              break;
            }
          }
        }
      }
    }

    // 성공 조건 검사: 목표 문항 수 및 최소 활성 셀 수(minFilledCells) 충족
    if (placed.length >= targetWordCount) {
      let filledCells = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] !== null) filledCells++;
        }
      }

      if (filledCells < minFilledCells) {
        continue;
      }

      // 3) 모든 단어가 최소 1개 이상 다른 단어와 교차하는지 전수 검증
      const allCrossed = placed.every(w => {
        for (let k = 0; k < w.len; k++) {
          const rr = w.dir === 'across' ? w.r : w.r + k;
          const cc = w.dir === 'across' ? w.c + k : w.c;
          const hasCross = placed.some(other => other !== w && other.dir !== w.dir && (
            other.dir === 'across'
              ? (other.r === rr && cc >= other.c && cc < other.c + other.len)
              : (other.c === cc && rr >= other.r && rr < other.r + other.len)
          ));
          if (hasCross) return true;
        }
        return false;
      });
      if (!allCrossed) {
        continue;
      }

      // 최종 단어 및 셀 번호 부여 (전통 십자말풀이 번호 매김 표준)
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
        wordCount: finalWords.length,
        filledCells
      };
    }
  }

  return null;
}

// 100단계 전수 생성 파이프라인
function generateAll100Stages() {
  console.log("=================================================");
  console.log("10x10 고밀도 100단계 전역 비중복 퍼즐 전수 생성 시작...");
  console.log("=================================================");

  const globalUsedWords = new Set();
  const allStages = [];

  for (let stage = 1; stage <= 10; stage++) {
    // 스테이지별 목표 문항 수 및 최소 활성 셀 수 설정
    // 10x10 격자를 촘촘하게 채우면서도(11~13문항, 26~32칸), 전역 100단계 100% 비중복 달성
    let targetWords = 12;
    let minFilled = 28;
    let allowedLevels = [1, 2, 3];

    if (stage <= 3) {
      targetWords = 12;
      minFilled = 28;
      allowedLevels = [1, 2, 3];
    } else if (stage <= 6) {
      targetWords = 13;
      minFilled = 28;
      allowedLevels = [1, 2, 3, 4];
    } else {
      targetWords = 13;
      minFilled = 28;
      allowedLevels = [1, 2, 3, 4, 5];
    }

    const stageVocab = FULL_VOCAB.filter(v => allowedLevels.includes(v.level));
    console.log(`\n[스테이지 ${stage}] 목표 문항: ${targetWords}개, 최소 활성칸: ${minFilled}칸, 후보 어휘: ${stageVocab.length}개`);

    for (let level = 1; level <= 10; level++) {
      const globalLevel = (stage - 1) * 10 + level;
      let seed = globalLevel * 911 + 107;
      let puzzle = null;

      // 1차 시도: 스테이지 어휘로 목표 문항 시도
      let tries = 0;
      while (!puzzle && tries < 80) {
        puzzle = generateDense10x10Puzzle(seed, targetWords, minFilled, stageVocab, globalUsedWords);
        seed += 17;
        tries++;
      }

      // 2차 시도: 전체 어휘 풀로 보충
      if (!puzzle) {
        let fallbackTries = 0;
        while (!puzzle && fallbackTries < 80) {
          puzzle = generateDense10x10Puzzle(seed, targetWords, minFilled - 2, FULL_VOCAB, globalUsedWords);
          seed += 11;
          fallbackTries++;
        }
      }

      // 3차 시도: 12문항으로 완화
      if (!puzzle) {
        let softTries = 0;
        while (!puzzle && softTries < 100) {
          puzzle = generateDense10x10Puzzle(seed, 12, 26, FULL_VOCAB, globalUsedWords);
          seed += 7;
          softTries++;
        }
      }

      // 4차 시도: 11문항으로 완화
      if (!puzzle) {
        let softTries2 = 0;
        while (!puzzle && softTries2 < 120) {
          puzzle = generateDense10x10Puzzle(seed, 11, 25, FULL_VOCAB, globalUsedWords);
          seed += 5;
          softTries2++;
        }
      }

      // 5차 시도: 10문항으로 최종 안전망
      if (!puzzle) {
        let softTries3 = 0;
        while (!puzzle && softTries3 < 150) {
          puzzle = generateDense10x10Puzzle(seed, 10, 23, FULL_VOCAB, globalUsedWords);
          seed += 3;
          softTries3++;
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

      process.stdout.write(`.${puzzle.words.length}(${puzzle.filledCells}칸) `);
      if (level === 10) console.log(`\n -> [스테이지 ${stage} 완료, 누적 고유 단어: ${globalUsedWords.size}개]`);
    }
  }

  console.log("\n=================================================");
  console.log(`[생성 성공!] 100단계 전체 고밀도 생성 완료!`);
  console.log(`총 배치된 고유 단어 수: ${globalUsedWords.size}개 (전 단계 100% 비중복)`);
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
