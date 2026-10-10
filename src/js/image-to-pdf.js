/* 이미지 → PDF 변환 (여러 장을 한 PDF로) */
(function () {
  'use strict';
  const { $, humanSize } = TB;
  const app = $('#image-to-pdf');
  if (!app) return;
  const { PDFDocument } = window.PDFLib;

  const el = {
    zone: $('#ip-zone'), list: $('#ip-list'), run: $('#ip-run'), clear: $('#ip-clear'), status: $('#ip-status'),
    size: $('#ip-size'), orient: $('#ip-orient'), margin: $('#ip-margin'),
  };
  const PAGE = { a4: [595.28, 841.89], letter: [612, 792] };
  const MM = 72 / 25.4;
  const MAX_SIDE = 5000;
  let items = [];
  let seq = 0;

  function setStatus(msg, warn) { el.status.textContent = msg; el.status.style.color = warn ? 'var(--warn)' : ''; }

  function addFiles(files) {
    let skipped = 0;
    for (const f of files) {
      if (!(f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name))) { skipped++; continue; }
      items.push({ id: ++seq, file: f, url: URL.createObjectURL(f) });
    }
    if (skipped) setStatus(skipped + '개 파일은 이미지가 아니라서 제외했어요.', true);
    render();
  }

  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    render();
  }

  function render() {
    el.list.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      li.innerHTML = '<div class="thumb"><img alt="" src="' + it.url + '"></div><div class="meta"><b></b><small></small></div><div class="acts"></div>';
      li.querySelector('b').textContent = (i + 1) + '. ' + it.file.name;
      li.querySelector('small').textContent = humanSize(it.file.size);
      const acts = li.querySelector('.acts');
      [['↑', '위로', () => move(i, -1), i === 0], ['↓', '아래로', () => move(i, 1), i === items.length - 1], ['삭제', '삭제', () => { URL.revokeObjectURL(it.url); items.splice(i, 1); render(); }, false]].forEach(([t, label, fn, dis]) => {
        const b = document.createElement('button');
        b.className = 'btn small secondary';
        b.textContent = t;
        b.setAttribute('aria-label', it.file.name + ' ' + label);
        b.disabled = dis;
        b.addEventListener('click', fn);
        acts.appendChild(b);
      });
      el.list.appendChild(li);
    });
    el.run.disabled = items.length === 0;
    el.clear.hidden = items.length === 0;
    if (items.length) setStatus(items.length + '장 · 위·아래 버튼으로 페이지 순서를 바꿀 수 있어요.');
  }

  // 휴대폰 사진의 회전 정보(EXIF)가 PDF에서 무시되지 않도록 canvas를 거쳐 JPEG로 변환
  async function toJpegBytes(file) {
    const im = await TB.loadImage(file);
    try {
      const s = Math.min(1, MAX_SIDE / Math.max(im.width, im.height));
      const w = Math.max(1, Math.round(im.width * s)), h = Math.max(1, Math.round(im.height * s));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(im.source, 0, 0, w, h);
      const blob = await TB.canvasToBlob(c, 'image/jpeg', 0.92);
      if (!blob) throw new Error('이미지를 변환할 수 없어요: ' + file.name);
      return new Uint8Array(await blob.arrayBuffer());
    } finally { im.close(); }
  }

  async function embed(doc, file) {
    if (file.type === 'image/png') {
      try { return await doc.embedPng(new Uint8Array(await file.arrayBuffer())); } catch (_) { /* 아래 폴백 */ }
    }
    return doc.embedJpg(await toJpegBytes(file));
  }

  async function run() {
    el.run.disabled = true;
    try {
      const doc = await PDFDocument.create();
      const margin = (parseFloat(el.margin.value) || 0) * MM;
      let n = 0;
      for (const it of items) {
        setStatus('변환 중… ' + (++n) + ' / ' + items.length);
        const img = await embed(doc, it.file);
        const iw = img.width, ih = img.height;
        let pw, ph;
        if (el.size.value === 'fit') {
          pw = iw * 0.75 + margin * 2; ph = ih * 0.75 + margin * 2; // 96dpi 기준 px → pt
        } else {
          [pw, ph] = PAGE[el.size.value];
          const landscape = el.orient.value === 'landscape' || (el.orient.value === 'auto' && iw > ih);
          if (landscape) [pw, ph] = [ph, pw];
        }
        const page = doc.addPage([pw, ph]);
        const aw = pw - margin * 2, ah = ph - margin * 2;
        const s = Math.min(aw / iw, ah / ih);
        const w = iw * s, h = ih * s;
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
        await new Promise((r) => setTimeout(r, 0));
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      TB.download(blob, 'images.pdf');
      setStatus('완료! images.pdf (' + humanSize(blob.size) + ') 를 저장했어요.');
    } catch (e) {
      console.error(e);
      setStatus('변환에 실패했어요: ' + (e.message || '알 수 없는 오류'), true);
    }
    el.run.disabled = false;
  }

  const syncOpts = () => { $('#ip-orient-row').hidden = el.size.value === 'fit'; };
  el.size.addEventListener('input', syncOpts);
  TB.dropzone(el.zone, addFiles);
  el.run.addEventListener('click', run);
  el.clear.addEventListener('click', () => { items.forEach((i) => URL.revokeObjectURL(i.url)); items = []; setStatus(''); render(); });
  syncOpts();
  render();
})();
