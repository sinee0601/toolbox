/* 글자수 세기: 공백 포함/제외, 바이트(한글 2byte · UTF-8), 단어·줄·문단, 제한 글자수 */
(function () {
  'use strict';
  const { $, $$, fmt } = TB;
  const ta = $('#cc-text');
  if (!ta) return;

  const KEY = 'tb_charcount_draft';
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null;
  const encoder = new TextEncoder();
  const out = {};
  $$('[data-cc]').forEach((e) => { out[e.dataset.cc] = e; });

  const nlMode = $('#cc-nl');
  const limitInput = $('#cc-limit');
  const limitBasis = $('#cc-basis');

  function graphemes(text) {
    if (seg) return Array.from(seg.segment(text), (s) => s.segment);
    return Array.from(text);
  }

  function bytesEucKr(g) { // 한글·특수문자 2바이트, ASCII 1바이트
    let n = 0;
    for (const ch of g) n += ch.codePointAt(0) <= 0x7f ? 1 : 2;
    return n;
  }

  function measure(text) {
    const nl = parseInt(nlMode.value, 10); // 줄바꿈 1개를 몇 자로 볼지
    const t = text.replace(/\r\n?/g, '\n');
    const gs = graphemes(t);
    let withSpace = 0, noSpace = 0, kBytes = 0, uBytes = 0;
    for (const g of gs) {
      if (g === '\n') {
        withSpace += nl; kBytes += nl; uBytes += nl;
        continue;
      }
      withSpace++;
      if (!/^\s+$/.test(g)) noSpace++;
      kBytes += bytesEucKr(g);
      uBytes += encoder.encode(g).length;
    }
    const trimmed = t.trim();
    return {
      withSpace,
      noSpace,
      kBytes,
      uBytes,
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      lines: t === '' ? 0 : t.split('\n').length,
      paras: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
    };
  }

  function render() {
    const m = measure(ta.value);
    out.withSpace.textContent = fmt(m.withSpace, 0);
    out.noSpace.textContent = fmt(m.noSpace, 0);
    out.kBytes.textContent = fmt(m.kBytes, 0);
    out.uBytes.textContent = fmt(m.uBytes, 0);
    out.words.textContent = fmt(m.words, 0);
    out.lines.textContent = fmt(m.lines, 0);
    out.paras.textContent = fmt(m.paras, 0);

    const limit = parseInt(limitInput.value, 10);
    const bar = $('#cc-bar'), note = $('#cc-limit-note');
    if (limit > 0) {
      const cur = limitBasis.value === 'noSpace' ? m.noSpace : limitBasis.value === 'kBytes' ? m.kBytes : m.withSpace;
      const unit = limitBasis.value === 'kBytes' ? 'byte' : '자';
      const pct = Math.min(100, (cur / limit) * 100);
      bar.style.width = pct + '%';
      bar.classList.toggle('over', cur > limit);
      note.textContent = cur > limit
        ? fmt(cur, 0) + ' / ' + fmt(limit, 0) + unit + ' — ' + fmt(cur - limit, 0) + unit + ' 초과'
        : fmt(cur, 0) + ' / ' + fmt(limit, 0) + unit + ' — ' + fmt(limit - cur, 0) + unit + ' 남음';
    } else {
      bar.style.width = '0';
      bar.classList.remove('over');
      note.textContent = '제한 글자수를 입력하면 남은 분량을 알려드려요.';
    }
  }

  function save() { try { localStorage.setItem(KEY, ta.value); } catch (_) { /* 저장 불가 환경 */ } }

  ta.addEventListener('input', () => { render(); save(); });
  [nlMode, limitInput, limitBasis].forEach((e) => e.addEventListener('input', render));
  $$('[data-limit]').forEach((b) => b.addEventListener('click', () => { limitInput.value = b.dataset.limit; render(); }));
  $('#cc-clear').addEventListener('click', () => { ta.value = ''; render(); save(); ta.focus(); });
  $('#cc-copy').addEventListener('click', () => TB.copyText(ta.value));
  $('#cc-trim').addEventListener('click', () => {
    ta.value = ta.value.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    render(); save();
  });

  try { const d = localStorage.getItem(KEY); if (d) ta.value = d; } catch (_) { /* 무시 */ }
  render();
})();
