/* 이미지 도구: 크기 조절 · 용량 압축 · 포맷 변환 (data-mode = resize | compress | convert)
   파일은 서버로 전송되지 않고 브라우저의 canvas로만 처리됩니다. */
(function () {
  'use strict';
  const { $, $$, parseNum, humanSize } = TB;
  const app = $('#img-app');
  if (!app) return;

  const mode = app.dataset.mode;
  const MAX_FILES = 50;
  const MAX_SIDE = 16000;
  const MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

  const el = {
    zone: $('#img-zone'),
    list: $('#img-list'),
    run: $('#img-run'),
    zip: $('#img-zip'),
    clear: $('#img-clear'),
    status: $('#img-status'),
    format: $('#img-format'),
    quality: $('#img-quality'),
    qVal: $('#img-q-val'),
    qRow: $('#img-q-row'),
    rsMode: $('#rs-mode'), rsW: $('#rs-w'), rsH: $('#rs-h'), rsKeep: $('#rs-keep'), rsPct: $('#rs-pct'),
    cpMax: $('#cp-maxw'),
    bg: $('#cv-bg'),
  };

  let items = [];
  let seq = 0;

  /* ---------- 목록 ---------- */
  function addFiles(files) {
    let skipped = 0;
    for (const f of files) {
      const ok = f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif|svg)$/i.test(f.name);
      if (!ok || items.length >= MAX_FILES) { skipped++; continue; }
      items.push({ id: ++seq, file: f, url: URL.createObjectURL(f), w: 0, h: 0, result: null, error: '' });
    }
    if (skipped) setStatus(skipped + '개 파일은 이미지가 아니거나 한 번에 ' + MAX_FILES + '장을 넘어 제외했어요.', true);
    items.filter((i) => !i.w).forEach(readDims);
    render();
  }

  async function readDims(item) {
    try {
      const im = await TB.loadImage(item.file);
      item.w = im.width; item.h = im.height;
      im.close();
    } catch (e) { item.error = e.message; }
    render();
  }

  function removeItem(id) {
    const it = items.find((i) => i.id === id);
    if (it) URL.revokeObjectURL(it.url);
    items = items.filter((i) => i.id !== id);
    render();
  }

  function render() {
    el.list.innerHTML = '';
    items.forEach((it) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      const dims = it.w ? it.w + '×' + it.h + ' · ' : '';
      let meta = dims + humanSize(it.file.size);
      if (it.result) {
        const r = it.result;
        const diff = ((r.blob.size - it.file.size) / it.file.size) * 100;
        const cls = diff <= 0 ? 'save' : 'grow';
        const sign = diff <= 0 ? '−' : '+';
        meta += ' → ' + r.w + '×' + r.h + ' · ' + humanSize(r.blob.size) +
          ' <span class="' + cls + '">(' + sign + Math.abs(diff).toFixed(1) + '%)</span>' + (r.note ? ' · ' + r.note : '');
      }
      if (it.error) meta = '<span class="grow">' + it.error + '</span>';
      li.innerHTML =
        '<div class="thumb"><img alt="" src="' + it.url + '"></div>' +
        '<div class="meta"><b></b><small>' + meta + '</small></div>' +
        '<div class="acts"></div>';
      li.querySelector('b').textContent = it.file.name;
      const acts = li.querySelector('.acts');
      if (it.result) {
        const b = document.createElement('button');
        b.className = 'btn small';
        b.textContent = '다운로드';
        b.addEventListener('click', () => TB.download(it.result.blob, it.result.name));
        acts.appendChild(b);
      }
      const x = document.createElement('button');
      x.className = 'btn small secondary';
      x.textContent = '삭제';
      x.setAttribute('aria-label', it.file.name + ' 삭제');
      x.addEventListener('click', () => removeItem(it.id));
      acts.appendChild(x);
      el.list.appendChild(li);
    });
    el.run.disabled = items.length === 0;
    el.clear.hidden = items.length === 0;
    el.zip.hidden = items.filter((i) => i.result).length < 2;
  }

  function setStatus(msg, warn) {
    el.status.textContent = msg;
    el.status.style.color = warn ? 'var(--warn)' : '';
  }

  /* ---------- 처리 ---------- */
  function targetSize(w, h) {
    if (mode === 'resize') {
      if (el.rsMode.value === 'percent') {
        const p = parseNum(el.rsPct.value);
        if (!p || p <= 0) throw new Error('비율(%)을 입력하세요.');
        return [Math.round((w * p) / 100), Math.round((h * p) / 100)];
      }
      const W = parseNum(el.rsW.value), H = parseNum(el.rsH.value);
      const keep = el.rsKeep.checked;
      if (W && H) {
        if (keep) { const s = Math.min(W / w, H / h); return [Math.round(w * s), Math.round(h * s)]; }
        return [Math.round(W), Math.round(H)];
      }
      if (W) return [Math.round(W), keep ? Math.round((h * W) / w) : h];
      if (H) return [keep ? Math.round((w * H) / h) : w, Math.round(H)];
      throw new Error('가로 또는 세로 크기를 입력하세요.');
    }
    if (mode === 'compress') {
      const m = parseNum(el.cpMax && el.cpMax.value);
      if (m && w > m) return [Math.round(m), Math.round((h * m) / w)];
    }
    return [w, h];
  }

  function chooseMime(file) {
    const f = el.format.value;
    if (f !== 'original') return MIME[f];
    return EXT[file.type] ? file.type : 'image/png';
  }

  async function processOne(item) {
    const im = await TB.loadImage(item.file);
    try {
      item.w = im.width; item.h = im.height;
      let [tw, th] = targetSize(im.width, im.height);
      tw = Math.max(1, tw); th = Math.max(1, th);
      if (tw > MAX_SIDE || th > MAX_SIDE) throw new Error('결과 크기가 너무 커요 (최대 ' + MAX_SIDE + 'px).');
      const mime = chooseMime(item.file);
      const canvas = document.createElement('canvas');
      canvas.width = tw; canvas.height = th;
      const ctx = canvas.getContext('2d');
      if (mime === 'image/jpeg') { // JPG는 투명도가 없으므로 배경을 채움
        ctx.fillStyle = (el.bg && el.bg.value) || '#ffffff';
        ctx.fillRect(0, 0, tw, th);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(im.source, 0, 0, tw, th);
      const q = (parseNum(el.quality.value) || 80) / 100;
      const blob = await TB.canvasToBlob(canvas, mime, q);
      if (!blob) throw new Error('변환에 실패했어요. 이미지가 너무 크거나 브라우저가 지원하지 않는 형식이에요.');
      const base = item.file.name.replace(/\.[^.]+$/, '');
      let note = '';
      if (blob.type !== mime) note = '이 브라우저는 ' + EXT[mime].toUpperCase() + ' 저장을 지원하지 않아 ' + (EXT[blob.type] || 'PNG').toUpperCase() + '로 저장됐어요';
      const outMime = blob.type || mime;
      const suffix = mode === 'resize' ? '_resized' : mode === 'compress' ? '_compressed' : '';
      let result = { blob, name: base + suffix + '.' + (EXT[outMime] || 'png'), w: tw, h: th, note };
      if (mode === 'compress' && blob.size >= item.file.size && outMime === item.file.type && tw === im.width && th === im.height) {
        result = { blob: item.file, name: item.file.name, w: im.width, h: im.height, note: '이미 충분히 최적화돼 있어 원본을 유지했어요' };
      }
      item.result = result;
      item.error = '';
    } finally {
      im.close();
    }
  }

  async function runAll() {
    el.run.disabled = true;
    let done = 0, failed = 0;
    for (const it of items) {
      setStatus('처리 중… ' + (done + 1) + ' / ' + items.length);
      try { await processOne(it); } catch (e) { it.result = null; it.error = e.message; failed++; }
      done++;
      render();
      await new Promise((r) => setTimeout(r, 0)); // UI 갱신 틈
    }
    el.run.disabled = false;
    const ok = items.filter((i) => i.result);
    const before = ok.reduce((s, i) => s + i.file.size, 0);
    const after = ok.reduce((s, i) => s + i.result.blob.size, 0);
    let msg = ok.length + '장 완료';
    if (ok.length && mode === 'compress') msg += ' · ' + humanSize(before) + ' → ' + humanSize(after) + ' (' + (((after - before) / before) * 100).toFixed(1) + '%)';
    if (failed) msg += ' · ' + failed + '장 실패';
    setStatus(msg, failed > 0);
    render();
  }

  async function downloadZip() {
    const files = [];
    const used = new Set();
    for (const it of items) {
      if (!it.result) continue;
      let name = it.result.name, n = 1;
      while (used.has(name)) { name = it.result.name.replace(/(\.[^.]+)$/, '(' + n++ + ')$1'); }
      used.add(name);
      files.push({ name, data: new Uint8Array(await it.result.blob.arrayBuffer()) });
    }
    TB.download(TB.makeZip(files), 'images.zip');
  }

  /* ---------- 옵션 UI ---------- */
  function syncOptions() {
    if (el.qVal) el.qVal.textContent = el.quality.value;
    if (el.qRow) el.qRow.hidden = el.format.value === 'png';
    if (el.rsMode) {
      const pct = el.rsMode.value === 'percent';
      $$('[data-rs=px]').forEach((e) => { e.hidden = pct; });
      $$('[data-rs=pct]').forEach((e) => { e.hidden = !pct; });
    }
    if (el.bg) $('#cv-bg-row').hidden = el.format.value !== 'jpeg';
    items.forEach((i) => { i.result = null; });
    render();
  }

  TB.dropzone(el.zone, addFiles);
  el.run.addEventListener('click', runAll);
  el.zip.addEventListener('click', downloadZip);
  el.clear.addEventListener('click', () => { items.forEach((i) => URL.revokeObjectURL(i.url)); items = []; setStatus(''); render(); });
  $$('#img-options input, #img-options select').forEach((e) => e.addEventListener('input', syncOptions));
  syncOptions();
})();
