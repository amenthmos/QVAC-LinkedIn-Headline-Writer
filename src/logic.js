// QVAC LinkedIn Headline Writer — core logic.
// Turns a role + specific strengths/achievements into one punchy LinkedIn
// headline. Grounded: at least one supplied specific must survive into
// the final headline, or we fall back to a deterministic template.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length < 5) return true;
  if (text.length > 220) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "not enough information"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function stripPreamble(text) {
  return text
    .trim()
    .split("\n")[0]
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .replace(/^sure[,!]?\s*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function keyTerms(str) {
  return str
    .toLowerCase()
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function containsAnyTerm(headline, terms) {
  const lower = headline.toLowerCase();
  return terms.some((term) => {
    // Check the term itself or its most distinctive word (>=4 chars)
    if (lower.includes(term)) return true;
    const words = term.split(/\s+/).filter((w) => w.length >= 4);
    return words.some((w) => lower.includes(w));
  });
}

function fallbackHeadline(role, strengths) {
  const list = keyTerms(strengths);
  const picked = list.slice(0, 2).join(" & ") || strengths.trim();
  return `${role.trim()} | ${picked}`;
}

export async function generate(modelId, { role, strengths }) {
  const roleText = (role || "").trim();
  const strengthsText = (strengths || "").trim();
  if (!roleText || !strengthsText) {
    return { error: "Please fill in both your role and your strengths/achievements." };
  }

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You write single-line, punchy professional LinkedIn headlines. Given a role and specific strengths " +
          "or achievements, write ONE headline (max 220 characters) that weaves in those specific details. " +
          "Never use vague buzzwords like 'passionate', 'synergy', 'go-getter', or 'results-driven' alone without " +
          "a concrete detail. Reply with ONLY the headline text, nothing else.",
      },
      {
        role: "user",
        content: "Role: Backend engineer\nStrengths/achievements: cut API latency by 40%, led migration to Kubernetes",
      },
      {
        role: "assistant",
        content: "Backend Engineer | Cut API latency 40% | Led our Kubernetes migration",
      },
      { role: "user", content: `Role: ${roleText}\nStrengths/achievements: ${strengthsText}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.7, maxTokens: 80 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = stripPreamble(text);

  const terms = keyTerms(strengthsText);
  let headline;
  if (looksUnusable(text) || !containsAnyTerm(text, terms)) {
    headline = fallbackHeadline(roleText, strengthsText);
  } else {
    headline = text;
  }

  return { headline };
}
