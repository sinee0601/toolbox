// 정적 사이트 빌드: node build.mjs  →  dist/ 폴더 생성 (그대로 호스팅하면 됩니다)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './site.config.mjs';
import { TOOLS, GROUPS } from './src/tools.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const today = new Date().toISOString().slice(0, 10);
const siteUrl = (process.env.SITE_URL || config.siteUrl).replace(/\/$/, '');
const ads = config.ads || { provider: 'none' };
const ASSET_VER = Date.now().toString(36); // 캐시 무효화용

/* ---------- 광고 ---------- */
function adHead() {
  if (ads.provider === 'adsense' && ads.adsense.client) {
    return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ads.adsense.client)}" crossorigin="anonymous"></script>`;
  }
  return '';
}
function adSlot(pos) {
  if (ads.provider === 'adsense' && ads.adsense.client && ads.adsense.slots[pos]) {
    return `<div class="ad-slot" aria-label="광고"><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(ads.adsense.client)}" data-ad-slot="${esc(ads.adsense.slots[pos])}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
  }
  if (ads.provider === 'adfit' && ads.adfit[pos]) {
    return `<div class="ad-slot" aria-label="광고"><ins class="kakao_ad_area" style="display:none;" data-ad-unit="${esc(ads.adfit[pos])}" data-ad-width="${ads.adfit.width}" data-ad-height="${ads.adfit.height}"></ins><script async src="//t1.kakaocdn.net/kas/static/ba.min.js"></script></div>`;
  }
  return '';
}

/* ---------- 공통 레이아웃 ---------- */
function layout({ title, description, urlPath, body, scripts = [], jsonld = [], noindex = false, needsPdfLib = false, bodyClass = '' }) {
  const canonical = siteUrl + urlPath;
  const fullTitle = urlPath === '/' ? title : `${title} | ${config.siteName}`;
  const ga = config.ga4Id
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(config.ga4Id)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(config.ga4Id)}');</script>`
    : '';
  const nav = GROUPS.map((g) => `<a href="/#${g.id}">${g.name}</a>`).join('');
  const scriptTags = [
    `<script defer src="/assets/common.js?v=${ASSET_VER}"></script>`,
    needsPdfLib ? '<script defer src="/assets/vendor/pdf-lib.min.js"></script>' : '',
    ...scripts.map((s) => `<script defer src="/assets/${s}?v=${ASSET_VER}"></script>`),
  ].join('\n');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(config.siteName)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#2457f5">
${config.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(config.googleSiteVerification)}">` : ''}
${config.naverSiteVerification ? `<meta name="naver-site-verification" content="${esc(config.naverSiteVerification)}">` : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css?v=${ASSET_VER}">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
${adHead()}
${ga}
</head>
<body class="${bodyClass}">
<header class="site-header"><div class="container bar">
  <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">⚙</span><span class="t">${esc(config.siteName)}</span></a>
  <nav class="site-nav" aria-label="도구 분류">${nav}</nav>
</div></header>
<main class="container">
${body}
</main>
<footer class="site-footer"><div class="container">
  <div class="links"><a href="/about/">사이트 소개</a><a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용약관</a><a href="/contact/">문의</a></div>
  <p>모든 도구는 브라우저 안에서 동작하며, 입력한 내용과 파일은 서버로 전송되지 않습니다.</p>
  <p>© ${new Date().getFullYear()} ${esc(config.siteName)}. 계산 결과는 참고용이며 법적·금융적 효력이 없습니다.</p>
</div></footer>
${scriptTags}
</body>
</html>
`;
}

/* ---------- 페이지: 홈 ---------- */
function homePage() {
  const sections = GROUPS.map((g) => {
    const tools = TOOLS.filter((t) => t.cat === g.id);
    return `<section class="cat-section" id="${g.id}">
  <h2><span aria-hidden="true">${g.icon}</span> ${g.name} <small>${esc(g.desc)}</small></h2>
  <div class="tool-grid">
${tools.map((t) => `    <a class="tool-card" href="/tools/${t.slug}/" data-keywords="${esc(t.name + ' ' + t.short + ' ' + t.kw)}"><span class="ico" aria-hidden="true">${t.icon}</span><div><strong>${esc(t.name)}</strong><span class="d">${esc(t.short)}</span></div></a>`).join('\n')}
  </div>
</section>`;
  }).join('\n');

  const body = `<section class="hero">
  <h1>${esc(config.siteName)}</h1>
  <p>${esc(config.tagline)}. 회원가입도 업로드도 없이, 열자마자 바로 쓰세요.</p>
  <div class="search"><label class="visually-hidden" for="tool-search">도구 검색</label><input id="tool-search" type="search" placeholder="도구 검색 (예: 평수, 글자수, pdf)" autocomplete="off"></div>
</section>
<p class="empty-note" id="search-empty">검색 결과가 없어요. 다른 단어로 찾아보세요.</p>
${sections}
<section class="features" aria-label="특징">
  <div><strong>🔒 파일이 밖으로 나가지 않아요</strong><p>이미지·PDF·텍스트 처리는 모두 내 브라우저 안에서 이뤄져서 개인정보 걱정이 없어요.</p></div>
  <div><strong>⚡ 설치·가입 없이 바로</strong><p>페이지를 열고 값을 입력하면 즉시 결과가 나와요. 모바일에서도 편하게 쓸 수 있어요.</p></div>
  <div><strong>🆓 모두 무료</strong><p>사용 횟수나 파일 크기를 서버 쪽에서 제한하지 않아요.</p></div>
</section>`;
  return layout({
    title: `${config.siteName} - ${config.tagline}`,
    description: `${config.siteName}: 계산기, 단위 변환(평·㎡·cm·인치), 글자수 세기, 이미지 크기 조절·압축·변환, PDF 합치기·나누기까지 무료 온라인 도구 모음. 업로드 없이 브라우저에서 바로 처리됩니다.`,
    urlPath: '/',
    body,
    scripts: [],
    jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: config.siteName, url: siteUrl + '/', inLanguage: 'ko' }],
  });
}

/* ---------- 페이지: 도구 ---------- */
function toolPage(t) {
  const group = GROUPS.find((g) => g.id === t.cat);
  const urlPath = `/tools/${t.slug}/`;
  const related = (t.related || []).map((s) => TOOLS.find((x) => x.slug === s)).filter(Boolean);
  const body = `<nav class="crumbs" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/#${group.id}">${group.name}</a><span>›</span>${esc(t.name)}</nav>
<div class="page-head"><h1>${esc(t.h1)}</h1><p class="lead">${esc(t.lead)}</p></div>
${adSlot('top')}
<section class="tool" aria-label="${esc(t.name)}">
${t.body}
</section>
${adSlot('mid')}
<section aria-label="사용 안내"><div class="prose">
${t.guide}
</div></section>
<section class="faq" aria-label="자주 묻는 질문"><h2 class="section-title">자주 묻는 질문</h2>
${t.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
</section>
${related.length ? `<section aria-label="관련 도구"><h2 class="section-title">함께 쓰면 좋은 도구</h2><div class="related">${related.map((r) => `<a href="/tools/${r.slug}/">${r.icon} ${esc(r.name)}</a>`).join('')}</div></section>` : ''}
${adSlot('bottom')}`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.h1, url: siteUrl + urlPath, description: t.desc, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'ko', offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: siteUrl + '/' },
      { '@type': 'ListItem', position: 2, name: group.name, item: siteUrl + '/#' + group.id },
      { '@type': 'ListItem', position: 3, name: t.name, item: siteUrl + urlPath },
    ] },
  ];
  return layout({ title: t.title, description: t.desc, urlPath, body, scripts: t.scripts, jsonld, needsPdfLib: !!t.needsPdfLib });
}

/* ---------- 페이지: 정책/소개 ---------- */
const LEGAL = {
  about: {
    title: '사이트 소개',
    desc: `${config.siteName}는 계산기, 단위 변환, 글자수 세기, 이미지·PDF 도구를 무료로 제공하는 온라인 도구 모음입니다.`,
    html: `<h1>사이트 소개</h1>
<p>${esc(config.siteName)}는 일상과 업무에서 자주 필요한 작은 작업들을 설치나 회원가입 없이 바로 처리할 수 있도록 만든 무료 온라인 도구 모음입니다.</p>
<h2>제공하는 도구</h2>
<ul>${GROUPS.map((g) => `<li><b>${g.name}</b> — ${TOOLS.filter((t) => t.cat === g.id).map((t) => `<a href="/tools/${t.slug}/">${esc(t.name)}</a>`).join(', ')}</li>`).join('')}</ul>
<h2>운영 원칙</h2>
<ul>
<li><b>파일은 서버로 보내지 않습니다.</b> 이미지·PDF·텍스트 처리는 모두 이용자의 브라우저 안에서 이뤄집니다.</li>
<li><b>계산 방식을 공개합니다.</b> 각 도구 페이지에 사용한 공식과 기준, 한계를 함께 적어 두었습니다.</li>
<li><b>오류는 바로잡습니다.</b> 잘못된 계산이나 표기를 발견하시면 <a href="/contact/">문의</a>로 알려주세요.</li>
</ul>
<h2>광고 안내</h2>
<p>사이트 운영을 위해 일부 페이지에 광고가 표시될 수 있습니다. 광고는 도구 이용 화면과 구분되어 표시되며, 광고주가 도구의 계산 결과에 영향을 주지 않습니다.</p>`,
  },
  privacy: {
    title: '개인정보처리방침',
    desc: `${config.siteName}의 개인정보 수집 및 이용, 쿠키와 광고 사용에 관한 안내입니다.`,
    html: `<h1>개인정보처리방침</h1>
<p>${esc(config.siteName)}(이하 "사이트")는 이용자의 개인정보를 소중하게 생각하며, 아래와 같이 개인정보 처리에 관한 사항을 안내합니다. (시행일: ${today})</p>
<h2>1. 수집하는 개인정보</h2>
<p>사이트는 회원가입 절차가 없으며, 이용자의 이름·연락처 등 개인정보를 직접 수집하지 않습니다.</p>
<h2>2. 입력한 내용과 파일의 처리</h2>
<p>이용자가 도구에 입력한 텍스트, 숫자와 업로드(선택)한 이미지·PDF 파일은 이용자의 브라우저 안에서만 처리되며 사이트 서버로 전송되거나 저장되지 않습니다. 글자수 세기 도구는 이어서 작성할 수 있도록 입력한 텍스트를 이용자 브라우저의 로컬 저장소(localStorage)에만 임시로 저장하며, "지우기" 버튼 또는 브라우저 데이터 삭제로 언제든 삭제할 수 있습니다.</p>
<h2>3. 쿠키 및 자동 수집 정보</h2>
<p>사이트는 서비스 이용 통계와 광고 제공을 위해 제3자 서비스(예: Google Analytics, Google AdSense, 카카오 애드핏)를 사용할 수 있으며, 이 과정에서 쿠키, IP 주소, 브라우저 종류, 방문 페이지 등의 정보가 해당 서비스 제공자에 의해 수집될 수 있습니다.</p>
<ul>
<li>Google을 포함한 제3자 광고 공급업체는 쿠키를 사용하여 이용자의 이전 사이트 방문 기록을 바탕으로 광고를 게재할 수 있습니다.</li>
<li>Google의 광고 쿠키 사용으로 Google과 파트너는 이 사이트 및 인터넷의 다른 사이트 방문 기록을 토대로 이용자에게 광고를 게재할 수 있습니다.</li>
<li>이용자는 <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google 광고 설정</a>에서 맞춤 광고를 해제할 수 있으며, <a href="https://www.aboutads.info" target="_blank" rel="noopener">www.aboutads.info</a>에서 제3자 맞춤 광고용 쿠키를 거부할 수 있습니다.</li>
<li>브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 일부 기능이 제한될 수 있습니다.</li>
</ul>
<h2>4. 개인정보의 제3자 제공</h2>
<p>사이트는 이용자의 개인정보를 별도로 수집하지 않으므로 제3자에게 제공하지 않습니다. 단, 위 3항의 제3자 서비스는 각 서비스의 개인정보 처리방침에 따릅니다.</p>
<h2>5. 문의</h2>
<p>개인정보 처리에 관한 문의는 <a href="/contact/">문의 페이지</a>를 이용해주세요.</p>
<h2>6. 방침의 변경</h2>
<p>이 방침은 법령이나 서비스 변경에 따라 수정될 수 있으며, 변경 시 이 페이지에 공지합니다.</p>`,
  },
  terms: {
    title: '이용약관',
    desc: `${config.siteName} 이용약관 및 면책 안내입니다.`,
    html: `<h1>이용약관</h1>
<h2>1. 목적</h2>
<p>이 약관은 ${esc(config.siteName)}(이하 "사이트")가 제공하는 온라인 도구의 이용 조건과 운영자·이용자의 권리와 의무를 정합니다.</p>
<h2>2. 서비스의 제공</h2>
<p>사이트는 계산기, 단위 변환기, 텍스트·이미지·PDF 도구를 무료로 제공합니다. 운영자는 서비스를 변경하거나 중단할 수 있으며, 가능한 경우 사전에 공지합니다.</p>
<h2>3. 결과에 대한 면책</h2>
<ul>
<li>사이트가 제공하는 계산 결과(대출 이자, 부가세, BMI, 날짜 등)는 <b>참고용</b>이며 법적·세무적·금융적·의학적 효력이 없습니다.</li>
<li>중요한 결정(대출 계약, 세금 신고, 건강 판단 등)에는 반드시 해당 기관이나 전문가를 통해 확인하시기 바랍니다.</li>
<li>변환·편집한 이미지와 PDF 파일의 결과는 사용 전 이용자가 직접 확인해야 하며, 결과물 사용으로 발생한 손해에 대해 운영자는 책임지지 않습니다.</li>
</ul>
<h2>4. 이용자의 의무</h2>
<p>이용자는 타인의 권리를 침해하거나 법령에 위반되는 목적으로 서비스를 이용해서는 안 됩니다. 처리하는 파일에 대한 권리와 책임은 이용자에게 있습니다.</p>
<h2>5. 지식재산권</h2>
<p>사이트의 디자인, 문구, 코드에 대한 권리는 운영자에게 있습니다. 이용자가 처리하는 파일의 권리는 이용자에게 있습니다.</p>
<h2>6. 약관의 변경</h2>
<p>약관은 필요에 따라 변경될 수 있으며, 변경 내용은 이 페이지에 게시합니다. (시행일: ${today})</p>`,
  },
  contact: {
    title: '문의',
    desc: `${config.siteName}에 대한 문의, 오류 제보, 도구 추가 제안 방법을 안내합니다.`,
    html: `<h1>문의</h1>
<p>사이트 이용 중 불편한 점, 계산 오류, 추가했으면 하는 도구가 있다면 아래 이메일로 알려주세요.</p>
<p><b>이메일:</b> <a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a></p>
<h2>문의 시 알려주시면 좋은 정보</h2>
<ul>
<li>문제가 생긴 도구 이름과 페이지 주소</li>
<li>입력한 값과 기대한 결과 (파일 처리 문제라면 파일 형식과 대략적인 크기)</li>
<li>사용 중인 기기와 브라우저 (예: 아이폰 Safari, 윈도우 Chrome)</li>
</ul>
<p>개인정보나 민감한 파일은 메일에 첨부하지 말아주세요. 접수 순서대로 확인하여 답변드립니다.</p>`,
  },
};

function legalPage(key) {
  const p = LEGAL[key];
  const body = `<article class="legal">${p.html}</article>`;
  return layout({ title: p.title, description: p.desc, urlPath: `/${key}/`, body, scripts: [] });
}

/* ---------- 파일 쓰기 ---------- */
async function write(rel, content) {
  const file = path.join(DIST, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(path.join(DIST, 'assets', 'vendor'), { recursive: true });

  // 정적 자산
  await fs.copyFile(path.join(SRC, 'css', 'style.css'), path.join(DIST, 'assets', 'style.css'));
  for (const f of await fs.readdir(path.join(SRC, 'js'))) {
    await fs.copyFile(path.join(SRC, 'js', f), path.join(DIST, 'assets', f));
  }
  await fs.copyFile(path.join(ROOT, 'node_modules', 'pdf-lib', 'dist', 'pdf-lib.min.js'), path.join(DIST, 'assets', 'vendor', 'pdf-lib.min.js'));
  await write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2457f5"/><path d="M20 22h24M20 32h24M20 42h14" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`);

  // 페이지
  await write('index.html', homePage());
  for (const t of TOOLS) await write(`tools/${t.slug}/index.html`, toolPage(t));
  for (const k of Object.keys(LEGAL)) await write(`${k}/index.html`, legalPage(k));
  await write('404.html', layout({
    title: '페이지를 찾을 수 없어요', description: '요청하신 페이지를 찾을 수 없습니다.', urlPath: '/404.html', noindex: true,
    body: `<article class="legal"><h1>페이지를 찾을 수 없어요</h1><p>주소가 바뀌었거나 삭제된 페이지예요. <a href="/">홈으로 돌아가</a> 필요한 도구를 찾아보세요.</p></article>`,
  }));

  // 검색엔진용
  const urls = ['/', ...TOOLS.map((t) => `/tools/${t.slug}/`), ...Object.keys(LEGAL).map((k) => `/${k}/`)];
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${siteUrl}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  if (ads.provider === 'adsense' && ads.adsense.client) {
    await write('ads.txt', `google.com, ${ads.adsense.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
  }

  console.log(`✓ 빌드 완료: ${urls.length}개 페이지 → dist/`);
  if (siteUrl.includes('example.com')) console.log('  ! site.config.mjs 의 siteUrl / contactEmail 을 실제 값으로 바꿔주세요.');
}

main().catch((e) => { console.error(e); process.exit(1); });
