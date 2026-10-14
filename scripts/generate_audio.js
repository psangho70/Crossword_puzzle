// 문제 듣기용 한국어 음성 MP3 사전 생성 스크립트 (빌드 타임 전용, Node 18+)
// 실행: node scripts/generate_audio.js
// - 스마트폰 기기 TTS 엔진(음성 데이터 미설치/엔진 차이)에 의존하지 않도록
//   모든 문제 음성을 같은 도메인의 정적 MP3 파일로 미리 만들어 audio/ 폴더에 저장합니다.
// - 이미 생성된 파일은 건너뛰므로 여러 번 실행해도 안전합니다.
const fs = require('fs');
const path = require('path');
const { prefixText, clueText, audioFileName } = require('./audio_util');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'audio');
const puzzleFile = fs.existsSync(path.join(__dirname, 'puzzles_100_10x10.json'))
  ? 'puzzles_100_10x10.json'
  : 'puzzles_100.json';
console.log(`오디오 대상 퍼즐 파일: ${puzzleFile}`);
const puzzles = JSON.parse(fs.readFileSync(path.join(__dirname, puzzleFile), 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function synthesize(text) {
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=' + encodeURIComponent(text);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const type = res.headers.get('content-type') || '';
  if (!type.includes('audio')) throw new Error('Unexpected content-type: ' + type);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error('Audio too small: ' + buf.length);
  return buf;
}

async function main() {
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const texts = new Set();
  for (const p of puzzles) {
    for (const w of p.words) {
      texts.add(prefixText(w));
      texts.add(clueText(w));
    }
  }

  const list = Array.from(texts);
  console.log(`전체 음성 대상 텍스트 수: ${list.length}개`);
  let created = 0, skipped = 0;
  const failed = [];

  // 미생성 대상만 필터링
  const pending = [];
  for (const text of list) {
    const file = path.join(AUDIO_DIR, audioFileName(text));
    if (fs.existsSync(file) && fs.statSync(file).size > 1000) {
      skipped++;
    } else {
      pending.push(text);
    }
  }
  console.log(`기존 보유 파일: ${skipped}개 / 신규 생성 대기: ${pending.length}개`);

  // 동시 3개 워커로 안정적으로 다운로드
  const CONCURRENCY = 3;
  let idx = 0;

  async function worker(workerId) {
    while (idx < pending.length) {
      const currentIdx = idx++;
      const text = pending[currentIdx];
      const file = path.join(AUDIO_DIR, audioFileName(text));

      let ok = false;
      for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
        try {
          const buf = await synthesize(text);
          fs.writeFileSync(file, buf);
          ok = true;
          created++;
        } catch (e) {
          if (attempt === 4) {
            console.warn(`[실패] ${text} -> ${e.message}`);
          }
          await sleep(1000 * attempt);
        }
      }
      if (!ok) failed.push(text);

      if ((created) % 25 === 0 && created > 0) {
        console.log(`[진행] 생성 완료: ${created}/${pending.length} (${Math.round((created/pending.length)*100)}%)`);
      }
      await sleep(200);
    }
  }

  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(worker(w));
  }
  await Promise.all(workers);

  console.log(`완료: 전체 ${list.length}개 / 신규 ${created}개 / 기존 ${skipped}개 / 실패 ${failed.length}개`);
  if (failed.length) {
    console.log('실패 목록:', failed.slice(0, 10), failed.length > 10 ? `외 ${failed.length - 10}개` : '');
  }
}

main();
