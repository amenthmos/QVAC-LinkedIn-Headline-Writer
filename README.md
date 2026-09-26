# QVAC-LinkedIn-Headline-Writer

Enter your role and a few key strengths or achievements, get a punchy professional LinkedIn headline built from those specific details. On-device AI, no cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:30102

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown. The GUI (`src/gui.js`) is a small HTTP server: the page POSTs the form fields to `/api/headline`, which calls `generate(modelId, { role, strengths })` in `src/logic.js`.

## Example

**Input:** Role: `Backend engineer` — Strengths/achievements: `cut API latency by 40%, led migration to Kubernetes`

**Output:** `Backend Engineer | Cut API latency 40% | Led our Kubernetes migration`

## Grounding & fallback

`containsAnyTerm()` requires the generated headline to actually retain at least one of the strengths/achievements you typed (or a distinctive word from one); `looksUnusable()` also rejects headlines over 220 characters or that read like a refusal. If either check fails, `fallbackHeadline()` builds a deterministic `Role | strength1 & strength2` headline straight from your input instead of showing a generic, ungrounded line.

## License

MIT
