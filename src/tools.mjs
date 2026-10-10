// 도구 페이지 정의. 새 도구를 추가하려면 TOOLS 배열에 항목을 하나 추가하면 됩니다.
import { CATEGORIES, convert, formatNumber } from './units-data.mjs';

export const GROUPS = [
  { id: 'calc', name: '계산기', icon: '🧮', desc: '퍼센트·날짜·나이·대출 이자까지' },
  { id: 'convert', name: '단위 변환기', icon: '🔄', desc: '평↔㎡, cm↔인치, kg↔lb 등' },
  { id: 'text', name: '텍스트', icon: '✍️', desc: '자소서·원고 글자수 확인' },
  { id: 'image', name: '이미지', icon: '🖼️', desc: '크기 조절·압축·포맷 변환' },
  { id: 'pdf', name: 'PDF', icon: '📄', desc: '병합·분할·이미지 변환' },
];

/* ---------- 작은 HTML 조각 ---------- */
const num = (k, ph, label, extra = '') =>
  `<input class="in" type="text" inputmode="decimal" autocomplete="off" data-k="${k}" placeholder="${ph}" aria-label="${label}" ${extra}>`;
const date = (k, label, extra = '') =>
  `<input class="in" type="date" data-k="${k}" data-str aria-label="${label}" ${extra}>`;
const out = (label, key, extra = '') => `<div><dt>${label}</dt><dd data-out="${key}" ${extra}>-</dd></div>`;
const dz = (id, accept, multiple, title, sub) =>
  `<div class="dropzone" id="${id}" role="button" tabindex="0" aria-label="${title}">
     <span class="big" aria-hidden="true">📁</span><strong>${title}</strong><small>${sub}</small>
     <input class="visually-hidden" type="file" accept="${accept}" ${multiple ? 'multiple' : ''} tabindex="-1">
   </div>`;
const privacyNote = '<p class="hint" style="margin-top:12px">🔒 파일은 서버로 업로드되지 않고 내 브라우저 안에서만 처리돼요.</p>';

/* ---------- 계산기 ---------- */
const percent = {
  slug: 'percent-calculator',
  cat: 'calc',
  icon: '％',
  name: '퍼센트 계산기',
  short: '비율·증감률·할인가를 바로 계산',
  title: '퍼센트 계산기 - 비율, 증감률, 할인율 계산',
  h1: '퍼센트 계산기',
  desc: 'A의 B%는 얼마인지, A는 B의 몇 %인지, 증감률과 할인가까지 한 번에 계산하는 무료 퍼센트 계산기입니다.',
  lead: '퍼센트 계산, 헷갈릴 때마다 여기서 숫자만 넣으세요. 네 가지 계산이 입력과 동시에 바로 나옵니다.',
  kw: '퍼센트 계산기 비율 증감률 할인율 할인가 백분율',
  scripts: ['calc.js'],
  body: `<div class="calc-grid">
  <section class="card" data-calc="of"><h3>① A의 B%는 얼마?</h3>
    <div class="inline-fields">${num('x', '예: 20000', '기준 값')}<span>의</span>${num('y', '예: 15', '퍼센트')}<span>% 는</span></div>
    <p class="answer"><strong data-out="res">-</strong></p></section>
  <section class="card" data-calc="ratio"><h3>② A는 B의 몇 %?</h3>
    <div class="inline-fields">${num('x', '예: 30', '부분 값')}<span>은(는)</span>${num('y', '예: 120', '전체 값')}<span>의</span></div>
    <p class="answer"><strong data-out="res">-</strong></p></section>
  <section class="card" data-calc="change"><h3>③ 증감률 (A에서 B로 변하면)</h3>
    <div class="inline-fields">${num('x', '이전 값', '이전 값')}<span>→</span>${num('y', '이후 값', '이후 값')}</div>
    <dl class="out-list">${out('증감률', 'pct')}${out('차이', 'diff')}</dl></section>
  <section class="card" data-calc="inc"><h3>④ A를 B% 올리거나 내리면</h3>
    <div class="inline-fields">${num('x', '예: 50000', '기준 값')}<span>를</span>${num('y', '예: 20', '퍼센트')}<span>%</span></div>
    <dl class="out-list">${out('증가 시', 'up')}${out('감소(할인) 시', 'down')}</dl></section>
</div>`,
  guide: `<h3>자주 쓰는 공식</h3>
<ul>
<li><b>A의 B%</b> = A × B ÷ 100</li>
<li><b>A는 B의 몇 %</b> = A ÷ B × 100</li>
<li><b>증감률</b> = (나중 값 − 처음 값) ÷ 처음 값 × 100</li>
<li><b>B% 할인된 가격</b> = 원래 가격 × (1 − B ÷ 100)</li>
</ul>
<p class="note">증감률은 기준이 처음 값이라는 점에 주의하세요. 100에서 150이 되면 +50%이지만, 150에서 100으로 돌아가면 −33.3%입니다. 오르고 내린 비율이 같아 보여도 기준이 달라 결과가 다릅니다.</p>`,
  faq: [
    ['20% 할인 후 다시 10% 할인하면 총 30% 할인인가요?', '아니요. 할인율은 더하지 않고 곱합니다. 0.8 × 0.9 = 0.72이므로 실제 총 할인율은 28%예요. 계산기 ④에서 20%를 내린 값에 10%를 한 번 더 적용해 확인해보세요.'],
    ['퍼센트(%)와 퍼센트포인트(%p)는 어떻게 다른가요?', '금리가 3%에서 4%로 오르면 1%p 상승이고, 증감률로는 약 33.3% 상승입니다. 비율끼리의 단순 차이는 %p, 처음 값 대비 변화율은 %로 구분해요.'],
    ['소수점 이하는 어디까지 표시되나요?', '결과는 필요한 만큼만 최대 소수점 4~6자리까지 보여주고, 불필요한 0은 생략합니다.'],
  ],
  related: ['vat-calculator', 'loan-calculator', 'date-calculator'],
};

const vat = {
  slug: 'vat-calculator',
  cat: 'calc',
  icon: '🧾',
  name: '부가세 계산기',
  short: '공급가액 ↔ 합계금액 부가세 계산',
  title: '부가세 계산기 - 공급가액, 부가가치세 10% 계산',
  h1: '부가세 계산기',
  desc: '공급가액으로 부가세와 합계금액을, 합계금액으로 공급가액과 부가세를 거꾸로 계산하는 부가가치세(VAT) 10% 계산기입니다.',
  lead: '공급가액에서 부가세를 더하거나, 부가세가 포함된 금액에서 공급가액을 역산하세요.',
  kw: '부가세 계산기 부가가치세 VAT 공급가액 합계금액 세금계산서 10%',
  scripts: ['calc.js'],
  body: `<section class="card" data-calc="vat">
  <div class="field"><span class="lbl">계산 방향</span>
    <div class="seg">
      <label><input type="radio" name="vat-mode" value="supply" data-k="mode" checked> 공급가액 → 부가세 더하기</label>
      <label><input type="radio" name="vat-mode" value="total" data-k="mode"> 합계금액 → 공급가액 구하기</label>
    </div></div>
  <div class="row" style="margin-top:14px">
    <div class="field"><label for="vat-amt">금액 (원)</label><input id="vat-amt" class="in money" type="text" inputmode="numeric" data-k="amt" placeholder="예: 1,000,000" autocomplete="off"></div>
    <div class="field" style="flex:0 1 140px"><label for="vat-rate">세율 (%)</label><input id="vat-rate" class="in" type="text" inputmode="decimal" data-k="rate" value="10"></div>
  </div>
  <dl class="out-list big">${out('공급가액', 'supply')}${out('부가세', 'vat')}${out('합계금액', 'total')}</dl>
</section>`,
  guide: `<h3>계산 방법</h3>
<ul>
<li><b>공급가액 기준</b>: 부가세 = 공급가액 × 10%, 합계금액 = 공급가액 + 부가세</li>
<li><b>합계금액 기준</b>: 공급가액 = 합계금액 ÷ 1.1, 부가세 = 합계금액 − 공급가액</li>
</ul>
<p class="note">원 단위 미만은 공급가액 기준에서는 절사, 합계금액 기준에서는 반올림으로 처리합니다. 실제 세금계산서는 거래 건별로 계산되므로 참고용으로 활용하세요.</p>`,
  faq: [
    ['부가가치세 세율은 얼마인가요?', '일반과세 기준 10%입니다. 면세 품목이나 영세율(0%) 적용 대상은 다르므로 세율 칸을 직접 바꿔 계산할 수 있어요.'],
    ['부가세 포함 금액에서 부가세만 빼려면 1.1로 나누나요?', '네. 합계금액 ÷ 1.1이 공급가액이고, 합계금액에서 공급가액을 뺀 값이 부가세입니다. 합계금액의 10%를 빼면 틀린 값이 나와요.'],
  ],
  related: ['percent-calculator', 'loan-calculator'],
};

const dateCalc = {
  slug: 'date-calculator',
  cat: 'calc',
  icon: '📅',
  name: '날짜 계산기',
  short: '날짜 간격, N일 후 날짜 계산',
  title: '날짜 계산기 - 날짜 간격, N일 후, 개월 수 계산',
  h1: '날짜 계산기',
  desc: '두 날짜 사이의 일수·주·개월 수와, 기준일로부터 N일/주/개월/년 후(전) 날짜를 계산하는 무료 날짜 계산기입니다.',
  lead: '두 날짜 사이가 며칠인지, 오늘로부터 100일 뒤는 언제인지 바로 확인하세요.',
  kw: '날짜 계산기 일수 계산 날짜 차이 며칠 후 N일 후 개월 수',
  scripts: ['calc.js'],
  body: `<div class="calc-grid">
  <section class="card" data-calc="diff"><h3>① 두 날짜 사이 간격</h3>
    <div class="row">
      <div class="field"><label>시작일</label>${date('start', '시작일', 'data-today')}</div>
      <div class="field"><label>종료일</label>${date('end', '종료일', 'data-today')}</div>
    </div>
    <p style="margin:12px 0 0"><label class="check"><input type="checkbox" data-k="incl"> 시작일도 1일로 포함해서 세기</label></p>
    <dl class="out-list">${out('일수', 'days')}${out('주', 'weeks')}${out('년·개월·일', 'ymd')}</dl>
    <div class="msg" data-out="note" data-blank></div></section>
  <section class="card" data-calc="add"><h3>② 기준일에서 N일(주·개월·년) 후/전</h3>
    <div class="row">
      <div class="field"><label>기준일</label>${date('base', '기준일', 'data-today')}</div>
      <div class="field"><label>기간</label>${num('n', '예: 100', '기간 숫자', 'value="100"')}</div>
    </div>
    <div class="row" style="margin-top:12px">
      <div class="field"><label>단위</label><select data-k="unit" aria-label="단위"><option value="day">일</option><option value="week">주</option><option value="month">개월</option><option value="year">년</option></select></div>
      <div class="field"><label>방향</label><select data-k="dir" aria-label="방향"><option value="after">후</option><option value="before">전</option></select></div>
    </div>
    <p class="answer"><strong data-out="result">-</strong></p></section>
</div>`,
  guide: `<h3>사용 팁</h3>
<ul>
<li>보통 두 날짜의 차이는 시작일을 빼고 셉니다. 계약 기간이나 여행 일정처럼 <b>시작일을 1일차로 포함</b>하려면 체크박스를 켜세요.</li>
<li>개월·년 단위는 달력 기준이라 일수가 달라요. 1월 31일에 1개월을 더하면 2월에는 31일이 없으므로 2월 말일로 계산합니다.</li>
<li>입력한 날짜는 서버로 전송되지 않고 브라우저에서만 계산됩니다.</li>
</ul>`,
  faq: [
    ['오늘부터 100일 뒤는 언제인가요?', '② 계산기에 기준일(오늘 자동 입력), 기간 100, 단위 일, 방향 후를 선택하면 날짜와 요일이 바로 나옵니다.'],
    ['두 날짜 사이 일수에 시작일이 포함되나요?', '기본값은 포함하지 않는 방식(종료일 − 시작일)입니다. 시작일을 1일째로 세려면 체크박스를 켜면 하루가 더해져요.'],
    ['윤년도 반영되나요?', '네. 달력 날짜를 기준으로 계산하므로 윤년의 2월 29일도 자동으로 반영됩니다.'],
  ],
  related: ['dday-calculator', 'age-calculator', 'percent-calculator'],
};

const dday = {
  slug: 'dday-calculator',
  cat: 'calc',
  icon: '⏳',
  name: 'D-day · 기념일 계산기',
  short: 'D-day와 100일·1주년 기념일 계산',
  title: 'D-day 계산기 - 기념일 100일, 200일, 1주년 계산',
  h1: 'D-day · 기념일 계산기',
  desc: '시험·여행 D-day를 계산하고, 만난 날 기준 100일·200일·300일·1주년 기념일 날짜를 한 번에 확인하는 계산기입니다.',
  lead: '목표일까지 며칠 남았는지, 기념일은 언제인지 한 번에 확인하세요.',
  kw: 'D-day 디데이 계산기 기념일 100일 200일 1주년 커플 기념일 며칠 남았',
  scripts: ['calc.js'],
  body: `<div class="calc-grid">
  <section class="card" data-calc="dday"><h3>① D-day 계산</h3>
    <div class="row">
      <div class="field"><label>기준일</label>${date('base', '기준일', 'data-today')}</div>
      <div class="field"><label>목표일</label>${date('target', '목표일')}</div>
    </div>
    <dl class="out-list">${out('D-day', 'dday')}${out('남은 기간', 'text')}${out('목표일', 'when')}</dl></section>
  <section class="card" data-calc="anniv"><h3>② 기념일 계산 (시작일 = 1일째)</h3>
    <div class="field"><label>시작일 (처음 만난 날 등)</label>${date('start', '시작일')}</div>
    <div class="table-wrap"><table><thead><tr><th>기념일</th><th>날짜</th><th>D-day</th></tr></thead><tbody data-out="rows" data-html data-blank></tbody></table></div></section>
</div>`,
  guide: `<h3>기념일은 이렇게 세요</h3>
<p>우리나라에서는 만난 날을 <b>1일째</b>로 세는 것이 일반적이라, 100일은 시작일로부터 99일 뒤입니다. 반면 1주년은 시작일과 같은 월·일입니다. 이 계산기는 이 관례를 그대로 따릅니다.</p>
<p class="note">② 표에서 이미 지난 기념일은 회색으로 표시되고, 남은 기념일은 오늘 기준 D-day가 표시돼요.</p>`,
  faq: [
    ['D-day의 D는 무슨 뜻인가요?', '작전 개시일을 뜻하는 군사 용어에서 온 표현으로, 지금은 "기준이 되는 날"의 의미로 쓰여요. D-10은 10일 전, D+10은 10일 지난 날입니다.'],
    ['100일 기념일은 시작일 포함인가요?', '네, 시작일을 1일째로 세므로 시작일 + 99일이 100일입니다. 시작일을 0일로 세고 싶다면 날짜 계산기에서 "N일 후"를 사용하세요.'],
  ],
  related: ['date-calculator', 'age-calculator'],
};

const age = {
  slug: 'age-calculator',
  cat: 'calc',
  icon: '🎂',
  name: '만 나이 계산기',
  short: '만 나이·연 나이·띠 계산',
  title: '만 나이 계산기 - 생년월일로 만 나이, 연 나이, 띠 계산',
  h1: '만 나이 계산기',
  desc: '생년월일만 입력하면 만 나이, 연 나이, 세는 나이, 띠, 다음 생일까지 남은 일수를 바로 계산해주는 만 나이 계산기입니다.',
  lead: '생년월일을 넣으면 만 나이와 다음 생일까지 남은 날을 알려드려요. 기준일도 바꿀 수 있어요.',
  kw: '만 나이 계산기 생년월일 연 나이 세는 나이 띠 다음 생일',
  scripts: ['calc.js'],
  body: `<section class="card" data-calc="age">
  <div class="row">
    <div class="field"><label>생년월일</label>${date('birth', '생년월일')}</div>
    <div class="field"><label>기준일 (기본: 오늘)</label>${date('ref', '기준일', 'data-today')}</div>
  </div>
  <dl class="out-list big">${out('만 나이', 'man')}${out('연 나이', 'year')}${out('세는 나이', 'korean')}</dl>
  <dl class="out-list">${out('띠 (양력 연도 기준)', 'zodiac')}${out('태어난 지', 'lived')}${out('다음 생일', 'next')}</dl>
</section>`,
  guide: `<h3>나이 계산 방식 3가지</h3>
<ul>
<li><b>만 나이</b>: 태어난 날 0세, 생일이 지날 때마다 1세씩 증가합니다. 2023년 6월부터 법과 행정에서 만 나이를 기준으로 통일했어요.</li>
<li><b>연 나이</b>: 기준 연도 − 출생 연도. 병역·청소년 보호법 등 일부 법령에서 사용합니다.</li>
<li><b>세는 나이</b>: 태어나자마자 1세, 해가 바뀔 때마다 1세 증가하는 전통 방식입니다.</li>
</ul>
<p class="note">띠는 양력 연도로 계산한 값이에요. 음력 설 이전 출생이라면 전년도 띠일 수 있습니다. 2월 29일생은 평년에 3월 1일을 생일로 계산하며, 기관에 따라 달리 볼 수 있습니다.</p>`,
  faq: [
    ['만 나이는 어떻게 계산하나요?', '기준일의 연도에서 출생 연도를 뺀 뒤, 올해 생일이 아직 오지 않았다면 1을 더 빼면 됩니다.'],
    ['연 나이와 만 나이는 얼마나 차이 나요?', '생일이 지난 후에는 같고, 생일 전에는 연 나이가 만 나이보다 1살 많아요.'],
    ['특정 날짜 기준의 나이도 알 수 있나요?', '네. 기준일 칸에 원하는 날짜를 넣으면 그날의 나이를 계산합니다. 자격 요건처럼 특정일 기준 나이를 확인할 때 유용해요.'],
  ],
  related: ['date-calculator', 'dday-calculator', 'bmi-calculator'],
};

const loan = {
  slug: 'loan-calculator',
  cat: 'calc',
  icon: '🏦',
  name: '대출 이자 계산기',
  short: '원리금균등·원금균등·만기일시 상환',
  title: '대출 이자 계산기 - 원리금균등, 원금균등, 만기일시 상환 계산',
  h1: '대출 이자 계산기',
  desc: '대출금액, 연 이자율, 기간을 입력하면 원리금균등·원금균등·만기일시 상환 방식별 월 상환액, 총 이자, 상환 스케줄을 계산합니다.',
  lead: '상환 방식에 따라 월 납입액과 총 이자가 얼마나 달라지는지 비교해보세요. 회차별 스케줄도 함께 보여드려요.',
  kw: '대출 이자 계산기 원리금균등 원금균등 만기일시 월 상환액 총 이자 거치기간 주택담보대출',
  scripts: ['loan.js'],
  body: `<form class="card" id="loan-form" onsubmit="return false">
  <div class="row">
    <div class="field"><label for="loan-amount">대출 금액 (원)</label><input class="in money" id="loan-amount" type="text" inputmode="numeric" value="100,000,000" autocomplete="off"></div>
    <div class="field"><label for="loan-rate">연 이자율 (%)</label><input class="in" id="loan-rate" type="text" inputmode="decimal" value="4.5" autocomplete="off"></div>
  </div>
  <div class="row" style="margin-top:12px">
    <div class="field"><label for="loan-term">대출 기간</label>
      <div style="display:flex;gap:8px"><input class="in" id="loan-term" type="text" inputmode="numeric" value="30" autocomplete="off"><select id="loan-unit" aria-label="기간 단위" style="width:90px"><option value="year">년</option><option value="month">개월</option></select></div></div>
    <div class="field"><label for="loan-grace">거치 기간 (개월)</label><input class="in" id="loan-grace" type="text" inputmode="numeric" value="0" autocomplete="off"><span class="hint">거치기간에는 이자만 내요 (만기일시는 해당 없음)</span></div>
  </div>
  <div class="field" style="margin-top:14px"><span class="lbl">상환 방식</span>
    <div class="seg">
      <label><input type="radio" name="loan-method" value="equal-payment" checked> 원리금균등</label>
      <label><input type="radio" name="loan-method" value="equal-principal"> 원금균등</label>
      <label><input type="radio" name="loan-method" value="bullet"> 만기일시</label>
    </div></div>
  <div id="loan-msg" class="msg" role="alert"></div>
  <dl class="out-list big" id="loan-summary">
    <div><dt data-out="monthly-label">월 상환액</dt><dd data-out="monthly">-</dd></div>
    <div><dt>총 이자</dt><dd data-out="interest">-</dd></div>
    <div><dt>총 상환액</dt><dd data-out="total">-</dd></div>
    <div><dt>원금 대비 이자</dt><dd data-out="ratio">-</dd></div>
  </dl>
  <div class="table-wrap" id="loan-table-wrap" hidden>
    <table><thead><tr><th>회차</th><th>납입금</th><th>원금</th><th>이자</th><th>잔액</th></tr></thead><tbody id="loan-rows"></tbody></table>
  </div>
</form>`,
  guide: `<h3>상환 방식 비교</h3>
<ul>
<li><b>원리금균등</b>: 매달 같은 금액을 냅니다. 초반에는 이자 비중이 크고 갈수록 원금 비중이 커져요. 월 부담이 일정해 계획을 세우기 쉽습니다.</li>
<li><b>원금균등</b>: 매달 같은 원금을 갚고 이자는 줄어듭니다. 첫 달 부담이 가장 크지만 총 이자는 원리금균등보다 적어요.</li>
<li><b>만기일시</b>: 매달 이자만 내고 만기에 원금을 한 번에 갚습니다. 월 부담은 가장 적지만 총 이자는 가장 많아요.</li>
</ul>
<p class="note">이 계산기는 "연 이자율 ÷ 12"를 매월 남은 잔액에 곱해 이자를 구하는 일반적인 방식이며, 원 단위 반올림으로 실제 금융기관 결과와 몇 원~수백 원 차이가 날 수 있습니다. 중도상환수수료, 변동금리, 일수 계산은 반영하지 않으니 참고용으로 사용하세요.</p>`,
  faq: [
    ['어떤 상환 방식이 가장 유리한가요?', '총 이자만 보면 원금균등이 적고, 월 부담의 안정성은 원리금균등이 좋습니다. 같은 조건으로 방식만 바꿔 총 이자 차이를 직접 비교해보세요.'],
    ['거치기간이 있으면 어떻게 되나요?', '거치기간에는 원금 없이 이자만 내고, 이후 남은 기간 동안 원금을 상환합니다. 상환 기간이 짧아지므로 거치 후 월 상환액이 더 커져요.'],
    ['변동금리 대출도 계산할 수 있나요?', '금리가 바뀔 때마다 남은 잔액과 남은 기간으로 새로 계산해야 합니다. 금리 변경 시점의 잔액을 대출금액으로, 남은 기간을 기간으로 넣어 다시 계산해보세요.'],
  ],
  related: ['percent-calculator', 'vat-calculator', 'date-calculator'],
};

const bmi = {
  slug: 'bmi-calculator',
  cat: 'calc',
  icon: '⚖️',
  name: 'BMI 계산기',
  short: '체질량지수와 정상 체중 범위',
  title: 'BMI 계산기 - 체질량지수, 정상 체중 범위 계산',
  h1: 'BMI 계산기',
  desc: '키와 몸무게로 체질량지수(BMI)를 계산하고 대한비만학회 기준 비만도와 키에 맞는 정상 체중 범위를 확인하세요.',
  lead: '키와 몸무게를 입력하면 BMI와 내 키의 정상 체중 범위를 알려드려요.',
  kw: 'BMI 계산기 체질량지수 비만도 정상 체중 표준 체중 비만 기준',
  scripts: ['calc.js'],
  body: `<section class="card" data-calc="bmi">
  <div class="row">
    <div class="field"><label>키 (cm)</label>${num('h', '예: 170', '키 센티미터')}</div>
    <div class="field"><label>몸무게 (kg)</label>${num('w', '예: 65', '몸무게 킬로그램')}</div>
  </div>
  <dl class="out-list big">${out('BMI', 'bmi')}${out('비만도 분류', 'cat')}${out('정상 체중 범위', 'range')}</dl>
</section>`,
  guide: `<h3>대한비만학회 BMI 기준 (성인)</h3>
<table><thead><tr><th>BMI (kg/㎡)</th><th>분류</th></tr></thead><tbody>
<tr><td>18.5 미만</td><td>저체중</td></tr>
<tr><td>18.5 ~ 22.9</td><td>정상</td></tr>
<tr><td>23 ~ 24.9</td><td>비만 전단계(과체중)</td></tr>
<tr><td>25 ~ 29.9</td><td>1단계 비만</td></tr>
<tr><td>30 ~ 34.9</td><td>2단계 비만</td></tr>
<tr><td>35 이상</td><td>3단계 비만(고도비만)</td></tr>
</tbody></table>
<p>BMI = 몸무게(kg) ÷ 키(m)². 서구 기준(25 이상 과체중)보다 낮은 아시아-태평양 기준을 사용합니다.</p>
<p class="note">BMI는 근육량·체지방률·연령을 반영하지 못하는 간접 지표입니다. 근육량이 많은 사람은 높게, 마른 비만은 낮게 나올 수 있어요. 건강 상태 판단은 의료진과 상담하세요.</p>`,
  faq: [
    ['BMI 정상 범위는 얼마인가요?', '대한비만학회 기준 18.5 이상 23 미만이 정상입니다. 계산기 아래의 "정상 체중 범위"는 18.5~22.9에 해당하는 내 키의 몸무게입니다.'],
    ['어린이나 청소년에게도 쓸 수 있나요?', '성인 기준표입니다. 소아·청소년은 성별·연령별 성장도표 백분위로 평가하므로 이 결과를 그대로 적용하면 안 돼요.'],
  ],
  related: ['age-calculator', 'percent-calculator'],
};

/* ---------- 단위 변환기 ---------- */
const UNIT_PAGES = [
  {
    key: 'area', slug: 'area-converter', icon: '📐', name: '평 ㎡ 변환기', short: '평↔제곱미터(㎡) 면적 변환',
    title: '평 ㎡ 변환기 - 평수를 제곱미터로, 제곱미터를 평으로',
    h1: '평 ↔ ㎡ 변환기 (면적 단위 변환)',
    desc: '평을 제곱미터(㎡)로, 제곱미터를 평으로 바로 변환합니다. 아파트 평수 계산과 헥타르·에이커·제곱피트 면적 단위까지 지원합니다.',
    lead: '아파트 평수와 ㎡를 서로 바꿔보세요. 평·㎡·㎢·헥타르·에이커·제곱피트를 한 번에 환산합니다.',
    kw: '평 제곱미터 변환 평수 계산기 ㎡ 평 아파트 평수 면적 변환 헥타르 에이커',
    from: 'pyeong', to: 'm2', value: '30',
    quick: { from: 'pyeong', to: 'm2', values: [5, 10, 15, 20, 25, 30, 32, 34, 40, 50, 60, 100], head: ['평', '제곱미터(㎡)'] },
    guide: `<h3>평과 ㎡ 환산 기준</h3>
<ul>
<li><b>1평 = 약 3.3058㎡</b> (정확히는 400/121㎡)</li>
<li><b>1㎡ = 약 0.3025평</b></li>
<li>빠른 암산: ㎡에 0.3025를 곱하거나, 평에 3.3을 곱하면 대략 맞아요.</li>
</ul>
<p>아파트 광고의 "34평형"은 보통 공급면적 기준이고, 전용면적은 그보다 작습니다. 전용 84㎡는 약 25.4평이에요. 공급·전용·계약면적은 단지마다 다르니 청약 공고나 등기부의 ㎡ 표기를 확인하세요.</p>
<p class="note">평은 공식 서류에서 쓰지 않는 비법정 단위라 부동산 표기는 ㎡를 기준으로 합니다. 계약·신고 시에는 ㎡ 값을 사용하세요.</p>`,
    faq: [
      ['84㎡는 몇 평인가요?', '84 × 0.3025 ≈ 25.4평입니다. 보통 "34평형" 아파트의 전용면적이 84㎡ 안팎이에요(단지에 따라 다름).'],
      ['30평은 몇 ㎡인가요?', '30 × 3.3058 ≈ 99.17㎡입니다.'],
      ['평수 계산을 직접 하려면?', '평 → ㎡는 3.3058을 곱하고, ㎡ → 평은 0.3025를 곱하거나 3.3058로 나눕니다.'],
    ],
    related: ['length-converter', 'volume-converter'],
  },
  {
    key: 'length', slug: 'length-converter', icon: '📏', name: '길이 변환기', short: 'cm·m·인치·피트·마일 변환',
    title: '길이 변환기 - cm 인치, 미터 피트, km 마일 변환',
    h1: '길이 변환기',
    desc: 'cm↔인치, m↔피트, km↔마일, 자까지 길이 단위를 즉시 변환합니다. 모든 단위로 한꺼번에 환산한 표도 함께 보여드려요.',
    lead: '키(cm↔ft), 화면 크기(인치↔cm), 거리(km↔마일)를 빠르게 바꿔보세요.',
    kw: '길이 변환 cm 인치 변환 미터 피트 km 마일 야드 자 단위 환산',
    from: 'cm', to: 'in', value: '170',
    quick: { from: 'cm', to: 'in', values: [1, 5, 10, 15, 20, 30, 50, 100, 150, 170, 180, 200], head: ['센티미터(cm)', '인치(in)'] },
    guide: `<h3>자주 쓰는 길이 환산</h3>
<ul>
<li><b>1인치 = 2.54cm</b> (정확한 값), 1피트 = 12인치 = 30.48cm</li>
<li>1야드 = 91.44cm, 1마일 = 1.609344km, 1해리 = 1.852km</li>
<li>1자 ≈ 30.3cm (10/33m), 전통 길이 단위로 1피트와 거의 같아요.</li>
</ul>
<p>TV·모니터의 인치는 화면 대각선 길이입니다. 55인치는 약 139.7cm예요.</p>`,
    faq: [
      ['170cm는 몇 피트 몇 인치인가요?', '170cm ÷ 2.54 ≈ 66.9인치이고, 12인치 = 1피트이므로 약 5피트 6.9인치(5′7″)입니다.'],
      ['1마일은 몇 km인가요?', '정확히 1.609344km입니다. 대략 1.6배로 기억하면 편해요.'],
    ],
    related: ['area-converter', 'speed-converter', 'weight-converter'],
  },
  {
    key: 'weight', slug: 'weight-converter', icon: '🏋️', name: '무게 변환기', short: 'kg·g·lb·oz·돈 변환',
    title: '무게 변환기 - kg 파운드, g 온스, 돈 변환',
    h1: '무게 변환기',
    desc: 'kg↔파운드(lb), g↔온스(oz), 금 한 돈(3.75g)까지 무게 단위를 즉시 변환합니다.',
    lead: '체중(kg↔lb), 요리(g↔oz), 금 시세(돈↔g)에 필요한 환산을 한 번에 하세요.',
    kw: '무게 변환 kg 파운드 lb 변환 g 온스 oz 돈 냥 금 한돈 몇 그램',
    from: 'kg', to: 'lb', value: '70',
    quick: { from: 'kg', to: 'lb', values: [1, 5, 10, 20, 50, 60, 70, 80, 90, 100], head: ['킬로그램(kg)', '파운드(lb)'] },
    guide: `<h3>자주 쓰는 무게 환산</h3>
<ul>
<li><b>1kg ≈ 2.2046lb</b>, 1lb = 453.59237g</li>
<li>1oz = 28.3495g (요리·귀금속 온스는 별도 기준이 있을 수 있어요)</li>
<li><b>금 1돈 = 3.75g</b>, 1냥 = 10돈 = 37.5g</li>
</ul>`,
    faq: [
      ['금 한 돈은 몇 그램인가요?', '3.75g입니다. 10돈이 1냥(37.5g)이에요.'],
      ['70kg은 몇 파운드인가요?', '70 × 2.2046 ≈ 154.3lb입니다.'],
    ],
    related: ['length-converter', 'volume-converter', 'bmi-calculator'],
  },
  {
    key: 'temperature', slug: 'temperature-converter', icon: '🌡️', name: '온도 변환기', short: '섭씨·화씨·켈빈 변환',
    title: '온도 변환기 - 섭씨 화씨 변환, 켈빈 계산',
    h1: '온도 변환기 (섭씨 ↔ 화씨)',
    desc: '섭씨(℃), 화씨(℉), 켈빈(K) 온도를 서로 변환합니다. 공식과 자주 쓰는 온도 환산표도 함께 확인하세요.',
    lead: '해외 날씨, 오븐 온도, 체온을 섭씨와 화씨로 바로 바꿔보세요.',
    kw: '온도 변환 섭씨 화씨 변환 켈빈 ℃ ℉ 화씨 계산',
    from: 'c', to: 'f', value: '25',
    quick: { from: 'c', to: 'f', values: [-20, -10, 0, 10, 20, 25, 30, 37, 40, 100, 180, 200], head: ['섭씨(℃)', '화씨(℉)'] },
    guide: `<h3>온도 변환 공식</h3>
<ul>
<li><b>섭씨 → 화씨</b>: ℉ = ℃ × 9/5 + 32</li>
<li><b>화씨 → 섭씨</b>: ℃ = (℉ − 32) × 5/9</li>
<li><b>섭씨 → 켈빈</b>: K = ℃ + 273.15</li>
</ul>
<p>물이 어는점 0℃ = 32℉, 끓는점 100℃ = 212℉입니다. 체온 36.5℃는 97.7℉예요. 오븐 레시피의 350℉는 약 177℃입니다.</p>`,
    faq: [
      ['화씨 100도는 섭씨로 몇 도인가요?', '(100 − 32) × 5/9 ≈ 37.8℃입니다.'],
      ['섭씨와 화씨가 같아지는 온도가 있나요?', '−40도입니다. −40℃ = −40℉예요.'],
    ],
    related: ['length-converter', 'speed-converter'],
  },
  {
    key: 'volume', slug: 'volume-converter', icon: '🥛', name: '부피 변환기', short: 'L·mL·갤런·컵·되 변환',
    title: '부피 변환기 - 리터 갤런, mL 컵, 되 말 변환',
    h1: '부피 변환기',
    desc: '리터(L), 밀리리터(mL), 갤런, 컵, 티스푼, 되·말까지 부피와 용량 단위를 즉시 변환합니다.',
    lead: '요리 레시피의 컵·스푼, 주유량의 갤런, 쌀 한 되까지 부피 단위를 바꿔보세요.',
    kw: '부피 변환 리터 갤런 변환 mL 컵 변환 티스푼 테이블스푼 되 말 용량',
    from: 'l', to: 'gal', value: '10',
    quick: { from: 'l', to: 'gal', values: [1, 2, 3.785411784, 5, 10, 20, 40, 50, 100], head: ['리터(L)', '갤런(미국, gal)'] },
    guide: `<h3>자주 쓰는 부피 환산</h3>
<ul>
<li><b>1갤런(미국) = 3.785L</b>, 1쿼트 = 0.946L, 1파인트 = 0.473L</li>
<li>1컵(미국) ≈ 236.6mL, 1테이블스푼 ≈ 14.8mL, 1티스푼 ≈ 4.9mL</li>
<li>1되 ≈ 1.8L, 1말(10되) ≈ 18L</li>
</ul>
<p class="note">영국(Imperial) 갤런·파인트는 미국 단위와 값이 다릅니다. 이 변환기는 미국 단위 기준이에요. 한국 요리의 "1컵"은 200mL로 쓰는 경우가 많아 미국 컵(약 237mL)과 차이가 있습니다.</p>`,
    faq: [
      ['쌀 한 되는 몇 리터인가요?', '1되는 약 1.8039L입니다. 한 말은 10되로 약 18L예요.'],
      ['1갤런은 몇 리터인가요?', '미국 갤런 기준 약 3.785L입니다.'],
    ],
    related: ['weight-converter', 'length-converter'],
  },
  {
    key: 'speed', slug: 'speed-converter', icon: '🚗', name: '속도 변환기', short: 'km/h·m/s·mph·노트 변환',
    title: '속도 변환기 - km/h m/s 변환, 마일 노트 변환',
    h1: '속도 변환기',
    desc: 'km/h, m/s, mph, 노트(kn), ft/s 속도 단위를 즉시 변환합니다. 시속과 초속 환산표도 함께 제공해요.',
    lead: '자동차 속도(km/h↔mph), 풍속(m/s↔km/h), 선박(노트)까지 한 번에 바꿔보세요.',
    kw: '속도 변환 km/h m/s 변환 시속 초속 mph 노트 풍속 변환',
    from: 'kmh', to: 'mph', value: '100',
    quick: { from: 'kmh', to: 'mph', values: [10, 30, 50, 60, 80, 100, 110, 120, 150, 200], head: ['시속(km/h)', '마일/시(mph)'] },
    guide: `<h3>자주 쓰는 속도 환산</h3>
<ul>
<li><b>1m/s = 3.6km/h</b> (초속에 3.6을 곱하면 시속)</li>
<li>1mph = 1.609km/h, 1노트 = 1.852km/h</li>
<li>시속 100km는 약 62.1mph, 초속 약 27.8m입니다.</li>
</ul>`,
    faq: [
      ['초속 10m는 시속 몇 km인가요?', '10 × 3.6 = 36km/h입니다.'],
      ['1노트는 몇 km/h인가요?', '1해리(1.852km)를 1시간에 가는 속도로, 약 1.852km/h입니다.'],
    ],
    related: ['length-converter', 'temperature-converter'],
  },
  {
    key: 'data', slug: 'data-converter', icon: '💾', name: '데이터 용량 변환기', short: 'KB·MB·GB·TB 용량 변환',
    title: '데이터 용량 변환기 - KB MB GB TB 변환',
    h1: '데이터 용량 변환기',
    desc: '바이트, KB, MB, GB, TB, PB 데이터 용량 단위를 변환합니다. 1024 기준으로 계산하며 모든 단위 환산표를 함께 보여드려요.',
    lead: '파일 크기, 저장 공간, 전송량을 KB·MB·GB 단위로 바꿔보세요.',
    kw: '데이터 용량 변환 KB MB GB TB 바이트 변환 기가바이트 메가바이트 비트',
    from: 'gb', to: 'mb', value: '1',
    quick: { from: 'gb', to: 'mb', values: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512], head: ['기가바이트(GB)', '메가바이트(MB)'] },
    guide: `<h3>1024 기준 환산</h3>
<ul>
<li>1KB = 1,024B, 1MB = 1,024KB, 1GB = 1,024MB, 1TB = 1,024GB</li>
<li>1바이트 = 8비트</li>
</ul>
<p class="note">저장장치 제조사는 1GB를 1,000MB(10진수)로 표기하는 경우가 많아, 운영체제에서 보이는 용량이 표기 용량보다 작게 보입니다. 이 변환기는 컴퓨터가 쓰는 1024 기준이에요.</p>`,
    faq: [
      ['1GB는 몇 MB인가요?', '1,024MB입니다(1024 기준). 제조사 표기 방식(1,000MB)과는 다를 수 있어요.'],
      ['Mbps와 MB/s는 어떻게 다른가요?', '인터넷 속도의 Mbps는 초당 메가비트이고, MB/s는 초당 메가바이트입니다. 8로 나누면 MB/s예요. 예: 100Mbps ≈ 12.5MB/s.'],
    ],
    related: ['image-compressor', 'length-converter'],
  },
];

function quickTable(page) {
  const q = page.quick;
  const rows = q.values
    .map((v) => `<tr><td>${formatNumber(v)} ${CATEGORIES[page.key].units.find((u) => u.id === q.from).sym}</td><td>${formatNumber(convert(page.key, q.from, q.to, v))} ${CATEGORIES[page.key].units.find((u) => u.id === q.to).sym}</td></tr>`)
    .join('');
  return `<h3>${q.head[0]} → ${q.head[1]} 환산표</h3>
<table><thead><tr><th>${q.head[0]}</th><th>${q.head[1]}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function unitTool(p) {
  const cat = CATEGORIES[p.key];
  const cfg = { cat: p.key, special: !!cat.special, from: p.from, to: p.to, value: p.value, units: cat.units };
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  return {
    slug: p.slug, cat: 'convert', icon: p.icon, name: p.name, short: p.short, title: p.title, h1: p.h1, desc: p.desc, lead: p.lead, kw: p.kw,
    scripts: ['unit.js'],
    body: `<section class="card conv" aria-label="${p.name}">
  <div class="field"><label for="u-val">변환할 값</label><input class="in" id="u-val" type="text" inputmode="decimal" autocomplete="off"></div>
  <div class="conv-row">
    <div class="field"><label for="u-from">변환 전 단위</label><select id="u-from"></select></div>
    <button class="btn secondary swap" id="u-swap" type="button" aria-label="단위 서로 바꾸기">⇄</button>
    <div class="field"><label for="u-to">변환 후 단위</label><select id="u-to"></select></div>
  </div>
  <div class="big-result" id="u-result" aria-live="polite">-</div>
  <div class="btns" style="margin-top:0"><button class="btn secondary small" id="u-copy" type="button">결과 복사</button></div>
  <div id="u-msg" class="msg"></div>
  <h3 style="margin-top:6px">모든 단위로 환산</h3>
  <div class="table-wrap" style="margin-top:0"><table><thead><tr><th>단위</th><th>변환 값</th></tr></thead><tbody id="u-table"></tbody></table></div>
  <script type="application/json" id="units-data">${json}</script>
</section>`,
    guide: p.guide + quickTable(p),
    faq: p.faq,
    related: p.related,
  };
}

/* ---------- 텍스트 ---------- */
const charCounter = {
  slug: 'char-counter',
  cat: 'text',
  icon: '🔤',
  name: '글자수 세기',
  short: '공백 포함/제외·바이트·제한 글자수',
  title: '글자수 세기 - 공백 포함 제외, 바이트 계산, 자소서 글자수 세기',
  h1: '글자수 세기 (바이트 계산)',
  desc: '글을 붙여넣으면 공백 포함/제외 글자수, 한글 2바이트·UTF-8 바이트, 단어·줄 수를 바로 세어줍니다. 자소서 제한 글자수 확인에 편리해요.',
  lead: '자기소개서, 블로그, 리포트 글자수를 실시간으로 세어드려요. 제한 글자수를 정하면 남은 분량도 보여줍니다.',
  kw: '글자수 세기 글자 수 세기 바이트 계산 자소서 글자수 공백 제외 공백 포함 byte 카운터',
  scripts: ['charcount.js'],
  body: `<section class="card">
  <div class="field"><label for="cc-text">텍스트 입력</label>
    <textarea id="cc-text" placeholder="여기에 글을 붙여넣거나 입력하세요." spellcheck="false"></textarea></div>
  <div class="btns" style="margin-top:10px">
    <button class="btn secondary small" id="cc-copy" type="button">복사</button>
    <button class="btn secondary small" id="cc-trim" type="button">줄 끝 공백·빈 줄 정리</button>
    <button class="btn secondary small" id="cc-clear" type="button">지우기</button>
  </div>
  <div class="stat-grid" aria-live="polite">
    <div class="stat main"><b data-cc="withSpace">0</b><small>글자수 (공백 포함)</small></div>
    <div class="stat main"><b data-cc="noSpace">0</b><small>글자수 (공백 제외)</small></div>
    <div class="stat"><b data-cc="kBytes">0</b><small>바이트 (한글 2byte)</small></div>
    <div class="stat"><b data-cc="uBytes">0</b><small>바이트 (UTF-8, 한글 3byte)</small></div>
    <div class="stat"><b data-cc="words">0</b><small>단어 수</small></div>
    <div class="stat"><b data-cc="lines">0</b><small>줄 수</small></div>
    <div class="stat"><b data-cc="paras">0</b><small>문단 수</small></div>
  </div>
  <div class="limit">
    <div class="row">
      <div class="field" style="flex:1 1 140px"><label for="cc-limit">제한 글자수</label><input class="in" id="cc-limit" type="number" min="0" inputmode="numeric" placeholder="예: 1000"></div>
      <div class="field" style="flex:1 1 180px"><label for="cc-basis">기준</label><select id="cc-basis"><option value="withSpace">글자수 (공백 포함)</option><option value="noSpace">글자수 (공백 제외)</option><option value="kBytes">바이트 (한글 2byte)</option></select></div>
      <div class="field" style="flex:1 1 180px"><label for="cc-nl">줄바꿈 1번을</label><select id="cc-nl"><option value="1">1자로 계산</option><option value="2">2자로 계산 (\\r\\n)</option><option value="0">계산 안 함</option></select></div>
    </div>
    <div class="seg" style="margin-top:10px">${[300, 500, 700, 1000, 1500, 2000].map((n) => `<button class="btn secondary small" type="button" data-limit="${n}">${n.toLocaleString('ko-KR')}</button>`).join('')}</div>
    <div class="bar-track" aria-hidden="true"><div class="bar-fill" id="cc-bar"></div></div>
    <div class="hint" id="cc-limit-note" style="margin-top:6px" aria-live="polite"></div>
  </div>
  <p class="hint" style="margin-top:12px">🔒 입력한 글은 서버로 전송되지 않고, 이어서 작성할 수 있도록 이 브라우저에만 임시 저장돼요.</p>
</section>`,
  guide: `<h3>채용 사이트마다 글자수가 다른 이유</h3>
<ul>
<li><b>공백 포함 / 제외</b>: 사이트마다 기준이 달라요. 공고의 안내 문구(예: "공백 포함 1,000자")를 꼭 확인하세요.</li>
<li><b>바이트 기준</b>: 일부 입력창은 한글을 2바이트로 계산합니다(EUC-KR 방식). 1,000byte면 한글 약 500자예요. UTF-8 기준은 한글이 3바이트입니다.</li>
<li><b>줄바꿈</b>: 줄바꿈을 1자로 세는 곳, \\r\\n 2자로 세는 곳, 세지 않는 곳이 있어요. 제한 글자수 옵션에서 줄바꿈 계산 방식을 바꿔 확인해보세요.</li>
</ul>
<p class="note">최종 제출 전에는 반드시 해당 사이트의 입력창에서 한 번 더 확인하세요. 이모지나 특수문자는 사이트에 따라 다르게 계산될 수 있습니다.</p>`,
  faq: [
    ['한글 1글자는 몇 바이트인가요?', 'EUC-KR 방식(많은 국내 입력폼 기준)은 2바이트, UTF-8은 3바이트입니다. 영문·숫자·공백은 둘 다 1바이트예요.'],
    ['공백 제외 글자수에 줄바꿈도 빠지나요?', '네. 공백 제외는 스페이스·탭·줄바꿈 등 모든 공백 문자를 제외한 글자수입니다.'],
    ['입력한 내용이 저장되나요?', '서버로는 전송되지 않습니다. 새로고침해도 이어서 쓸 수 있게 이 브라우저(localStorage)에만 임시 저장되며, "지우기"를 누르면 삭제돼요. 공용 PC에서는 사용 후 지워주세요.'],
  ],
  related: ['pdf-merge', 'image-compressor'],
};

/* ---------- 이미지 ---------- */
const imgOptsFormat = (opts, def) => `<div class="field"><label for="img-format">저장 형식</label><select id="img-format">${opts}</select></div>`;
const qualityRow = (def) => `<div class="field" id="img-q-row"><label for="img-quality">품질 <b id="img-q-val">${def}</b></label><input id="img-quality" type="range" min="10" max="100" step="1" value="${def}"><span class="hint">JPG·WEBP에 적용돼요. 낮을수록 용량이 작아져요.</span></div>`;

function imageApp(mode, optionsHtml) {
  return `<div id="img-app" data-mode="${mode}">
  ${dz('img-zone', 'image/*', true, '이미지를 끌어다 놓거나 클릭해서 선택', 'JPG · PNG · WEBP · GIF · BMP · 여러 장 가능 (최대 50장)')}
  <div class="card opts" id="img-options" style="margin-top:14px"><h3>옵션</h3>${optionsHtml}</div>
  <div class="btns">
    <button class="btn" id="img-run" type="button" disabled>시작하기</button>
    <button class="btn secondary" id="img-zip" type="button" hidden>전체 ZIP으로 받기</button>
    <button class="btn ghost" id="img-clear" type="button" hidden>모두 지우기</button>
  </div>
  <div class="status" id="img-status" role="status" aria-live="polite"></div>
  <ul class="file-list" id="img-list"></ul>
  ${privacyNote}
</div>`;
}

const imgResize = {
  slug: 'image-resizer',
  cat: 'image',
  icon: '📐',
  name: '이미지 크기 조절',
  short: '가로·세로 픽셀 또는 비율로 리사이즈',
  title: '이미지 크기 조절 - 사진 리사이즈, 픽셀 줄이기 (무료·업로드 없음)',
  h1: '이미지 크기 조절 (리사이즈)',
  desc: '사진과 이미지의 가로·세로 크기를 픽셀 또는 비율로 줄이고 늘립니다. 서버 업로드 없이 브라우저에서 처리되어 안전해요.',
  lead: '원하는 픽셀 크기나 비율로 이미지를 바로 줄여보세요. 여러 장도 한 번에 처리됩니다.',
  kw: '이미지 크기 조절 사진 리사이즈 이미지 픽셀 줄이기 사진 크기 변경 가로 세로',
  scripts: ['image.js'],
  body: imageApp('resize', `
    <div class="row">
      <div class="field"><label for="rs-mode">크기 지정 방식</label><select id="rs-mode"><option value="px">픽셀(px)</option><option value="percent">비율(%)</option></select></div>
      <div class="field" data-rs="px"><label for="rs-w">가로 (px)</label><input class="in" id="rs-w" type="text" inputmode="numeric" placeholder="예: 1280"></div>
      <div class="field" data-rs="px"><label for="rs-h">세로 (px)</label><input class="in" id="rs-h" type="text" inputmode="numeric" placeholder="비워두면 자동"></div>
      <div class="field" data-rs="pct" hidden><label for="rs-pct">비율 (%)</label><input class="in" id="rs-pct" type="text" inputmode="numeric" value="50"></div>
    </div>
    <p style="margin:12px 0" data-rs="px"><label class="check"><input type="checkbox" id="rs-keep" checked> 가로세로 비율 유지</label></p>
    <div class="row">
      ${imgOptsFormat('<option value="original">원본 형식 유지</option><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WEBP</option>')}
      ${qualityRow(90)}
    </div>`),
  guide: `<h3>사용 방법</h3>
<ol>
<li>이미지를 끌어다 놓거나 선택합니다. 여러 장을 한꺼번에 올려도 돼요.</li>
<li>가로·세로 픽셀(또는 비율)을 입력합니다. 한쪽만 입력하면 비율에 맞춰 나머지가 자동 계산돼요.</li>
<li>"시작하기"를 누르면 결과가 목록에 표시되고, 개별 다운로드 또는 ZIP으로 받을 수 있어요.</li>
</ol>
<p class="note">가로·세로를 모두 입력하고 비율 유지를 켜면, 두 값 안에 들어가는 가장 큰 크기로 맞춰집니다. 이미지가 너무 크면(한 변 16,000px 초과) 브라우저 한계로 처리할 수 없어요.</p>`,
  faq: [
    ['업로드한 사진이 서버에 저장되나요?', '아니요. 이미지는 내 기기의 브라우저 안에서만 처리되고 어디로도 전송되지 않습니다.'],
    ['이미지를 키워도 화질이 유지되나요?', '확대하면 원본에 없는 정보를 만들 수 없어 흐려집니다. 줄이는 용도에 가장 적합해요.'],
    ['휴대폰 사진 방향이 돌아가 있지 않나요?', '사진에 저장된 회전 정보(EXIF)를 반영해 올바른 방향으로 저장합니다.'],
  ],
  related: ['image-compressor', 'image-converter', 'image-to-pdf'],
};

const imgCompress = {
  slug: 'image-compressor',
  cat: 'image',
  icon: '🗜️',
  name: '이미지 용량 줄이기',
  short: 'JPG·PNG·WEBP 이미지 압축',
  title: '이미지 용량 줄이기 - JPG PNG 이미지 압축 (무료·업로드 없음)',
  h1: '이미지 압축 (용량 줄이기)',
  desc: '사진 용량을 품질 슬라이더로 줄여보세요. JPG, PNG, WEBP를 서버 업로드 없이 브라우저에서 압축하고 줄어든 용량을 바로 확인합니다.',
  lead: '이메일 첨부, 블로그 업로드, 지원서 제출 용량 제한에 맞게 이미지 용량을 줄여보세요.',
  kw: '이미지 압축 용량 줄이기 사진 용량 줄이기 jpg 압축 png 압축 이미지 최적화 kb 줄이기',
  scripts: ['image.js'],
  body: imageApp('compress', `
    <div class="row">
      ${imgOptsFormat('<option value="jpeg">JPG (용량 절감 효과 큼)</option><option value="webp">WEBP (더 작음)</option><option value="original">원본 형식 유지</option>')}
      ${qualityRow(75)}
      <div class="field"><label for="cp-maxw">최대 가로 크기 (px, 선택)</label><input class="in" id="cp-maxw" type="text" inputmode="numeric" placeholder="예: 1920 — 더 크면 줄임"></div>
    </div>
    <p class="hint" style="margin-top:10px">PNG는 무손실 형식이라 품질 설정으로 용량이 줄지 않아요. 용량을 크게 줄이려면 JPG나 WEBP로 저장하거나 최대 가로 크기를 지정하세요. 투명 배경이 있는 이미지는 JPG로 저장하면 흰 배경이 됩니다.</p>`),
  guide: `<h3>용량을 효과적으로 줄이는 방법</h3>
<ul>
<li><b>품질 70~80</b>: 눈에 띄는 화질 저하 없이 용량이 크게 줄어드는 구간입니다.</li>
<li><b>가로 크기 줄이기</b>: 스마트폰 사진(4000px 이상)을 1920px 정도로 줄이면 용량이 가장 크게 줄어요.</li>
<li><b>WEBP</b>: 같은 화질에서 JPG보다 작지만, 일부 오래된 프로그램에서는 열리지 않을 수 있어요.</li>
</ul>
<p class="note">이미 충분히 압축된 이미지는 다시 압축해도 오히려 커질 수 있어요. 이 경우 원본을 그대로 유지하고 안내해드립니다.</p>`,
  faq: [
    ['압축하면 화질이 많이 나빠지나요?', '품질 75 안팎이면 일반적인 화면에서는 차이를 거의 느끼기 어렵습니다. 결과를 확인하면서 품질을 조절해보세요.'],
    ['용량 제한(예: 500KB)에 맞추려면?', '품질을 낮추거나 최대 가로 크기를 줄여가며 결과 용량을 확인하세요. 같은 이미지는 여러 번 다시 실행해도 원본 기준으로 처리돼요.'],
    ['여러 장을 한 번에 압축할 수 있나요?', '네, 최대 50장까지 한 번에 올리고 ZIP 파일로 한꺼번에 받을 수 있어요.'],
  ],
  related: ['image-resizer', 'image-converter', 'image-to-pdf'],
};

const imgConvert = {
  slug: 'image-converter',
  cat: 'image',
  icon: '🔁',
  name: '이미지 포맷 변환',
  short: 'PNG ↔ JPG ↔ WEBP 변환',
  title: '이미지 포맷 변환 - PNG JPG WEBP 변환 (무료·업로드 없음)',
  h1: '이미지 포맷 변환 (PNG · JPG · WEBP)',
  desc: 'PNG를 JPG로, WEBP를 JPG로, JPG를 PNG로 간단히 변환합니다. 파일은 서버로 올라가지 않고 브라우저에서만 처리돼요.',
  lead: 'WEBP를 열 수 없거나 PNG를 JPG로 바꿔야 할 때, 파일을 올리고 형식만 고르세요.',
  kw: '이미지 변환 png jpg 변환 webp jpg 변환 jpg png 변환 이미지 포맷 변환 파일 형식',
  scripts: ['image.js'],
  body: imageApp('convert', `
    <div class="row">
      ${imgOptsFormat('<option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WEBP</option>')}
      ${qualityRow(90)}
      <div class="field" id="cv-bg-row"><label for="cv-bg">투명 영역 배경색 (JPG)</label><input class="in" id="cv-bg" type="color" value="#ffffff" style="height:46px;padding:4px"></div>
    </div>`),
  guide: `<h3>어떤 형식을 고를까요?</h3>
<ul>
<li><b>JPG</b>: 사진에 적합하고 용량이 작아요. 투명 배경은 지원하지 않아 지정한 배경색으로 채워집니다.</li>
<li><b>PNG</b>: 로고·캡처 화면·투명 배경에 적합하지만 사진은 용량이 커집니다.</li>
<li><b>WEBP</b>: 웹용으로 JPG·PNG보다 작은 용량을 제공하며 투명도도 지원해요.</li>
</ul>
<p class="note">GIF 애니메이션은 첫 프레임만 변환됩니다. HEIC(아이폰 원본) 등 브라우저가 열지 못하는 형식은 변환할 수 없어요.</p>`,
  faq: [
    ['PNG를 JPG로 바꾸면 투명 배경은 어떻게 되나요?', 'JPG에는 투명도가 없어서 옵션에서 고른 배경색(기본 흰색)으로 채워집니다.'],
    ['변환하면 화질이 떨어지나요?', 'JPG·WEBP는 손실 압축이므로 품질 설정에 따라 약간의 손실이 생기고, PNG로 저장하면 손실이 없습니다.'],
  ],
  related: ['image-compressor', 'image-resizer', 'image-to-pdf'],
};

/* ---------- PDF ---------- */
const pdfMerge = {
  slug: 'pdf-merge',
  cat: 'pdf',
  icon: '🧷',
  name: 'PDF 합치기',
  short: '여러 PDF를 하나로 병합',
  title: 'PDF 합치기 - PDF 병합, 여러 파일을 하나로 (무료·업로드 없음)',
  h1: 'PDF 합치기 (병합)',
  desc: '여러 개의 PDF 파일을 순서대로 하나로 합칩니다. 서버로 업로드하지 않고 브라우저에서만 처리되어 안전해요.',
  lead: '이력서·포트폴리오·증빙서류처럼 따로 있는 PDF를 순서를 맞춰 한 파일로 합쳐보세요.',
  kw: 'PDF 합치기 PDF 병합 pdf 합치는 법 pdf 하나로 여러 pdf 합치기',
  needsPdfLib: true,
  scripts: ['pdf-merge.js'],
  body: `<div id="pdf-merge">
  ${dz('pm-zone', 'application/pdf,.pdf', true, 'PDF 파일을 끌어다 놓거나 클릭해서 선택', '2개 이상 선택하면 합칠 수 있어요')}
  <ul class="file-list" id="pm-list"></ul>
  <div class="btns"><button class="btn" id="pm-run" type="button" disabled>PDF 합치기</button><button class="btn ghost" id="pm-clear" type="button" hidden>모두 지우기</button></div>
  <div class="status" id="pm-status" role="status" aria-live="polite"></div>
  ${privacyNote}
</div>`,
  guide: `<h3>사용 방법</h3>
<ol>
<li>합칠 PDF 파일을 모두 올립니다.</li>
<li>↑ ↓ 버튼으로 합쳐질 순서를 정합니다. 목록 위에서부터 차례로 이어붙어요.</li>
<li>"PDF 합치기"를 누르면 merged.pdf가 저장됩니다.</li>
</ol>
<p class="note">암호가 걸린 PDF는 합칠 수 없습니다. 먼저 암호를 해제한 파일을 사용하세요. 대용량 파일은 기기 메모리에 따라 처리 시간이 걸릴 수 있어요.</p>`,
  faq: [
    ['제 파일이 서버에 업로드되나요?', '아니요. 파일은 내 브라우저 안에서만 읽고 합쳐지며 외부로 전송되지 않습니다. 이력서나 증빙서류처럼 개인정보가 담긴 파일도 안심하고 쓸 수 있어요.'],
    ['합친 PDF에서 북마크나 링크는 유지되나요?', '페이지 내용은 그대로 복사되지만 문서 전체의 북마크(목차)는 유지되지 않을 수 있어요.'],
    ['한 번에 몇 개까지 합칠 수 있나요?', '개수 제한은 없지만 기기 메모리에 따라 한계가 있어요. 합친 총 용량이 수백 MB를 넘으면 나눠서 진행하세요.'],
  ],
  related: ['pdf-split', 'image-to-pdf', 'image-compressor'],
};

const pdfSplit = {
  slug: 'pdf-split',
  cat: 'pdf',
  icon: '✂️',
  name: 'PDF 나누기 · 페이지 추출',
  short: '원하는 페이지만 추출하거나 분할',
  title: 'PDF 나누기 - PDF 페이지 추출, 분할, 특정 페이지 삭제 (무료)',
  h1: 'PDF 나누기 · 페이지 추출',
  desc: 'PDF에서 원하는 페이지만 뽑아내거나 일부 페이지를 제외하고, 한 페이지씩 또는 N쪽씩 나눠 ZIP으로 저장합니다. 업로드 없이 브라우저에서 처리돼요.',
  lead: '큰 PDF에서 필요한 페이지만 골라 새 파일로 저장하거나, 페이지별로 분할해보세요.',
  kw: 'PDF 나누기 PDF 분할 PDF 페이지 추출 PDF 페이지 삭제 pdf 자르기 특정 페이지',
  needsPdfLib: true,
  scripts: ['pdf-split.js'],
  body: `<div id="pdf-split">
  ${dz('ps-zone', 'application/pdf,.pdf', false, 'PDF 파일을 끌어다 놓거나 클릭해서 선택', '파일 1개')}
  <div class="status" id="ps-info" hidden style="color:var(--text)"></div>
  <div class="card opts" id="ps-options" hidden>
    <div class="seg" role="radiogroup" aria-label="나누는 방식">
      <label><input type="radio" name="ps-mode" value="extract" checked> 페이지 추출</label>
      <label><input type="radio" name="ps-mode" value="each"> 한 페이지씩 분할 (ZIP)</label>
      <label><input type="radio" name="ps-mode" value="chunk"> N쪽씩 분할 (ZIP)</label>
    </div>
    <div data-ps="extract" style="margin-top:14px">
      <div class="field"><label for="ps-range">추출할 페이지</label><input class="in" id="ps-range" type="text" placeholder="예: 1-3, 5, 8-10"><span class="hint">쉼표로 구분하고, 입력한 순서대로 새 PDF가 만들어져요 (예: 3,1,2)</span></div>
      <p style="margin:12px 0 0"><label class="check"><input type="checkbox" id="ps-invert"> 입력한 페이지를 <b>제외</b>하고 나머지를 추출 (페이지 삭제)</label></p>
    </div>
    <div data-ps="chunk" hidden style="margin-top:14px"><div class="field" style="max-width:200px"><label for="ps-chunk">몇 쪽씩 나눌까요?</label><input class="in" id="ps-chunk" type="text" inputmode="numeric" value="10"></div></div>
    <div class="btns"><button class="btn" id="ps-run" type="button">실행</button></div>
  </div>
  <div class="status" id="ps-status" role="status" aria-live="polite"></div>
  ${privacyNote}
</div>`,
  guide: `<h3>세 가지 모드</h3>
<ul>
<li><b>페이지 추출</b>: "1-3, 5"처럼 입력한 페이지만 모아 하나의 PDF로 저장합니다. 제외 옵션을 켜면 해당 페이지가 삭제된 PDF가 만들어져요.</li>
<li><b>한 페이지씩 분할</b>: 모든 페이지를 개별 PDF로 만들어 ZIP 파일로 받습니다.</li>
<li><b>N쪽씩 분할</b>: 10쪽씩처럼 일정한 분량으로 나누어 ZIP으로 받습니다.</li>
</ul>
<p class="note">암호가 걸린 PDF는 처리할 수 없습니다. 페이지 번호는 1부터 시작하는 PDF 뷰어의 쪽 번호 기준이에요.</p>`,
  faq: [
    ['특정 페이지만 삭제하려면?', '"페이지 추출" 모드에서 삭제할 페이지 번호를 입력하고 "제외하고 나머지를 추출"을 체크하세요.'],
    ['페이지 순서를 바꿀 수도 있나요?', '추출 모드에서 3,1,2처럼 원하는 순서대로 입력하면 그 순서로 새 PDF가 만들어집니다.'],
  ],
  related: ['pdf-merge', 'image-to-pdf'],
};

const imageToPdf = {
  slug: 'image-to-pdf',
  cat: 'pdf',
  icon: '🖼️',
  name: '이미지를 PDF로',
  short: 'JPG·PNG 여러 장을 PDF 한 파일로',
  title: '이미지 PDF 변환 - JPG PNG 사진을 PDF로 합치기 (무료·업로드 없음)',
  h1: '이미지를 PDF로 변환',
  desc: 'JPG, PNG 등 사진 여러 장을 순서대로 하나의 PDF 파일로 변환합니다. A4·Letter 용지 맞춤과 여백 설정을 지원하며 업로드 없이 처리돼요.',
  lead: '스캔한 서류나 사진 여러 장을 용지 크기에 맞춰 한 개의 PDF로 만들어보세요.',
  kw: '이미지 PDF 변환 jpg pdf 변환 사진 pdf 만들기 png pdf 변환 이미지 합치기 스캔 서류 pdf',
  needsPdfLib: true,
  scripts: ['image-to-pdf.js'],
  body: `<div id="image-to-pdf">
  ${dz('ip-zone', 'image/*', true, '이미지를 끌어다 놓거나 클릭해서 선택', 'JPG · PNG · WEBP 등 여러 장 가능')}
  <div class="card opts" style="margin-top:14px"><h3>옵션</h3>
    <div class="row">
      <div class="field"><label for="ip-size">페이지 크기</label><select id="ip-size"><option value="a4">A4</option><option value="letter">Letter</option><option value="fit">이미지 크기에 맞춤</option></select></div>
      <div class="field" id="ip-orient-row"><label for="ip-orient">방향</label><select id="ip-orient"><option value="auto">이미지에 맞춰 자동</option><option value="portrait">세로</option><option value="landscape">가로</option></select></div>
      <div class="field"><label for="ip-margin">여백</label><select id="ip-margin"><option value="0">없음</option><option value="10" selected>10mm</option><option value="20">20mm</option></select></div>
    </div>
  </div>
  <ul class="file-list" id="ip-list"></ul>
  <div class="btns"><button class="btn" id="ip-run" type="button" disabled>PDF 만들기</button><button class="btn ghost" id="ip-clear" type="button" hidden>모두 지우기</button></div>
  <div class="status" id="ip-status" role="status" aria-live="polite"></div>
  ${privacyNote}
</div>`,
  guide: `<h3>사용 방법</h3>
<ol>
<li>PDF에 넣을 이미지를 올리고, ↑ ↓ 버튼으로 페이지 순서를 정합니다.</li>
<li>페이지 크기·방향·여백을 고릅니다. A4 용지에서는 이미지가 비율을 유지한 채 용지 안에 가운데 맞춤됩니다.</li>
<li>"PDF 만들기"를 누르면 images.pdf가 저장됩니다.</li>
</ol>
<p class="note">사진은 용량을 위해 긴 변이 5,000px을 넘으면 줄여서 넣고, 스마트폰 사진의 회전 정보도 반영합니다. 결과 PDF가 너무 크면 이미지 압축 도구로 먼저 용량을 줄여보세요.</p>`,
  faq: [
    ['여러 장의 사진을 한 PDF로 만들 수 있나요?', '네. 올린 순서(↑ ↓로 변경 가능)대로 한 장당 한 페이지로 들어갑니다.'],
    ['PDF 용량이 너무 커요.', '원본 사진 해상도가 높으면 PDF도 커집니다. 이미지 압축 도구로 먼저 줄인 뒤 변환하세요.'],
  ],
  related: ['pdf-merge', 'pdf-split', 'image-compressor'],
};

export const TOOLS = [
  percent, vat, dateCalc, dday, age, loan, bmi,
  ...UNIT_PAGES.map(unitTool),
  charCounter,
  imgResize, imgCompress, imgConvert,
  pdfMerge, pdfSplit, imageToPdf,
];
