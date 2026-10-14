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
const puzzles = JSON.parse(fs.readFileSync(path.join(__dirname, 'puzzles_100.json'), 'utf8'));

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
  let created = 0, skipped = 0, failed = [];
  for (let i = 0; i < list.length; i++) {
    const text = list[i];
    const file = path.join(AUDIO_DIR, audioFileName(text));
    if (fs.existsSync(file) && fs.statSync(file).size > 1000) { skipped++; continue; }

    let ok = false;
    for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
      try {
        const buf = await synthesize(text);
        fs.writeFileSync(file, buf);
        ok = true;
        created++;
      } catch (e) {
        console.warn(`[재시도 ${attempt}] ${text} -> ${e.message}`);
        await sleep(1500 * attempt);
      }
    }
    if (!ok) failed.push(text);
    if ((i + 1) % 20 === 0) console.log(`진행: ${i + 1}/${list.length}`);
    await sleep(350);
  }

  console.log(`완료: 전체 ${list.length}개 / 신규 ${created}개 / 기존 ${skipped}개 / 실패 ${failed.length}개`);
  if (failed.length) {
    console.log('실패 목록:', failed);
    process.exitCode = 1;
  }
}

main();
