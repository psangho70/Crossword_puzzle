// build_app.js
// 100단계 퍼즐 데이터 + 사전 생성 음성(MP3) 매핑을 내장한 index.html 생성기 (UI/UX 전면 개편 버전)
const fs = require('fs');
const path = require('path');
const { prefixText, clueText, audioFileName } = require('./audio_util');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.resolve(ROOT, 'audio');
const puzzleSrc = path.join(ROOT, 'scripts/puzzles_100_10x10.json');

console.log(`앱 빌드 퍼즐 데이터: ${puzzleSrc}`);
const puzzlesJson = JSON.parse(fs.readFileSync(puzzleSrc, 'utf8'));

let audioLinked = 0, audioMissing = 0;
for (const p of puzzlesJson) {
  for (const w of p.words) {
    const pa = audioFileName(prefixText(w));
    const ca = audioFileName(clueText(w));
    if (fs.existsSync(path.join(AUDIO_DIR, pa))) w.pa = pa; else audioMissing++;
    if (fs.existsSync(path.join(AUDIO_DIR, ca))) { w.ca = ca; audioLinked++; } else audioMissing++;
  }
}
console.log(`음성 파일 연결: 문제 본문 ${audioLinked}개 연결 / 누락 ${audioMissing}개`);
const puzzlesData = JSON.stringify(puzzlesJson);

const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>청춘 10x10 가로세로 낱말 퍼즐 100</title>
  <meta name="description" content="시니어 맞춤형 10x10 한국어 가로세로 낱말 퍼즐 100단계! 큰 글자, 큼직한 터치 자판, 또렷한 음성 안내(TTS)로 두뇌 건강을 지키세요.">
  <meta name="theme-color" content="#1D4ED8">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="청춘낱말퍼즐">
  <link rel="manifest" href="./manifest.json">
  <link rel="icon" type="image/svg+xml" href="./icon.svg">
  <link rel="apple-touch-icon" href="./icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&display=swap" rel="stylesheet">

  <style>
    /* =========================================================
       1. 디자인 시스템 토큰 & 시니어 친화적 고대비 색상 테마
       ========================================================= */
    :root {
      --bg-color: #FAF8F5;          /* 눈의 피로를 줄이는 따뜻한 미색 배경 */
      --card-bg: #FFFFFF;           /* 깔끔한 흰색 카드 */
      --text-color: #111827;         /* 선명하고 짙은 먹색 본문 */
      --text-muted: #4B5563;        /* 보조 텍스트 */
      --primary-color: #1D4ED8;      /* 선명한 포인트 블루 */
      --primary-hover: #1E40AF;
      --highlight-color: #FEF08A;    /* 선택 단어 하이라이트 노란색 */
      --highlight-border: #EAB308;
      --cell-active: #FDE047;       /* 현재 커서 칸 */
      --cell-active-border: #1D4ED8;
      --success-bg: #DCFCE7;         /* 정답 완료 연초록 */
      --success-border: #22C55E;
      --success-text: #15803D;
      --error-bg: #FEE2E2;           /* 오답 연빨강 */
      --error-border: #EF4444;
      --border-color: #D1D5DB;
      --font-scale: 1.0;            /* 글자 크기 변수 (1.0 / 1.15 / 1.30) */
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
    }

    html, body {
      width: 100%;
      height: 100%;
      height: 100dvh;
      overflow: hidden; /* 모바일 메인 퍼즐 화면 스크롤 완전 방지 */
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif;
      line-height: 1.35;
    }

    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    /* PWA 원터치 설치 배너 (슬림형) */
    #installBanner {
      display: none;
      width: 100%;
      max-width: 480px;
      background: linear-gradient(135deg, #15803D 0%, #16A34A 100%);
      color: #FFFFFF;
      padding: 6px 12px;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      z-index: 100;
      flex-shrink: 0;
    }
    #installBanner.active {
      display: flex;
    }
    .install-btn {
      background: #FFFFFF;
      color: #15803D;
      border: none;
      font-weight: 900;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 9999px;
      cursor: pointer;
      white-space: nowrap;
    }
    .install-close {
      background: transparent;
      border: none;
      color: #FFFFFF;
      font-size: 16px;
      cursor: pointer;
      padding: 2px 6px;
    }

    /* =========================================================
       2. 메인 게임 앱 컨테이너 (100dvh 핏 No-Scroll 레이아웃)
       ========================================================= */
    .app-container {
      width: 100%;
      max-width: 440px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 4px 8px 6px 8px;
      gap: 4px;
      overflow: hidden;
    }

    /* =========================================================
       3-1. 최상단 앱 명칭 & 브랜딩 바
       ========================================================= */
    .brand-bar {
      height: 28px;
      min-height: 28px;
      background: linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #2563EB 100%);
      border-radius: 9px;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #FFFFFF;
      box-shadow: 0 2px 4px rgba(29, 78, 216, 0.18);
      flex-shrink: 0;
    }

    .brand-logo-area {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand-icon {
      font-size: 15px;
      line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
    }

    .brand-title {
      font-size: 13.5px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: #FFFFFF;
      line-height: 1;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .brand-highlight {
      color: #FDE047; /* 따뜻하고 밝은 골드 옐로우 */
      font-weight: 900;
    }

    .brand-sub-badge {
      font-size: 10px;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #FEF08A;
      padding: 1px 7px;
      border-radius: 9999px;
      letter-spacing: -0.2px;
      line-height: 1.3;
    }

    /* =========================================================
       3-2. 초슬림 단계 조작 탑바 (38px)
       ========================================================= */
    .app-topbar {
      height: 38px;
      min-height: 38px;
      background: var(--card-bg);
      border-radius: 11px;
      padding: 0 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 6px;
    }

    .topbar-btn {
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      border-radius: 7px;
      padding: 3px 8px;
      font-size: 12.5px;
      font-weight: 800;
      color: var(--text-color);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      height: 28px;
      transition: all 0.15s ease;
    }
    .topbar-btn:active {
      transform: scale(0.95);
      background: #E2E8F0;
    }

    .topbar-title-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-grow: 1;
      cursor: pointer;
    }
    .topbar-title {
      font-size: calc(16px * var(--font-scale));
      font-weight: 900;
      color: var(--primary-color);
      letter-spacing: -0.5px;
      white-space: nowrap;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .topbar-icon-btn {
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      width: 34px;
      height: 32px;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .topbar-icon-btn:active {
      transform: scale(0.95);
    }
    .topbar-icon-btn.active {
      background: #EFF6FF;
      border-color: #93C5FD;
      color: var(--primary-color);
    }

    /* =========================================================
       4. 10x10 격자판 (Board) - 반응형 정사각 핏
       ========================================================= */
    .board-card {
      background: var(--card-bg);
      border-radius: 14px;
      padding: 4px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      flex-shrink: 1;
      min-height: 0;
    }

    .board-grid {
      width: 100%;
      max-width: min(100%, 390px);
      aspect-ratio: 1 / 1;
      max-height: 46vh;
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      grid-template-rows: repeat(10, 1fr);
      gap: 2px;
      background: #E2E8F0;
      padding: 2.5px;
      border-radius: 10px;
      box-shadow: inset 0 1px 4px rgba(0,0,0,0.04);
    }

    .cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #CBD5E1;
      border-radius: 4px;
      font-weight: 900;
      font-size: clamp(14px, 3.8vw, 20px);
      color: #0F172A;
      cursor: default;
      transition: background-color 0.12s ease, border-color 0.12s ease;
      user-select: none;
    }

    .cell.playable {
      background: #FFFFFF;
      border: 1.5px solid #94A3B8;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      cursor: pointer;
    }
    .cell.playable:active {
      transform: scale(0.97);
    }

    .cell-num {
      position: absolute;
      top: 1px;
      left: 1.5px;
      font-size: clamp(7.5px, 1.8vw, 9.5px);
      font-weight: 900;
      color: #475569;
      line-height: 1;
      pointer-events: none;
    }

    .cell.in-word {
      background-color: var(--highlight-color);
      border: 2px solid var(--highlight-border);
    }

    .cell.current-cursor {
      background-color: #FEF9C3;
      border: 2.5px solid var(--cell-active-border);
      box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.35);
      z-index: 2;
    }

    .cell.solved {
      background-color: var(--success-bg) !important;
      border-color: var(--success-border) !important;
      color: var(--success-text) !important;
      font-weight: 900;
    }

    /* =========================================================
       5. 슬림형 문제 설명 카드 & 정답 슬롯 분리 (오버플로 원천 방지)
       ========================================================= */
    .clue-card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 5px 9px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      border: 1.5px solid #BFDBFE;
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex-shrink: 0;
    }

    .clue-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 6px;
    }

    .clue-tag {
      background: var(--primary-color);
      color: #FFFFFF;
      font-size: calc(12px * var(--font-scale));
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .tts-btn {
      background: #EFF6FF;
      color: var(--primary-color);
      border: 1.5px solid #93C5FD;
      border-radius: 9999px;
      padding: 2px 10px;
      font-size: calc(12px * var(--font-scale));
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      flex-shrink: 0;
      height: 26px;
      box-sizing: border-box;
      transition: all 0.15s ease;
    }
    .tts-btn:active {
      transform: scale(0.96);
    }
    .tts-btn.speaking {
      background: #DCFCE7;
      border-color: #22C55E;
      color: #15803D;
    }

    .clue-text {
      font-size: calc(14px * var(--font-scale));
      font-weight: 800;
      color: var(--text-color);
      line-height: 1.32;
      word-break: keep-all;
    }

    /* 정답 조합 슬롯 (단독 행으로 가로 폭 100% 여유 배치) */
    .slots-container {
      display: flex;
      align-items: center;
      gap: 5px;
      width: 100%;
      justify-content: center;
      padding-top: 1px;
    }

    .slot {
      width: clamp(28px, 6.8vw, 35px);
      height: clamp(28px, 6.8vw, 35px);
      background: #FFFFFF;
      border: 1.5px solid #94A3B8;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: calc(16px * var(--font-scale));
      font-weight: 900;
      color: var(--text-color);
      cursor: pointer;
      position: relative;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: all 0.12s ease;
      box-sizing: border-box;
    }
    .slot:active {
      transform: scale(0.96);
    }
    .slot.locked {
      background: #DCFCE7;
      border-color: #22C55E;
      color: #15803D;
      cursor: default;
    }
    .slot.active-target {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.3);
      background: #EFF6FF;
    }

    .tts-toast {
      display: none;
      background: #1E293B;
      color: #FFFFFF;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
    }
    .tts-toast.active {
      display: block;
    }

    /* =========================================================
       6. 터치 키패드 & 3대 핵심 액션 바
       ========================================================= */
    .touch-keyboard-card {
      background: var(--card-bg);
      border-radius: 14px;
      padding: 6px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex-shrink: 0;
    }

    .key-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
    }

    .key-btn {
      height: clamp(38px, 9.5vw, 46px);
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      border-bottom: 3px solid #94A3B8;
      border-radius: 9px;
      font-size: calc(18px * var(--font-scale));
      font-weight: 900;
      color: #1E293B;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      transition: all 0.08s ease;
    }
    .key-btn:active {
      transform: translateY(2px);
      border-bottom-width: 1px;
    }
    .key-btn.used {
      background: #F1F5F9;
      border-color: #E2E8F0;
      border-bottom-width: 1.5px;
      color: #94A3B8;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .control-actions-bar {
      display: grid;
      grid-template-columns: 1fr 1fr 1.3fr;
      gap: 5px;
    }

    .sub-btn {
      height: 38px;
      border-radius: 9px;
      font-size: calc(13px * var(--font-scale));
      font-weight: 900;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.1s ease;
      white-space: nowrap;
    }
    .sub-btn:active {
      transform: scale(0.96);
    }

    .btn-backspace {
      background: #FEE2E2;
      color: #B91C1C;
      border: 1px solid #FECACA;
    }
    .btn-hint {
      background: #FEF08A;
      color: #854D0E;
      border: 1.5px solid #FACC15;
    }
    .btn-check {
      background: var(--primary-color);
      color: #FFFFFF;
      border: 1.5px solid var(--primary-hover);
    }

    /* =========================================================
       7. [화면 2] 스테이지 & 단계 사용 현황판 화면 (전체 오버레이)
       ========================================================= */
    .screen-stage-map {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      height: 100dvh;
      background: #FAF8F5;
      z-index: 1500;
      flex-direction: column;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    .screen-stage-map.active {
      display: flex;
    }

    .map-header {
      background: #FFFFFF;
      border-bottom: 1.5px solid #E2E8F0;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }

    .map-back-btn {
      background: #EFF6FF;
      color: var(--primary-color);
      border: 1.5px solid #93C5FD;
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .map-back-btn:active {
      transform: scale(0.95);
    }

    .map-header-title {
      font-size: 18px;
      font-weight: 900;
      color: var(--text-color);
    }

    .map-content-wrap {
      width: 100%;
      max-width: 480px;
      margin: 0 auto;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .map-summary-card {
      background: #FFFFFF;
      border-radius: 16px;
      padding: 14px 16px;
      border: 1.5px solid #BFDBFE;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .map-summary-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .map-summary-label {
      font-size: 15px;
      font-weight: 900;
      color: #1E3A8A;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .map-summary-pct {
      font-size: 15px;
      font-weight: 900;
      color: var(--primary-color);
    }

    .map-progress-track {
      width: 100%;
      height: 10px;
      background: #E2E8F0;
      border-radius: 9999px;
      overflow: hidden;
    }
    .map-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    /* 10개 스테이지 카드 리스트 */
    .stage-card {
      background: #FFFFFF;
      border-radius: 16px;
      padding: 14px;
      border: 1.5px solid var(--border-color);
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .stage-card.all-cleared {
      border-color: #86EFAC;
      background: #F0FDF4;
    }

    .stage-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stage-card-title {
      font-size: 16px;
      font-weight: 900;
      color: #0F172A;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stage-card-badge {
      font-size: 12px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 9999px;
      background: #EFF6FF;
      color: var(--primary-color);
    }
    .stage-card.all-cleared .stage-card-badge {
      background: #DCFCE7;
      color: #15803D;
    }

    /* 10개 단계 타일 그리드 (2행 5열) */
    .level-tiles-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
    }

    .level-tile {
      height: 52px;
      background: #FFFFFF;
      border: 2px solid #CBD5E1;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.12s ease;
      position: relative;
    }
    .level-tile:active {
      transform: scale(0.95);
    }
    .level-tile-num {
      font-size: 15px;
      font-weight: 900;
      color: #334155;
    }
    .level-tile-status {
      font-size: 10px;
      font-weight: 800;
      color: #64748B;
    }

    .level-tile.cleared {
      background: #DCFCE7;
      border-color: #22C55E;
    }
    .level-tile.cleared .level-tile-num {
      color: #15803D;
    }
    .level-tile.cleared .level-tile-status {
      color: #16A34A;
      font-weight: 900;
    }

    .level-tile.current-playing {
      background: #FEF9C3;
      border-color: #EAB308;
      box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.4);
    }
    .level-tile.current-playing .level-tile-num {
      color: #854D0E;
    }
    .level-tile.current-playing .level-tile-status {
      color: #A16207;
    }

    /* =========================================================
       8. [화면 3] 환경설정 모달 (Settings Modal)
       ========================================================= */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(3px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 2000;
    }
    .modal-overlay.active {
      display: flex;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-card {
      background: #FFFFFF;
      border-radius: 20px;
      max-width: 400px;
      width: 100%;
      padding: 20px;
      box-shadow: 0 16px 28px rgba(0,0,0,0.25);
      border: 3px solid #BFDBFE;
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #E2E8F0;
      padding-bottom: 8px;
    }
    .settings-title {
      font-size: 19px;
      font-weight: 900;
      color: #1E3A8A;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .settings-close-btn {
      background: #F1F5F9;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 16px;
      font-weight: 900;
      color: #64748B;
      cursor: pointer;
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .setting-label {
      font-size: 14px;
      font-weight: 900;
      color: #334155;
    }
    .setting-hint {
      font-size: 12px;
      color: #64748B;
      font-weight: 600;
    }

    .font-scale-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .scale-opt-btn {
      height: 42px;
      background: #F8FAFC;
      border: 2px solid #CBD5E1;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 800;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .scale-opt-btn.active {
      background: #EFF6FF;
      border-color: var(--primary-color);
      color: var(--primary-color);
      font-weight: 900;
    }

    .setting-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #F8FAFC;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
    }
    .setting-toggle-text {
      font-size: 14px;
      font-weight: 800;
      color: #334155;
    }

    .btn-danger-outline {
      width: 100%;
      height: 40px;
      background: #FFF1F2;
      border: 1.5px solid #FECDD3;
      border-radius: 10px;
      color: #BE123C;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }

    .help-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
      font-weight: 600;
    }

    .modal-btn {
      width: 100%;
      height: 46px;
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      color: #FFFFFF;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    /* 단계 클리어 모달 */
    .clear-card {
      border: 3px solid #FDE047;
      text-align: center;
      align-items: center;
    }
    .clear-icon {
      font-size: 50px;
      line-height: 1;
    }
    .clear-title {
      font-size: 21px;
      font-weight: 900;
      color: #1E3A8A;
    }
    .clear-desc {
      font-size: 15px;
      font-weight: 700;
      color: #4B5563;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <!-- PWA 원터치 설치 배너 -->
  <div id="installBanner">
    <div style="font-weight: 800; font-size: 12px; display: flex; align-items: center; gap: 4px;">
      <span>📲</span> <span>바탕화면에 앱 설치하고 편하게 푸세요!</span>
    </div>
    <div style="display: flex; align-items: center; gap: 4px;">
      <button class="install-btn" id="btnInstall">설치</button>
      <button class="install-close" id="btnCloseInstall">✕</button>
    </div>
  </div>

  <!-- [화면 1] 메인 퍼즐 화면 -->
  <div class="app-container" id="mainGameScreen">

    <!-- 최상단 앱 명칭 & 브랜딩 바 -->
    <div class="brand-bar">
      <div class="brand-logo-area">
        <span class="brand-icon">🧩</span>
        <h1 class="brand-title">청춘 <span class="brand-highlight">10×10</span> 낱말퍼즐</h1>
      </div>
      <div class="brand-sub-badge">어르신 두뇌 건강</div>
    </div>

    <!-- 상단 38px 초슬림 단계 조작 탑바 -->
    <header class="app-topbar">
      <button class="topbar-btn" id="btnOpenStageMap" title="스테이지/단계 선택 목록 열기">
        <span>☰</span> <span>단계목록</span>
      </button>

      <div class="topbar-title-wrap" id="topbarTitleWrap" title="단계 변경">
        <span class="topbar-title" id="topbarStageLevel">스테이지 1 - 1단계</span>
      </div>

      <div class="topbar-actions">
        <button class="topbar-icon-btn active" id="btnSoundToggle" title="소리 켜기/끄기">
          <span id="soundIcon">🔊</span>
        </button>
        <button class="topbar-icon-btn" id="btnOpenSettings" title="환경설정">
          <span>⚙</span>
        </button>
      </div>
    </header>

    <!-- 10x10 격자판 보드 카드 -->
    <main class="board-card">
      <div class="board-grid" id="boardGrid">
        <!-- 100개 셀 동적 렌더링 -->
      </div>
    </main>

    <!-- 슬림형 문제 설명 카드 & 정답 슬롯 분리 (오버플로 원천 방지) -->
    <section class="clue-card">
      <div class="clue-top-row">
        <div class="clue-tag" id="clueTag">
          <span id="clueDirIcon">➡</span>
          <span id="clueTitle">가로 1번</span>
        </div>
        <button class="tts-btn" id="btnTts">
          <span>🔊</span> <span>문제 듣기</span>
        </button>
      </div>
      <div class="clue-text" id="clueText">
        문제를 불러오는 중입니다...
      </div>
      <!-- 정답 글자 조합 슬롯 (단독 행: 5글자 이상도 가로폭 100% 여유) -->
      <div class="slots-container" id="slotsContainer">
        <!-- 글자 수 슬롯 동적 생성 -->
      </div>
      <div class="tts-toast" id="ttsToast">
        🔊 문제 낭독 중입니다...
      </div>
    </section>

    <!-- 터치 키패드 & 3대 핵심 액션 바 -->
    <section class="touch-keyboard-card">
      <div class="key-grid" id="keyGrid">
        <!-- 10개 한글 음절 키패드 동적 생성 -->
      </div>

      <div class="control-actions-bar">
        <button class="sub-btn btn-backspace" id="btnBackspace" title="한 글자 지우기">
          <span>⬅</span> <span>지우기</span>
        </button>
        <button class="sub-btn btn-hint" id="btnHint" title="힌트 (한 글자 채우기)">
          <span>💡</span> <span>힌트</span>
        </button>
        <button class="sub-btn btn-check" id="btnCheckAnswer" title="정답 확인">
          <span>✔</span> <span>확인</span>
        </button>
      </div>
    </section>

  </div>

  <!-- [화면 2] 스테이지 & 단계 사용 현황판 화면 -->
  <div class="screen-stage-map" id="stageMapScreen">
    <div class="map-header">
      <button class="map-back-btn" id="btnCloseStageMap">
        <span>←</span> <span>퍼즐로 돌아가기</span>
      </button>
      <h2 class="map-header-title">전체 진행 현황</h2>
      <div style="width: 20px;"></div>
    </div>

    <div class="map-content-wrap">
      <!-- 100단계 달성도 요약 카드 -->
      <div class="map-summary-card">
        <div class="map-summary-top">
          <span class="map-summary-label">🏆 전체 100단계 달성도</span>
          <span class="map-summary-pct" id="mapProgressText">0 / 100 단계 (0%)</span>
        </div>
        <div class="map-progress-track">
          <div class="map-progress-fill" id="mapProgressFill" style="width: 0%;"></div>
        </div>
      </div>

      <!-- 10개 스테이지 카드 리스트 -->
      <div class="stages-scroll-list" id="stagesListContainer">
        <!-- 10개 스테이지와 100단계 타일 동적 렌더링 -->
      </div>
    </div>
  </div>

  <!-- [화면 3] 환경설정 모달 -->
  <div class="modal-overlay" id="settingsModal">
    <div class="modal-card">
      <div class="settings-header">
        <h3 class="settings-title">⚙️ 환경설정</h3>
        <button class="settings-close-btn" id="btnCloseSettings">✕</button>
      </div>

      <!-- 1. 글자 크기 3단 선택 -->
      <div class="setting-item">
        <label class="setting-label">글자 크기 조절</label>
        <div class="font-scale-options">
          <button class="scale-opt-btn" data-scale="1.0" id="optFontSmall">보통 글자</button>
          <button class="scale-opt-btn" data-scale="1.15" id="optFontMed">큰 글자</button>
          <button class="scale-opt-btn" data-scale="1.30" id="optFontLarge">아주 큰 글자</button>
        </div>
        <p class="setting-hint">※ 눈이 침침하시면 '큰 글자'나 '아주 큰 글자'를 누르세요.</p>
      </div>

      <!-- 2. 소리 안내 설정 -->
      <div class="setting-item">
        <label class="setting-label">음성 안내 설정</label>
        <div class="setting-toggle-row">
          <span class="setting-toggle-text">문제 선택 시 자동으로 읽어주기</span>
          <button class="topbar-btn" id="btnToggleAutoSpeak" style="height: 32px; color: #64748B;">꺼짐</button>
        </div>
      </div>

      <!-- 3. 현재 단계 다시 풀기 -->
      <div class="setting-item">
        <label class="setting-label">단계 초기화</label>
        <button class="btn-danger-outline" id="btnResetLevelInSettings">
          🔄 현재 단계 처음부터 다시 풀기
        </button>
      </div>

      <!-- 4. 도움말 -->
      <div class="setting-item">
        <label class="setting-label">📖 쉬운 게임 방법</label>
        <div class="help-box">
          • 노란색으로 칠해진 칸의 문제를 읽어보세요.<br>
          • 아래 한글 자판에서 글자를 콕콕 누르면 채워집니다.<br>
          • 파란색 [확인] 버튼을 누르면 정답을 검사합니다.<br>
          • 어려울 땐 노란색 [힌트] 버튼을 눌러보세요.
        </div>
      </div>

      <button class="modal-btn" id="btnConfirmSettings">
        <span>확인 (닫기)</span>
      </button>
    </div>
  </div>

  <!-- 단계 클리어 축하 모달 -->
  <div class="modal-overlay" id="clearModal">
    <div class="modal-card clear-card">
      <div class="clear-icon">🎉</div>
      <h2 class="clear-title" id="modalTitle">참 잘하셨습니다!</h2>
      <p class="clear-desc" id="modalDesc">
        스테이지 1 - 1단계를 멋지게 완료하셨습니다.<br>
        두뇌가 맑아지고 기억력이 쑥쑥 자라납니다!
      </p>
      <button class="modal-btn" id="btnNextLevel">
        <span>다음 단계 도전하기</span> <span>➔</span>
      </button>
    </div>
  </div>

  <script>
    // 1. 100단계 퍼즐 내장 데이터 (JSON)
    const PUZZLE_DATA = ${puzzlesData};

    // 2. Web Audio API 사운드 엔진
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.enabled = true;
      }

      initCtx() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      playTone(freq, duration, type = 'sine', gainVal = 0.15) {
        if (!this.enabled) return;
        try {
          this.initCtx();
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
      }

      playTap() { this.playTone(520, 0.08, 'triangle', 0.1); }
      playBackspace() { this.playTone(320, 0.09, 'sine', 0.1); }
      playWrong() {
        if (!this.enabled) return;
        this.playTone(280, 0.12, 'sawtooth', 0.08);
        setTimeout(() => this.playTone(220, 0.18, 'sawtooth', 0.08), 120);
      }
      playCorrect() {
        if (!this.enabled) return;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          setTimeout(() => this.playTone(freq, 0.18, 'triangle', 0.18), idx * 80);
        });
      }
      playStageClear() {
        if (!this.enabled) return;
        const chords = [
          [523.25, 659.25],
          [659.25, 783.99],
          [783.99, 1046.50],
          [523.25, 659.25, 783.99, 1046.50, 1318.51]
        ];
        chords.forEach((chord, idx) => {
          setTimeout(() => {
            chord.forEach(freq => this.playTone(freq, idx === 3 ? 0.7 : 0.22, 'triangle', 0.14));
          }, idx * 160);
        });
      }
    }

    const sound = new SoundEngine();

    // 3. 상태 관리 및 로컬스토리지
    const STORAGE_KEY_STAGE = 'senior_crossword_stage';
    const STORAGE_KEY_LEVEL = 'senior_crossword_level';
    const STORAGE_KEY_CLEARED = 'senior_crossword_cleared_v1';
    const STORAGE_KEY_FONT = 'senior_crossword_font_scale';
    const STORAGE_KEY_SOUND = 'senior_crossword_sound_enabled';
    const STORAGE_KEY_AUTO_SPEAK = 'senior_crossword_auto_speak';

    let currentStage = parseInt(localStorage.getItem(STORAGE_KEY_STAGE) || '1', 10);
    let currentLevel = parseInt(localStorage.getItem(STORAGE_KEY_LEVEL) || '1', 10);
    let clearedSet = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_CLEARED) || '[]'));
    let fontScale = parseFloat(localStorage.getItem(STORAGE_KEY_FONT) || '1.0');
    let soundEnabled = localStorage.getItem(STORAGE_KEY_SOUND) !== 'false';
    let autoSpeak = localStorage.getItem(STORAGE_KEY_AUTO_SPEAK) === 'true';

    sound.enabled = soundEnabled;
    document.documentElement.style.setProperty('--font-scale', fontScale.toString());

    let currentPuzzle = null;
    let selectedWordIndex = 0;
    let solvedWords = new Set();
    let currentWordInputs = [];
    let keyboardKeys = [];
    let ttsSpeaking = false;

    // 4. UI 엘리먼트 참조
    const topbarStageLevel = document.getElementById('topbarStageLevel');
    const topbarTitleWrap = document.getElementById('topbarTitleWrap');
    const btnOpenStageMap = document.getElementById('btnOpenStageMap');
    const btnCloseStageMap = document.getElementById('btnCloseStageMap');
    const stageMapScreen = document.getElementById('stageMapScreen');
    const mapProgressText = document.getElementById('mapProgressText');
    const mapProgressFill = document.getElementById('mapProgressFill');
    const stagesListContainer = document.getElementById('stagesListContainer');

    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const btnConfirmSettings = document.getElementById('btnConfirmSettings');
    const settingsModal = document.getElementById('settingsModal');
    const btnResetLevelInSettings = document.getElementById('btnResetLevelInSettings');
    const btnToggleAutoSpeak = document.getElementById('btnToggleAutoSpeak');

    const btnSoundToggle = document.getElementById('btnSoundToggle');
    const soundIcon = document.getElementById('soundIcon');

    const boardGrid = document.getElementById('boardGrid');
    const clueTag = document.getElementById('clueTag');
    const clueDirIcon = document.getElementById('clueDirIcon');
    const clueTitle = document.getElementById('clueTitle');
    const clueText = document.getElementById('clueText');
    const btnTts = document.getElementById('btnTts');
    const ttsToast = document.getElementById('ttsToast');
    const slotsContainer = document.getElementById('slotsContainer');
    const keyGrid = document.getElementById('keyGrid');
    const btnBackspace = document.getElementById('btnBackspace');
    const btnHint = document.getElementById('btnHint');
    const btnCheckAnswer = document.getElementById('btnCheckAnswer');

    const clearModal = document.getElementById('clearModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const btnNextLevel = document.getElementById('btnNextLevel');

    // 5. 스테이지 테마 정보
    const STAGE_THEMES = {
      1: "새싹 입문",
      2: "은빛 초급",
      3: "청춘 중급",
      4: "황금 상급",
      5: "지혜 달인",
      6: "지혜 심화",
      7: "고수 풍류",
      8: "명인 열전",
      9: "신선 유람",
      10: "천하 통일"
    };

    // 6. 퍼즐 로드
    function loadPuzzle(stage, level) {
      currentStage = stage;
      currentLevel = level;
      localStorage.setItem(STORAGE_KEY_STAGE, currentStage);
      localStorage.setItem(STORAGE_KEY_LEVEL, currentLevel);

      const globalIdx = (currentStage - 1) * 10 + (currentLevel - 1);
      currentPuzzle = PUZZLE_DATA[globalIdx] || PUZZLE_DATA[0];

      solvedWords.clear();
      selectedWordIndex = 0;

      const isAlreadyCleared = clearedSet.has(\`\${currentStage}-\${currentLevel}\`);
      if (isAlreadyCleared) {
        currentPuzzle.words.forEach((_, idx) => solvedWords.add(idx));
      }

      // 상단 타이틀 갱신
      topbarStageLevel.textContent = \`스테이지 \${currentStage} - \${currentLevel}단계\`;

      renderBoard();
      selectWord(selectedWordIndex);
    }

    // 7. 10x10 격자판 렌더링
    function renderBoard() {
      boardGrid.innerHTML = '';

      const numMap = {};
      currentPuzzle.words.forEach(w => {
        numMap[\`\${w.r},\${w.c}\`] = w.num;
      });

      const solvedCharMap = {};
      solvedWords.forEach(wIdx => {
        const w = currentPuzzle.words[wIdx];
        for (let i = 0; i < w.len; i++) {
          const r = w.dir === 'across' ? w.r : w.r + i;
          const c = w.dir === 'across' ? w.c + i : w.c;
          solvedCharMap[\`\${r},\${c}\`] = w.word[i];
        }
      });

      const gridSize = currentPuzzle.grid.length;
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const cellDiv = document.createElement('div');
          cellDiv.className = 'cell';
          cellDiv.dataset.r = r;
          cellDiv.dataset.c = c;

          const charInPuzzle = currentPuzzle.grid[r][c];
          if (charInPuzzle !== null) {
            cellDiv.classList.add('playable');

            if (numMap[\`\${r},\${c}\`]) {
              const numSpan = document.createElement('span');
              numSpan.className = 'cell-num';
              numSpan.textContent = numMap[\`\${r},\${c}\`];
              cellDiv.appendChild(numSpan);
            }

            if (solvedCharMap[\`\${r},\${c}\`]) {
              cellDiv.classList.add('solved');
              const textNode = document.createTextNode(solvedCharMap[\`\${r},\${c}\`]);
              cellDiv.appendChild(textNode);
            }

            cellDiv.addEventListener('click', () => onCellClick(r, c));
          }

          boardGrid.appendChild(cellDiv);
        }
      }

      updateBoardHighlights();
    }

    function onCellClick(r, c) {
      sound.playTap();
      const matchingWords = [];
      currentPuzzle.words.forEach((w, idx) => {
        if (w.dir === 'across') {
          if (w.r === r && c >= w.c && c < w.c + w.len) matchingWords.push(idx);
        } else {
          if (w.c === c && r >= w.r && r < w.r + w.len) matchingWords.push(idx);
        }
      });

      if (matchingWords.length === 0) return;

      if (matchingWords.includes(selectedWordIndex)) {
        if (matchingWords.length > 1) {
          const nextIdx = matchingWords.find(i => i !== selectedWordIndex);
          selectWord(nextIdx);
        } else {
          selectWord(selectedWordIndex);
        }
      } else {
        selectWord(matchingWords[0]);
      }
    }

    function selectWord(wIdx) {
      selectedWordIndex = wIdx;
      const wordObj = currentPuzzle.words[selectedWordIndex];
      const isSolved = solvedWords.has(selectedWordIndex);

      if (isSolved) {
        currentWordInputs = wordObj.word.split('');
      } else {
        currentWordInputs = [];
        for (let i = 0; i < wordObj.len; i++) {
          const r = wordObj.dir === 'across' ? wordObj.r : wordObj.r + i;
          const c = wordObj.dir === 'across' ? wordObj.c + i : wordObj.c;
          let sharedChar = '';
          solvedWords.forEach(sIdx => {
            const sw = currentPuzzle.words[sIdx];
            for (let k = 0; k < sw.len; k++) {
              const sr = sw.dir === 'across' ? sw.r : sw.r + k;
              const sc = sw.dir === 'across' ? sw.c + k : sw.c;
              if (sr === r && sc === c) sharedChar = sw.word[k];
            }
          });
          currentWordInputs.push(sharedChar);
        }
      }

      updateBoardHighlights();
      renderClueCard();
      renderTouchKeyboard();

      if (autoSpeak && !isSolved) {
        speakCurrentClue();
      }
    }

    function updateBoardHighlights() {
      const wordObj = currentPuzzle.words[selectedWordIndex];
      if (!wordObj) return;

      const wordCells = new Set();
      for (let i = 0; i < wordObj.len; i++) {
        const r = wordObj.dir === 'across' ? wordObj.r : wordObj.r + i;
        const c = wordObj.dir === 'across' ? wordObj.c + i : wordObj.c;
        wordCells.add(\`\${r},\${c}\`);
      }

      document.querySelectorAll('.cell.playable').forEach(cell => {
        const r = parseInt(cell.dataset.r, 10);
        const c = parseInt(cell.dataset.c, 10);
        const key = \`\${r},\${c}\`;

        cell.classList.toggle('in-word', wordCells.has(key));
        cell.classList.toggle('current-cursor', wordCells.has(key));
      });
    }

    function renderClueCard() {
      const wordObj = currentPuzzle.words[selectedWordIndex];
      const isSolved = solvedWords.has(selectedWordIndex);

      clueDirIcon.textContent = wordObj.dir === 'across' ? '➡' : '⬇';
      clueTitle.textContent = \`\${wordObj.dirKo} \${wordObj.num}번 (\${wordObj.len}글자)\`;
      clueText.textContent = wordObj.clue;

      slotsContainer.innerHTML = '';
      for (let i = 0; i < wordObj.len; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';
        const char = currentWordInputs[i] || '';
        slotDiv.textContent = char;

        if (isSolved) {
          slotDiv.classList.add('locked');
        } else {
          slotDiv.addEventListener('click', () => {
            sound.playTap();
            onSlotClick(i);
          });
        }
        slotsContainer.appendChild(slotDiv);
      }
    }

    function onSlotClick(slotIdx) {
      if (solvedWords.has(selectedWordIndex)) return;
      if (currentWordInputs[slotIdx]) {
        currentWordInputs[slotIdx] = '';
        renderClueCard();
        renderTouchKeyboard();
      }
    }

    function renderTouchKeyboard() {
      const wordObj = currentPuzzle.words[selectedWordIndex];
      const isSolved = solvedWords.has(selectedWordIndex);

      const targetChars = wordObj.word.split('');
      const distractorPool = ['강','산','들','바','다','꽃','달','별','해','물','돌','불','풀','잎','길','소','비','구','름','빛'];

      const needed = 10 - targetChars.length;
      const distractors = [];
      for (let i = 0; i < distractorPool.length && distractors.length < needed; i++) {
        const ch = distractorPool[i];
        if (!targetChars.includes(ch)) distractors.push(ch);
      }

      keyboardKeys = [...targetChars, ...distractors];
      keyboardKeys.sort((a, b) => a.localeCompare(b, 'ko'));

      keyGrid.innerHTML = '';
      keyboardKeys.forEach((char) => {
        const btn = document.createElement('button');
        btn.className = 'key-btn';
        btn.textContent = char;

        if (isSolved) {
          btn.classList.add('used');
          btn.disabled = true;
        } else {
          const usedCountInInputs = currentWordInputs.filter(c => c === char).length;
          const totalInTarget = targetChars.filter(c => c === char).length;
          if (usedCountInInputs >= Math.max(1, totalInTarget)) {
            btn.classList.add('used');
          }

          btn.addEventListener('click', () => onKeyTap(char));
        }

        keyGrid.appendChild(btn);
      });
    }

    function onKeyTap(char) {
      sound.playTap();
      if (solvedWords.has(selectedWordIndex)) return;

      const emptyIdx = currentWordInputs.findIndex(c => !c || c === '');
      if (emptyIdx !== -1) {
        currentWordInputs[emptyIdx] = char;
        renderClueCard();
        renderTouchKeyboard();

        if (currentWordInputs.every(c => c && c.length > 0)) {
          setTimeout(onCheckAnswer, 200);
        }
      }
    }

    function onBackspace() {
      sound.playBackspace();
      if (solvedWords.has(selectedWordIndex)) return;

      for (let i = currentWordInputs.length - 1; i >= 0; i--) {
        if (currentWordInputs[i]) {
          currentWordInputs[i] = '';
          break;
        }
      }
      renderClueCard();
      renderTouchKeyboard();
    }

    function onHint() {
      sound.playTap();
      if (solvedWords.has(selectedWordIndex)) return;

      const wordObj = currentPuzzle.words[selectedWordIndex];
      const emptyIndices = [];
      for (let i = 0; i < wordObj.len; i++) {
        if (currentWordInputs[i] !== wordObj.word[i]) emptyIndices.push(i);
      }

      if (emptyIndices.length > 0) {
        const targetIdx = emptyIndices[0];
        currentWordInputs[targetIdx] = wordObj.word[targetIdx];
        renderClueCard();
        renderTouchKeyboard();

        if (currentWordInputs.every(c => c && c.length > 0)) {
          setTimeout(onCheckAnswer, 200);
        }
      }
    }

    function onCheckAnswer() {
      if (solvedWords.has(selectedWordIndex)) return;

      const wordObj = currentPuzzle.words[selectedWordIndex];
      const enteredWord = currentWordInputs.join('');

      if (enteredWord === wordObj.word) {
        sound.playCorrect();
        solvedWords.add(selectedWordIndex);

        // 그리드에 정답 글자 반영
        for (let i = 0; i < wordObj.len; i++) {
          const r = wordObj.dir === 'across' ? wordObj.r : wordObj.r + i;
          const c = wordObj.dir === 'across' ? wordObj.c + i : wordObj.c;
          const cell = document.querySelector(\`.cell[data-r="\${r}"][data-c="\${c}"]\`);
          if (cell) {
            cell.classList.add('solved');
            let hasText = false;
            for (const node of cell.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = wordObj.word[i];
                hasText = true;
                break;
              }
            }
            if (!hasText) {
              cell.appendChild(document.createTextNode(wordObj.word[i]));
            }
          }
        }

        renderClueCard();
        renderTouchKeyboard();

        // 전체 완료 체크
        if (solvedWords.size === currentPuzzle.words.length) {
          setTimeout(onStageClear, 400);
        } else {
          // 다음 미완료 단어로 이동
          for (let i = 0; i < currentPuzzle.words.length; i++) {
            const nextIdx = (selectedWordIndex + 1 + i) % currentPuzzle.words.length;
            if (!solvedWords.has(nextIdx)) {
              setTimeout(() => selectWord(nextIdx), 300);
              break;
            }
          }
        }
      } else {
        sound.playWrong();
        slotsContainer.classList.add('shake');
        setTimeout(() => slotsContainer.classList.remove('shake'), 400);
      }
    }

    function onStageClear() {
      sound.playStageClear();
      clearedSet.add(\`\${currentStage}-\${currentLevel}\`);
      localStorage.setItem(STORAGE_KEY_CLEARED, JSON.stringify(Array.from(clearedSet)));

      modalTitle.textContent = "참 잘하셨습니다!";
      modalDesc.innerHTML = \`스테이지 \${currentStage} - \${currentLevel}단계를 멋지게 완료하셨습니다.<br>두뇌가 맑아지고 기억력이 쑥쑥 자라납니다!\`;
      clearModal.classList.add('active');
    }

    btnNextLevel.addEventListener('click', () => {
      clearModal.classList.remove('active');
      let nextStage = currentStage;
      let nextLevel = currentLevel + 1;
      if (nextLevel > 10) {
        nextLevel = 1;
        nextStage = Math.min(10, currentStage + 1);
      }
      loadPuzzle(nextStage, nextLevel);
    });

    // 8. 음성 안내 (TTS 및 MP3 연동)
    let currentAudio = null;
    function speakText(text, mp3File, onEnd) {
      if (!soundEnabled) {
        if (onEnd) onEnd();
        return;
      }

      if (currentAudio) {
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
        currentAudio = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      if (mp3File) {
        ttsSpeaking = true;
        btnTts.classList.add('speaking');
        ttsToast.classList.add('active');

        const audio = new Audio('./audio/' + mp3File);
        currentAudio = audio;
        audio.onended = () => {
          ttsSpeaking = false;
          btnTts.classList.remove('speaking');
          ttsToast.classList.remove('active');
          currentAudio = null;
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          currentAudio = null;
          fallbackSpeech(text, onEnd);
        };
        audio.play().catch(() => fallbackSpeech(text, onEnd));
      } else {
        fallbackSpeech(text, onEnd);
      }
    }

    function fallbackSpeech(text, onEnd) {
      if (!('speechSynthesis' in window) || !soundEnabled) {
        ttsSpeaking = false;
        btnTts.classList.remove('speaking');
        ttsToast.classList.remove('active');
        if (onEnd) onEnd();
        return;
      }

      ttsSpeaking = true;
      btnTts.classList.add('speaking');
      ttsToast.classList.add('active');

      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = 0.88;
      u.pitch = 1.0;
      u.onend = () => {
        ttsSpeaking = false;
        btnTts.classList.remove('speaking');
        ttsToast.classList.remove('active');
        if (onEnd) onEnd();
      };
      u.onerror = () => {
        ttsSpeaking = false;
        btnTts.classList.remove('speaking');
        ttsToast.classList.remove('active');
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(u);
    }

    function speakCurrentClue() {
      const wordObj = currentPuzzle.words[selectedWordIndex];
      if (!wordObj) return;

      const prefix = \`\${wordObj.dirKo} \${wordObj.num}번. \${wordObj.len}글자.\`;
      const clue = wordObj.clue;

      speakText(prefix, wordObj.pa, () => {
        setTimeout(() => speakText(clue, wordObj.ca), 250);
      });
    }

    btnTts.addEventListener('click', () => {
      sound.playTap();
      speakCurrentClue();
    });

    // 소리 토글
    btnSoundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      sound.enabled = soundEnabled;
      localStorage.setItem(STORAGE_KEY_SOUND, soundEnabled.toString());
      updateSoundUI();
    });

    function updateSoundUI() {
      btnSoundToggle.classList.toggle('active', soundEnabled);
      soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    }
    updateSoundUI();

    // 9. [화면 2] 스테이지 현황판 화면 로직
    function openStageMap() {
      sound.playTap();
      renderStageMap();
      stageMapScreen.classList.add('active');
    }
    function closeStageMap() {
      sound.playTap();
      stageMapScreen.classList.remove('active');
    }

    btnOpenStageMap.addEventListener('click', openStageMap);
    topbarTitleWrap.addEventListener('click', openStageMap);
    btnCloseStageMap.addEventListener('click', closeStageMap);

    function renderStageMap() {
      const totalCleared = clearedSet.size;
      const pct = Math.round((totalCleared / 100) * 100);
      mapProgressText.textContent = \`\${totalCleared} / 100 단계 (\${pct}%)\`;
      mapProgressFill.style.width = \`\${pct}%\`;

      stagesListContainer.innerHTML = '';
      for (let s = 1; s <= 10; s++) {
        let stageClearedCount = 0;
        for (let l = 1; l <= 10; l++) {
          if (clearedSet.has(\`\${s}-\${l}\`)) stageClearedCount++;
        }

        const stageCard = document.createElement('div');
        stageCard.className = 'stage-card';
        if (stageClearedCount === 10) stageCard.classList.add('all-cleared');

        const cardHeader = document.createElement('div');
        cardHeader.className = 'stage-card-header';
        cardHeader.innerHTML = \`
          <div class="stage-card-title">
            <span>\${stageClearedCount === 10 ? '👑' : '🚩'} 스테이지 \${s}</span>
            <span style="font-size: 13px; color: #475569; font-weight: 700;">(\${STAGE_THEMES[s] || ''})</span>
          </div>
          <span class="stage-card-badge">\${stageClearedCount} / 10 완료</span>
        \`;
        stageCard.appendChild(cardHeader);

        const tilesGrid = document.createElement('div');
        tilesGrid.className = 'level-tiles-grid';

        for (let l = 1; l <= 10; l++) {
          const tile = document.createElement('button');
          tile.className = 'level-tile';
          const isCleared = clearedSet.has(\`\${s}-\${l}\`);
          const isCurrent = (s === currentStage && l === currentLevel);

          if (isCleared) tile.classList.add('cleared');
          if (isCurrent) tile.classList.add('current-playing');

          tile.innerHTML = \`
            <span class="level-tile-num">\${l}단계</span>
            <span class="level-tile-status">\${isCleared ? '✔ 완료' : (isCurrent ? '도전 중' : '')}</span>
          \`;

          tile.addEventListener('click', () => {
            sound.playTap();
            closeStageMap();
            loadPuzzle(s, l);
          });

          tilesGrid.appendChild(tile);
        }

        stageCard.appendChild(tilesGrid);
        stagesListContainer.appendChild(stageCard);
      }
    }

    // 10. [화면 3] 환경설정 모달 로직
    function openSettingsModal() {
      sound.playTap();
      updateSettingsUI();
      settingsModal.classList.add('active');
    }
    function closeSettingsModal() {
      sound.playTap();
      settingsModal.classList.remove('active');
    }

    btnOpenSettings.addEventListener('click', openSettingsModal);
    btnCloseSettings.addEventListener('click', closeSettingsModal);
    btnConfirmSettings.addEventListener('click', closeSettingsModal);

    function updateSettingsUI() {
      document.querySelectorAll('.scale-opt-btn').forEach(btn => {
        const sc = parseFloat(btn.dataset.scale);
        btn.classList.toggle('active', Math.abs(sc - fontScale) < 0.05);
      });
      btnToggleAutoSpeak.textContent = autoSpeak ? '켜짐' : '꺼짐';
      btnToggleAutoSpeak.style.color = autoSpeak ? '#15803D' : '#64748B';
    }

    document.querySelectorAll('.scale-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playTap();
        fontScale = parseFloat(btn.dataset.scale);
        localStorage.setItem(STORAGE_KEY_FONT, fontScale.toString());
        document.documentElement.style.setProperty('--font-scale', fontScale.toString());
        updateSettingsUI();
      });
    });

    btnToggleAutoSpeak.addEventListener('click', () => {
      sound.playTap();
      autoSpeak = !autoSpeak;
      localStorage.setItem(STORAGE_KEY_AUTO_SPEAK, autoSpeak.toString());
      updateSettingsUI();
    });

    btnResetLevelInSettings.addEventListener('click', () => {
      if (confirm('현재 단계를 처음부터 다시 푸시겠습니까?')) {
        sound.playTap();
        closeSettingsModal();
        solvedWords.clear();
        clearedSet.delete(\`\${currentStage}-\${currentLevel}\`);
        localStorage.setItem(STORAGE_KEY_CLEARED, JSON.stringify(Array.from(clearedSet)));
        loadPuzzle(currentStage, currentLevel);
      }
    });

    // 11. 키보드 및 제스처 바인딩
    btnBackspace.addEventListener('click', onBackspace);
    btnHint.addEventListener('click', onHint);
    btnCheckAnswer.addEventListener('click', () => {
      sound.playTap();
      onCheckAnswer();
    });

    // PWA 설치 배너
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const banner = document.getElementById('installBanner');
      if (banner && !sessionStorage.getItem('pwa_banner_closed')) {
        banner.classList.add('active');
      }
    });

    const btnInstall = document.getElementById('btnInstall');
    if (btnInstall) {
      btnInstall.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        document.getElementById('installBanner').classList.remove('active');
      });
    }

    const btnCloseInstall = document.getElementById('btnCloseInstall');
    if (btnCloseInstall) {
      btnCloseInstall.addEventListener('click', () => {
        document.getElementById('installBanner').classList.remove('active');
        sessionStorage.setItem('pwa_banner_closed', '1');
      });
    }

    // 12. PWA 서비스 워커 등록 (자동 캐시 업데이트)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=11')
          .then(reg => {
            reg.update();
          })
          .catch(err => console.warn('SW reg failed:', err));
      });
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 초기 퍼즐 로드
    loadPuzzle(currentStage, currentLevel);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'index.html'), htmlContent, 'utf8');
console.log('index.html 생성 완료! 파일 크기: ' + (Buffer.byteLength(htmlContent) / 1024).toFixed(1) + ' KB');
