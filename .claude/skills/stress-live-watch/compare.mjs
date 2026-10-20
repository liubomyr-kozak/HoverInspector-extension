// Compares the ground truth of a stress run with what the extension logged, per use case.
// Usage: node compare.mjs result.json
import fs from "fs";

const { truth, recorded, segments, total, duration, errors } = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
// Navigations match by kind (the harness knows the page, the log the URL); key presses by the key
const key = (e) =>
  e.kind === "navigate"
    ? "navigate"
    : e.kind === "keyPress"
      ? `keyPress|${e.kind === "keyPress" && e.value && e.value !== e.label ? e.value : e.label}`
      : `${e.kind}|${e.label}${e.value === "checked" || e.value === "unchecked" ? `|${e.value}` : ""}`;

// LCS alignment: which expected actions were found, in order
function align(expected, got) {
  const n = expected.length;
  const m = got.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = key(expected[i]) === key(got[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const missing = [];
  const extra = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(expected[i]) === key(got[j])) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) missing.push(expected[i++]);
    else extra.push(got[j++]);
  }
  while (i < n) missing.push(expected[i++]);
  while (j < m) extra.push(got[j++]);
  return { matched: dp[0][0], missing, extra };
}

const byUc = {};
const sorted = [...recorded].sort((a, b) => a.time - b.time);
segments.forEach((seg, index) => {
  const next = segments[index + 1];
  const end = next ? next.t0 : Infinity;
  const expected = truth.slice(seg.from, seg.to);
  const got = sorted.filter((e) => e.time >= seg.t0 && e.time < end);
  const result = align(expected, got);
  const bucket = (byUc[seg.uc] ||= { runs: 0, expected: 0, matched: 0, missing: {}, extra: {}, missingSamples: [], extraSamples: [] });
  bucket.runs++;
  bucket.expected += expected.length;
  bucket.matched += result.matched;
  result.missing.forEach((e) => {
    bucket.missing[e.kind] = (bucket.missing[e.kind] || 0) + 1;
    if (bucket.missingSamples.length < 6) bucket.missingSamples.push(`${e.kind} ${e.label}${e.value ? ` (${e.value})` : ""}`);
  });
  result.extra.forEach((e) => {
    bucket.extra[e.kind] = (bucket.extra[e.kind] || 0) + 1;
    if (bucket.extraSamples.length < 6) bucket.extraSamples.push(`${e.kind} ${e.label}${e.value ? ` (${e.value})` : ""}`);
  });
});

let expectedAll = 0;
let matchedAll = 0;
let extraAll = 0;
const rows = Object.entries(byUc).map(([uc, b]) => {
  expectedAll += b.expected;
  matchedAll += b.matched;
  const extra = Object.values(b.extra).reduce((s, v) => s + v, 0);
  extraAll += extra;
  return { uc, runs: b.runs, expected: b.expected, matched: b.matched, rate: `${((100 * b.matched) / b.expected).toFixed(1)}%`, missing: b.missing, extra: b.extra, missingSamples: b.missingSamples, extraSamples: b.extraSamples };
});
const summary = {
  actions: total,
  recordedEvents: recorded.length,
  matched: matchedAll,
  rate: `${((100 * matchedAll) / expectedAll).toFixed(1)}%`,
  extra: extraAll,
  durationSec: Math.round(duration / 1000),
  errors,
};
console.log(JSON.stringify({ summary, rows }, null, 1));
