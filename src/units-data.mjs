// 단위 변환 데이터 — 빌드 시 (1) 페이지에 JSON으로 내장하고 (2) 정적 환산표를 만드는 데 함께 씁니다.
// f = 기준 단위 1개가 아니라 "해당 단위 1개가 기준 단위로 몇 개인지" 입니다.

export const CATEGORIES = {
  length: {
    base: 'm',
    units: [
      { id: 'mm', name: '밀리미터', sym: 'mm', f: 0.001 },
      { id: 'cm', name: '센티미터', sym: 'cm', f: 0.01 },
      { id: 'm', name: '미터', sym: 'm', f: 1 },
      { id: 'km', name: '킬로미터', sym: 'km', f: 1000 },
      { id: 'in', name: '인치', sym: 'in', f: 0.0254 },
      { id: 'ft', name: '피트', sym: 'ft', f: 0.3048 },
      { id: 'yd', name: '야드', sym: 'yd', f: 0.9144 },
      { id: 'mi', name: '마일', sym: 'mi', f: 1609.344 },
      { id: 'nmi', name: '해리', sym: 'nmi', f: 1852 },
      { id: 'ja', name: '자', sym: '자', f: 10 / 33 },
    ],
  },
  weight: {
    base: 'kg',
    units: [
      { id: 'mg', name: '밀리그램', sym: 'mg', f: 1e-6 },
      { id: 'g', name: '그램', sym: 'g', f: 0.001 },
      { id: 'kg', name: '킬로그램', sym: 'kg', f: 1 },
      { id: 't', name: '톤', sym: 't', f: 1000 },
      { id: 'oz', name: '온스', sym: 'oz', f: 0.028349523125 },
      { id: 'lb', name: '파운드', sym: 'lb', f: 0.45359237 },
      { id: 'don', name: '돈', sym: '돈', f: 0.00375 },
      { id: 'nyang', name: '냥', sym: '냥', f: 0.0375 },
    ],
  },
  area: {
    base: 'm2',
    units: [
      { id: 'cm2', name: '제곱센티미터', sym: 'cm²', f: 1e-4 },
      { id: 'm2', name: '제곱미터', sym: '㎡', f: 1 },
      { id: 'a', name: '아르', sym: 'a', f: 100 },
      { id: 'ha', name: '헥타르', sym: 'ha', f: 10000 },
      { id: 'km2', name: '제곱킬로미터', sym: '㎢', f: 1e6 },
      { id: 'pyeong', name: '평', sym: '평', f: 400 / 121 },
      { id: 'ft2', name: '제곱피트', sym: 'ft²', f: 0.09290304 },
      { id: 'yd2', name: '제곱야드', sym: 'yd²', f: 0.83612736 },
      { id: 'acre', name: '에이커', sym: 'ac', f: 4046.8564224 },
    ],
  },
  volume: {
    base: 'L',
    units: [
      { id: 'ml', name: '밀리리터', sym: 'mL', f: 0.001 },
      { id: 'l', name: '리터', sym: 'L', f: 1 },
      { id: 'm3', name: '세제곱미터', sym: '㎥', f: 1000 },
      { id: 'tsp', name: '티스푼(미국)', sym: 'tsp', f: 0.00492892159375 },
      { id: 'tbsp', name: '테이블스푼(미국)', sym: 'tbsp', f: 0.01478676478125 },
      { id: 'floz', name: '액량 온스(미국)', sym: 'fl oz', f: 0.0295735295625 },
      { id: 'cup', name: '컵(미국)', sym: 'cup', f: 0.2365882365 },
      { id: 'pt', name: '파인트(미국)', sym: 'pt', f: 0.473176473 },
      { id: 'qt', name: '쿼트(미국)', sym: 'qt', f: 0.946352946 },
      { id: 'gal', name: '갤런(미국)', sym: 'gal', f: 3.785411784 },
      { id: 'doe', name: '되', sym: '되', f: 1.8039 },
      { id: 'mal', name: '말', sym: '말', f: 18.039 },
    ],
  },
  speed: {
    base: 'm/s',
    units: [
      { id: 'ms', name: '미터/초', sym: 'm/s', f: 1 },
      { id: 'kmh', name: '킬로미터/시', sym: 'km/h', f: 1 / 3.6 },
      { id: 'mph', name: '마일/시', sym: 'mph', f: 0.44704 },
      { id: 'kn', name: '노트', sym: 'kn', f: 1852 / 3600 },
      { id: 'fts', name: '피트/초', sym: 'ft/s', f: 0.3048 },
    ],
  },
  data: {
    base: 'B',
    units: [
      { id: 'bit', name: '비트', sym: 'bit', f: 0.125 },
      { id: 'b', name: '바이트', sym: 'B', f: 1 },
      { id: 'kb', name: '킬로바이트', sym: 'KB', f: 1024 },
      { id: 'mb', name: '메가바이트', sym: 'MB', f: 1024 ** 2 },
      { id: 'gb', name: '기가바이트', sym: 'GB', f: 1024 ** 3 },
      { id: 'tb', name: '테라바이트', sym: 'TB', f: 1024 ** 4 },
      { id: 'pb', name: '페타바이트', sym: 'PB', f: 1024 ** 5 },
    ],
  },
  temperature: {
    base: '℃',
    special: true,
    units: [
      { id: 'c', name: '섭씨', sym: '℃' },
      { id: 'f', name: '화씨', sym: '℉' },
      { id: 'k', name: '켈빈', sym: 'K' },
    ],
  },
};

const toC = { c: (x) => x, f: (x) => ((x - 32) * 5) / 9, k: (x) => x - 273.15 };
const fromC = { c: (x) => x, f: (x) => (x * 9) / 5 + 32, k: (x) => x + 273.15 };

export function convert(cat, from, to, value) {
  const c = CATEGORIES[cat];
  if (c.special) return fromC[to](toC[from](value));
  const f = c.units.find((u) => u.id === from).f;
  const t = c.units.find((u) => u.id === to).f;
  return (value * f) / t;
}

export function formatNumber(n) {
  if (!Number.isFinite(n)) return '-';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-6 || abs >= 1e15)) return n.toExponential(4).replace('e+', 'e');
  return Number(n.toPrecision(10)).toLocaleString('ko-KR', { maximumFractionDigits: 8 });
}
