# 만능도구함 — 광고형 올인원 도구 사이트

계산기 · 단위 변환 · 글자수 세기 · 이미지 · PDF 도구를 제공하는 **정적 사이트**입니다.
서버/DB가 없고, 모든 처리는 방문자의 브라우저 안에서 일어납니다(호스팅 비용 0원 가능).

## 빠른 시작

```bash
npm install
npm run dev        # 빌드 후 http://localhost:8080 에서 미리보기
npm run build      # dist/ 폴더 생성 (이 폴더를 배포)
```

## 배포 전에 꼭 바꿀 것 (`site.config.mjs`)

| 항목 | 설명 |
|---|---|
| `siteUrl` | 실제 도메인. canonical / sitemap / OG 태그에 쓰입니다. |
| `contactEmail` | 문의 페이지에 **공개**되는 이메일. 공개해도 되는 주소로. |
| `siteName`, `tagline` | 사이트 이름과 소개 문구 |
| `ga4Id` | (선택) Google Analytics 4 측정 ID |
| `ads` | 광고 설정 (아래 참고) |

## 배포 (무료)

- **Cloudflare Pages / Netlify / Vercel**: 저장소 연결 → Build command `npm run build`, Output directory `dist`
- 도메인 연결 후 `siteUrl` 수정 → 다시 빌드·배포
- 배포 후 **Google Search Console**, **네이버 서치어드바이저**에 사이트 등록 + `sitemap.xml` 제출

## 광고 붙이기

1. 트래픽이 어느 정도 생기고 `about / privacy / terms / contact` 페이지가 있는 상태에서 **AdSense** 승인 신청 (이 사이트에 기본 포함)
2. 승인 후 `site.config.mjs`:
   ```js
   ads: { provider: 'adsense', adsense: { client: 'ca-pub-XXXXXXXXXXXXXXXX', slots: { top: '1234567890', mid: '...', bottom: '...' } } }
   ```
   `npm run build` 하면 `ads.txt`와 광고 슬롯(도구 위/중간/아래)이 자동 생성됩니다.
3. 국내 트래픽 위주면 `provider: 'adfit'`(카카오 애드핏)도 가능합니다. 광고 단위 크기와 `width/height`를 맞추세요.

## 도구 추가하기

`src/tools.mjs`의 `TOOLS` 배열에 항목 하나를 추가하면 홈 카드, 도구 페이지, sitemap, 구조화 데이터(JSON-LD)가 자동으로 만들어집니다.
스크립트는 `src/js/`에 넣고 `scripts: ['파일명.js']`로 연결하세요. 단위 변환은 `src/units-data.mjs`에 단위만 추가하면 됩니다.

## 구조

```
site.config.mjs     사이트/광고 설정
build.mjs           정적 페이지 생성기
src/tools.mjs       도구 정의(본문 HTML · 설명 · FAQ)
src/units-data.mjs  단위 변환 데이터
src/js/*.js         도구별 스크립트 (common.js = 공통 유틸)
src/css/style.css   스타일 (라이트/다크 자동)
```

## 알아둘 한계

- **맞춤법 검사**는 서버 측 사전·엔진이 필요해 포함하지 않았습니다(외부 API 이용 약관·비용 검토 후 추가 가능).
- PDF는 암호가 걸린 파일을 처리하지 못합니다. 이미지는 HEIC 등 브라우저가 열지 못하는 형식을 처리하지 못합니다.
- 계산 결과는 참고용이며, 각 페이지에 면책 문구와 계산 기준을 적어 두었습니다.

## CI/CD (GitHub Actions → Cloudflare Pages)

`.github/workflows/ci.yml` 한 파일로 구성돼 있습니다.

| 트리거 | 동작 |
|---|---|
| Pull Request / main push | `npm ci` → 빌드 → Playwright E2E(전 페이지 로드·계산 결과·이미지/PDF 처리) |
| main push + 테스트 통과 | Cloudflare Pages로 자동 배포 |

배포를 켜려면 저장소 **Settings → Secrets and variables → Actions**에 아래를 등록하세요. (없으면 배포 단계만 건너뛰고 CI는 정상 동작)

- Secrets: `CLOUDFLARE_API_TOKEN` (권한: Account › Cloudflare Pages › Edit), `CLOUDFLARE_ACCOUNT_ID`
- Variables: `CLOUDFLARE_PROJECT_NAME` (Pages 프로젝트 이름), `SITE_URL` (예: `https://내도메인.com`, canonical·sitemap에 반영)
- Cloudflare 대시보드에서 Pages 프로젝트를 먼저 만들어 두세요 (Direct Upload 방식).

로컬에서 같은 테스트 실행:

```bash
pip install -r tests/requirements.txt && playwright install chromium
npm run dev &            # 미리보기 서버
npm run test:e2e
```
