'use strict';
/* "Pilih AI": the app chooses Gemini, Claude or ChatGPT per request. */
const test = require('node:test');
const assert = require('node:assert/strict');
const common = require('../lib/common');
const status = require('../api/status');

const KEYS = ['AI_DISABLED', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'AI_PROVIDER', 'CLAUDE_MODEL', 'OPENAI_MODEL', 'THESTALK_AI_ACCESS_CODE'];
function withEnv(env, fn) {
  return async () => {
    const saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]));
    KEYS.forEach(k => delete process.env[k]);
    Object.assign(process.env, env);
    const realFetch = global.fetch;
    try { await fn(); } finally {
      global.fetch = realFetch;
      KEYS.forEach(k => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
    }
  };
}
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test('provider: requested AI is used only when its key exists', withEnv({ GEMINI_API_KEY: 'g', ANTHROPIC_API_KEY: 'a' }, () => {
  assert.equal(common.provider('claude'), 'claude');
  assert.equal(common.provider('anthropic'), 'claude');
  assert.equal(common.provider('openai'), 'gemini'); // no OpenAI key, so the free default
  assert.equal(common.provider('chatgpt'), 'gemini');
  assert.equal(common.provider(''), 'gemini');
  assert.equal(common.pick({ headers: { 'x-thestalk-ai': 'claude' } }), 'claude');
  assert.deepEqual(common.available(), { gemini: true, claude: true, openai: false });
}));

test('provider: Claude alone is enough to configure the app', withEnv({ ANTHROPIC_API_KEY: 'a', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, () => {
  assert.equal(common.configured(), true);
  assert.equal(common.provider(), 'claude');
}));

test('Claude request uses the Messages API and returns the text', withEnv({ ANTHROPIC_API_KEY: 'sk-ant-test' }, async () => {
  let seen;
  global.fetch = async (url, opts) => { seen = { url, opts, body: JSON.parse(opts.body) }; return reply(200, { content: [{ type: 'text', text: 'Helo dari Claude' }] }); };
  const out = await common.askAI('Be helpful', [{ role: 'assistant', content: 'hi' }, { role: 'user', content: 'a' }, { role: 'user', content: 'b' }], 600, { provider: 'claude' });
  assert.equal(out, 'Helo dari Claude');
  assert.equal(seen.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(seen.opts.headers['x-api-key'], 'sk-ant-test');
  assert.equal(seen.opts.headers['anthropic-version'], '2023-06-01');
  assert.equal(seen.body.model, 'claude-sonnet-5-5');
  assert.equal(seen.body.system, 'Be helpful');
  // Leading assistant turn dropped, consecutive user turns merged.
  assert.deepEqual(seen.body.messages, [{ role: 'user', content: 'a\n\nb' }]);
  assert.equal(seen.body.provider, undefined);
}));

test('Claude JSON requests get a JSON-only reminder', withEnv({ ANTHROPIC_API_KEY: 'k' }, async () => {
  let body;
  global.fetch = async (url, opts) => { body = JSON.parse(opts.body); return reply(200, { content: [{ type: 'text', text: '{"a":1}' }] }); };
  await common.askAI('Plan', 'idea', 400, { text: { format: { type: 'json_object' } }, provider: 'claude' });
  assert.match(body.system, /valid JSON object only/);
  assert.equal(body.text, undefined);
}));

test('Claude falls back to Haiku when Sonnet is unavailable', withEnv({ ANTHROPIC_API_KEY: 'k' }, async () => {
  const models = [];
  global.fetch = async (url, opts) => { const m = JSON.parse(opts.body).model; models.push(m); return m === 'claude-sonnet-5-5' ? reply(529, { error: { message: 'Overloaded' } }) : reply(200, { content: [{ type: 'text', text: 'ok' }] }); };
  assert.equal(await common.askAI('s', 'x', 100, { provider: 'claude' }), 'ok');
  assert.deepEqual(models, ['claude-sonnet-5-5', 'claude-haiku-5-5']);
}));

test('Claude with no credits gives a clear message', withEnv({ ANTHROPIC_API_KEY: 'k' }, async () => {
  global.fetch = async () => reply(400, { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } });
  await assert.rejects(common.askAI('s', 'x', 100, { provider: 'claude' }), e => e.status === 402 && /credits are used up/.test(e.message));
}));

test('ChatGPT request uses GPT-5.6 Terra with low reasoning', withEnv({ OPENAI_API_KEY: 'sk-test', GEMINI_API_KEY: 'g' }, async () => {
  let seen;
  global.fetch = async (url, opts) => { seen = { url, body: JSON.parse(opts.body) }; return reply(200, { output_text: 'Helo dari ChatGPT' }); };
  assert.equal(await common.askAI('s', 'x', 700, { provider: 'openai' }), 'Helo dari ChatGPT');
  assert.equal(seen.url, 'https://api.openai.com/v1/responses');
  assert.equal(seen.body.model, 'gpt-5.6-terra');
  assert.deepEqual(seen.body.reasoning, { effort: 'low' });
  assert.equal(seen.body.max_output_tokens, 2100);
  assert.equal(seen.body.provider, undefined);
}));

test('ChatGPT quota error says credits are used up', withEnv({ OPENAI_API_KEY: 'k' }, async () => {
  global.fetch = async () => reply(429, { error: { message: 'You exceeded your current quota, please check your plan and billing details.', type: 'insufficient_quota' } });
  await assert.rejects(common.askAI('s', 'x', 100, { provider: 'openai' }), e => e.status === 429 && /credits are used up/.test(e.message));
}));

test('status lists which AIs are switched on, without secrets', withEnv({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o', THESTALK_AI_ACCESS_CODE: 'secure-test-code-16' }, async () => {
  const r = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } };
  await status({ method: 'GET', headers: { 'x-thestalk-access': 'secure-test-code-16' } }, r);
  assert.deepEqual(r.body.providers, { gemini: true, claude: false, openai: true });
  assert.equal(r.body.defaultProvider, 'gemini');
  assert.ok(!JSON.stringify(r.body).includes('"o"'));
  const locked = { headers: {}, setHeader() {}, end(b) { this.body = JSON.parse(b); } };
  await status({ method: 'GET', headers: {} }, locked);
  assert.deepEqual(locked.body.providers, { gemini: false, claude: false, openai: false });
}));

test('AI_DISABLED hides an AI even when its key exists', withEnv({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o', AI_DISABLED: 'chatgpt' }, () => {
  assert.deepEqual(common.available(), { gemini: true, claude: false, openai: false });
  assert.equal(common.provider('openai'), 'gemini');
}));
