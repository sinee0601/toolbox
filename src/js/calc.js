/* 계산기 모음: 퍼센트 · 부가세 · 날짜 · D-day/기념일 · 만 나이 · BMI
   각 페이지에는 해당하는 [data-calc] 카드만 있으므로, 없는 카드는 자동으로 무시됩니다. */
(function () {
  'use strict';
  const { fmt, pad, bindCards, todayStr } = TB;

  /* ---------- 날짜 도우미 ---------- */
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  function parseYMD(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function daysBetween(a, b) {
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function addMonths(d, n) {
    const day = d.getDate();
    const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(day, last));
    return r;
  }
  function ymdDiff(a, b) { // a <= b
    let total = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (addMonths(a, total) > b) total--;
    const mid = addMonths(a, total);
    return { y: Math.floor(total / 12), m: total % 12, d: daysBetween(mid, b) };
  }
  function dateText(d) {
    return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + WEEK[d.getDay()] + ')';
  }
  function ddayText(n) { return n === 0 ? 'D-Day' : n > 0 ? 'D-' + fmt(n) : 'D+' + fmt(-n); }

  /* ---------- 계산식 ---------- */
  const calcs = {
    /* 퍼센트 */
    of: (v) => ({ res: fmt(v.x * v.y / 100, 6) }),
    ratio: (v) => (v.y === 0 ? { res: '0으로 나눌 수 없어요' } : { res: fmt(v.x / v.y * 100, 4) + '%' }),
    change: (v) => {
      if (v.x === 0) return { pct: '기준값이 0이면 계산할 수 없어요', diff: fmt(v.y - v.x, 6) };
      const p = (v.y - v.x) / Math.abs(v.x) * 100;
      return { pct: (p > 0 ? '+' : '') + fmt(p, 4) + '%', diff: (v.y - v.x > 0 ? '+' : '') + fmt(v.y - v.x, 6) };
    },
    inc: (v) => ({ up: fmt(v.x * (1 + v.y / 100), 6), down: fmt(v.x * (1 - v.y / 100), 6) }),

    /* 부가세 */
    vat: (v) => {
      const rate = v.rate / 100;
      let supply, vat, total;
      if (v.mode === 'total') {
        total = Math.round(v.amt);
        supply = Math.round(total / (1 + rate));
        vat = total - supply;
      } else {
        supply = Math.round(v.amt);
        vat = Math.floor(supply * rate); // 원 미만 절사
        total = supply + vat;
      }
      return { supply: fmt(supply, 0) + '원', vat: fmt(vat, 0) + '원', total: fmt(total, 0) + '원' };
    },

    /* 날짜 차이 */
    diff: (v) => {
      let a = parseYMD(v.start), b = parseYMD(v.end);
      if (!a || !b) return null;
      let note = '';
      if (b < a) { [a, b] = [b, a]; note = '종료일이 시작일보다 앞서 있어 순서를 바꿔 계산했어요.'; }
      let days = daysBetween(a, b);
      if (v.incl) days += 1;
      const w = Math.floor(days / 7), r = days % 7;
      const ymd = ymdDiff(a, b);
      return {
        days: fmt(days) + '일',
        weeks: w + '주 ' + r + '일',
        ymd: (ymd.y ? ymd.y + '년 ' : '') + ymd.m + '개월 ' + ymd.d + '일',
        note,
      };
    },
    /* 날짜 더하기/빼기 */
    add: (v) => {
      const base = parseYMD(v.base);
      if (!base || !Number.isInteger(v.n) || v.n < 0) return { result: '0 이상의 정수를 입력하세요' };
      const sign = v.dir === 'before' ? -1 : 1;
      let r;
      if (v.unit === 'day') r = addDays(base, sign * v.n);
      else if (v.unit === 'week') r = addDays(base, sign * v.n * 7);
      else if (v.unit === 'month') r = addMonths(base, sign * v.n);
      else r = addMonths(base, sign * v.n * 12);
      return { result: dateText(r), iso: r.getFullYear() + '-' + pad(r.getMonth() + 1) + '-' + pad(r.getDate()) };
    },

    /* D-day */
    dday: (v) => {
      const base = parseYMD(v.base), target = parseYMD(v.target);
      if (!base || !target) return null;
      const n = daysBetween(base, target);
      const text = n === 0 ? '기준일 당일이에요' : n > 0 ? n.toLocaleString('ko-KR') + '일 남았어요' : (-n).toLocaleString('ko-KR') + '일 지났어요';
      return { dday: ddayText(n), text, when: dateText(target) };
    },
    /* 기념일: 시작일을 1일로 센다 */
    anniv: (v) => {
      const start = parseYMD(v.start), today = parseYMD(todayStr());
      if (!start) return null;
      const rows = [];
      [50, 100, 200, 300, 365, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 3000].forEach((n) => rows.push(['' + n.toLocaleString('ko-KR') + '일', addDays(start, n - 1)]));
      for (let y = 1; y <= 10; y++) rows.push([y + '주년', addMonths(start, y * 12)]);
      rows.sort((p, q) => p[1] - q[1]);
      const html = rows.map(([label, d]) => {
        const left = daysBetween(today, d);
        return '<tr class="' + (left < 0 ? 'past' : '') + '"><td>' + label + '</td><td>' + dateText(d) + '</td><td>' + ddayText(left) + '</td></tr>';
      }).join('');
      return { rows: html };
    },

    /* 만 나이 */
    age: (v) => {
      const birth = parseYMD(v.birth), ref = parseYMD(v.ref);
      if (!birth || !ref) return null;
      if (birth > ref) return { man: '생년월일이 기준일보다 미래예요' };
      const birthdayIn = (y) => new Date(y, birth.getMonth(), birth.getDate()); // 2/29는 평년에 3/1로 넘어감
      let man = ref.getFullYear() - birth.getFullYear();
      if (ref < birthdayIn(ref.getFullYear())) man--;
      let next = birthdayIn(ref.getFullYear());
      if (next < ref) next = birthdayIn(ref.getFullYear() + 1);
      const left = daysBetween(ref, next);
      const animals = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
      const zodiac = animals[(((birth.getFullYear() - 4) % 12) + 12) % 12] + '띠';
      return {
        man: '만 ' + man + '세',
        year: (ref.getFullYear() - birth.getFullYear()) + '세',
        korean: (ref.getFullYear() - birth.getFullYear() + 1) + '세',
        lived: fmt(daysBetween(birth, ref) + 1) + '일째',
        next: dateText(next) + ' · ' + ddayText(left),
        zodiac,
      };
    },

    /* BMI — 대한비만학회(아시아-태평양) 기준 */
    bmi: (v) => {
      if (v.h < 50 || v.h > 260 || v.w <= 0 || v.w > 500) return { bmi: '키(cm)와 몸무게(kg)를 확인하세요' };
      const m = v.h / 100;
      const b = v.w / (m * m);
      let cat = b < 18.5 ? '저체중' : b < 23 ? '정상' : b < 25 ? '비만 전단계(과체중)' : b < 30 ? '1단계 비만' : b < 35 ? '2단계 비만' : '3단계 비만(고도비만)';
      return {
        bmi: b.toFixed(1),
        cat,
        range: (18.5 * m * m).toFixed(1) + ' ~ ' + (22.9 * m * m).toFixed(1) + ' kg',
      };
    },
  };

  bindCards(calcs);
})();
