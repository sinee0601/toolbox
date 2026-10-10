/* 공통 유틸 — 모든 페이지에서 가장 먼저 로드됩니다. 모든 처리는 브라우저 안에서만 이뤄집니다. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- 숫자 ---------- */
  function parseNum(v) {
    if (v === null || v === undefined) return null;
    const s = String(v).replace(/[,\s]/g, '');
    if (s === '' || s === '-' || s === '.' || s === '+') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  // fmt(n)       : 의미 있는 자리까지 (부동소수점 오차 정리)
  // fmt(n, d)    : 소수점 최대 d자리
  function fmt(n, d) {
    if (n === null || n === undefined || typeof n !== 'number' || !Number.isFinite(n)) return '-';
    if (typeof d === 'number') return n.toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
    const abs = Math.abs(n);
    if (abs !== 0 && (abs < 1e-6 || abs >= 1e18)) return n.toExponential(4).replace('e+', 'e');
    return Number(n.toPrecision(12)).toLocaleString('ko-KR', { maximumFractionDigits: 10 });
  }

  function humanSize(bytes) {
    if (!Number.isFinite(bytes)) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  // 천 단위 콤마 자동 입력
  function bindMoney(input) {
    input.addEventListener('input', () => {
      const raw = input.value.replace(/[^\d]/g, '');
      input.value = raw ? Number(raw).toLocaleString('ko-KR') : '';
    });
  }

  /* ---------- 날짜 ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* ---------- UI ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) { /* ignore */ }
      ta.remove();
    }
    toast('복사했어요');
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function dropzone(zone, onFiles) {
    const input = $('input[type=file]', zone);
    zone.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', () => {
      if (input.files && input.files.length) onFiles(Array.from(input.files));
      input.value = '';
    });
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('is-drag'); }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('is-drag'); }));
    zone.addEventListener('drop', (e) => {
      const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
      if (files.length) onFiles(files);
    });
  }

  /* ---------- 입력 카드 바인딩 ----------
     [data-calc="이름"] 카드 안의 [data-k] 입력을 읽어 calcs[이름](값들)을 실행하고
     [data-out="키"] 요소에 결과를 채웁니다. 숫자 필드가 비어 있으면 결과를 비웁니다. */
  function bindCards(calcs, root) {
    root = root || document;
    $$('[data-calc]', root).forEach((card) => {
      const fn = calcs[card.dataset.calc];
      if (!fn) return;
      const inputs = $$('[data-k]', card);
      const outs = $$('[data-out]', card);
      const run = () => {
        const v = {};
        let ok = true;
        for (const el of inputs) {
          const k = el.dataset.k;
          let val;
          if (el.type === 'radio') {
            if (!el.checked) continue;
            val = el.value;
          } else if (el.type === 'checkbox') {
            val = el.checked;
          } else if (el.tagName === 'SELECT' || el.hasAttribute('data-str')) {
            val = el.value;
            if (val === '' && !el.hasAttribute('data-optional')) ok = false;
          } else {
            val = parseNum(el.value);
            if (val === null && !el.hasAttribute('data-optional')) ok = false;
          }
          v[k] = val;
        }
        let r = null;
        if (ok) {
          try { r = fn(v, card); } catch (e) { console.error(e); r = null; }
        }
        outs.forEach((o) => {
          const val = r && r[o.dataset.out] !== undefined ? r[o.dataset.out] : '';
          if (o.hasAttribute('data-html')) o.innerHTML = val === '' ? (o.hasAttribute('data-blank') ? '' : '-') : val;
          else o.textContent = val === '' ? (o.hasAttribute('data-blank') ? '' : '-') : val;
        });
      };
      card.addEventListener('input', run);
      card.addEventListener('change', run);
      run();
    });
  }

  /* ---------- 이미지 ---------- */
  async function loadImage(file) {
    try {
      const bmp = await createImageBitmap(file);
      return { source: bmp, width: bmp.width, height: bmp.height, close() { if (bmp.close) bmp.close(); } };
    } catch (_) { /* 폴백 */ }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (!img.naturalWidth) { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없어요: ' + file.name)); return; }
        resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, close() { URL.revokeObjectURL(url); } });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('지원하지 않는 이미지 형식이에요: ' + file.name)); };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  /* ---------- ZIP (무압축 저장 방식, 외부 라이브러리 불필요) ---------- */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
    return (crc ^ -1) >>> 0;
  }

  // files: [{ name: string, data: Uint8Array }]
  function makeZip(files) {
    const enc = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
    const dosDate = ((((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff);
    for (const f of files) {
      const name = enc.encode(f.name);
      const data = f.data;
      const crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);
      lh.setUint16(6, 0x0800, true); // UTF-8 파일명
      lh.setUint16(8, 0, true);      // 무압축
      lh.setUint16(10, dosTime, true);
      lh.setUint16(12, dosDate, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true);
      lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true);
      lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, data);

      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true);
      ch.setUint16(4, 20, true);
      ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true);
      ch.setUint16(14, dosDate, true);
      ch.setUint32(16, crc, true);
      ch.setUint32(20, data.length, true);
      ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true);
      ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + data.length;
    }
    let cdSize = 0;
    for (const c of central) cdSize += c.byteLength;
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true);
    end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
  }

  /* ---------- 홈 검색 ---------- */
  function initSearch() {
    const input = $('#tool-search');
    if (!input) return;
    const cards = $$('.tool-card');
    const sections = $$('.cat-section');
    const empty = $('#search-empty');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach((c) => {
        const hit = !q || (c.dataset.keywords || '').toLowerCase().includes(q);
        c.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      sections.forEach((s) => {
        const any = $$('.tool-card', s).some((c) => c.style.display !== 'none');
        s.style.display = any ? '' : 'none';
      });
      if (empty) empty.style.display = shown ? 'none' : 'block';
    });
  }

  /* ---------- 초기화 ---------- */
  function init() {
    $$('input[type=date][data-today]').forEach((i) => { if (!i.value) i.value = todayStr(); });
    $$('input.money').forEach(bindMoney);
    initSearch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.TB = { $, $$, parseNum, fmt, humanSize, pad, todayStr, toast, copyText, download, dropzone, bindCards, bindMoney, loadImage, canvasToBlob, makeZip, crc32 };
})();
