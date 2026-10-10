/* 단위 변환기 — 페이지에 내장된 #units-data(JSON)를 읽어 동작합니다. */
(function () {
  'use strict';
  const { $, parseNum } = TB;
  const dataEl = $('#units-data');
  if (!dataEl) return;

  const cfg = JSON.parse(dataEl.textContent);
  const vEl = $('#u-val'), fromEl = $('#u-from'), toEl = $('#u-to');
  const resEl = $('#u-result'), tbody = $('#u-table'), msg = $('#u-msg');

  const toC = { c: (x) => x, f: (x) => ((x - 32) * 5) / 9, k: (x) => x - 273.15 };
  const fromC = { c: (x) => x, f: (x) => (x * 9) / 5 + 32, k: (x) => x + 273.15 };

  function conv(from, to, v) {
    if (cfg.special) return fromC[to](toC[from](v));
    const f = cfg.units.find((u) => u.id === from).f;
    const t = cfg.units.find((u) => u.id === to).f;
    return (v * f) / t;
  }
  function show(n) {
    if (!Number.isFinite(n)) return '-';
    const a = Math.abs(n);
    if (a !== 0 && (a < 1e-6 || a >= 1e15)) return n.toExponential(4).replace('e+', 'e');
    return Number(n.toPrecision(10)).toLocaleString('ko-KR', { maximumFractionDigits: 8 });
  }
  const unit = (id) => cfg.units.find((u) => u.id === id);

  function fillSelects() {
    const opts = cfg.units.map((u) => '<option value="' + u.id + '">' + (u.name === u.sym ? u.name : u.name + ' (' + u.sym + ')') + '</option>').join('');
    fromEl.innerHTML = opts;
    toEl.innerHTML = opts;
    fromEl.value = cfg.from;
    toEl.value = cfg.to;
    vEl.value = cfg.value;
  }

  function render() {
    const v = parseNum(vEl.value);
    msg.textContent = '';
    if (v === null) {
      resEl.textContent = '값을 입력하세요';
      tbody.innerHTML = '';
      return;
    }
    const from = fromEl.value, to = toEl.value;
    if (cfg.cat === 'data' && v < 0) { msg.textContent = '음수 값은 의미가 없어요.'; }
    const r = conv(from, to, v);
    resEl.textContent = show(v) + ' ' + unit(from).sym + ' = ' + show(r) + ' ' + unit(to).sym;
    tbody.innerHTML = cfg.units.map((u) =>
      '<tr><td>' + u.name + '</td><td>' + show(conv(from, u.id, v)) + ' ' + u.sym + '</td></tr>'
    ).join('');
  }

  fillSelects();
  [vEl, fromEl, toEl].forEach((e) => e.addEventListener('input', render));
  $('#u-swap').addEventListener('click', () => {
    const t = fromEl.value; fromEl.value = toEl.value; toEl.value = t;
    render();
  });
  $('#u-copy').addEventListener('click', () => TB.copyText(resEl.textContent));
  render();
})();
