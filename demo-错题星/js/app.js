/* =====================================================
   错题星 · 作品集站点交互
   ===================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  /* ========== 移动端导航 ========== */
  var burger = $('burger'), nav = $('nav');
  burger.addEventListener('click', function () { nav.classList.toggle('open'); });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('open'); });
  });

  /* ========== 滚动高亮 + 返回顶部 ========== */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('[data-spy]'));
  var toTop = $('toTop');
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    toTop.classList.toggle('show', y > 600);
    var current = '';
    spyLinks.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec && sec.offsetTop - 130 <= y) current = a.getAttribute('href');
    });
    spyLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === current); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ========== 滚动浮现 ========== */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  /* ========== 教研效率条形图 ========== */
  function renderEff() {
    var wrap = $('effWrap');
    var html = '<div class="eff-row" style="border-top:1px dashed var(--line)">' +
      '<span class="eff-name" style="font-weight:700;color:var(--ink);flex:0 0 210px">教研环节</span>' +
      '<span class="eff-track" style="flex:1"></span>' +
      '<span class="eff-old" style="flex:0 0 84px;text-align:left;color:var(--muted)">传统</span>' +
      '<span class="eff-new" style="flex:0 0 96px;text-align:left;color:var(--teal-deep)">AI 辅助</span></div>';
    DEMO.eff.forEach(function (e) {
      html += '<div class="eff-row"><span class="eff-name">' + e.name + '</span>' +
        '<div class="eff-track"><span style="width:0%;background:linear-gradient(90deg,var(--teal),var(--amber))" data-w="' + e.pct + '"></span></div>' +
        '<span class="eff-old"><s>' + e.old + '</s></span>' +
        '<span class="eff-new">' + e.neu + '</span></div>';
    });
    wrap.innerHTML = html;
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.querySelectorAll('[data-w]').forEach(function (s) {
            s.style.width = s.getAttribute('data-w') + '%';
          });
          io2.unobserve(en.target);
        }
      });
    }, { threshold: 0.3 });
    io2.observe(wrap);
  }
  renderEff();

  /* ========== 小潘成绩折线图（SVG） ========== */
  function renderScore() {
    var el = $('scoreChart');
    var data = DEMO.score.points;
    var W = 560, H = 240, padL = 46, padR = 16, padT = 20, padB = 36;
    var x = function (i) { return padL + (W - padL - padR) * (i / (data.length - 1)); };
    var yS = function (v) { return padT + (H - padT - padB) * (1 - v / 100); };
    var yR = function (v) { return padT + (H - padT - padB) * (1 - v / 100); };
    var ptsS = data.map(function (d, i) { return x(i) + ',' + yS(d.s); }).join(' ');
    var ptsR = data.map(function (d, i) { return x(i) + ',' + yR(d.r); }).join(' ');

    var html = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="小潘化学成绩与同类题重错率变化">';
    for (var g = 0; g <= 4; g++) {
      var gy = padT + (H - padT - padB) * (g / 4);
      html += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="#E2EAE4" stroke-dasharray="3 5"/>';
      html += '<text x="' + (padL - 8) + '" y="' + (gy + 4) + '" text-anchor="end" class="chart-tip">' + (100 - g * 25) + '</text>';
    }
    data.forEach(function (d, i) {
      html += '<text x="' + x(i) + '" y="' + (H - 12) + '" text-anchor="middle" class="chart-tip">' + d.w + '</text>';
    });
    html += '<polyline points="' + ptsR + '" fill="none" stroke="#D64550" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>';
    html += '<polyline points="' + ptsS + '" fill="none" stroke="#0E7C6B" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>';
    data.forEach(function (d, i) {
      html += '<circle cx="' + x(i) + '" cy="' + yS(d.s) + '" r="5" fill="#fff" stroke="#0E7C6B" stroke-width="2.5" opacity="0"/>';
      html += '<text x="' + x(i) + '" y="' + (yS(d.s) - 11) + '" text-anchor="middle" class="chart-tip" style="font-weight:700;fill:#0A5F52" opacity="0">' + d.s + ' 分</text>';
      html += '<circle cx="' + x(i) + '" cy="' + yR(d.r) + '" r="3.5" fill="#fff" stroke="#D64550" stroke-width="2" opacity="0"/>';
    });
    html += '</svg>';
    el.innerHTML = html;

    var svg = el.querySelector('svg');
    var polys = svg.querySelectorAll('polyline');
    var deco = svg.querySelectorAll('circle, text');
    var io3 = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        setTimeout(function () {
          polys[0].style.transition = 'opacity .8s'; polys[0].style.opacity = 1;
          polys[1].style.transition = 'opacity .8s .2s'; polys[1].style.opacity = 1;
          deco.forEach(function (c, i) {
            c.style.transition = 'opacity .35s ' + (0.35 + i * 0.1) + 's';
            c.style.opacity = 1;
          });
        }, 120);
        io3.unobserve(el);
      }
    }, { threshold: 0.4 });
    io3.observe(el);
  }
  renderScore();
  /* =====================================================
     04 · 交互演示（手机屏 + 流程节点）
     ===================================================== */
  var TITLES = { 1: '拍照上传', 2: '识别与错因', 3: '漏洞报告', 4: '分层训练', 5: '智能复习' };
  var DESCS = {
    1: { t: 'STEP 1 · 拍照诊断', d: '选择一张演示错题，点击「拍照识别」，模拟 OCR 识别与 AI 自动标注（学科 / 考点 / 题型 / 难度）并推荐错因的过程。真实版本支持调用 DeepSeek 多模态能力识别照片。' },
    2: { t: 'STEP 2 · 漏洞分析', d: '同一知识点错题累计 ≥ 5 道时，系统自动跨题聚类，把错误率最高的子环节揪出来，并给出可操作的学习建议——而不是笼统地说「化学方程式不好」。' },
    3: { t: 'STEP 3 · 分层训练', d: '系统按「基础 · 中档 · 拔高」生成同类变式题（题库检索优先、AI 生成补充）。遮住答案先独立重做；做错的题自动回流错题本。' },
    4: { t: 'STEP 4 · 智能复习', d: '按遗忘曲线在第 1 / 3 / 7 / 15 天与考前提醒复习。遮住答案独立重做：做对延长间隔，做错缩短间隔并补同类题，连续 3 次做对标记「已掌握」。' }
  };

  var current = 'balance';
  var errSel = {};
  var trainIdx = 0;
  var step = 1;

  function flowOf(n) { return n <= 2 ? 1 : n - 1; }
  function phoneOf(f) { return f === 1 ? 1 : f + 1; }

  function pToast(msg) {
    var t = $('pToast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(pToast._t);
    pToast._t = setTimeout(function () { t.classList.remove('show'); }, 1900);
  }

  function setFlow(on) {
    document.querySelectorAll('.df').forEach(function (d) {
      d.classList.toggle('on', +d.getAttribute('data-step') === on);
    });
    var dc = DESCS[on];
    if (dc) {
      $('demoDescTitle').textContent = dc.t;
      $('demoDescText').textContent = dc.d;
    }
  }

  function showStep(n) {
    step = n;
    for (var i = 1; i <= 5; i++) {
      var st = $('st' + i);
      if (st) st.classList.remove('on');
    }
    var el = $('st' + n);
    if (el) el.classList.add('on');
    $('pStepNo').textContent = n + '/5';
    $('pTitle').textContent = TITLES[n] || '';
    setFlow(flowOf(n));
  }

  /* —— 流程节点点击 —— */
  document.querySelectorAll('.df').forEach(function (df) {
    df.addEventListener('click', function () {
      showStep(phoneOf(+this.getAttribute('data-step')));
    });
  });

  /* —— 样本选择 —— */
  var sampBtns = document.querySelectorAll('.sample-btn');
  sampBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      sampBtns.forEach(function (x) { x.classList.remove('sel'); });
      b.classList.add('sel');
      current = b.getAttribute('data-samp');
    });
  });

  /* —— 步骤 1 → 2：拍照识别 —— */
  $('btnShoot').addEventListener('click', function () {
    var s = DEMO.samples[current];
    var btn = this;
    btn.disabled = true; btn.textContent = '⏳ 正在识别…';
    $('ocrLoading').style.display = 'block';
    $('ocrResult').style.display = 'none';
    $('btnSave').style.display = 'none';
    showStep(2);
    setTimeout(function () {
      $('ocrLoading').style.display = 'none';
      $('ocrQ').innerHTML = '<b>题目：</b>' + s.question;
      $('ocrTags').innerHTML = s.tags.map(function (t) {
        return '<span class="pt chem">' + t + '</span>';
      }).join('');
      errSel = {};
      $('errChips').innerHTML = s.errors.map(function (e, i) {
        return '<span class="pt diff" data-i="' + i + '" style="cursor:pointer">' + e.code + ' ' + e.name + ' · ' + e.conf + '</span>';
      }).join('');
      $('errChips').querySelectorAll('.pt').forEach(function (c) {
        c.addEventListener('click', function () {
          if (c.classList.contains('on')) {
            c.classList.remove('on'); c.style.background = ''; c.style.color = '';
          } else {
            c.classList.add('on'); c.style.background = 'var(--teal)'; c.style.color = '#fff'; c.style.borderColor = 'var(--teal)';
          }
        });
      });
      $('ocrResult').style.display = 'flex';
      $('btnSave').style.display = 'block';
      btn.disabled = false; btn.textContent = '📷 拍照识别';
      pToast('识别完成 · 请点选确认错因');
    }, 1400);
  });

  /* —— 步骤 2 → 3：保存并生成漏洞报告 —— */
  $('btnSave').addEventListener('click', function () {
    var s = DEMO.samples[current];
    $('vulnHead').innerHTML =
      '<div class="pb-t"><span class="n">报告</span>' + s.kp + '<span style="margin-left:auto;font-size:11px;color:var(--muted)">已累计 6 道同类错题</span></div>' +
      '<div style="font-size:12px;color:var(--muted)">错题数 ≥ 5 · 自动触发跨题聚类分析</div>';
    $('vulnList').innerHTML = s.vulns.map(function (v) {
      var sevTxt = { high: '高', mid: '中', low: '低' }[v.sev];
      return '<div class="p-block">' +
        '<div class="pb-t"><span class="n">漏洞</span><span style="flex:1">' + v.name + '</span><span class="sev ' + v.sev + '">' + sevTxt + '</span></div>' +
        '<div class="vuln-bar"><span class="vb-name">错误率</span><div class="vb-track"><div class="vb-fill" data-w="' + v.rate + '"></div></div><span class="vb-rate">' + v.rate + '%</span></div>' +
        '<div style="font-size:12px;color:var(--ink-2)">' + v.desc + '</div>' +
        '<div style="font-size:12px;color:var(--teal-deep);margin-top:6px;background:var(--teal-soft);border-radius:6px;padding:5px 8px">💡 ' + v.advice + '</div>' +
        '</div>';
    }).join('');
    showStep(3);
    setTimeout(function () {
      $('vulnList').querySelectorAll('.vb-fill').forEach(function (f) {
        f.style.width = f.getAttribute('data-w') + '%';
      });
    }, 90);
    pToast('已生成漏洞报告');
  });

  /* —— 步骤 3 → 4：分层训练 —— */
  function renderTrain() {
    var s = DEMO.samples[current];
    var t = s.train[trainIdx];
    $('diffName').textContent = t.d + ' · ' + t.diff;
    $('trainQ').innerHTML = t.q;
    $('trainA').innerHTML = '<b>答案：</b>' + t.a + '<br><b>解析：</b>' + t.note;
    $('trainA').style.visibility = 'hidden';
    $('revealBtn').style.display = 'flex';
  }
  $('btnToTrain').addEventListener('click', function () {
    trainIdx = 0;
    document.querySelectorAll('.diff-tab').forEach(function (t, i) { t.classList.toggle('on', i === 0); });
    showStep(4);
    renderTrain();
    pToast('已为你生成三级同类变式题');
  });
  $('diffTabs').addEventListener('click', function (e) {
    var b = e.target.closest('.diff-tab');
    if (!b) return;
    document.querySelectorAll('.diff-tab').forEach(function (t) { t.classList.remove('on'); });
    b.classList.add('on');
    trainIdx = +b.getAttribute('data-d');
    renderTrain();
  });
  $('revealBtn').addEventListener('click', function () {
    $('trainA').style.visibility = 'visible';
    this.style.display = 'none';
  });
  $('btnWrong').addEventListener('click', function () {
    pToast('已回流错题本 · 复习间隔缩短，补推 1 道同类题');
    setTimeout(function () { showStep(5); renderReview(); }, 650);
  });
  $('btnRight').addEventListener('click', function () {
    pToast('做对啦 · 下次复习间隔延长');
    setTimeout(function () { showStep(5); renderReview(); }, 650);
  });

  /* —— 步骤 5：智能复习（遗忘曲线 + 任务） —— */
  function renderReview() {
    var s = DEMO.samples[current];
    var c = $('curveSvg');
    c.innerHTML = '';
    var ns = 'http://www.w3.org/2000/svg';
    function el(tag, attrs, text) {
      var e = document.createElementNS(ns, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      return e;
    }
    var pts = [[44, 86], [98, 60], [152, 42], [206, 30], [258, 25]];
    var labels = ['第 1 天', '第 3 天', '第 7 天', '第 15 天', '考前 3 天'];
    c.appendChild(el('line', { x1: 30, y1: 92, x2: 272, y2: 92, stroke: '#E2EAE4' }));
    c.appendChild(el('polyline', {
      points: pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '),
      fill: 'none', stroke: '#0E7C6B', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
    pts.forEach(function (p, i) {
      c.appendChild(el('circle', { cx: p[0], cy: p[1], r: 4.5, fill: '#fff', stroke: '#0E7C6B', 'stroke-width': 2.5 }));
      c.appendChild(el('text', { x: p[0], y: 105, 'text-anchor': 'middle', 'class': 'chart-tip' }, labels[i]));
    });
    $('reviewList').innerHTML = s.review.map(function (r, i) {
      return '<div class="review-item" data-i="' + i + '">' +
        '<div class="ri-top"><span class="ri-day">' + r.day + '</span><span class="ri-kp">' + r.kp + '</span><span class="ri-btn">👁 遮答案重做</span></div>' +
        '<div class="ri-ans" style="display:none;margin-top:6px;font-size:12px;color:var(--muted)">已重做完成 → 请自评对错（演示）</div>' +
        '</div>';
    }).join('');
    $('reviewList').querySelectorAll('.review-item').forEach(function (item) {
      item.querySelector('.ri-btn').addEventListener('click', function () {
        var ans = item.querySelector('.ri-ans');
        if (ans.style.display === 'block') {
          ans.style.display = 'none';
          item.classList.remove('done');
          this.textContent = '👁 遮答案重做';
        } else {
          ans.style.display = 'block';
          item.classList.add('done');
          this.textContent = '✓ 自评完成';
          pToast('已记录：做对 → 下次复习间隔延长');
        }
      });
    });
    pToast('已生成复习计划');
  }

})();
