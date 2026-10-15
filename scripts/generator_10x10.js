// scripts/generator_10x10.js
// 10x10 가로세로 낱말퍼즐 100단계 초고밀도(Ultra-Dense) & 전역 비중복(Global Unique) 생성 엔진
const fs = require('fs');
const path = require('path');

// Mulberry32 결정론적 시드 난수 생성기
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
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

// 10x10 초고밀도 퍼즐 단일 생성기
function generateDense10x10Puzzle(seed, targetWords, minFilled, pool, usedGlobal) {
  let rngVal = seed;
  function rand() {
    rngVal = (rngVal * 9301 + 49297) % 233280;
    return rngVal / 233280;
  }

  // 2~4글자 위주로 우선 필터링하되 5글자도 일부 허용
  const available = pool.filter(v => !usedGlobal.has(v.word) && v.word.length >= 2 && v.word.length <= 5);
  if (available.length < targetWords) return null;

  const charIndex = buildCharIndex(available);

  for (let attempt = 0; attempt < 40; attempt++) {
    const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    const placed = [];
    const usedInStage = new Set();

    // 초기 시드 단어 (중앙 2~4행, 2~4열 부근)
    const seedPool = available.filter(v => v.word.length >= 3 && v.word.length <= 4);
    if (seedPool.length === 0) continue;
    const seedWord = seedPool[Math.floor(rand() * seedPool.length)];
    const dir0 = rand() > 0.5 ? 'across' : 'down';
    const r0 = dir0 === 'across' ? (2 + Math.floor(rand() * 4)) : (1 + Math.floor(rand() * 4));
    const c0 = dir0 === 'across' ? (1 + Math.floor(rand() * 4)) : (2 + Math.floor(rand() * 4));

    if (!canPlaceWord(grid, seedWord.word, dir0, r0, c0)) continue;
    applyWord(grid, seedWord.word, dir0, r0, c0);
    placed.push({ word: seedWord.word, clue: seedWord.clue, dir: dir0, r: r0, c: c0, len: seedWord.word.length });
    usedInStage.add(seedWord.word);

    // 단어 점진적 추가 (최대 150 반복)
    for (let iter = 0; iter < 150; iter++) {
      if (placed.length >= targetWords) break;

      let curMinR = GRID_SIZE, curMaxR = 0, curMinC = GRID_SIZE, curMaxC = 0;
      for (const p of placed) {
        curMinR = Math.min(curMinR, p.r);
        curMaxR = Math.max(curMaxR, p.dir === 'down' ? p.r + p.len - 1 : p.r);
        curMinC = Math.min(curMinC, p.c);
        curMaxC = Math.max(curMaxC, p.dir === 'across' ? p.c + p.len - 1 : p.c);
      }

      const validPlacements = [];
      for (const p of placed) {
        const oppDir = p.dir === 'across' ? 'down' : 'across';
        for (let i = 0; i < p.len; i++) {
          const char = p.word[i];
          const ir = p.dir === 'across' ? p.r : p.r + i;
          const ic = p.dir === 'across' ? p.c + i : p.c;

          const already = placed.some(other => {
            if (other.dir !== oppDir) return false;
            return oppDir === 'down'
              ? (other.c === ic && ir >= other.r && ir < other.r + other.len)
              : (other.r === ir && ic >= other.c && ic < other.c + other.len);
          });
          if (already) continue;

          const matches = charIndex[char] || [];
          for (const m of matches) {
            const cand = m.item;
            if (usedInStage.has(cand.word)) continue;
            const sr = oppDir === 'down' ? ir - m.pos : ir;
            const sc = oppDir === 'across' ? ic - m.pos : ic;
            if (canPlaceWord(grid, cand.word, oppDir, sr, sc)) {
              const er = oppDir === 'down' ? sr + cand.word.length - 1 : sr;
              const ec = oppDir === 'across' ? sc + cand.word.length - 1 : sc;

              // 외곽 확장 및 빈 구역 진출 시 높은 가중치 부여
              let weight = 1;
              if (sr < curMinR || er > curMaxR) weight += 2.5;
              if (sc < curMinC || ec > curMaxC) weight += 2.5;
              if (sr <= 1 || er >= 8) weight += 2.0;
              if (sc <= 1 || ec >= 8) weight += 2.0;

              validPlacements.push({ cand, dir: oppDir, r: sr, c: sc, len: cand.word.length, weight });
            }
          }
        }
      }

      if (validPlacements.length === 0) break;

      // 가중치 룰렛 선택
      const totalWeight = validPlacements.reduce((sum, v) => sum + v.weight, 0);
      let rnd = rand() * totalWeight;
      let chosen = validPlacements[0];
      for (const vp of validPlacements) {
        rnd -= vp.weight;
        if (rnd <= 0) {
          chosen = vp;
          break;
        }
      }

      applyWord(grid, chosen.cand.word, chosen.dir, chosen.r, chosen.c);
      placed.push({
        word: chosen.cand.word,
        clue: chosen.cand.clue,
        dir: chosen.dir,
        r: chosen.r,
        c: chosen.c,
        len: chosen.len
      });
      usedInStage.add(chosen.cand.word);
    }

    if (placed.length >= targetWords) {
      let filled = 0;
      let minR = GRID_SIZE, maxR = 0, minC = GRID_SIZE, maxC = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] !== null) {
            filled++;
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
            minC = Math.min(minC, c);
            maxC = Math.max(maxC, c);
          }
        }
      }

      if (filled < minFilled) continue;
      // 전역 커버리지: 사방 외곽에 최소 2행/열 이내 접근 보장 (한쪽 쏠림 방지)
      if (minR > 2 || maxR < 7 || minC > 2 || maxC < 7) continue;

      // 연결성 검증: 모든 단어가 최소 1개 이상 다른 단어와 교차
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
      if (!allCrossed) continue;

      // 번호 부여 (전통 십자말풀이 표준)
      const cellNumbers = {};
      let numCounter = 1;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (placed.some(p => p.r === r && p.c === c)) {
            cellNumbers[`${r},${c}`] = numCounter++;
          }
        }
      }

      const finalWords = placed.map(p => ({
        num: cellNumbers[`${p.r},${p.c}`],
        dir: p.dir,
        dirKo: p.dir === 'across' ? '가로' : '세로',
        r: p.r,
        c: p.c,
        len: p.len,
        word: p.word,
        clue: p.clue
      }));
      finalWords.sort((a, b) => a.num - b.num || (a.dir === 'across' ? -1 : 1));

      return {
        grid,
        words: finalWords,
        wordCount: finalWords.length,
        filledCells: filled,
        minR, maxR, minC, maxC
      };
    }
  }

  return null;
}

// 100단계 전수 생성 파이프라인
function generateAll100Stages() {
  console.log("=================================================");
  console.log("10x10 초고밀도 100단계 전역 비중복 퍼즐 전수 생성 시작...");
  console.log("=================================================");

  const globalUsedWords = new Set();
  const allStages = [];
  let totalWords = 0, totalFilled = 0;

  for (let stage = 1; stage <= 10; stage++) {
    console.log(`\n[스테이지 ${stage}] 시작 (누적 고유 단어: ${globalUsedWords.size}개)`);

    for (let level = 1; level <= 10; level++) {
      const globalLevel = (stage - 1) * 10 + level;
      let seed = globalLevel * 1009 + 317;
      let puzzle = null;

      // 단계별 점진적 타깃 완화 (최대 20문항/48칸 -> 최소 13문항/30칸 안전망)
      const targets = [
        { words: 20, filled: 48 },
        { words: 19, filled: 46 },
        { words: 18, filled: 44 },
        { words: 17, filled: 42 },
        { words: 16, filled: 39 },
        { words: 15, filled: 36 },
        { words: 14, filled: 33 },
        { words: 13, filled: 30 }
      ];

      for (const t of targets) {
        let tries = 0;
        while (!puzzle && tries < 70) {
          puzzle = generateDense10x10Puzzle(seed, t.words, t.filled, FULL_VOCAB, globalUsedWords);
          seed += 23;
          tries++;
        }
        if (puzzle) break;
      }

      if (!puzzle) {
        throw new Error(`스테이지 ${stage}-${level}단계 생성 실패! (시드: ${seed})`);
      }

      puzzle.stage = stage;
      puzzle.level = level;
      puzzle.globalLevel = globalLevel;

      // 생성된 퍼즐의 단어들을 글로벌 세트에 등록 (전역 100% 무중복 보장)
      puzzle.words.forEach(w => globalUsedWords.add(w.word));
      allStages.push(puzzle);
      totalWords += puzzle.words.length;
      totalFilled += puzzle.filledCells;

      process.stdout.write(`.${puzzle.words.length}(${puzzle.filledCells}칸) `);
      if (level === 10) console.log(`\n -> [스테이지 ${stage} 완료, 누적 고유 단어: ${globalUsedWords.size}개]`);
    }
  }

  console.log("\n=================================================");
  console.log(`[생성 성공!] 100단계 전체 초고밀도 퍼즐 생성 완료!`);
  console.log(`총 배치된 고유 단어 수: ${globalUsedWords.size}개 (전 단계 100% 비중복)`);
  console.log(`평균 문항 수: ${(totalWords / 100).toFixed(1)}개 / 단계 (최소: ${Math.min(...allStages.map(s => s.words.length))}, 최대: ${Math.max(...allStages.map(s => s.words.length))})`);
  console.log(`평균 활성 칸 수: ${(totalFilled / 100).toFixed(1)}칸 / 100칸 (기존 28.7칸 대비 대폭 증가!)`);
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
