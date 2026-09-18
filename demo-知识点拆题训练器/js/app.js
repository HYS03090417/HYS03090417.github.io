/* =====================================================
   错题星 · 应用逻辑
   产品概念：红笔批改 × 学习诊断报告
   AI 能力由 ai.js 提供（可替换为真实 API）
   ===================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var q = function (id) { return APP.questions.filter(function (x) { return x.id === id; })[0]; };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var IC = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 13 4 4L19 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 4.5v15"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 1 2 1c0-3 2-5 2-7z"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="14" r="5"/><path d="m8 9-3-6h6l1 3 1-3h6l-3 6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/></svg>'
  };

  var MASTERY = {
    weak: { label: '待巩固', cls: 'weak' },
    learning: { label: '复习中', cls: 'learning' },
    mastered: { label: '已掌握', cls: 'mastered' }
  };
  var TITLES = { dashboard: '今日', mistakes: '错题本', mistake: '诊断报告', practice: '专项训练', review: '复习计划', report: '学习报告' };

  var state = {
    page: 'dashboard', mistakeId: null,
    subject: '全部', status: 'all', keyword: '',
    practiceId: null, practiceIdx: 0, revealed: false,
    reviewDone: {}, reviewRevealed: {},
    upload: { step: 'pick', qid: null, stage: 0, fileName: '', recognized: '' }
  };

  /* ---------- 本地持久化（让操作真的被记住） ---------- */
  function saveState() {
    try {
      localStorage.setItem('cuotixing:v1', JSON.stringify({
        mastery: APP.questions.map(function (x) { return { id: x.id, mastery: x.mastery, stars: x.stars, due: x.due }; }),
        reviewDone: state.reviewDone
      }));
    } catch (e) {}
  }
  function loadState() {
    try {
      var raw = localStorage.getItem('cuotixing:v1');
      if (!raw) return;
      var d = JSON.parse(raw);
      (d.mastery || []).forEach(function (m) {
        var item = q(m.id);
        if (item) { item.mastery = m.mastery; item.stars = m.stars; item.due = m.due; }
      });
      state.reviewDone = d.reviewDone || {};
    } catch (e) {}
  }

  /* ---------- 小组件 ---------- */
  function toast(msg) {
    var wrap = $('#toastWrap');
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 280); }, 2400);
  }

  function masteryBadge(m) {
    var d = MASTERY[m] || MASTERY.learning;
    return '<span class="m-badge ' + d.cls + '">' + d.label + '</span>';
  }

  function stars(n) {
    var out = '';
    for (var i = 1; i <= 5; i++) { out += '<span class="' + (i <= n ? 'on' : 'off') + '">★</span>'; }
    return '<span class="stars" title="掌握度 ' + n + '/5">' + out + '</span>';
  }

  function ring(pct) {
    var r = 26, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<svg class="ring" viewBox="0 0 64 64" aria-label="置信度 ' + pct + '%">' +
      '<circle cx="32" cy="32" r="' + r + '" class="ring-bg"></circle>' +
      '<circle cx="32" cy="32" r="' + r + '" class="ring-fg" style="stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + off.toFixed(1) + '"></circle>' +
      '<text x="32" y="37" text-anchor="middle" class="ring-t">' + pct + '%</text></svg>';
  }

  function errorChips(item) {
    return item.errors.map(function (e) {
      var cls = e.conf >= 70 ? 'red' : (e.conf >= 45 ? 'amber' : 'blue');
      return '<span class="chip chip-' + cls + '">' + esc(e.name) + '<b>' + e.conf + '%</b></span>';
    }).join('');
  }

  function kpTree(item) {
    return (item.kps || []).map(function (k) {
      var cls = k.rate >= 70 ? 'high' : (k.rate >= 50 ? 'mid' : 'low');
      return '<div class="kpb-row' + (k.main ? ' main' : '') + '">' +
        '<div class="kpb-top"><span class="kpb-path"><i>' + esc(k.l1) + '</i> › ' + esc(k.l2) + '</span>' +
        (k.main ? '<span class="kpb-main-tag">主因</span>' : '') + '</div>' +
        '<div class="kpb-bar"><span class="' + cls + '" style="width:' + k.rate + '%"></span></div>' +
        '<div class="kpb-meta">错误率 ' + k.rate + '%</div></div>';
    }).join('');
  }

  function vulnRows(item) {
    return item.vulns.map(function (v) {
      var sevTxt = { high: '高', mid: '中', low: '低' }[v.sev];
      return '<div class="vuln-row">' +
        '<div class="vuln-top"><span>' + esc(v.name) + '</span><span class="sev ' + v.sev + '">' + sevTxt + '</span></div>' +
        '<div class="vuln-bar"><span class="vuln-fill ' + v.sev + '" style="width:' + v.rate + '%"></span></div>' +
        '<div class="vuln-meta">错误率 ' + v.rate + '%</div>' +
        '<p class="vuln-desc">' + esc(v.desc) + '</p></div>';
    }).join('');
  }

  function questionCard(item) {
    return '<a class="q-card" href="#/mistake/' + item.id + '">' +
      '<div class="q-card-top"><span class="q-subject">' + esc(item.subject) + '</span>' + masteryBadge(item.mastery) + '</div>' +
      '<h3>' + esc(item.kp) + ' ' + stars(item.stars) + '</h3>' +
      '<p class="q-excerpt">' + esc(item.question) + '</p>' +
      '<div class="q-card-foot"><span class="q-tags">' + item.tags.slice(1).map(function (t) { return '<span class="tag-mini">' + esc(t) + '</span>'; }).join('') + '</span>' +
      '<span class="q-date">' + esc(item.addedAt) + '</span></div></a>';
  }

  /* ---------- 图表（纯 SVG） ---------- */
  function lineChart(points, color, unit) {
    var W = 520, H = 200, padL = 36, padR = 18, padT = 18, padB = 30;
    var max = Math.max.apply(null, points.map(function (p) { return p.value; }));
    var min = Math.min.apply(null, points.map(function (p) { return p.value; }));
    var lo = Math.max(0, Math.floor((min - 8) / 10) * 10), hi = Math.ceil((max + 6) / 10) * 10;
    var x = function (i) { return padL + (W - padL - padR) * (points.length === 1 ? 0.5 : i / (points.length - 1)); };
    var y = function (v) { return padT + (H - padT - padB) * (1 - (v - lo) / (hi - lo || 1)); };
    var line = points.map(function (p, i) { return x(i) + ',' + y(p.value); }).join(' ');
    var area = padL + ',' + (H - padB) + ' ' + line + ' ' + x(points.length - 1) + ',' + (H - padB);
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img">';
    s += '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".22"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 0; g <= 3; g++) {
      var gy = padT + (H - padT - padB) * (g / 3);
      s += '<line class="chart-grid" x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '"/>';
      s += '<text class="chart-label" x="' + (padL - 6) + '" y="' + (gy + 4) + '" text-anchor="end">' + (hi - (hi - lo) * g / 3).toFixed(0) + '</text>';
    }
    s += '<polygon points="' + area + '" fill="url(#areaGrad)"/>';
    s += '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    points.forEach(function (p, i) {
      s += '<circle cx="' + x(i) + '" cy="' + y(p.value) + '" r="4.5" fill="#fff" stroke="' + color + '" stroke-width="2.5"/>';
      s += '<text class="chart-value" x="' + x(i) + '" y="' + (y(p.value) - 10) + '" text-anchor="middle">' + p.value + (unit || '') + '</text>';
      s += '<text class="chart-label" x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(p.label) + '</text>';
    });
    return s + '</svg>';
  }

  function barChart(points) {
    var W = 520, H = 190, padL = 34, padR = 16, padT = 16, padB = 30;
    var max = Math.max.apply(null, points.map(function (p) { return p.value; })) || 1;
    var bw = (W - padL - padR) / points.length * 0.52;
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img"><defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F6BFF"/><stop offset="1" stop-color="#8FB4FF"/></linearGradient></defs>';
    for (var g = 0; g <= 2; g++) {
      var gy = padT + (H - padT - padB) * (g / 2);
      s += '<line class="chart-grid" x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '"/>';
    }
    points.forEach(function (p, i) {
      var cx = padL + (W - padL - padR) * (i + 0.5) / points.length;
      var h = (H - padT - padB) * (p.value / max);
      s += '<rect x="' + (cx - bw / 2) + '" y="' + (H - padB - h) + '" width="' + bw + '" height="' + Math.max(h, 2) + '" rx="6" fill="url(#barGrad)"/>';
      if (p.value > 0) s += '<text class="chart-value" x="' + cx + '" y="' + (H - padB - h - 6) + '" text-anchor="middle">' + p.value + '</text>';
      s += '<text class="chart-label" x="' + cx + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(p.label) + '</text>';
    });
    return s + '</svg>';
  }

  /* ---------- 路由 ---------- */
  function route() {
    var hash = location.hash || '#/dashboard';
    var parts = hash.replace(/^#\/?/, '').split('/');
    var page = parts[0] || 'dashboard';
    state.page = page;
    if (page === 'mistake') { state.mistakeId = parts[1]; renderDetail(parts[1]); }
    else if (page === 'mistakes') { renderMistakes(); }
    else if (page === 'practice') { state.practiceId = parts[1] || null; renderPractice(); }
    else if (page === 'review') { renderReview(); }
    else if (page === 'report') { renderReport(); }
    else { renderDashboard(); }
    updateChrome();
    window.scrollTo(0, 0);
  }

  function updateChrome() {
    $('#topTitle').textContent = TITLES[state.page] || '今日';
    $('#navCount').textContent = APP.questions.length;
    $$('[data-nav]').forEach(function (a) {
      var key = a.getAttribute('data-nav');
      a.classList.toggle('active', key === state.page || (state.page === 'mistake' && key === 'mistakes'));
    });
  }
﻿
  /* ---------- 今日工作台 ---------- */
  function renderDashboard() {
    var hour = new Date().getHours();
    var greet = hour < 6 ? '夜深了' : (hour < 12 ? '早上好' : (hour < 18 ? '下午好' : '晚上好'));
    var due = APP.questions.filter(function (x) { return x.due === '今天'; });
    var weak = APP.questions.filter(function (x) { return x.mastery === 'weak'; });
    var mastered = APP.questions.filter(function (x) { return x.mastery === 'mastered'; }).length;
    var recent = APP.questions.slice().sort(function (a, b) { return a.addedAt < b.addedAt ? 1 : -1; });

    var html =
      '<div class="page-head"><div><h1>' + greet + '，' + esc(APP.user.name) + '</h1><p>' + (due.length ? '今天有 <b>' + due.length + '</b> 个知识点需要复习，继续保持。' : '今天的复习已完成，做得不错。') + '</p></div>' +
      '<button class="btn btn-primary" data-action="upload">' + IC.camera + ' 拍照诊断</button></div>' +

      '<div class="scan-hero" data-action="upload">' +
        '<div class="sh-left"><div class="sh-icon">' + IC.camera + '</div>' +
        '<div><h2>拍下错题，让 AI 帮你诊断</h2><p>识别题目 → 拆解知识点 → 定位错因 → 生成同类题，一次完成。</p></div></div>' +
        '<span class="sh-go">开始诊断 →</span>' +
      '</div>' +

      '<div class="quick-grid">' +
        '<a class="quick-tile" href="#/mistakes"><span class="qt-ic blue">' + IC.book + '</span><span><b>错题本</b><small>' + APP.questions.length + ' 道错题</small></span></a>' +
        '<a class="quick-tile" href="#/practice"><span class="qt-ic orange">' + IC.target + '</span><span><b>专项训练</b><small>' + (APP.questions.length * 3) + ' 道变式题</small></span></a>' +
        '<a class="quick-tile" href="#/review"><span class="qt-ic green">' + IC.calendar + '</span><span><b>复习计划</b><small>今日 ' + due.length + ' 个</small></span></a>' +
        '<a class="quick-tile" href="#/report"><span class="qt-ic purple">' + IC.chart + '</span><span><b>学习报告</b><small>掌握度趋势</small></span></a>' +
      '</div>' +
      '<div class="stat-grid">' +
        '<div class="stat-card"><div class="stat-l">今日待复习</div><div class="stat-v">' + due.length + '<em>个</em></div><div class="stat-s warn">按遗忘曲线安排</div></div>' +
        '<div class="stat-card"><div class="stat-l">待巩固知识点</div><div class="stat-v">' + weak.length + '<em>个</em></div><div class="stat-s warn">优先处理</div></div>' +
        '<div class="stat-card"><div class="stat-l">错题总数</div><div class="stat-v">' + APP.questions.length + '<em>道</em></div><div class="stat-s up">本周新增 3 道</div></div>' +
        '<div class="stat-card"><div class="stat-l">连续学习</div><div class="stat-v">' + APP.user.streak + '<em>天</em></div><div class="stat-s ok">保持住</div></div>' +
      '</div>' +

      '<div class="two-col">' +
        '<section class="panel"><div class="panel-head"><h2>今日复习</h2><a class="panel-link" href="#/review">全部计划 →</a></div>' +
          (due.length ? due.map(function (x) {
            return '<div class="review-row" data-action="go" data-href="#/mistake/' + x.id + '">' +
              '<div><div class="rr-kp">' + esc(x.kp) + '</div><div class="rr-sub">' + esc(x.subject) + ' · ' + esc(x.due) + '复习</div></div>' +
              '<span class="rr-go">去复习 →</span></div>';
          }).join('') : '<div class="empty-mini">今天没有待复习的错题 🎉</div>') +
        '</section>' +
        '<section class="panel"><div class="panel-head"><h2>知识点漏洞 TOP3</h2><a class="panel-link" href="#/mistakes">查看错题 →</a></div>' +
          APP.questions.filter(function (x) { return x.mastery !== 'mastered'; }).slice(0, 4).map(function (x) {
            var top = x.vulns[0];
            return '<div class="weak-row" data-action="go" data-href="#/mistake/' + x.id + '">' +
              '<div class="weak-top"><span>' + esc(top.name) + '</span><b>' + top.rate + '%</b></div>' +
              '<div class="weak-bar"><span style="width:' + top.rate + '%"></span></div></div>';
          }).join('') +
        '</section>' +
      '</div>' +

      '<section class="panel"><div class="panel-head"><h2>最近错题</h2><a class="panel-link" href="#/mistakes">进入错题本 →</a></div>' +
        '<div class="q-list">' + recent.slice(0, 3).map(questionCard).join('') + '</div></section>';

    $('#view').innerHTML = html;
  }

  /* ---------- 错题本 ---------- */
  function renderMistakes() {
    var list = APP.questions.filter(function (x) {
      if (state.subject !== '全部' && x.subject !== state.subject) return false;
      if (state.status !== 'all' && x.mastery !== state.status) return false;
      if (state.keyword) {
        var k = state.keyword.toLowerCase();
        if ((x.kp + x.question + x.tags.join('')).toLowerCase().indexOf(k) < 0) return false;
      }
      return true;
    });
    var html =
      '<div class="page-head"><div><h1>错题本</h1><p>共 ' + APP.questions.length + ' 道错题，按知识点归档、按掌握度复习。</p></div>' +
      '<button class="btn btn-primary" data-action="upload">' + IC.camera + ' 拍照诊断</button></div>' +
      '<div class="toolbar">' +
        '<div class="search-inline">' + IC.search + '<input id="mistakeSearch" placeholder="搜索题目、知识点…" value="' + esc(state.keyword) + '"></div>' +
        '<div class="seg">' + APP.subjects.map(function (s) { return '<button class="seg-btn' + (state.subject === s ? ' on' : '') + '" data-subject="' + s + '">' + s + '</button>'; }).join('') + '</div>' +
        '<div class="seg">' + APP.filters.map(function (f) { return '<button class="seg-btn' + (state.status === f.key ? ' on' : '') + '" data-status="' + f.key + '">' + f.label + '</button>'; }).join('') + '</div>' +
      '</div>' +
      (list.length ? '<div class="q-list">' + list.map(questionCard).join('') + '</div>'
        : '<div class="empty-state">' + IC.search + '<h3>没有找到匹配的错题</h3><p>换个关键词，或切换筛选条件试试。</p></div>');
    $('#view').innerHTML = html;
  }

  /* ---------- 诊断报告（核心页） ---------- */
  function renderDetail(id) {
    var item = q(id);
    if (!item) { location.hash = '#/mistakes'; return; }
    var top = item.errors[0];
    var ansEsc = esc(item.myAnswer);
    var markEsc = esc(item.penMark);
    var marked = (markEsc && ansEsc.indexOf(markEsc) >= 0)
      ? ansEsc.replace(markEsc, '<span class="pen-mark">' + markEsc + '</span>')
      : '<span class="pen-mark">' + ansEsc + '</span>';

    var html =
      '<a class="back-link" href="#/mistakes">← 返回错题本</a>' +
      '<div class="detail-head"><div><div class="detail-tags"><span class="q-subject">' + esc(item.subject) + '</span><span class="tag-mini">' + esc(item.grade) + '</span><span class="tag-mini">难度 ' + esc(item.difficulty) + '</span>' + stars(item.stars) + '</div>' +
      '<h1>' + esc(item.kp) + '</h1></div>' +
      '<div class="detail-actions">' + masteryBadge(item.mastery) + '<button class="btn btn-primary btn-sm" data-action="practice" data-id="' + item.id + '">开始专项训练</button></div></div>' +

      '<div class="detail-grid">' +
        '<div class="detail-left">' +
          '<section class="paper"><div class="paper-label">题目原题</div><p class="question-text">' + esc(item.question) + '</p></section>' +

          '<section class="paper"><div class="paper-label">我的作答</div>' +
            '<p class="answer-text">' + marked + '</p>' +
            '<div class="pen-note"><span class="pn-ic">✎</span><p>' + esc(item.annotation) + '</p></div>' +
            '<div class="correct-block"><div class="cb-label">正确答案与解析</div><p>' + esc(item.answer) + '</p></div>' +
          '</section>' +

          '<section class="panel"><div class="panel-head"><h2>复习安排</h2><span class="panel-note">按遗忘曲线安排</span></div>' +
            '<div class="review-mini">' + item.review.map(function (r) { return '<div class="rm-item"><b>' + esc(r.day) + '</b><span>' + esc(r.kp) + '</span></div>'; }).join('') + '</div>' +
          '</section>' +
        '</div>' +

        '<aside class="detail-right"><div class="ai-card">' +
          '<div class="ai-head"><div><div class="ai-eyebrow">AI 诊断报告</div><h2>这道题，错在哪一步</h2></div>' + ring(top.conf) + '</div>' +

          '<div class="report-sec"><div class="rs-label"><i>1</i>症状 · 错因</div><div class="chip-row">' + errorChips(item) + '</div></div>' +

          '<div class="report-sec"><div class="rs-label"><i>2</i>病灶 · 知识点拆解</div><div class="kp-tree">' + kpTree(item) + '</div></div>' +

          '<div class="report-sec"><div class="rs-label"><i>3</i>定位 · 漏洞分析</div>' + vulnRows(item) + '</div>' +

          '<div class="report-sec"><div class="rs-label"><i>4</i>处方 · 学习建议</div><div class="advice-box"><span class="adv-ic">' + IC.bulb + '</span><p>' + esc(item.advice) + '</p></div></div>' +

          '<div class="ai-actions">' +
            '<button class="btn btn-primary btn-block" data-action="add-review" data-id="' + item.id + '">加入复习计划</button>' +
            '<button class="btn btn-outline btn-block" data-action="mastered" data-id="' + item.id + '">标记为已掌握</button>' +
          '</div>' +
          '<div class="ai-foot">AI 分析结果 · 置信度 ' + top.conf + '% · 可人工复核</div>' +
        '</div></aside>' +
      '</div>';

    $('#view').innerHTML = html;
  }
﻿
  /* ---------- 专项训练 ---------- */
  function renderPractice() {
    if (!state.practiceId) {
      var html = '<div class="page-head"><div><h1>专项训练</h1><p>选择一道错题，按「基础 → 中档 → 拔高」三级做针对性训练。</p></div></div><div class="q-list">' +
        APP.questions.map(function (x) {
          return '<div class="practice-pick"><div class="pp-main"><span class="q-subject">' + esc(x.subject) + '</span>' +
            '<h3>' + esc(x.kp) + '</h3><p>' + esc(x.question) + '</p></div>' +
            '<div class="pp-side">' + stars(x.stars) + '<button class="btn btn-primary btn-sm" data-action="practice" data-id="' + x.id + '">开始训练</button></div></div>';
        }).join('') + '</div>';
      $('#view').innerHTML = html;
      return;
    }
    var item = q(state.practiceId);
    if (!item) { location.hash = '#/practice'; return; }
    var t = item.train[state.practiceIdx] || item.train[0];
    var pct = Math.round((state.practiceIdx + 1) / item.train.length * 100);

    var html =
      '<a class="back-link" href="#/practice">← 返回训练列表</a>' +
      '<div class="detail-head"><div><div class="detail-tags"><span class="q-subject">' + esc(item.subject) + '</span><span class="tag-mini">' + esc(item.kp) + '</span></div><h1>专项训练</h1></div></div>' +
      '<div class="progress-line"><span style="width:' + pct + '%"></span></div>' +
      '<div class="train-tabs">' + item.train.map(function (x, i) {
        return '<button class="train-tab' + (i === state.practiceIdx ? ' on' : '') + '" data-train="' + i + '"><b>' + esc(x.d) + '</b><span>' + esc(x.diff) + '</span></button>';
      }).join('') + '</div>' +
      '<section class="panel train-panel">' +
        '<div class="train-q-head"><span class="train-badge">' + esc(t.d) + '</span><span class="panel-note">' + esc(t.diff) + '</span></div>' +
        '<p class="question-text">' + esc(t.q) + '</p>' +
        (state.revealed
          ? '<div class="correct-block"><div class="cb-label">答案与解析</div><p>' + esc(t.a) + '</p><p style="margin-top:8px;color:var(--body);font-size:13px">' + esc(t.note) + '</p></div>' +
            '<div class="self-eval"><span>这道题你做对了吗？</span><button class="btn btn-outline btn-sm" data-action="self-wrong">没做对</button><button class="btn btn-primary btn-sm" data-action="self-right">做对了</button></div>'
          : '<button class="btn btn-primary" data-action="reveal">查看答案与解析</button>') +
      '</section>';

    $('#view').innerHTML = html;
  }

  /* ---------- 复习计划 ---------- */
  function renderReview() {
    var total = APP.questions.length;
    var done = APP.questions.filter(function (x) { return state.reviewDone[x.id]; }).length;

    var html =
      '<div class="page-head"><div><h1>复习计划</h1><p>按遗忘曲线安排：第 1 天 → 第 3 天 → 第 7 天 → 考前回顾。</p></div></div>' +
      '<div class="review-progress">' +
        '<svg class="rp-ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="#E5EBF4" stroke-width="7"/>' +
        '<circle cx="32" cy="32" r="26" fill="none" stroke="#2F6BFF" stroke-width="7" stroke-linecap="round" transform="rotate(-90 32 32)" stroke-dasharray="' + (2 * Math.PI * 26).toFixed(1) + '" stroke-dashoffset="' + (2 * Math.PI * 26 * (1 - done / total)).toFixed(1) + '"/>' +
        '<text x="32" y="37" text-anchor="middle" class="rp-num">' + done + '/' + total + '</text></svg>' +
        '<div class="rp-info"><div class="rp-t">本轮复习进度</div><div class="rp-bar"><span style="width:' + (done / total * 100) + '%"></span></div></div>' +
      '</div>' +
      '<div class="review-cards">' + APP.questions.map(function (x) {
        var isDone = !!state.reviewDone[x.id];
        var revealed = !!state.reviewRevealed[x.id];
        var top = x.vulns[0];
        return '<div class="review-card' + (isDone ? ' done' : '') + '">' +
          '<div class="rc-top"><span class="q-subject">' + esc(x.subject) + '</span><span class="rc-due">' + esc(x.due) + '</span></div>' +
          '<h3>' + esc(x.kp) + '</h3>' +
          '<div class="rc-weak">薄弱点：' + esc(top.name) + '（错误率 ' + top.rate + '%）</div>' +
          (revealed && !isDone
            ? '<div class="correct-block" style="margin-bottom:12px"><div class="cb-label">参考答案</div><p>' + esc(x.answer) + '</p></div>'
            : '') +
          '<div class="rc-actions">' +
            (isDone ? '<span class="rc-done">' + IC.check + ' 本轮已完成</span>'
              : (revealed
                ? '<button class="btn btn-primary btn-sm" data-action="review-done" data-id="' + x.id + '">完成复习</button>'
                : '<button class="btn btn-primary btn-sm" data-action="review-start" data-id="' + x.id + '">遮答案重做</button>') +
                '<a class="btn btn-outline btn-sm" href="#/mistake/' + x.id + '">看错因</a>') +
          '</div></div>';
      }).join('') + '</div>';

    $('#view').innerHTML = html;
  }

  /* ---------- 学习报告 ---------- */
  function renderReport() {
    var hard = APP.questions.filter(function (x) { return x.mastery !== 'mastered'; }).slice(0, 5);
    var html =
      '<div class="page-head"><div><h1>学习报告</h1><p>掌握度、漏洞与提分轨迹——用数据看见自己的变化。</p></div></div>' +

      '<div class="report-grid">' +
        '<div class="chart-card"><div class="chart-title"><h2>知识点掌握度趋势</h2><span>近 5 周</span></div><div class="chart-sub">掌握度按错题重做正确率与复习完成度综合计算</div>' +
          lineChart(APP.report.masteryTrend, '#2F6BFF', '%') + '</div>' +
        '<div class="summary-card"><div class="sc-eyebrow">AI 周报</div><h2>本周学习总结</h2><p>' + esc(APP.report.summary) + '</p>' +
          '<div class="summary-stats"><div><b>' + APP.questions.length + '</b><span>错题总数</span></div><div><b>' + APP.user.streak + '</b><span>连续学习天数</span></div></div></div>' +
      '</div>' +

      '<div class="report-grid">' +
        '<div class="chart-card"><div class="chart-title"><h2>提分轨迹</h2><span>化学单科</span></div><div class="chart-sub">来自阶段测评成绩（示例数据）</div>' +
          lineChart(APP.report.scoreTrend, '#10B981', '') + '</div>' +
        '<div class="chart-card"><div class="chart-title"><h2>本周学习时长</h2><span>分钟</span></div><div class="chart-sub">周一至周日</div>' +
          barChart(APP.report.weekMinutes) + '</div>' +
      '</div>' +

      '<section class="panel"><div class="panel-head"><h2>知识点掌握度</h2><a class="panel-link" href="#/mistakes">查看错题 →</a></div>' +
        hard.map(function (x) {
          var top = x.kps[0];
          return '<div class="weak-row" data-action="go" data-href="#/mistake/' + x.id + '">' +
            '<div class="weak-top"><span>' + esc(top.l1) + ' › ' + esc(top.l2) + '</span><b>' + top.rate + '% 错误率</b></div>' +
            '<div class="weak-bar"><span style="width:' + top.rate + '%"></span></div></div>';
        }).join('') +
      '</section>' +

      '<section class="panel"><div class="panel-head"><h2>学习成就</h2><span class="panel-note">每一次坚持都算数</span></div>' +
        '<div class="achievement-grid">' +
          '<div class="ach-card"><div class="ach-ic">' + IC.flame + '</div><h3>连续学习</h3><p>' + APP.user.streak + ' 天</p></div>' +
          '<div class="ach-card"><div class="ach-ic">' + IC.book + '</div><h3>错题归档</h3><p>' + APP.questions.length + ' 道</p></div>' +
          '<div class="ach-card"><div class="ach-ic">' + IC.target + '</div><h3>专项训练</h3><p>' + (APP.questions.length * 3) + ' 题</p></div>' +
          '<div class="ach-card"><div class="ach-ic">' + IC.medal + '</div><h3>连续 12 天</h3><p>超越 68% 的同学</p></div>' +
        '</div></section>';

    $('#view').innerHTML = html;
  }
﻿
  /* ---------- 拍照诊断弹窗 ---------- */
  function openUpload() {
    state.upload = { step: 'pick', qid: null, stage: 0, fileName: '', recognized: '', result: null };
    renderModal();
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }

  function renderModal() {
    var u = state.upload, root = $('#modalRoot');
    if (!root) return;

    if (u.step === 'pick') {
      root.innerHTML = '<div class="modal-mask" data-action="close-modal"><div class="modal" data-stop>' +
        '<div class="modal-head"><h2>拍照诊断</h2><button class="modal-x" data-action="close-modal">' + IC.close + '</button></div>' +
        '<div class="upload-zone" id="uploadZone"><div class="uz-ic">' + IC.camera + '</div><div class="uz-t">点击选择错题照片，或拖拽到这里</div><div class="uz-s">支持 JPG / PNG，尽量拍全题干与手写过程</div>' +
        '<input type="file" id="fileInput" accept="image/*" hidden>' + (u.fileName ? '<div class="uz-file">已选择：' + esc(u.fileName) + '</div>' : '') + '</div>' +
        '<div class="picker"><div class="picker-t">没有照片？选一道示例错题，体验完整的 AI 诊断流程：</div><div class="picker-chips">' +
          APP.questions.map(function (x) { return '<button class="picker-chip' + (u.qid === x.id ? ' on' : '') + '" data-pick="' + x.id + '"><b>' + esc(x.subject) + '</b>' + esc(x.kp) + '</button>'; }).join('') +
        '</div></div>' +
        '<div class="modal-foot"><span class="demo-note">原型演示 · AI 分析由 ai.js 提供内置样例</span>' +
        '<button class="btn btn-primary" id="startAnalyze" ' + (u.qid ? '' : 'disabled') + '>' + IC.camera + ' 开始 AI 分析</button></div>' +
        '</div></div>';
    } else if (u.step === 'analyzing') {
      root.innerHTML = '<div class="modal-mask"><div class="modal"><div class="modal-head"><h2>AI 正在分析</h2></div>' +
        '<div class="analyzing"><div class="spinner"></div><div class="an-steps">' + AI.STEPS.map(function (s, i) {
          var cls = i < u.stage ? 'done' : (i === u.stage ? 'doing' : '');
          return '<div class="an-step ' + cls + '"><span class="an-dot">' + (i < u.stage ? '✓' : (i + 1)) + '</span>' + esc(s) + '</div>';
        }).join('') + '</div><div class="an-tip">接入真实 API 后，这一步将调用多模态模型完成识图与错因分析</div></div>' +
        '</div></div>';
    } else if (u.step === 'review') {
      var item = u.result || {};
      root.innerHTML = '<div class="modal-mask" data-action="close-modal"><div class="modal" data-stop>' +
        '<div class="modal-head"><h2>确认识别结果</h2><button class="modal-x" data-action="close-modal">' + IC.close + '</button></div>' +
        '<div class="done-banner">' + IC.check + ' 识别完成，请核对题干（可手动修正）</div>' +
        '<div class="ocr-area"><label>识别到的题目</label><textarea class="ocr-text" id="ocrText">' + esc(u.recognized) + '</textarea></div>' +
        '<div class="done-grid">' +
          '<div class="done-block"><span class="db-l">学科与知识点</span><span class="db-v">' + esc(item.subject) + ' · ' + esc(item.kp) + '</span></div>' +
          '<div class="done-block"><span class="db-l">主要错因</span><span class="db-v">' + esc(item.errors[0].name) + '（' + item.errors[0].conf + '%）</span></div>' +
          '<div class="done-block"><span class="db-l">生成同类题</span><span class="db-v">3 道（基础 / 中档 / 拔高）</span></div>' +
        '</div>' +
        '<div class="modal-foot"><button class="btn btn-outline" data-action="re-pick">重新选择</button>' +
        '<button class="btn btn-primary" data-action="finish-upload" data-id="' + item.id + '">生成诊断报告 →</button></div>' +
        '</div></div>';
    }
  }

  function startAnalyze() {
    var u = state.upload;
    if (!u.qid) return;
    u.step = 'analyzing'; u.stage = 0;
    renderModal();
    AI.analyze({ sampleId: u.qid }, function (i) {
      u.stage = i;
      if (u.step === 'analyzing') renderModal();
    }).then(function (result) {
      u.result = result;
      u.recognized = result.question;
      u.step = 'review';
      renderModal();
    });
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.classList.contains('modal-mask') && e.target.closest('.modal')) return;
    var action = el.getAttribute('data-action');
    var id = el.getAttribute('data-id');

    if (action === 'upload') { openUpload(); }
    else if (action === 'close-modal') { closeModal(); }
    else if (action === 're-pick') { state.upload.step = 'pick'; renderModal(); }
    else if (action === 'go') { location.hash = el.getAttribute('data-href'); }
    else if (action === 'practice') { state.practiceIdx = 0; state.revealed = false; location.hash = '#/practice/' + id; }
    else if (action === 'reveal') { state.revealed = true; renderPractice(); }
    else if (action === 'self-right') { toast('已记录：掌握度提升，下次复习间隔延长'); state.revealed = false; nextTrain(); }
    else if (action === 'self-wrong') { toast('已记录：该知识点将缩短复习间隔，并补推 1 道同类题'); state.revealed = false; nextTrain(); }
    else if (action === 'add-review') { toast('已加入复习计划，将按遗忘曲线提醒'); }
    else if (action === 'mastered') {
      var it = q(id);
      if (it) { it.mastery = 'mastered'; it.stars = Math.min(5, it.stars + 2); it.due = '考前回顾'; saveState(); renderDetail(id); toast('已标记为掌握，后续将减少复习频率'); }
    }
    else if (action === 'review-start') { state.reviewRevealed[id] = true; renderReview(); }
    else if (action === 'review-done') {
      state.reviewDone[id] = true; state.reviewRevealed[id] = false;
      var x = q(id);
      if (x) { x.stars = Math.min(5, x.stars + 1); if (x.stars >= 4) x.mastery = 'mastered'; }
      saveState(); renderReview(); toast('完成复习，掌握度 +1');
    }
    else if (action === 'finish-upload') {
      var item = q(id);
      if (item) { item.mastery = 'weak'; item.due = '今天'; item.stars = Math.max(1, item.stars - 1); }
      var txt = $('#ocrText'); if (txt && txt.value.trim()) { /* 用户修正后的题干 */ }
      saveState(); closeModal(); toast('已生成诊断报告，并加入错题本'); location.hash = '#/mistake/' + id;
    }
  });

  document.addEventListener('click', function (e) {
    var seg = e.target.closest('[data-subject]');
    if (seg) { state.subject = seg.getAttribute('data-subject'); renderMistakes(); return; }
    var st = e.target.closest('[data-status]');
    if (st) { state.status = st.getAttribute('data-status'); renderMistakes(); return; }
    var tr = e.target.closest('[data-train]');
    if (tr) { state.practiceIdx = +tr.getAttribute('data-train'); state.revealed = false; renderPractice(); return; }
    var pick = e.target.closest('[data-pick]');
    if (pick) { state.upload.qid = pick.getAttribute('data-pick'); renderModal(); return; }
    var zone = e.target.closest('#uploadZone');
    if (zone && !e.target.closest('#fileInput')) { var fi = $('#fileInput'); if (fi) fi.click(); return; }
    var sa = e.target.closest('#startAnalyze');
    if (sa) { startAnalyze(); return; }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'mistakeSearch') {
      state.keyword = e.target.value; renderMistakes();
      var inp = $('#mistakeSearch');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
      return;
    }
    if (e.target.id === 'topSearch') {
      state.keyword = e.target.value;
      if (state.page !== 'mistakes') location.hash = '#/mistakes'; else renderMistakes();
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'fileInput' && e.target.files && e.target.files[0]) {
      state.upload.fileName = e.target.files[0].name;
      if (!state.upload.qid) state.upload.qid = APP.questions[0].id;
      renderModal();
    }
  });

  function nextTrain() {
    var item = q(state.practiceId);
    var len = item ? item.train.length : 3;
    if (state.practiceIdx < len - 1) { state.practiceIdx++; renderPractice(); }
    else { toast('本轮三级训练已完成 👏'); location.hash = '#/mistakes'; }
  }

  /* ---------- 启动 ---------- */
  window.addEventListener('hashchange', route);
  loadState();
  route();
})();
