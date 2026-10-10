/* 대출 이자 계산기: 원리금균등 · 원금균등 · 만기일시 (+ 거치기간) */
(function () {
  'use strict';
  const { $, parseNum, fmt } = TB;
  const form = $('#loan-form');
  if (!form) return;

  const el = {
    amount: $('#loan-amount'),
    rate: $('#loan-rate'),
    term: $('#loan-term'),
    unit: $('#loan-unit'),
    grace: $('#loan-grace'),
    out: $('#loan-summary'),
    msg: $('#loan-msg'),
    body: $('#loan-rows'),
    wrap: $('#loan-table-wrap'),
  };
  const won = (n) => fmt(Math.round(n), 0) + '원';

  function schedule(P, annualRate, n, grace, method) {
    const r = annualRate / 100 / 12;
    const rows = [];
    let bal = P;
    if (method === 'bullet') {
      for (let i = 1; i <= n; i++) {
        const interest = Math.round(P * r);
        const principal = i === n ? P : 0;
        bal = i === n ? 0 : P;
        rows.push({ i, pay: interest + principal, principal, interest, bal });
      }
      return rows;
    }
    const m = n - grace; // 원금 상환 개월 수
    for (let i = 1; i <= grace; i++) {
      const interest = Math.round(bal * r);
      rows.push({ i, pay: interest, principal: 0, interest, bal });
    }
    if (method === 'equal-payment') {
      const pay = r === 0 ? P / m : (P * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1);
      for (let k = 1; k <= m; k++) {
        const interest = Math.round(bal * r);
        let principal = k === m ? bal : Math.round(pay) - interest;
        if (principal > bal) principal = bal;
        bal -= principal;
        rows.push({ i: grace + k, pay: principal + interest, principal, interest, bal });
      }
    } else { // equal-principal
      const unit = P / m;
      for (let k = 1; k <= m; k++) {
        const interest = Math.round(bal * r);
        const principal = k === m ? bal : Math.round(unit);
        bal -= principal;
        rows.push({ i: grace + k, pay: principal + interest, principal, interest, bal });
      }
    }
    return rows;
  }

  function run() {
    el.msg.textContent = '';
    el.msg.className = 'msg';
    const P = parseNum(el.amount.value);
    const rate = parseNum(el.rate.value);
    let term = parseNum(el.term.value);
    const grace = parseNum(el.grace.value) || 0;
    const method = form.querySelector('input[name=loan-method]:checked').value;
    el.body.innerHTML = '';
    el.wrap.hidden = true;
    el.out.querySelectorAll('dd').forEach((d) => { d.textContent = '-'; });
    if (P === null || rate === null || term === null) return;
    if (el.unit.value === 'year') term *= 12;
    term = Math.round(term);
    if (P <= 0 || rate < 0 || term < 1) { el.msg.textContent = '금액·금리·기간을 확인해주세요.'; return; }
    if (term > 600) { el.msg.textContent = '기간은 최대 600개월(50년)까지 계산해요.'; return; }
    if (method !== 'bullet' && (grace < 0 || grace >= term || !Number.isInteger(grace))) {
      el.msg.textContent = '거치기간은 0 이상이고 전체 기간보다 짧은 정수(개월)여야 해요.';
      return;
    }
    const rows = schedule(P, rate, term, method === 'bullet' ? 0 : grace, method);
    const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
    const totalPay = rows.reduce((s, r) => s + r.pay, 0);
    const first = rows[0].pay, last = rows[rows.length - 1].pay;
    const set = (k, v) => { el.out.querySelector('[data-out=' + k + ']').textContent = v; };
    if (method === 'equal-payment') {
      const m = rows.find((r) => r.principal > 0) || rows[0];
      set('monthly-label', '월 상환액' + (grace ? ' (거치 후)' : ''));
      set('monthly', won(m.pay));
    } else if (method === 'equal-principal') {
      set('monthly-label', '월 상환액 (첫 달 → 마지막 달)');
      set('monthly', won(first) + ' → ' + won(last));
    } else {
      set('monthly-label', '매월 이자 / 만기 상환액');
      set('monthly', won(rows[0].interest) + ' / ' + won(last));
    }
    set('interest', won(totalInterest));
    set('total', won(totalPay));
    set('ratio', (totalInterest / P * 100).toFixed(2) + '%');

    el.body.innerHTML = rows.map((r) =>
      '<tr><td>' + r.i + '회</td><td>' + fmt(r.pay, 0) + '</td><td>' + fmt(r.principal, 0) + '</td><td>' + fmt(r.interest, 0) + '</td><td>' + fmt(r.bal, 0) + '</td></tr>'
    ).join('');
    el.wrap.hidden = false;
  }

  TB.bindMoney(el.amount);
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  run();
})();
