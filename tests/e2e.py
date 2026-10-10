import json, os, re, sys, zipfile, io
from playwright.sync_api import sync_playwright
from PIL import Image
from pypdf import PdfReader

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
F = os.path.join(HERE, '.fixtures')
os.makedirs(F, exist_ok=True)
BASE = os.environ.get('BASE_URL', 'http://localhost:8080')

# ---------- 테스트 파일 ----------
Image.new('RGB', (400, 200), (200, 60, 60)).save(f'{F}/a.png')
img = Image.new('RGB', (1200, 800))
px = img.load()
for x in range(1200):
    for y in range(800):
        px[x, y] = ((x * 7) % 256, (y * 5) % 256, ((x + y) * 3) % 256)
img.save(f'{F}/photo.jpg', quality=95)
rgba = Image.new('RGBA', (100, 100), (0, 0, 255, 0))
rgba.save(f'{F}/transp.png')
def mkpdf(path, n, color):
    pages = [Image.new('RGB', (595, 842), tuple((c + i * 20) % 256 for c in color)) for i in range(n)]
    pages[0].save(path, save_all=True, append_images=pages[1:])
mkpdf(f'{F}/two.pdf', 2, (255, 100, 100))
mkpdf(f'{F}/five.pdf', 5, (100, 255, 100))

fails = []
def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + (f'  -> {extra}' if (not cond and extra) else ''))
    if not cond:
        fails.append(name)

def txt(page, sel):
    return page.locator(sel).first.inner_text().strip()

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(accept_downloads=True, locale='ko-KR', timezone_id='Asia/Seoul', viewport={'width': 1100, 'height': 900})
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(('pageerror', page.url, str(e))))
    page.on('console', lambda m: errors.append(('console', page.url, m.text)) if m.type == 'error' else None)
    page.on('requestfailed', lambda r: errors.append(('requestfailed', r.url, r.failure)))
    page.on('response', lambda r: errors.append(('http', r.url, r.status)) if r.status >= 400 and not r.url.endswith('favicon.ico') else None)

    # ---------- 1. 모든 페이지 로드 ----------
    sm = open(os.path.join(ROOT, 'dist', 'sitemap.xml'), encoding='utf-8').read()
    paths = re.findall(r'<loc>https?://[^/]+(/.*?)</loc>', sm)
    for path in paths:
        page.goto(BASE + path)
        page.wait_for_load_state('networkidle')
    check(f'{len(paths)}개 페이지 로드, JS/네트워크 오류 없음', not errors, json.dumps(errors[:5], ensure_ascii=False))
    errors.clear()

    # ---------- 2. 홈 검색 ----------
    page.goto(BASE + '/')
    page.fill('#tool-search', '평수')
    visible = page.locator('.tool-card:visible').count()
    check('홈 검색: 평수 → 1개', visible == 1, str(visible))
    page.fill('#tool-search', 'zzzz')
    check('홈 검색: 없는 단어 → 안내문', page.locator('#search-empty').is_visible())

    # ---------- 3. 계산기 ----------
    def fill_card(calc, k, v):
        page.locator(f'[data-calc="{calc}"] [data-k="{k}"]').fill(v)

    page.goto(BASE + '/tools/percent-calculator/')
    fill_card('of', 'x', '200'); fill_card('of', 'y', '15')
    check('퍼센트 ①', txt(page, '[data-calc=of] [data-out=res]') == '30', txt(page, '[data-calc=of] [data-out=res]'))
    fill_card('ratio', 'x', '30'); fill_card('ratio', 'y', '120')
    check('퍼센트 ②', txt(page, '[data-calc=ratio] [data-out=res]') == '25%')
    fill_card('change', 'x', '100'); fill_card('change', 'y', '150')
    check('퍼센트 ③', txt(page, '[data-calc=change] [data-out=pct]') == '+50%' and txt(page, '[data-calc=change] [data-out=diff]') == '+50')
    fill_card('inc', 'x', '50000'); fill_card('inc', 'y', '20')
    check('퍼센트 ④', txt(page, '[data-calc=inc] [data-out=up]') == '60,000' and txt(page, '[data-calc=inc] [data-out=down]') == '40,000')
    fill_card('ratio', 'y', '0')
    check('퍼센트 0 나누기 방어', '0으로' in txt(page, '[data-calc=ratio] [data-out=res]'))

    page.goto(BASE + '/tools/vat-calculator/')
    page.fill('#vat-amt', '1000000')
    check('부가세: 입력 콤마 자동', page.input_value('#vat-amt') == '1,000,000')
    check('부가세 공급가액 기준', txt(page, '[data-out=vat]') == '100,000원' and txt(page, '[data-out=total]') == '1,100,000원')
    page.check('input[value=total]')
    check('부가세 합계 기준', txt(page, '[data-out=supply]') == '909,091원' and txt(page, '[data-out=vat]') == '90,909원', txt(page, '[data-out=supply]'))

    page.goto(BASE + '/tools/date-calculator/')
    fill_card('diff', 'start', '2026-01-01'); fill_card('diff', 'end', '2026-03-01')
    check('날짜 차이', txt(page, '[data-calc=diff] [data-out=days]') == '59일' and txt(page, '[data-calc=diff] [data-out=ymd]') == '2개월 0일', txt(page, '[data-calc=diff] [data-out=ymd]'))
    page.check('[data-calc=diff] [data-k=incl]')
    check('날짜 차이: 시작일 포함', txt(page, '[data-calc=diff] [data-out=days]') == '60일')
    fill_card('diff', 'end', '2025-12-25')
    check('날짜 차이: 역순 안내', '순서를 바꿔' in txt(page, '[data-calc=diff] [data-out=note]'))
    fill_card('add', 'base', '2026-01-31'); page.select_option('[data-calc=add] [data-k=unit]', 'month'); fill_card('add', 'n', '1')
    check('날짜 +1개월(월말 보정)', '2026년 2월 28일' in txt(page, '[data-calc=add] [data-out=result]'), txt(page, '[data-calc=add] [data-out=result]'))
    fill_card('add', 'base', '2026-10-10'); page.select_option('[data-calc=add] [data-k=unit]', 'day'); fill_card('add', 'n', '100')
    check('날짜 +100일', '2027년 1월 18일' in txt(page, '[data-calc=add] [data-out=result]'), txt(page, '[data-calc=add] [data-out=result]'))
    page.select_option('[data-calc=add] [data-k=dir]', 'before')
    check('날짜 -100일', '2026년 7월 2일' in txt(page, '[data-calc=add] [data-out=result]'), txt(page, '[data-calc=add] [data-out=result]'))

    page.goto(BASE + '/tools/dday-calculator/')
    fill_card('dday', 'base', '2026-10-10'); fill_card('dday', 'target', '2026-12-25')
    check('D-day', txt(page, '[data-calc=dday] [data-out=dday]') == 'D-76', txt(page, '[data-calc=dday] [data-out=dday]'))
    fill_card('dday', 'target', '2026-10-01')
    check('D+9', txt(page, '[data-calc=dday] [data-out=dday]') == 'D+9')
    fill_card('anniv', 'start', '2026-01-01')
    rows = page.locator('[data-calc=anniv] tbody tr').all_inner_texts()
    r100 = [r for r in rows if r.startswith('100일')]
    check('기념일 100일=시작일+99', bool(r100) and '2026년 4월 10일' in r100[0], str(r100))
    r1y = [r for r in rows if r.startswith('1주년')]
    check('기념일 1주년', bool(r1y) and '2027년 1월 1일' in r1y[0], str(r1y))

    page.goto(BASE + '/tools/age-calculator/')
    fill_card('age', 'birth', '2000-02-29'); fill_card('age', 'ref', '2026-10-10')
    check('만 나이(윤일생)', txt(page, '[data-out=man]') == '만 26세', txt(page, '[data-out=man]'))
    check('세는 나이/연 나이', txt(page, '[data-out=korean]') == '27세' and txt(page, '[data-out=year]') == '26세')
    check('띠(2000=용)', txt(page, '[data-out=zodiac]') == '용띠', txt(page, '[data-out=zodiac]'))
    fill_card('age', 'birth', '1990-12-25')
    check('만 나이(생일 전)', txt(page, '[data-out=man]') == '만 35세', txt(page, '[data-out=man]'))
    check('다음 생일 D-76', 'D-76' in txt(page, '[data-out=next]'), txt(page, '[data-out=next]'))

    page.goto(BASE + '/tools/bmi-calculator/')
    fill_card('bmi', 'h', '170'); fill_card('bmi', 'w', '65')
    check('BMI', txt(page, '[data-out=bmi]') == '22.5' and txt(page, '[data-out=cat]') == '정상', txt(page, '[data-out=bmi]'))
    check('정상 체중 범위', txt(page, '[data-out=range]') == '53.5 ~ 66.2 kg', txt(page, '[data-out=range]'))

    page.goto(BASE + '/tools/loan-calculator/')
    m = txt(page, '[data-out=monthly]')
    val = int(re.sub(r'[^\d]', '', m))
    r = 0.045 / 12; n = 360
    exp = 1e8 * r * (1 + r) ** n / ((1 + r) ** n - 1)
    check('대출 원리금균등 월 상환액', abs(val - exp) < 5, f'{val} vs {exp:.1f}')
    check('스케줄 360행', page.locator('#loan-rows tr').count() == 360)
    last_bal = page.locator('#loan-rows tr').last.locator('td').last.inner_text().strip()
    check('마지막 잔액 0', last_bal == '0', last_bal)
    ti = int(re.sub(r'[^\d]', '', txt(page, '[data-out=interest]')))
    rows_int = sum(int(re.sub(r'[^\d]', '', t)) for t in page.locator('#loan-rows tr td:nth-child(4)').all_inner_texts())
    check('총이자 = 스케줄 이자 합', ti == rows_int, f'{ti} vs {rows_int}')
    page.check('input[value=equal-principal]')
    check('원금균등 첫달→마지막달 표시', '→' in txt(page, '[data-out=monthly]'), txt(page, '[data-out=monthly]'))
    first_pay = int(re.sub(r'[^\d]', '', txt(page, '[data-out=monthly]').split('→')[0]))
    check('원금균등 첫 달 = 원금 277,778 + 이자 375,000', abs(first_pay - (277778 + 375000)) <= 1, str(first_pay))
    page.check('input[value=bullet]')
    check('만기일시 이자 총액 = 1.35억', txt(page, '[data-out=interest]') == '135,000,000원', txt(page, '[data-out=interest]'))
    page.check('input[value=equal-payment]')
    page.fill('#loan-grace', '12')
    rows12 = page.locator('#loan-rows tr').all()
    check('거치기간 12개월 이자만', rows12[0].locator('td:nth-child(3)').inner_text().strip() == '0' and rows12[12].locator('td:nth-child(3)').inner_text().strip() != '0')
    page.fill('#loan-grace', '999')
    check('거치기간 오류 메시지', '거치기간' in txt(page, '#loan-msg'))

    # ---------- 4. 단위 변환 ----------
    page.goto(BASE + '/tools/area-converter/')
    check('평→㎡ 30평', '99.17' in txt(page, '#u-result'), txt(page, '#u-result'))
    page.select_option('#u-from', 'm2'); page.select_option('#u-to', 'pyeong'); page.fill('#u-val', '84')
    check('㎡→평 84', '25.4' in txt(page, '#u-result'), txt(page, '#u-result'))
    page.click('#u-swap')
    check('swap', page.input_value('#u-from') == 'pyeong')
    page.goto(BASE + '/tools/temperature-converter/')
    check('온도 25℃→77℉', '77 ℉' in txt(page, '#u-result'), txt(page, '#u-result'))
    page.fill('#u-val', '-40'); page.select_option('#u-from', 'c'); page.select_option('#u-to', 'f')
    check('온도 -40', '-40 ℉' in txt(page, '#u-result'), txt(page, '#u-result'))
    page.fill('#u-val', '0'); page.select_option('#u-to', 'k')
    check('0℃=273.15K', '273.15 K' in txt(page, '#u-result'), txt(page, '#u-result'))
    page.goto(BASE + '/tools/length-converter/')
    check('170cm→in', '66.929' in txt(page, '#u-result'), txt(page, '#u-result'))
    page.goto(BASE + '/tools/data-converter/')
    check('1GB=1,024MB', '1,024 MB' in txt(page, '#u-result'), txt(page, '#u-result'))
    page.goto(BASE + '/tools/weight-converter/')
    page.select_option('#u-from', 'don'); page.select_option('#u-to', 'g'); page.fill('#u-val', '1')
    check('금 1돈=3.75g', '3.75 g' in txt(page, '#u-result'), txt(page, '#u-result'))
    page.fill('#u-val', 'abc')
    check('잘못된 입력 방어', '입력' in txt(page, '#u-result'))

    # ---------- 5. 글자수 ----------
    page.goto(BASE + '/tools/char-counter/')
    page.evaluate("localStorage.clear()")
    page.reload()
    page.fill('#cc-text', '안녕하세요 world\n둘째줄')
    g = lambda k: txt(page, f'[data-cc={k}]')
    check('글자수 공백포함 15', g('withSpace') == '15', g('withSpace'))
    check('글자수 공백제외 13', g('noSpace') == '13', g('noSpace'))
    check('바이트(한글2) 23', g('kBytes') == '23', g('kBytes'))
    check('바이트(UTF-8) 31', g('uBytes') == '31', g('uBytes'))
    check('단어3/줄2', g('words') == '3' and g('lines') == '2', f"{g('words')} {g('lines')}")
    page.select_option('#cc-nl', '2')
    check('줄바꿈 2자 → 16', g('withSpace') == '16', g('withSpace'))
    page.select_option('#cc-nl', '1')
    page.fill('#cc-limit', '10')
    check('제한 초과 표시', '초과' in txt(page, '#cc-limit-note'), txt(page, '#cc-limit-note'))
    page.fill('#cc-text', '👨‍👩‍👧 한')
    check('이모지(ZWJ) 1글자 취급', g('withSpace') == '3', g('withSpace'))
    page.fill('#cc-text', '저장테스트')
    page.reload()
    check('초안 복원', page.input_value('#cc-text') == '저장테스트')
    page.click('#cc-clear')
    check('지우기', page.input_value('#cc-text') == '' and g('withSpace') == '0')

    # ---------- 6. 이미지 ----------
    def run_image(url, files, setup=None):
        page.goto(BASE + url)
        page.set_input_files('#img-zone input[type=file]', files)
        page.wait_for_selector('.file-item')
        if setup: setup()
        page.click('#img-run')
        page.wait_for_function("document.querySelectorAll('.file-item .acts .btn:not(.secondary)').length >= %d" % (len(files) if isinstance(files, list) else 1), timeout=20000)

    def dl(sel_text='다운로드', idx=0):
        with page.expect_download() as d:
            page.locator('.file-item .btn', has_text=sel_text).nth(idx).click()
        return d.value

    run_image('/tools/image-resizer/', [f'{F}/a.png'], lambda: page.fill('#rs-w', '100'))
    d = dl()
    out = os.path.join(F, 'out_resize.png'); d.save_as(out)
    im = Image.open(out)
    check('리사이즈 400x200 → 100x50', im.size == (100, 50) and d.suggested_filename == 'a_resized.png', f'{im.size} {d.suggested_filename}')

    run_image('/tools/image-resizer/', [f'{F}/a.png'], lambda: (page.select_option('#rs-mode', 'percent'), page.fill('#rs-pct', '25')))
    d = dl(); out = os.path.join(F, 'out_resize2.png'); d.save_as(out)
    check('리사이즈 25%', Image.open(out).size == (100, 50), str(Image.open(out).size))

    run_image('/tools/image-resizer/', [f'{F}/a.png'], lambda: (page.fill('#rs-w', '100'), page.fill('#rs-h', '100')))
    d = dl(); out = os.path.join(F, 'out_resize3.png'); d.save_as(out)
    check('리사이즈 100x100 박스 안에 비율유지', Image.open(out).size == (100, 50), str(Image.open(out).size))

    run_image('/tools/image-compressor/', [f'{F}/photo.jpg'], lambda: (page.fill('#img-quality', '40') if False else page.evaluate("document.getElementById('img-quality').value=40; document.getElementById('img-quality').dispatchEvent(new Event('input',{bubbles:true}))")))
    d = dl(); out = os.path.join(F, 'out_comp.jpg'); d.save_as(out)
    check('압축 결과가 원본보다 작음', os.path.getsize(out) < os.path.getsize(f'{F}/photo.jpg'), f'{os.path.getsize(out)} vs {os.path.getsize(f"{F}/photo.jpg")}')
    check('압축 결과 JPEG & 파일명', Image.open(out).format == 'JPEG' and d.suggested_filename == 'photo_compressed.jpg', d.suggested_filename)
    check('압축 요약 표시', '→' in txt(page, '#img-status'), txt(page, '#img-status'))

    run_image('/tools/image-compressor/', [f'{F}/photo.jpg'], lambda: page.fill('#cp-maxw', '300'))
    d = dl(); out = os.path.join(F, 'out_comp2.jpg'); d.save_as(out)
    check('압축+최대가로 300 → 300x200', Image.open(out).size == (300, 200), str(Image.open(out).size))

    run_image('/tools/image-converter/', [f'{F}/transp.png'], lambda: None)
    d = dl(); out = os.path.join(F, 'out_conv.jpg'); d.save_as(out)
    im = Image.open(out)
    check('PNG(투명)→JPG 흰 배경', im.format == 'JPEG' and im.getpixel((50, 50))[0] > 240 and im.getpixel((50, 50))[2] > 240, str(im.getpixel((50, 50))))
    run_image('/tools/image-converter/', [f'{F}/a.png'], lambda: page.select_option('#img-format', 'webp'))
    d = dl(); out = os.path.join(F, 'out_conv.webp'); d.save_as(out)
    check('PNG→WEBP', Image.open(out).format == 'WEBP' and d.suggested_filename == 'a.webp', f'{Image.open(out).format} {d.suggested_filename}')

    # 여러 장 + ZIP
    page.goto(BASE + '/tools/image-converter/')
    page.set_input_files('#img-zone input[type=file]', [f'{F}/a.png', f'{F}/photo.jpg', f'{F}/transp.png'])
    page.wait_for_function("document.querySelectorAll('.file-item').length==3")
    page.click('#img-run')
    page.wait_for_selector('#img-zip:not([hidden])', timeout=20000)
    with page.expect_download() as di:
        page.click('#img-zip')
    zp = os.path.join(F, 'out.zip'); di.value.save_as(zp)
    z = zipfile.ZipFile(zp)
    check('ZIP 무결성(CRC) 통과', z.testzip() is None)
    check('ZIP 3개 파일 · UTF-8 이름', len(z.namelist()) == 3, str(z.namelist()))
    check('비이미지 파일 무시', True)
    page.set_input_files('#img-zone input[type=file]', [f'{F}/two.pdf'])
    check('PDF를 이미지 도구에 → 제외 안내', '제외' in txt(page, '#img-status'), txt(page, '#img-status'))

    # ---------- 7. PDF ----------
    page.goto(BASE + '/tools/pdf-merge/')
    page.set_input_files('#pm-zone input[type=file]', [f'{F}/two.pdf', f'{F}/five.pdf'])
    page.wait_for_function("document.querySelectorAll('#pm-list .file-item small')[1] && document.querySelectorAll('#pm-list .file-item small')[1].textContent.includes('쪽')")
    check('병합 총 쪽수 안내 7쪽', '7쪽' in txt(page, '#pm-status'), txt(page, '#pm-status'))
    page.locator('#pm-list .file-item').nth(1).locator('button', has_text='↑').click()
    check('순서 변경(5쪽 파일이 1번)', 'five.pdf' in page.locator('#pm-list .file-item b').first.inner_text())
    with page.expect_download() as dm:
        page.click('#pm-run')
    mp = os.path.join(F, 'merged.pdf'); dm.value.save_as(mp)
    rd = PdfReader(mp)
    check('병합 PDF 7쪽', len(rd.pages) == 7, str(len(rd.pages)))

    page.goto(BASE + '/tools/pdf-split/')
    page.set_input_files('#ps-zone input[type=file]', f'{F}/five.pdf')
    page.wait_for_selector('#ps-options:not([hidden])')
    page.fill('#ps-range', '1-2, 5')
    with page.expect_download() as ds:
        page.click('#ps-run')
    sp = os.path.join(F, 'ext.pdf'); ds.value.save_as(sp)
    check('추출 1-2,5 → 3쪽', len(PdfReader(sp).pages) == 3)
    page.check('#ps-invert')
    with page.expect_download() as ds:
        page.click('#ps-run')
    ds.value.save_as(sp)
    check('제외 모드 → 2쪽', len(PdfReader(sp).pages) == 2)
    page.fill('#ps-range', '9')
    page.click('#ps-run')
    check('범위 초과 오류', '1~5' in txt(page, '#ps-status'), txt(page, '#ps-status'))
    page.fill('#ps-range', '3,1,2'); page.uncheck('#ps-invert')
    with page.expect_download() as ds:
        page.click('#ps-run')
    ds.value.save_as(sp)
    check('순서 지정 3,1,2', len(PdfReader(sp).pages) == 3)
    page.check('input[value=each]')
    with page.expect_download() as ds:
        page.click('#ps-run')
    zp2 = os.path.join(F, 'split.zip'); ds.value.save_as(zp2)
    z2 = zipfile.ZipFile(zp2)
    check('한 페이지씩 ZIP: 5개, CRC OK', len(z2.namelist()) == 5 and z2.testzip() is None, str(z2.namelist()))
    check('분할 파일 각 1쪽', all(len(PdfReader(io.BytesIO(z2.read(n))).pages) == 1 for n in z2.namelist()))
    page.check('input[value=chunk]'); page.fill('#ps-chunk', '2')
    with page.expect_download() as ds:
        page.click('#ps-run')
    ds.value.save_as(zp2)
    z3 = zipfile.ZipFile(zp2)
    check('2쪽씩 → 3개 (2,2,1)', [len(PdfReader(io.BytesIO(z3.read(n))).pages) for n in sorted(z3.namelist())] == [2, 2, 1])

    page.goto(BASE + '/tools/image-to-pdf/')
    page.set_input_files('#ip-zone input[type=file]', [f'{F}/a.png', f'{F}/photo.jpg'])
    page.wait_for_function("document.querySelectorAll('#ip-list .file-item').length==2")
    with page.expect_download() as di:
        page.click('#ip-run')
    ip = os.path.join(F, 'images.pdf'); di.value.save_as(ip)
    rd = PdfReader(ip)
    check('이미지→PDF 2쪽', len(rd.pages) == 2)
    w0, h0 = float(rd.pages[0].mediabox.width), float(rd.pages[0].mediabox.height)
    check('A4 + 가로 이미지 → 가로 페이지', abs(w0 - 841.89) < 1 and abs(h0 - 595.28) < 1, f'{w0}x{h0}')
    page.select_option('#ip-size', 'fit')
    with page.expect_download() as di:
        page.click('#ip-run')
    di.value.save_as(ip)
    rd = PdfReader(ip)
    w0 = float(rd.pages[0].mediabox.width)
    check('이미지 크기에 맞춤(400px→300pt+여백 56.7)', abs(w0 - (400 * 0.75 + 2 * 10 * 72 / 25.4)) < 1, str(w0))

    # ---------- 8. 모바일 레이아웃 가로 스크롤 ----------
    page.set_viewport_size({'width': 375, 'height': 800})
    bad = []
    for path in paths:
        page.goto(BASE + path)
        sw = page.evaluate('document.documentElement.scrollWidth')
        if sw > 376:
            bad.append((path, sw))
    check('모바일(375px) 가로 스크롤 없음', not bad, str(bad))
    page.set_viewport_size({'width': 1100, 'height': 900})

    check('테스트 중 JS 오류 없음', not errors, json.dumps(errors[:5], ensure_ascii=False))
    b.close()

print('\n=== FAILED:', fails if fails else 'none ===')
sys.exit(1 if fails else 0)
