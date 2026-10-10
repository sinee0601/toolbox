/* PDF 분할 / 페이지 추출 */
(function () {
  'use strict';
  const { $, $$, parseNum, humanSize } = TB;
  const app = $('#pdf-split');
  if (!app) return;
  const { PDFDocument } = window.PDFLib;

  const el = {
    zone: $('#ps-zone'), info: $('#ps-info'), opts: $('#ps-options'),
    range: $('#ps-range'), invert: $('#ps-invert'), chunk: $('#ps-chunk'),
    run: $('#ps-run'), status: $('#ps-status'),
  };
  let file = null, src = null, pageCount = 0;

  const mode = () => $('input[name=ps-mode]:checked').value;
  const baseName = () => file.name.replace(/\.pdf$/i, '');
  function setStatus(msg, warn) { el.status.textContent = msg; el.status.style.color = warn ? 'var(--warn)' : ''; }

  async function load(files) {
    const f = files.find((x) => x.type === 'application/pdf' || /\.pdf$/i.test(x.name));
    if (!f) { setStatus('PDF 파일을 선택해주세요.', true); return; }
    setStatus('파일을 읽는 중…');
    try {
      src = await PDFDocument.load(await f.arrayBuffer());
      file = f;
      pageCount = src.getPageCount();
      el.info.innerHTML = '';
      const b = document.createElement('b');
      b.textContent = f.name;
      el.info.append(b, ' · ' + humanSize(f.size) + ' · 총 ' + pageCount + '쪽');
      el.info.hidden = false;
      el.opts.hidden = false;
      el.range.placeholder = '예: 1-3, 5, 8-10 (전체 ' + pageCount + '쪽)';
      setStatus('');
      sync();
    } catch (e) {
      console.error(e);
      file = src = null;
      el.opts.hidden = true; el.info.hidden = true;
      setStatus(/encrypt/i.test(e.name + e.message) ? '암호가 걸린 PDF는 처리할 수 없어요.' : '읽을 수 없는 PDF 파일이에요.', true);
    }
  }

  function userError(msg) { const e = new Error(msg); e.user = true; return e; }

  function parseRanges(text, n) {
    const t = text.replace(/[~–—]/g, '-').replace(/[，、]/g, ',').replace(/\s+/g, '');
    if (!t) throw userError('페이지 범위를 입력하세요. 예: 1-3,5');
    const idx = [];
    for (const tok of t.split(',')) {
      if (!tok) continue;
      const m = /^(\d+)(?:-(\d+))?$/.exec(tok);
      if (!m) throw userError('"' + tok + '" 형식을 읽을 수 없어요. 예: 1-3,5');
      const a = +m[1], b = m[2] ? +m[2] : a;
      if (a < 1 || b > n) throw userError('페이지는 1~' + n + ' 사이여야 해요. ("' + tok + '")');
      if (a > b) throw userError('"' + tok + '" 범위의 시작이 끝보다 커요.');
      for (let p = a; p <= b; p++) idx.push(p - 1);
    }
    return idx;
  }

  async function makePdf(indices) {
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, indices);
    pages.forEach((p) => doc.addPage(p));
    return doc.save();
  }

  function sync() {
    const m = mode();
    $$('[data-ps]').forEach((e) => { e.hidden = e.dataset.ps !== m; });
  }

  async function run() {
    if (!src) return;
    el.run.disabled = true;
    setStatus('처리 중…');
    try {
      const m = mode();
      if (m === 'extract') {
        let idx = parseRanges(el.range.value, pageCount);
        if (el.invert.checked) {
          const drop = new Set(idx);
          idx = Array.from({ length: pageCount }, (_, i) => i).filter((i) => !drop.has(i));
          if (!idx.length) throw userError('모든 페이지를 제외하면 남는 페이지가 없어요.');
        }
        const bytes = await makePdf(idx);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        TB.download(blob, baseName() + '_extracted.pdf');
        setStatus('완료! ' + idx.length + '쪽짜리 PDF (' + humanSize(blob.size) + ') 를 저장했어요.');
      } else {
        const size = m === 'each' ? 1 : Math.floor(parseNum(el.chunk.value) || 0);
        if (size < 1) throw userError('나눌 쪽수를 1 이상으로 입력하세요.');
        const files = [];
        const total = Math.ceil(pageCount / size);
        const digits = String(total).length < 3 ? 3 : String(total).length;
        for (let s = 0, n = 1; s < pageCount; s += size, n++) {
          const idx = [];
          for (let p = s; p < Math.min(pageCount, s + size); p++) idx.push(p);
          files.push({ name: baseName() + '_' + String(n).padStart(digits, '0') + '.pdf', data: await makePdf(idx) });
          setStatus('처리 중… ' + n + ' / ' + total);
          if (n % 10 === 0) await new Promise((r) => setTimeout(r, 0));
        }
        TB.download(TB.makeZip(files), baseName() + '_split.zip');
        setStatus('완료! PDF ' + files.length + '개를 ZIP으로 묶어 저장했어요.');
      }
    } catch (e) {
      if (!e.user) console.error(e);
      setStatus(e.user ? e.message : '처리에 실패했어요. 손상된 PDF일 수 있어요.', true);
    }
    el.run.disabled = false;
  }

  TB.dropzone(el.zone, load);
  $$('input[name=ps-mode]').forEach((r) => r.addEventListener('change', sync));
  el.run.addEventListener('click', run);
  sync();
})();
