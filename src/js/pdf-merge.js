/* PDF 병합 — pdf-lib 사용, 파일은 브라우저 밖으로 나가지 않습니다. */
(function () {
  'use strict';
  const { $, humanSize } = TB;
  const app = $('#pdf-merge');
  if (!app) return;
  const { PDFDocument } = window.PDFLib;

  const listEl = $('#pm-list'), runEl = $('#pm-run'), statusEl = $('#pm-status'), clearEl = $('#pm-clear');
  let items = [];
  let seq = 0;

  const isEncrypted = (e) => /encrypt/i.test((e && (e.name + e.message)) || '');

  async function addFiles(files) {
    let skipped = 0;
    for (const f of files) {
      if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) { skipped++; continue; }
      items.push({ id: ++seq, file: f, pages: null, error: '' });
    }
    if (skipped) setStatus(skipped + '개 파일은 PDF가 아니라서 제외했어요.', true);
    render();
    for (const it of items.filter((i) => i.pages === null && !i.error)) {
      try {
        const doc = await PDFDocument.load(await it.file.arrayBuffer());
        it.pages = doc.getPageCount();
      } catch (e) {
        it.error = isEncrypted(e) ? '암호가 걸린 PDF는 병합할 수 없어요' : '읽을 수 없는 PDF 파일이에요';
      }
      render();
    }
  }

  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    render();
  }

  function render() {
    listEl.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      li.innerHTML = '<div class="thumb">📄</div><div class="meta"><b></b><small></small></div><div class="acts"></div>';
      li.querySelector('b').textContent = (i + 1) + '. ' + it.file.name;
      const small = li.querySelector('small');
      if (it.error) { small.innerHTML = '<span class="grow"></span>'; small.firstChild.textContent = it.error; }
      else small.textContent = humanSize(it.file.size) + (it.pages ? ' · ' + it.pages + '쪽' : ' · 읽는 중…');
      const acts = li.querySelector('.acts');
      [['↑', '위로', () => move(i, -1), i === 0], ['↓', '아래로', () => move(i, 1), i === items.length - 1], ['삭제', '삭제', () => { items.splice(i, 1); render(); }, false]].forEach(([t, label, fn, dis]) => {
        const b = document.createElement('button');
        b.className = 'btn small secondary';
        b.textContent = t;
        b.setAttribute('aria-label', it.file.name + ' ' + label);
        b.disabled = dis;
        b.addEventListener('click', fn);
        acts.appendChild(b);
      });
      listEl.appendChild(li);
    });
    const valid = items.filter((i) => i.pages);
    runEl.disabled = valid.length < 2;
    clearEl.hidden = items.length === 0;
    const total = valid.reduce((s, i) => s + i.pages, 0);
    if (valid.length >= 2) setStatus('합치면 총 ' + total + '쪽이 돼요. 위·아래 버튼으로 순서를 바꿀 수 있어요.');
    else if (items.length) setStatus('병합하려면 PDF가 2개 이상 필요해요.');
    else setStatus('');
  }

  function setStatus(msg, warn) {
    statusEl.textContent = msg;
    statusEl.style.color = warn ? 'var(--warn)' : '';
  }

  async function merge() {
    runEl.disabled = true;
    setStatus('합치는 중…');
    try {
      const out = await PDFDocument.create();
      for (const it of items.filter((i) => i.pages)) {
        const src = await PDFDocument.load(await it.file.arrayBuffer());
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      TB.download(blob, 'merged.pdf');
      setStatus('완료! merged.pdf (' + humanSize(blob.size) + ') 를 저장했어요.');
    } catch (e) {
      console.error(e);
      setStatus('병합에 실패했어요: ' + (isEncrypted(e) ? '암호가 걸린 파일이 있어요.' : '손상된 PDF가 포함돼 있을 수 있어요.'), true);
    }
    runEl.disabled = false;
  }

  TB.dropzone($('#pm-zone'), addFiles);
  runEl.addEventListener('click', merge);
  clearEl.addEventListener('click', () => { items = []; render(); });
  render();
})();
