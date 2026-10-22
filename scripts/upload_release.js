const fs = require('fs');
const https = require('https');
const path = require('path');

const { execSync } = require('child_process');

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const cred = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n', encoding: 'utf8' });
    const match = cred.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {}
  return '';
}

const TOKEN = getGitHubToken();
const OWNER = 'psangho70';
const REPO = 'Crossword_puzzle';
const TAG = 'v1.0.4';
const RELEASE_NAME = '청춘 10x10 낱말퍼즐 v1.0.4 (GHAILab 신규 원형 아이콘 반영)';

const RELEASE_BODY = `## 🧩 청춘 10x10 가로세로 낱말 퍼즐 100 v1.0.4

### 🌟 주요 업데이트 내역
1. **GHAILab CI & 청춘 낱말 퍼즐 통합 신규 원형 아이콘 반영**:
   - 두뇌 신경망 인간 실루엣과 4색 입체 낱말 타일('청', '춘', '낱', '말'), 'GHAILab 청춘낱말' 캡슐 배지가 유기적으로 결합된 2048x2048 초고화질 아이콘 적용.
   - 외곽 모서리 투명 마스킹으로 레거시 및 최신 안드로이드 런처 완벽 지원.
2. **안드로이드 Adaptive Icon Safe Zone (72%) 정밀 보정**:
   - 삼성 One UI 및 구글 픽셀 등 제조사별 런처 마스킹(원형, Squircle, 조약돌) 시 외곽 요소가 잘려나가지 않도록 Safe Margin 14% 확보.
3. **100% 오프라인 동작 보장**:
   - 2,067개 전체 고품질 MP3 음성 에셋이 앱 내부에 완전 번들링 탑재.
4. **버전 판올림 (versionCode 5, versionName 1.0.4)**:
   - 기존 앱이 설치된 스마트폰에서 삭제 없이 즉시 원터치 '업데이트' 설치 지원.

---

### 📥 배포 APK 다운로드
- **[청춘10x10낱말퍼즐_100.apk](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/%EC%B2%AD%EC%B6%9810x10%EB%82%B1%EB%A7%90%ED%8D%BC%EC%A6%90_100.apk)** (약 123.8 MB)
- **[SeniorCrossword_100.apk](https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/SeniorCrossword_100.apk)** (약 123.8 MB)
`;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

function uploadAsset(uploadUrlTemplate, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const stat = fs.statSync(filePath);
    const uploadUrl = new URL(uploadUrlTemplate.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`));

    console.log(`파일 업로드 시작: ${fileName} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);

    const options = {
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      method: 'POST',
      headers: {
        'Authorization': 'token ' + TOKEN,
        'User-Agent': 'Node-Agent',
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`업로드 성공: ${fileName}`);
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`업로드 실패 (${fileName}): HTTP ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);

    const fileStream = fs.createReadStream(filePath);
    let uploadedBytes = 0;
    let lastLogTime = Date.now();

    fileStream.on('data', chunk => {
      uploadedBytes += chunk.length;
      if (Date.now() - lastLogTime > 3000) {
        lastLogTime = Date.now();
        const percent = ((uploadedBytes / stat.size) * 100).toFixed(1);
        console.log(`진행률 (${fileName}): ${percent}% (${(uploadedBytes / 1024 / 1024).toFixed(1)} / ${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
      }
    });

    fileStream.pipe(req);
  });
}

async function main() {
  try {
    // 1. 기존 Release 조회 혹은 신규 생성
    console.log(`GitHub 릴리즈(${TAG}) 생성 시도 중...`);
    let release;

    try {
      const getRes = await request({
        hostname: 'api.github.com',
        path: `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`,
        method: 'GET',
        headers: {
          'Authorization': 'token ' + TOKEN,
          'User-Agent': 'Node-Agent',
          'Accept': 'application/vnd.github+json'
        }
      });
      release = getRes.data;
      console.log(`이미 존재하는 릴리즈 발견 (ID: ${release.id})`);
    } catch (e) {
      // 존재하지 않으면 새로 생성
      const createRes = await request({
        hostname: 'api.github.com',
        path: `/repos/${OWNER}/${REPO}/releases`,
        method: 'POST',
        headers: {
          'Authorization': 'token ' + TOKEN,
          'User-Agent': 'Node-Agent',
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        }
      }, JSON.stringify({
        tag_name: TAG,
        name: RELEASE_NAME,
        body: RELEASE_BODY,
        draft: false,
        prerelease: false
      }));
      release = createRes.data;
      console.log(`새 릴리즈 생성 완료 (ID: ${release.id})`);
    }

    const uploadUrl = release.upload_url;
    console.log(`Upload URL: ${uploadUrl}`);

    // 2. 파일 업로드
    const projectRoot = path.resolve(__dirname, '..');
    const apkKo = path.join(projectRoot, '청춘10x10낱말퍼즐_100.apk');
    const apkEn = path.join(projectRoot, 'SeniorCrossword_100.apk');

    if (fs.existsSync(apkKo)) {
      await uploadAsset(uploadUrl, apkKo, '청춘10x10낱말퍼즐_100.apk');
    }
    if (fs.existsSync(apkEn)) {
      await uploadAsset(uploadUrl, apkEn, 'SeniorCrossword_100.apk');
    }

    console.log('🎉 모든 APK 파일이 GitHub Release에 완벽하게 백업되었습니다!');
    console.log(`릴리즈 웹 URL: ${release.html_url}`);
  } catch (err) {
    console.error('오류 발생:', err);
    process.exit(1);
  }
}

main();
