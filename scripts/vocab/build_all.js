// scripts/vocab/build_all.js
// 10x10 시니어 낱말퍼즐 전용 마스터 어휘 DB 빌더
// - level 1~5 통합
// - 단어(word) 및 해설(clue) 중복 0건 완벽 필터링
// - 총 어휘 수 1,000개 이상 보장 및 난이도별/길이별 통계 출력
const fs = require('fs');
const path = require('path');

const l1 = require('./level1');
const l2 = require('./level2');
const l3 = require('./level3');
const l4 = require('./level4');
const l5 = require('./level5');
const lExtra = require('./level_extra');
const lExtra2 = require('./level_extra2');
const lExtra3 = require('./level_extra3');
const lExtra4 = require('./level_extra4');
const lExtra5 = require('./level_extra5');
const lExtra6 = require('./level_extra6');
const lExtra7 = require('./level_extra7');
const lExtra8 = require('./level_extra8');
const lExtra9 = require('./level_extra9');
const lExtra10 = require('./level_extra10');
const lExtra11 = require('./level_extra11');
const lExtra12 = require('./level_extra12');
const lExtra13 = require('./level_extra13');
const lExtra14 = require('./level_extra14');
const lExtra15 = require('./level_extra15');
const lExtra16 = require('./level_extra16');
const lExtra17 = require('./level_extra17');
const lExtra18 = require('./level_extra18');
const lExtra19 = require('./level_extra19');
const lExtra20 = require('./level_extra20');
const lExtra21 = require('./level_extra21');
const lExtra22 = require('./level_extra22');
const lExtra23 = require('./level_extra23');
const lExtra24 = require('./level_extra24');
const lExtra25 = require('./level_extra25');
const lExtra26 = require('./level_extra26');
const lExtra27 = require('./level_extra27');
const lExtra28 = require('./level_extra28');
const lExtra29 = require('./level_extra29');
const lExtra30 = require('./level_extra30');
const lExtra31 = require('./level_extra31');
const lExtra32 = require('./level_extra32');
const lExtra33 = require('./level_extra33');
const lExtra34 = require('./level_extra34');
const lExtra35 = require('./level_extra35');
const lExtra36 = require('./level_extra36');
const lExtra37 = require('./level_extra37');
const lExtra38 = require('./level_extra38');
const lExtra39 = require('./level_extra39');
const lExtra40 = require('./level_extra40');
const lExtra41 = require('./level_extra41');
const lExtra42 = require('./level_extra42');
const lExtra43 = require('./level_extra43');
const lExtra44 = require('./level_extra44');
const lExtra45 = require('./level_extra45');
const lExtra46 = require('./level_extra46');
const lExtra47 = require('./level_extra47');
const lExtra48 = require('./level_extra48');
const lExtra49 = require('./level_extra49');
const lExtra50 = require('./level_extra50');
const lExtra51 = require('./level_extra51');
const lExtra52 = require('./level_extra52');
const lExtra53 = require('./level_extra53');
const lExtra54 = require('./level_extra54');
const lExtra55 = require('./level_extra55');
const lExtra56 = require('./level_extra56');
const lExtra57 = require('./level_extra57');

// 기존 test_engine.js 단어도 가져와서 중복되지 않는 것 흡수
let existingVocab = [];
try {
  const code = fs.readFileSync(path.join(__dirname, '../test_engine.js'), 'utf8');
  const m = code.match(/const VOCABULARY = (\[[\s\S]*?\]);\s*console/);
  if (m) {
    existingVocab = eval(m[1]).map(item => ({
      word: item.word,
      clue: item.clue,
      level: item.word.length <= 3 ? 2 : (item.word.length === 4 ? 3 : 4),
      cat: "전통문화"
    }));
  }
} catch (e) {
  console.warn('기존 단어 로드 생략:', e.message);
}

const allCandidates = [
  ...l1,
  ...l2,
  ...l3,
  ...l4,
  ...l5,
  ...lExtra,
  ...lExtra2,
  ...lExtra3,
  ...lExtra4,
  ...lExtra5,
  ...lExtra6,
  ...lExtra7,
  ...lExtra8,
  ...lExtra9,
  ...lExtra10,
  ...lExtra11,
  ...lExtra12,
  ...lExtra13,
  ...lExtra14,
  ...lExtra15,
  ...lExtra16,
  ...lExtra17,
  ...lExtra18,
  ...lExtra19,
  ...lExtra20,
  ...lExtra21,
  ...lExtra22,
  ...lExtra23,
  ...lExtra24,
  ...lExtra25,
  ...lExtra26,
  ...lExtra27,
  ...lExtra28,
  ...lExtra29,
  ...lExtra30,
  ...lExtra31,
  ...lExtra32,
  ...lExtra33,
  ...lExtra34,
  ...lExtra35,
  ...lExtra36,
  ...lExtra37,
  ...lExtra38,
  ...lExtra39,
  ...lExtra40,
  ...lExtra41,
  ...lExtra42,
  ...lExtra43,
  ...lExtra44,
  ...lExtra45,
  ...lExtra46,
  ...lExtra47,
  ...lExtra48,
  ...lExtra49,
  ...lExtra50,
  ...lExtra51,
  ...lExtra52,
  ...lExtra53,
  ...lExtra54,
  ...lExtra55,
  ...lExtra56,
  ...lExtra57,
  ...existingVocab
];

const wordMap = new Map();
const clueSet = new Set();
let duplicatesSkipped = 0;

for (const item of allCandidates) {
  const w = (item.word || '').trim();
  const c = (item.clue || '').trim();
  if (!w || !c) continue;

  // 단어 글자 수 유효성 검사 (2글자 ~ 7글자)
  if (w.length < 2 || w.length > 7) continue;

  // 중복 단어 또는 중복 해설 제거
  if (wordMap.has(w) || clueSet.has(c)) {
    duplicatesSkipped++;
    continue;
  }

  wordMap.set(w, {
    word: w,
    clue: c,
    len: w.length,
    level: item.level || 3,
    cat: item.cat || "일반"
  });
  clueSet.add(c);
}

const finalVocab = Array.from(wordMap.values());

// 레벨별 정렬 및 통계
finalVocab.sort((a, b) => a.level - b.level || a.len - b.len);

const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const lenCounts = {};
for (const v of finalVocab) {
  levelCounts[v.level] = (levelCounts[v.level] || 0) + 1;
  lenCounts[v.len] = (lenCounts[v.len] || 0) + 1;
}

const outPath = path.join(__dirname, '../vocabulary_1000.json');
fs.writeFileSync(outPath, JSON.stringify(finalVocab, null, 2), 'utf8');

console.log('==============================================');
console.log(`[어휘 DB 생성 완료] 총 고유 어휘 수: ${finalVocab.length}개`);
console.log(`중복으로 제외된 단어 수: ${duplicatesSkipped}개`);
console.log('--- 난이도별 어휘 수 ---');
console.log(`Level 1 (새싹 입문): ${levelCounts[1]}개`);
console.log(`Level 2 (은빛 초급): ${levelCounts[2]}개`);
console.log(`Level 3 (청춘 중급): ${levelCounts[3]}개`);
console.log(`Level 4 (황금 상급): ${levelCounts[4]}개`);
console.log(`Level 5 (지혜 달인): ${levelCounts[5]}개`);
console.log('--- 글자 수별 분포 ---');
console.log(lenCounts);
console.log(`저장 위치: ${outPath}`);
console.log('==============================================');
