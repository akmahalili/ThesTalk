'use strict';
/* POST /api/analysis — { output, kind, language, uiLang, hypotheses, title } → { result, references } */
const { json, protect, cap, getBody, askAI, pick, fail } = require('../lib/common');
const C = require('../lib/cite');
const A = require('../lib/analysis');

module.exports = async function handler(req, res) {
  if (!protect(req, res)) return;
  try {
    const data = getBody(req, 40000);
    const output = cap(data.output, 30000);
    if (output.replace(/\s+/g, '').length < 20) return json(res, 400, { error: 'Paste the statistical output first.' });
    const kind = A.KINDS.includes(data.kind) ? data.kind : 'auto';
    const language = A.isMalay(data.language) ? 'Bahasa Melayu' : 'English';
    const raw = await askAI(A.instructions(language, data.uiLang === 'en' ? 'en' : 'ms'),
      A.input({ output, kind, hypotheses: cap(data.hypotheses, 3000), title: cap(data.title, 300) }), 2600,
      { text: { format: { type: 'json_object' } }, provider: pick(req) });
    const result = A.clean(C.parseJSONLoose(raw));
    if (!result) return json(res, 502, { error: 'AI could not read this output. Copy the tables again and try once more.' });
    const rendered = C.render(result.writeup, A.METHOD_REFS, language === 'Bahasa Melayu' ? 'ms' : 'en');
    result.writeup = rendered.text;
    // Threshold citations inside the checks list are shown as plain text without numbers.
    const noNums = v => String(v || '').replace(/\s*\[\d+(?:\s*[,;]\s*\d+)*\](?:\s*\[\d+\])*/g, '');
    result.summary = noNums(result.summary);
    result.warnings = result.warnings.map(noNums);
    result.checks.forEach(c => { c.threshold = noNums(c.threshold); });
    // Belt and braces: APA never shows p = .000.
    result.writeup = result.writeup.replace(/\bp\s*=\s*0?\.000\b/g, 'p < .001');
    return json(res, 200, { result, references: rendered.references, ai: pick(req) });
  } catch (e) {
    return fail(res, e);
  }
};
