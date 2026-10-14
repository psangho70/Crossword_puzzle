// build_app.js
// 100단계 퍼즐 데이터와 모바일 PWA 최적화 index.html 생성기
const fs = require('fs');

const puzzlesData = fs.readFileSync('scripts/puzzles_100.json', 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>청춘 7x7 가로세로 낱말 퍼즐 100</title>
  <meta name="description" content="시니어 맞춤형 7x7 한국어 가로세로 낱말 퍼즐 100단계! 큰 글자, 큼직한 터치 자판, 또렷한 음성 안내(TTS)로 두뇌 건강을 지키세요.">
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
      --font-scale: 1.0;            /* 3단 글자 크기 변수 (1.0 / 1.15 / 1.32) */
    }

    /* 리셋 & 기본 설정 */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif;
      line-height: 1.4;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-bottom: 20px;
      overflow-x: hidden;
    }

    /* PWA 원터치 설치 배너 */
    #installBanner {
      display: none;
      width: 100%;
      max-width: 500px;
      background: linear-gradient(135deg, #15803D 0%, #16A34A 100%);
      color: #FFFFFF;
      padding: 10px 14px;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    #installBanner.active {
      display: flex;
    }
    .install-btn {
      background: #FFFFFF;
      color: #15803D;
      border: none;
      font-weight: 900;
      font-size: 14px;
      padding: 6px 14px;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      white-space: nowrap;
    }
    .install-btn:active {
      transform: scale(0.96);
    }
    .install-close {
      background: transparent;
      border: none;
      color: #FFFFFF;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
    }

    /* 최상단 메인 컨테이너 (스마트폰 최적화 패딩 & 갭) */
    .app-container {
      width: 100%;
      max-width: 480px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* =========================================================
       2. 상단 헤더 & 컨트롤 바 (모바일 불필요한 줄바꿈 원천 차단)
       ========================================================= */
    .app-header {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 10px 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* 헤더 1행: 타이틀, 뱃지, 소리토글, 글자크기 */
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: nowrap; /* 절대 줄바꿈 금지 */
    }

    .brand-title {
      font-size: 18px;
      font-weight: 900;
      color: var(--primary-color);
      display: flex;
      align-items: center;
      gap: 5px;
      letter-spacing: -0.5px;
      white-space: nowrap; /* 한 줄 고정 */
      flex-shrink: 0;
    }
    .brand-title .badge {
      font-size: 11px;
      background: #EFF6FF;
      color: var(--primary-color);
      border: 1px solid #BFDBFE;
      padding: 2px 5px;
      border-radius: 6px;
      font-weight: 800;
      white-space: nowrap;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap; /* 줄바꿈 금지 */
      flex-shrink: 0;
    }

    /* 소리 토글 버튼 (가로 정렬 고정) */
    .icon-btn {
      background: #F3F4F6;
      border: 1px solid var(--border-color);
      border-radius: 9px;
      padding: 5px 8px;
      font-size: 13px;
      font-weight: 800;
      color: var(--text-color);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap; /* 절대 텍스트 줄바꿈 방지 */
      height: 34px;
    }
    .icon-btn:active {
      transform: scale(0.95);
    }
    .icon-btn.active {
      background: #EFF6FF;
      border-color: #93C5FD;
      color: var(--primary-color);
    }

    /* 글자 크기 3단 조절 버튼 그룹 (가로 고정) */
    .font-size-group {
      display: inline-flex;
      align-items: center;
      background: #F3F4F6;
      padding: 2px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      gap: 2px;
      white-space: nowrap;
      height: 34px;
    }
    .font-btn {
      border: none;
      background: transparent;
      padding: 4px 7px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
      cursor: pointer;
      white-space: nowrap; /* '작게' 두 글자 한 줄 유지 */
      transition: all 0.15s ease;
    }
    .font-btn.active {
      background: #FFFFFF;
      color: var(--primary-color);
      font-weight: 900;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }

    /* 스테이지 / 단계 선택 드롭다운 영역 */
    .stage-bar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .select-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .select-label {
      font-size: 11px;
      font-weight: 800;
      color: var(--text-muted);
    }
    .custom-select {
      width: 100%;
      height: 38px;
      border: 1.5px solid #CBD5E1;
      border-radius: 9px;
      background: #FFFFFF;
      color: var(--text-color);
      font-size: 14px;
      font-weight: 800;
      padding: 0 8px;
      cursor: pointer;
      outline: none;
    }
    .custom-select:focus {
      border-color: var(--primary-color);
    }

    /* 전체 진행률 프로그레스 바 */
    .progress-bar-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .progress-text-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 800;
      color: var(--text-muted);
    }
    .progress-track {
      width: 100%;
      height: 6px;
      background: #E5E7EB;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%);
      border-radius: 9999px;
      transition: width 0.3s ease;
      width: 0%;
    }

    /* =========================================================
       3. 7x7 격자판 (Board)
       스마트폰 화면에 맞게 최적 비율 유지 & 깨짐 방지
       ========================================================= */
    .board-card {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .board-grid {
      width: 100%;
      max-width: 380px;
      aspect-ratio: 1 / 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-template-rows: repeat(7, 1fr);
      gap: 4px;
      background: #F1F5F9;
      padding: 4px;
      border-radius: 12px;
      box-shadow: inset 0 2px 5px rgba(0,0,0,0.04);
    }

    .cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #E2E8F0;
      border-radius: 7px;
      font-weight: 900;
      font-size: clamp(16px, 4.2vw, 24px);
      color: var(--text-color);
      cursor: default;
      transition: background-color 0.15s ease, border-color 0.15s ease;
      user-select: none;
    }

    /* 단어가 들어가는 활성 칸 */
    .cell.playable {
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      cursor: pointer;
    }
    .cell.playable:active {
      transform: scale(0.97);
    }

    /* 번호 뱃지 (왼쪽 상단) */
    .cell-num {
      position: absolute;
      top: 1px;
      left: 2px;
      font-size: clamp(9px, 2.1vw, 11px);
      font-weight: 900;
      color: #64748B;
      line-height: 1;
      pointer-events: none;
    }

    /* 선택된 단어 전체 하이라이트 */
    .cell.in-word {
      background-color: var(--highlight-color);
      border-color: var(--highlight-border);
    }

    /* 현재 커서 칸 */
    .cell.current-cursor {
      background-color: #FEF9C3;
      border: 2.5px solid var(--cell-active-border);
      box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.25);
      z-index: 2;
    }

    /* 정답 완료 칸 */
    .cell.solved {
      background-color: var(--success-bg) !important;
      border-color: var(--success-border) !important;
      color: var(--success-text);
      font-weight: 900;
    }

    /* =========================================================
       4. 현재 문제 설명 & TTS 음성 버튼
       글자 크기 스케일(--font-scale) 적용
       ========================================================= */
    .clue-card {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 10px 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1.5px solid #BFDBFE;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .clue-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .clue-tag {
      background: var(--primary-color);
      color: #FFFFFF;
      font-size: calc(13px * var(--font-scale));
      font-weight: 900;
      padding: 3px 9px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .clue-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    /* TTS 음성 듣기 버튼 */
    .tts-btn {
      background: #EFF6FF;
      color: var(--primary-color);
      border: 1.5px solid #93C5FD;
      border-radius: 9999px;
      padding: 4px 10px;
      font-size: calc(13px * var(--font-scale));
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .tts-btn:active {
      transform: scale(0.96);
    }
    .tts-btn.speaking {
      background: #DCFCE7;
      border-color: #22C55E;
      color: #15803D;
      animation: pulse 0.8s infinite alternate;
    }
    @keyframes pulse {
      from { transform: scale(1); }
      to { transform: scale(1.04); }
    }

    .clue-text {
      font-size: calc(16px * var(--font-scale));
      font-weight: 800;
      color: var(--text-color);
      line-height: 1.45;
      word-break: keep-all;
    }

    /* =========================================================
       5. 정답 조합 슬롯 (Answer Slots)
       ========================================================= */
    .slots-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 2px 0;
      flex-wrap: wrap;
    }

    .slot {
      width: clamp(40px, 9.8vw, 50px);
      height: clamp(44px, 10.8vw, 54px);
      background: #FFFFFF;
      border: 2px solid #94A3B8;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: calc(21px * var(--font-scale));
      font-weight: 900;
      color: var(--text-color);
      cursor: pointer;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 0.15s ease;
    }
    .slot:active {
      transform: scale(0.96);
    }

    /* 이미 교차로 맞혀진 잠금 슬롯 */
    .slot.locked {
      background: #DCFCE7;
      border-color: #22C55E;
      color: #15803D;
      cursor: default;
    }
    .slot.locked::after {
      content: '✔';
      position: absolute;
      top: -5px;
      right: -5px;
      background: #16A34A;
      color: #FFFFFF;
      font-size: 10px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
    }

    /* 현재 채워야 할 활성 슬롯 */
    .slot.active-target {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2.5px rgba(29, 78, 216, 0.25);
      background: #EFF6FF;
    }

    /* 슬롯 오답 흔들림 애니메이션 */
    .slots-container.shake {
      animation: shakeSlots 0.4s ease;
    }
    @keyframes shakeSlots {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }

    /* =========================================================
       6. 10개 큼직한 한글 음절 터치 자판 (5열 × 2행, 48~56px)
       스마트폰 가상 키보드 완전 대체
       ========================================================= */
    .touch-keyboard-card {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .key-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
    }

    .key-btn {
      min-height: 48px;
      height: clamp(48px, 11vw, 54px);
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      border-bottom: 3.5px solid #94A3B8;
      border-radius: 11px;
      font-size: calc(20px * var(--font-scale));
      font-weight: 900;
      color: #1E293B;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.1s ease;
    }
    .key-btn:active {
      transform: translateY(2px);
      border-bottom-width: 1.5px;
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

    /* 보조 버튼 바 */
    .control-actions-bar {
      display: grid;
      grid-template-columns: 1fr 1fr 1.2fr 1.2fr;
      gap: 5px;
    }

    .sub-btn {
      height: 42px;
      border-radius: 10px;
      font-size: calc(13px * var(--font-scale));
      font-weight: 800;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
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
    .btn-clear {
      background: #F3F4F6;
      color: #374151;
      border: 1px solid #D1D5DB;
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

    /* 하단 보조 옵션: 이 단계 다시 풀기 */
    .bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
    }
    .reset-stage-btn {
      background: transparent;
      border: none;
      color: #6B7280;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      text-decoration: underline;
    }

    /* =========================================================
       7. 단계 완료 축하 모달 & 팡파르
       ========================================================= */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 2000;
    }
    .modal-overlay.active {
      display: flex;
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-card {
      background: #FFFFFF;
      border-radius: 20px;
      max-width: 380px;
      width: 100%;
      padding: 24px 20px;
      text-align: center;
      box-shadow: 0 16px 28px rgba(0,0,0,0.25);
      border: 3px solid #FDE047;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes popUp {
      from { transform: scale(0.85); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-icon {
      font-size: 56px;
      line-height: 1;
    }
    .modal-title {
      font-size: 22px;
      font-weight: 900;
      color: #1E3A8A;
    }
    .modal-desc {
      font-size: 15px;
      font-weight: 700;
      color: #4B5563;
      line-height: 1.5;
    }
    .modal-btn {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      color: #FFFFFF;
      border: none;
      border-radius: 14px;
      font-size: 17px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(29, 78, 216, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .modal-btn:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>

  <!-- PWA 원터치 설치 배너 -->
  <div id="installBanner">
    <div style="font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 5px;">
      <span>📲</span> <span>바탕화면에 앱 설치하고 언제든 편하게 푸세요!</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <button class="install-btn" id="btnInstall">설치</button>
      <button class="install-close" id="btnCloseInstall">✕</button>
    </div>
  </div>

  <div class="app-container">

    <!-- 상단 헤더 & 컨트롤 바 (모바일 가로 정렬 고정) -->
    <header class="app-header">
      <div class="header-top">
        <div class="brand-title">
          <span>청춘 낱말 퍼즐</span>
          <span class="badge">7×7 100단계</span>
        </div>
        <div class="header-actions">
          <!-- 소리 토글 -->
          <button class="icon-btn active" id="btnSoundToggle" title="소리 켜기/끄기">
            <span id="soundIcon">🔊</span>
            <span id="soundText" style="font-size: 12px;">소리켬</span>
          </button>
          <!-- 3단 글자 크기 조절 -->
          <div class="font-size-group">
            <button class="font-btn active" data-scale="1.0" id="btnFontSmall">작게</button>
            <button class="font-btn" data-scale="1.15" id="btnFontMed">중간</button>
            <button class="font-btn" data-scale="1.32" id="btnFontLarge">크게</button>
          </div>
        </div>
      </div>

      <!-- 스테이지 / 단계 선택기 드롭다운 2개 -->
      <div class="stage-bar">
        <div class="select-wrap">
          <label class="select-label" for="selectStage">스테이지 선택</label>
          <select class="custom-select" id="selectStage"></select>
        </div>
        <div class="select-wrap">
          <label class="select-label" for="selectLevel">단계 선택</label>
          <select class="custom-select" id="selectLevel"></select>
        </div>
      </div>

      <!-- 100단계 전체 진행률 -->
      <div class="progress-bar-wrap">
        <div class="progress-text-row">
          <span>전체 진행률</span>
          <span id="progressText">전체 완료: 0 / 100 단계 (0%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" id="progressFill"></div>
        </div>
      </div>
    </header>

    <!-- 7x7 격자판 보드 카드 -->
    <main class="board-card">
      <div class="board-grid" id="boardGrid">
        <!-- 49개 셀이 동적으로 렌더링됩니다 -->
      </div>
    </main>

    <!-- 문제 설명 및 TTS 음성 카드 -->
    <section class="clue-card">
      <div class="clue-header">
        <div class="clue-tag" id="clueTag">
          <span id="clueDirIcon">➡</span>
          <span id="clueTitle">가로 1번 문제</span>
        </div>
        <div class="clue-actions">
          <button class="tts-btn" id="btnTts">
            <span>🔊</span> <span>문제 듣기</span>
          </button>
        </div>
      </div>
      <div class="clue-text" id="clueText">
        문제를 불러오는 중입니다...
      </div>

      <!-- 정답 조합 슬롯 -->
      <div class="slots-container" id="slotsContainer">
        <!-- 글자 수만큼의 슬롯이 동적으로 생성됩니다 -->
      </div>
    </section>

    <!-- 터치 자판 카드 (10개 한글 음절 버튼 + 보조 버튼) -->
    <section class="touch-keyboard-card">
      <!-- 5열 x 2행 한글 음절 버튼 10개 -->
      <div class="key-grid" id="keyGrid">
        <!-- 10개 키 버튼이 동적으로 생성됩니다 -->
      </div>

      <!-- 보조 기능 버튼 -->
      <div class="control-actions-bar">
        <button class="sub-btn btn-backspace" id="btnBackspace" title="한 글자 지우기">
          <span>⬅</span> <span>지우기</span>
        </button>
        <button class="sub-btn btn-clear" id="btnClearAll" title="전체 지우기">
          <span>↺</span> <span>전체</span>
        </button>
        <button class="sub-btn btn-hint" id="btnHint" title="힌트 (한 글자 채우기)">
          <span>💡</span> <span>힌트</span>
        </button>
        <button class="sub-btn btn-check" id="btnCheckAnswer" title="정답 확인">
          <span>✔</span> <span>확인</span>
        </button>
      </div>

      <!-- 하단 옵션: 다시 풀기 -->
      <div class="bottom-bar">
        <button class="reset-stage-btn" id="btnResetLevel">
          <span>🔄</span> <span>이 단계 처음부터 다시 풀기</span>
        </button>
      </div>
    </section>

  </div>

  <!-- 단계 클리어 축하 모달 -->
  <div class="modal-overlay" id="clearModal">
    <div class="modal-card">
      <div class="modal-icon">🎉</div>
      <h2 class="modal-title" id="modalTitle">참 잘하셨습니다!</h2>
      <p class="modal-desc" id="modalDesc">
        스테이지 1 - 1단계를 멋지게 완료하셨습니다.<br>
        두뇌가 맑아지고 기억력이 쑥쑥 자라납니다!
      </p>
      <button class="modal-btn" id="btnNextLevel">
        <span>다음 단계 도전하기</span> <span>➔</span>
      </button>
    </div>
  </div>

  <script>
    // =========================================================
    // 1. 100단계 퍼즐 내장 데이터 (JSON)
    // =========================================================
    const PUZZLE_DATA = ${puzzlesData};

    // =========================================================
    // 2. Web Audio API 사운드 엔진 (효과음 & 챠임벨)
    // =========================================================
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
        } catch (e) {
          console.warn('Audio play error:', e);
        }
      }

      // 버튼 터치음 (가볍고 맑은 틱)
      playTap() {
        this.playTone(520, 0.08, 'triangle', 0.1);
      }

      // 글자 지우기 음
      playBackspace() {
        this.playTone(320, 0.09, 'sine', 0.1);
      }

      // 오답 알림음 (온화한 저음 비프 2회)
      playWrong() {
        if (!this.enabled) return;
        this.playTone(280, 0.12, 'sawtooth', 0.08);
        setTimeout(() => this.playTone(220, 0.18, 'sawtooth', 0.08), 120);
      }

      // 정답 팡파르 (도-미-솔-도 C5-E5-G5-C6 경쾌한 아르페지오)
      playCorrect() {
        if (!this.enabled) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            this.playTone(freq, 0.18, 'triangle', 0.18);
          }, idx * 80);
        });
      }

      // 단계 올클리어 축하 화음 (도-솔-도-미 화려한 축포)
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

      // 문제 듣기 시작 알림 챠임벨
      playChime() {
        if (!this.enabled) return;
        this.playTone(659.25, 0.12, 'triangle', 0.12);
        setTimeout(() => this.playTone(880.00, 0.25, 'triangle', 0.15), 100);
      }
    }

    const sound = new SoundEngine();

    // =========================================================
    // 3. 상태 관리 및 로컬스토리지 (LocalStorage)
    // =========================================================
    const STORAGE_KEY_STAGE = 'senior_crossword_stage';
    const STORAGE_KEY_LEVEL = 'senior_crossword_level';
    const STORAGE_KEY_CLEARED = 'senior_crossword_cleared_v1';
    const STORAGE_KEY_FONT = 'senior_crossword_font_scale';
    const STORAGE_KEY_SOUND = 'senior_crossword_sound_enabled';

    let currentStage = parseInt(localStorage.getItem(STORAGE_KEY_STAGE) || '1', 10);
    let currentLevel = parseInt(localStorage.getItem(STORAGE_KEY_LEVEL) || '1', 10);
    let clearedSet = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_CLEARED) || '[]'));
    let fontScale = parseFloat(localStorage.getItem(STORAGE_KEY_FONT) || '1.0');
    let soundEnabled = localStorage.getItem(STORAGE_KEY_SOUND) !== 'false';

    sound.enabled = soundEnabled;
    document.documentElement.style.setProperty('--font-scale', fontScale.toString());

    // 현재 플레이 상태
    let currentPuzzle = null;
    let selectedWordIndex = 0;   // 현재 선택된 단어 인덱스
    let solvedWords = new Set(); // 현재 단계에서 맞힌 단어 인덱스들
    let currentWordInputs = [];  // 현재 선택된 단어의 각 슬롯 입력 상태 [ { char: '가', locked: false, keyIndex: 2 } ]
    let keyboardKeys = [];       // 현재 단어의 10개 한글 음절 [ { char: '가', used: false } ]
    let ttsSpeaking = false;

    // =========================================================
    // 4. UI 엘리먼트 참조
    // =========================================================
    const selectStage = document.getElementById('selectStage');
    const selectLevel = document.getElementById('selectLevel');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const boardGrid = document.getElementById('boardGrid');
    const clueTag = document.getElementById('clueTag');
    const clueDirIcon = document.getElementById('clueDirIcon');
    const clueTitle = document.getElementById('clueTitle');
    const clueText = document.getElementById('clueText');
    const btnTts = document.getElementById('btnTts');
    const slotsContainer = document.getElementById('slotsContainer');
    const keyGrid = document.getElementById('keyGrid');
    const btnBackspace = document.getElementById('btnBackspace');
    const btnClearAll = document.getElementById('btnClearAll');
    const btnHint = document.getElementById('btnHint');
    const btnCheckAnswer = document.getElementById('btnCheckAnswer');
    const btnResetLevel = document.getElementById('btnResetLevel');
    const clearModal = document.getElementById('clearModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const btnNextLevel = document.getElementById('btnNextLevel');
    const btnSoundToggle = document.getElementById('btnSoundToggle');
    const soundIcon = document.getElementById('soundIcon');
    const soundText = document.getElementById('soundText');

    // =========================================================
    // 5. 모바일 호환 TTS (SpeechSynthesis) 음성 사전 로드
    // =========================================================
    let availableVoices = [];
    let koreanVoice = null;

    function initVoices() {
      if (!('speechSynthesis' in window)) return;
      try {
        availableVoices = window.speechSynthesis.getVoices() || [];
        // 한국어 음성 검색 (ko-KR, kor, 한국어 등)
        koreanVoice = availableVoices.find(v => {
          const l = (v.lang || '').toLowerCase();
          const n = (v.name || '').toLowerCase();
          return l.includes('ko') || l.includes('kor') || n.includes('korean') || n.includes('한국');
        }) || null;
      } catch (e) {
        console.warn('Voice load error:', e);
      }
    }

    if ('speechSynthesis' in window) {
      initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        initVoices();
      };
    }

    // =========================================================
    // 6. 스테이지 / 레벨 드롭다운 구성 및 진행률 갱신
    // =========================================================
    function updateDropdowns() {
      // 1) 스테이지 드롭다운 (1~10)
      selectStage.innerHTML = '';
      for (let s = 1; s <= 10; s++) {
        let stageAllCleared = true;
        for (let l = 1; l <= 10; l++) {
          if (!clearedSet.has(\`\${s}-\${l}\`)) {
            stageAllCleared = false;
            break;
          }
        }
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = stageAllCleared ? \`★ 스테이지 \${s} (완료)\` : \`스테이지 \${s}\`;
        if (s === currentStage) opt.selected = true;
        selectStage.appendChild(opt);
      }

      // 2) 단계 드롭다운 (1~10)
      selectLevel.innerHTML = '';
      for (let l = 1; l <= 10; l++) {
        const isCleared = clearedSet.has(\`\${currentStage}-\${l}\`);
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = isCleared ? \`✔ \${l}단계 (완료)\` : \`\${l}단계\`;
        if (l === currentLevel) opt.selected = true;
        selectLevel.appendChild(opt);
      }

      // 3) 전체 진행률 (총 100단계 중 완료 수)
      const totalCleared = clearedSet.size;
      const pct = Math.round((totalCleared / 100) * 100);
      progressText.textContent = \`전체 완료: \${totalCleared} / 100 단계 (\${pct}%)\`;
      progressFill.style.width = \`\${pct}%\`;
    }

    // =========================================================
    // 7. 퍼즐 로드 및 초기화
    // =========================================================
    function loadPuzzle(stage, level) {
      currentStage = stage;
      currentLevel = level;
      localStorage.setItem(STORAGE_KEY_STAGE, currentStage);
      localStorage.setItem(STORAGE_KEY_LEVEL, currentLevel);

      const globalIdx = (currentStage - 1) * 10 + (currentLevel - 1);
      currentPuzzle = PUZZLE_DATA[globalIdx] || PUZZLE_DATA[0];

      // 이전 진행 복원 또는 신규 초기화
      solvedWords.clear();
      selectedWordIndex = 0;

      const isAlreadyCleared = clearedSet.has(\`\${currentStage}-\${currentLevel}\`);
      if (isAlreadyCleared) {
        currentPuzzle.words.forEach((_, idx) => solvedWords.add(idx));
      }

      updateDropdowns();
      renderBoard();
      selectWord(selectedWordIndex);
    }

    // =========================================================
    // 8. 7x7 격자판 렌더링
    // =========================================================
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

      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
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
          if (w.r === r && c >= w.c && c < w.c + w.len) {
            matchingWords.push(idx);
          }
        } else {
          if (w.c === c && r >= w.r && r < w.r + w.len) {
            matchingWords.push(idx);
          }
        }
      });

      if (matchingWords.length === 0) return;

      if (matchingWords.includes(selectedWordIndex) && matchingWords.length > 1) {
        const nextIdx = matchingWords[0] === selectedWordIndex ? matchingWords[1] : matchingWords[0];
        selectWord(nextIdx);
      } else {
        selectWord(matchingWords[0]);
      }
    }

    function updateBoardHighlights() {
      const activeWord = currentPuzzle.words[selectedWordIndex];
      const allCells = boardGrid.querySelectorAll('.cell.playable');

      allCells.forEach(cell => {
        cell.classList.remove('in-word', 'current-cursor');
        const r = parseInt(cell.dataset.r, 10);
        const c = parseInt(cell.dataset.c, 10);

        if (activeWord.dir === 'across') {
          if (r === activeWord.r && c >= activeWord.c && c < activeWord.c + activeWord.len) {
            cell.classList.add('in-word');
            const offset = c - activeWord.c;
            if (isCurrentCursorSlot(offset)) {
              cell.classList.add('current-cursor');
            }
          }
        } else {
          if (c === activeWord.c && r >= activeWord.r && r < activeWord.r + activeWord.len) {
            cell.classList.add('in-word');
            const offset = r - activeWord.r;
            if (isCurrentCursorSlot(offset)) {
              cell.classList.add('current-cursor');
            }
          }
        }
      });
    }

    function isCurrentCursorSlot(offset) {
      if (!currentWordInputs || currentWordInputs.length === 0) return offset === 0;
      const firstEmptyIdx = currentWordInputs.findIndex(slot => !slot.char);
      return firstEmptyIdx === -1 ? offset === 0 : offset === firstEmptyIdx;
    }

    // =========================================================
    // 9. 단어 선택 및 문제/슬롯/자판 세팅
    // =========================================================
    function selectWord(wordIndex) {
      selectedWordIndex = wordIndex;
      const w = currentPuzzle.words[wordIndex];

      clueDirIcon.textContent = w.dir === 'across' ? '➡' : '⬇';
      clueTitle.textContent = \`\${w.dirKo} \${w.num}번 (\${w.len}글자)\`;
      clueText.textContent = w.clue;

      currentWordInputs = [];
      for (let i = 0; i < w.len; i++) {
        const r = w.dir === 'across' ? w.r : w.r + i;
        const c = w.dir === 'across' ? w.c + i : w.c;
        const cellChar = getBoardConfirmedChar(r, c);

        if (cellChar) {
          currentWordInputs.push({ char: cellChar, locked: true, keyIndex: null });
        } else {
          currentWordInputs.push({ char: '', locked: false, keyIndex: null });
        }
      }

      setupTouchKeyboard(w);

      renderSlots();
      renderKeyboard();
      updateBoardHighlights();

      stopTts();
    }

    function getBoardConfirmedChar(r, c) {
      for (const wIdx of solvedWords) {
        const w = currentPuzzle.words[wIdx];
        if (w.dir === 'across') {
          if (w.r === r && c >= w.c && c < w.c + w.len) {
            return w.word[c - w.c];
          }
        } else {
          if (w.c === c && r >= w.r && r < w.r + w.len) {
            return w.word[r - w.r];
          }
        }
      }
      return null;
    }

    function setupTouchKeyboard(activeWord) {
      const correctChars = activeWord.word.split('');
      const distractorPool = ['강', '달', '꽃', '물', '산', '길', '새', '집', '봄', '밤', '솔', '바', '람', '들', '돌', '해', '눈', '빛', '곡', '정', '마', '가', '나', '다', '라', '자', '차', '카', '타', '파', '하', '선', '문', '전', '국', '노', '래', '배', '소', '리'];

      currentPuzzle.words.forEach(other => {
        if (other !== activeWord) {
          for (const ch of other.word) {
            if (!distractorPool.includes(ch)) distractorPool.push(ch);
          }
        }
      });

      const keys = [...correctChars];
      const shuffledDistractors = distractorPool.filter(c => !correctChars.includes(c)).sort(() => 0.5 - Math.random());

      while (keys.length < 10) {
        if (shuffledDistractors.length > 0) {
          keys.push(shuffledDistractors.pop());
        } else {
          keys.push('정');
        }
      }

      keys.sort(() => 0.5 - Math.random());

      keyboardKeys = keys.map(ch => ({
        char: ch,
        used: false
      }));

      currentWordInputs.forEach(slot => {
        if (slot.locked && slot.char) {
          const k = keyboardKeys.find(item => item.char === slot.char && !item.used);
          if (k) k.used = true;
        }
      });
    }

    function renderSlots() {
      slotsContainer.innerHTML = '';
      currentWordInputs.forEach((slot, idx) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';
        if (slot.locked) slotDiv.classList.add('locked');
        if (slot.char) slotDiv.textContent = slot.char;

        const firstEmpty = currentWordInputs.findIndex(s => !s.char);
        if (idx === firstEmpty) slotDiv.classList.add('active-target');

        slotDiv.addEventListener('click', () => {
          if (!slot.locked && slot.char) {
            removeSlotChar(idx);
          }
        });

        slotsContainer.appendChild(slotDiv);
      });
    }

    function renderKeyboard() {
      keyGrid.innerHTML = '';
      keyboardKeys.forEach((keyItem, idx) => {
        const btn = document.createElement('button');
        btn.className = 'key-btn';
        if (keyItem.used) btn.classList.add('used');
        btn.textContent = keyItem.char;
        btn.disabled = keyItem.used;

        btn.addEventListener('click', () => onKeyPress(idx));
        keyGrid.appendChild(btn);
      });
    }

    // =========================================================
    // 10. 터치 자판 입력 및 자동 정답 판별
    // =========================================================
    function onKeyPress(keyIndex) {
      sound.playTap();
      const keyItem = keyboardKeys[keyIndex];
      if (keyItem.used) return;

      const targetSlotIndex = currentWordInputs.findIndex(s => !s.char);
      if (targetSlotIndex === -1) return;

      currentWordInputs[targetSlotIndex].char = keyItem.char;
      currentWordInputs[targetSlotIndex].keyIndex = keyIndex;
      keyItem.used = true;

      renderSlots();
      renderKeyboard();
      updateBoardHighlights();

      const isAllFilled = currentWordInputs.every(s => s.char !== '');
      if (isAllFilled) {
        setTimeout(checkCurrentWordAnswer, 120);
      }
    }

    function removeSlotChar(slotIndex) {
      const slot = currentWordInputs[slotIndex];
      if (slot.locked || !slot.char) return;

      sound.playBackspace();

      if (slot.keyIndex !== null && keyboardKeys[slot.keyIndex]) {
        keyboardKeys[slot.keyIndex].used = false;
      } else {
        const k = keyboardKeys.find(item => item.char === slot.char && item.used);
        if (k) k.used = false;
      }

      slot.char = '';
      slot.keyIndex = null;

      renderSlots();
      renderKeyboard();
      updateBoardHighlights();
    }

    function onBackspace() {
      for (let i = currentWordInputs.length - 1; i >= 0; i--) {
        if (!currentWordInputs[i].locked && currentWordInputs[i].char) {
          removeSlotChar(i);
          return;
        }
      }
    }

    function onClearAll() {
      sound.playBackspace();
      currentWordInputs.forEach((slot, idx) => {
        if (!slot.locked && slot.char) {
          if (slot.keyIndex !== null && keyboardKeys[slot.keyIndex]) {
            keyboardKeys[slot.keyIndex].used = false;
          } else {
            const k = keyboardKeys.find(item => item.char === slot.char && item.used);
            if (k) k.used = false;
          }
          slot.char = '';
          slot.keyIndex = null;
        }
      });
      renderSlots();
      renderKeyboard();
      updateBoardHighlights();
    }

    function onHint() {
      sound.playTap();
      const activeWord = currentPuzzle.words[selectedWordIndex];
      const emptySlotIdx = currentWordInputs.findIndex(s => !s.char);
      if (emptySlotIdx === -1) return;

      const targetChar = activeWord.word[emptySlotIdx];

      const keyIdx = keyboardKeys.findIndex(k => k.char === targetChar && !k.used);
      if (keyIdx !== -1) {
        onKeyPress(keyIdx);
      } else {
        currentWordInputs[emptySlotIdx].char = targetChar;
        renderSlots();
        renderKeyboard();
        updateBoardHighlights();

        if (currentWordInputs.every(s => s.char !== '')) {
          setTimeout(checkCurrentWordAnswer, 120);
        }
      }
    }

    // =========================================================
    // 11. 정답 확인 및 단계 완료 처리
    // =========================================================
    function checkCurrentWordAnswer() {
      const activeWord = currentPuzzle.words[selectedWordIndex];
      const enteredWord = currentWordInputs.map(s => s.char).join('');

      if (enteredWord === activeWord.word) {
        sound.playCorrect();
        solvedWords.add(selectedWordIndex);

        renderBoard();

        if (solvedWords.size === currentPuzzle.words.length) {
          setTimeout(onStageAllClear, 350);
        } else {
          setTimeout(goToNextUnsolvedWord, 300);
        }
      } else {
        sound.playWrong();
        slotsContainer.classList.add('shake');
        setTimeout(() => slotsContainer.classList.remove('shake'), 450);
      }
    }

    function goToNextUnsolvedWord() {
      for (let i = 0; i < currentPuzzle.words.length; i++) {
        const nextIdx = (selectedWordIndex + 1 + i) % currentPuzzle.words.length;
        if (!solvedWords.has(nextIdx)) {
          selectWord(nextIdx);
          return;
        }
      }
    }

    function onStageAllClear() {
      sound.playStageClear();

      const stageKey = \`\${currentStage}-\${currentLevel}\`;
      clearedSet.add(stageKey);
      localStorage.setItem(STORAGE_KEY_CLEARED, JSON.stringify(Array.from(clearedSet)));

      updateDropdowns();

      modalTitle.textContent = '🎉 참 잘하셨습니다!';
      modalDesc.innerHTML = \`<strong>스테이지 \${currentStage} - \${currentLevel}단계</strong>를 멋지게 완료하셨습니다!<br>두뇌가 맑아지고 기억력이 쑥쑥 자라납니다.\`;
      clearModal.classList.add('active');
    }

    btnNextLevel.addEventListener('click', () => {
      clearModal.classList.remove('active');
      let nextStage = currentStage;
      let nextLevel = currentLevel + 1;
      if (nextLevel > 10) {
        nextLevel = 1;
        nextStage = currentStage + 1;
        if (nextStage > 10) nextStage = 1;
      }
      loadPuzzle(nextStage, nextLevel);
    });

    // =========================================================
    // 12. 모바일 PWA 완벽 지원 음성 안내 (TTS)
    // 안드로이드 크롬 GC 버그 및 Voice 바인딩 해결
    // =========================================================
    window.__currentUtterance = null; // 안드로이드 크롬 GC 수거 방지용 전역 참조

    function speakClue() {
      if (!('speechSynthesis' in window)) {
        alert('이 기기는 음성 안내(TTS)를 지원하지 않는 브라우저입니다.');
        return;
      }

      if (ttsSpeaking) {
        stopTts();
        return;
      }

      try {
        // 모바일 사운드 활성화 (챠임벨 먼저 재생하여 반응성 확보)
        sound.playChime();

        // 멈춰있는 오디오 세션 해제
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();

        initVoices();

        const activeWord = currentPuzzle.words[selectedWordIndex];
        const textToRead = \`\${activeWord.dirKo} \${activeWord.num}번, \${activeWord.len}글자 문제입니다. \${activeWord.clue}\`;

        const utter = new SpeechSynthesisUtterance(textToRead);
        utter.lang = 'ko-KR';
        if (koreanVoice) utter.voice = koreanVoice;
        utter.rate = 0.92;
        utter.pitch = 1.0;

        // GC 방지 전역 참조 보존
        window.__currentUtterance = utter;

        utter.onstart = () => {
          ttsSpeaking = true;
          btnTts.classList.add('speaking');
          btnTts.querySelector('span:last-child').textContent = '듣기 중지';
        };

        utter.onend = () => {
          stopTts();
        };

        utter.onerror = (err) => {
          console.warn('TTS playback error:', err);
          stopTts();
        };

        // 모바일 브라우저 실행 타이밍 보정 (cancel 후 약간의 대기)
        setTimeout(() => {
          window.speechSynthesis.speak(utter);
        }, 60);

      } catch (err) {
        console.error('Speech synthesis failure:', err);
        stopTts();
      }
    }

    function stopTts() {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      ttsSpeaking = false;
      window.__currentUtterance = null;
      btnTts.classList.remove('speaking');
      btnTts.querySelector('span:last-child').textContent = '문제 듣기';
    }

    btnTts.addEventListener('click', () => {
      speakClue();
    });

    // =========================================================
    // 13. 컨트롤 이벤트 리스너
    // =========================================================
    btnBackspace.addEventListener('click', onBackspace);
    btnClearAll.addEventListener('click', onClearAll);
    btnHint.addEventListener('click', onHint);
    btnCheckAnswer.addEventListener('click', () => {
      sound.playTap();
      checkCurrentWordAnswer();
    });

    btnResetLevel.addEventListener('click', () => {
      if (confirm(\`현재 스테이지 \${currentStage} - \${currentLevel}단계를 처음부터 다시 푸시겠습니까?\`)) {
        sound.playTap();
        solvedWords.clear();
        const stageKey = \`\${currentStage}-\${currentLevel}\`;
        clearedSet.delete(stageKey);
        localStorage.setItem(STORAGE_KEY_CLEARED, JSON.stringify(Array.from(clearedSet)));
        updateDropdowns();
        renderBoard();
        selectWord(0);
      }
    });

    selectStage.addEventListener('change', (e) => {
      sound.playTap();
      const newStage = parseInt(e.target.value, 10);
      loadPuzzle(newStage, 1);
    });

    selectLevel.addEventListener('change', (e) => {
      sound.playTap();
      const newLevel = parseInt(e.target.value, 10);
      loadPuzzle(currentStage, newLevel);
    });

    btnSoundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      sound.enabled = soundEnabled;
      localStorage.setItem(STORAGE_KEY_SOUND, soundEnabled);
      if (soundEnabled) {
        btnSoundToggle.classList.add('active');
        soundIcon.textContent = '🔊';
        soundText.textContent = '소리켬';
        sound.playTap();
      } else {
        btnSoundToggle.classList.remove('active');
        soundIcon.textContent = '🔇';
        soundText.textContent = '소리끔';
      }
    });

    const fontBtns = [
      { btn: document.getElementById('btnFontSmall'), scale: 1.0 },
      { btn: document.getElementById('btnFontMed'), scale: 1.15 },
      { btn: document.getElementById('btnFontLarge'), scale: 1.32 }
    ];

    function setFontScale(scale) {
      fontScale = scale;
      localStorage.setItem(STORAGE_KEY_FONT, scale);
      document.documentElement.style.setProperty('--font-scale', scale.toString());
      fontBtns.forEach(item => {
        item.btn.classList.toggle('active', item.scale === scale);
      });
      renderSlots();
      renderKeyboard();
    }

    fontBtns.forEach(item => {
      item.btn.addEventListener('click', () => {
        sound.playTap();
        setFontScale(item.scale);
      });
    });

    setFontScale(fontScale);
    if (!soundEnabled) {
      btnSoundToggle.classList.remove('active');
      soundIcon.textContent = '🔇';
      soundText.textContent = '소리끔';
    }

    // =========================================================
    // 14. PWA 서비스워커 등록 & 설치 프롬프트
    // =========================================================
    let deferredPrompt = null;
    const installBanner = document.getElementById('installBanner');
    const btnInstall = document.getElementById('btnInstall');
    const btnCloseInstall = document.getElementById('btnCloseInstall');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBanner.classList.add('active');
    });

    btnInstall.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          installBanner.classList.remove('active');
        }
        deferredPrompt = null;
      }
    });

    btnCloseInstall.addEventListener('click', () => {
      installBanner.classList.remove('active');
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('ServiceWorker registered:', reg.scope))
          .catch(err => console.warn('ServiceWorker registration failed:', err));
      });
    }

    // =========================================================
    // 15. 앱 초기 로드 실행
    // =========================================================
    loadPuzzle(currentStage, currentLevel);
  </script>
</body>
</html>
`;

fs.writeFileSync('index.html', htmlContent, 'utf8');
console.log('index.html 생성 완료! 파일 크기: ' + (htmlContent.length / 1024).toFixed(1) + ' KB');
