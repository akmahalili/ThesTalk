'use strict';
/*
 * Semak Persamaan: abstracts of the cited works come from OpenAlex (by DOI in batches, by title for
 * a few without DOI). The AI only suggests a paraphrase for one flagged sentence at a time and must
 * keep its citations, numbers and meaning.
 */
const isMalay = l => /melayu|malay|^ms$/i.test(String(l || ''));

function paraphrasePrompt(language) {
  return [
    `You help a student rewrite one sentence of a thesis in ${language} so it no longer repeats the wording of a source, while keeping its meaning.`,
    'Change the sentence structure and the vocabulary; keep technical terms, construct names, numbers and statistics exactly.',
    'Keep every in-text citation exactly as written, e.g. (Hair et al., 2019) or Hair et al. (2019). If the sentence has no citation, do not add one.',
    'Do not add new facts, claims or examples. Write one or two sentences, formal academic style.',
    'Return JSON only: {"paraphrase": string}'
  ].join('\n');
}

/* Every citation and every number of the original must still be in the paraphrase. */
function kept(before, after) {
  const cites = s => (String(s).match(/\([^()]*\b(?:1[89]|20)\d{2}[a-z]?\b[^()]*\)|[A-Z][\p{L}'-]+(?: et al\.| (?:&|and|dan) [A-Z][\p{L}'-]+)? \((?:1[89]|20)\d{2}[a-z]?\)/gu) || []).map(x => x.replace(/\s+/g, ' '));
  const nums = s => String(s).match(/\d+(?:\.\d+)?/g) || [];
  const has = (list, s) => list.every(x => s.includes(x));
  const a = String(after).replace(/\s+/g, ' ');
  return has(cites(before), a) && has(nums(before), a);
}

module.exports = { isMalay, paraphrasePrompt, kept };
