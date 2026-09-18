/* =====================================================
   错题星 · AI 能力层（可替换的接口层）
   -----------------------------------------------------
   现在：调用内置样例（mock），用于产品原型演示。
   接入真实 API：把 CONFIG.enabled 改为 true，
   填好 endpoint，即可自动切换为真实调用。
   界面代码不需要任何改动。
   ===================================================== */
var AI = (function () {
  'use strict';

  var CONFIG = {
    enabled: false,        // ← 接入 API 后改为 true
    endpoint: '',          // ← 例如 https://xxx.workers.dev/analyze
    model: '',             // ← 例如 qwen-vl-max / glm-4v
    timeout: 30000
  };

  var STEPS = [
    '正在识别题目与手写内容…',
    '正在解析考点与知识点…',
    '正在分析错因并定位到步骤…',
    '正在生成分层同类题…'
  ];

  /* 分析一道错题（图片或样例）
     input: { file: File } 或 { sampleId: 'q-valence' }
     onStep: function(index, text) —— 用于驱动界面进度
     返回 Promise<分析结果对象> */
  function analyze(input, onStep) {
    if (CONFIG.enabled && CONFIG.endpoint) {
      return callAPI(input, onStep);
    }
    return mockAnalyze(input, onStep);
  }

  /* —— 内置样例：按步骤推进，最后返回结构化结果 —— */
  function mockAnalyze(input, onStep) {
    return new Promise(function (resolve) {
      var q = findQuestion(input);
      var i = 0;
      function tick() {
        if (i < STEPS.length) {
          if (onStep) onStep(i, STEPS[i]);
          i++;
          setTimeout(tick, 620);
        } else {
          if (onStep) onStep(STEPS.length, '分析完成');
          setTimeout(function () {
            resolve(JSON.parse(JSON.stringify(q)));
          }, 420);
        }
      }
      tick();
    });
  }

  /* —— 真实 API 调用（接入时实现） —— */
  function callAPI(input, onStep) {
    return new Promise(function (resolve, reject) {
      var payload = {};
      if (input && input.file) {
        payload.type = 'image';
        payload.fileName = input.file.name || '';
      } else {
        payload.type = 'sample';
        payload.sampleId = (input && input.sampleId) || 'q-valence';
      }

      // 提示：图片建议转成 base64 或 FormData 后上传；
      // 真实部署时 API Key 应放在服务端（如 Cloudflare Worker），不要写在前端。
      fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (onStep) onStep(STEPS.length, '分析完成');
          resolve(data);
        })
        .catch(reject);
    });
  }

  /* —— 生成同类题（按难度） —— */
  function generateSimilar(question, index) {
    var q = question || {};
    if (CONFIG.enabled && CONFIG.endpoint) {
      // TODO: 接入真实 API 时，调用同类题生成接口
    }
    var train = q.train || [];
    return train[index] || train[0] || null;
  }

  function findQuestion(input) {
    var id = (input && input.sampleId) || 'q-valence';
    var list = (window.APP && APP.questions) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return list[0] || {};
  }

  return {
    CONFIG: CONFIG,
    STEPS: STEPS,
    analyze: analyze,
    generateSimilar: generateSimilar
  };
})();
