// 사이트 전역 설정 — 배포 전에 아래 값을 실제 값으로 바꿔주세요.
export default {
  siteName: '만능도구함',
  tagline: '계산기 · 단위 변환 · 글자수 세기 · 이미지 · PDF 도구를 한곳에서',
  // 배포할 실제 도메인 (끝에 / 없이). canonical, sitemap, OG 태그에 쓰입니다.
  siteUrl: 'https://example.com',
  // 문의 페이지에 공개되는 이메일. 공개해도 되는 주소로 바꾸세요.
  contactEmail: 'contact@example.com',

  // Google Analytics 4 측정 ID (예: 'G-XXXXXXXXXX'). 비워두면 삽입하지 않습니다.
  ga4Id: '',
  // 검색엔진 소유권 확인 메타 태그 값 (선택)
  googleSiteVerification: '',
  naverSiteVerification: '',

  ads: {
    // 'none' | 'adsense' | 'adfit'
    provider: 'none',
    adsense: {
      client: '', // 예: 'ca-pub-1234567890123456'
      slots: { top: '', mid: '', bottom: '' }, // 광고 단위 ID(숫자)
    },
    adfit: {
      // 카카오 애드핏 광고단위 ID (예: 'DAN-xxxxxxxxxxxx'), 단위를 만든 크기와 아래 width/height가 같아야 합니다.
      width: 320,
      height: 100,
      top: '',
      mid: '',
      bottom: '',
    },
  },
};
