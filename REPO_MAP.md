# SpendFence — Repository Map

A Next.js 16 / React 19 PWA for adaptive budgeting ("spending fences"). Auth, billing, and bank
connections are server-backed (Supabase + Stripe + Teller/Plaid); the actual budgeting data model
lives **client-side in `localStorage`**. AI is provided by **Groq only** and is used for a small set
of optional, review-first features. Most "intelligence" in the app is deterministic rule logic, not AI.

---

## 1. Folder structure

```
SpendFence/
├── app/                          # Next.js App Router (pages + API routes)
│   ├── api/
│   │   ├── ai/                    # AI endpoints (Groq-backed, all with local fallbacks)
│   │   │   ├── analyze-receipt/        → re-export of receipt-analysis
│   │   │   ├── categorize-purchase/    → purchase category suggestion
│   │   │   ├── categorize-transaction/ → re-export of categorize-purchase
│   │   │   ├── fence-suggestions/      → premium-only fence refinement (ORPHANED, see §10)
│   │   │   ├── premium/                → premium AI capability manifest (all "planned")
│   │   │   ├── receipt-analysis/       → receipt OCR-text → line items/splits
│   │   │   └── spending-insight/       → basic single insight (ORPHANED, see §10)
│   │   ├── developer/status/      # developer-tier gate check
│   │   ├── plaid/                 # Plaid link-token / exchange / import
│   │   ├── stripe/                # checkout, portal, subscription, webhook
│   │   └── teller/                # accounts, config, enrollments, transactions
│   ├── dashboard/                 # primary signed-in view (renders one dashboard insight)
│   ├── categories/                # fences list + per-category detail (renders local fence guidance)
│   ├── add-purchase/              # manual entry + receipt scanner entry point
│   ├── transaction-review/        # imported-transaction review + AI categorization
│   ├── receipt-scanner/, reports/, notifications/, onboarding/, checkout/, premium/
│   ├── settings/                  # ~14 settings subpages (ai, bank-sync, budget-cycle, security…)
│   ├── (marketing) /, features/, pricing/, philosophy/, security/, adaptive-ai/
│   ├── privacy/, terms/           # public legal pages
│   ├── login/, signup/, forgot-password/, security/
│   ├── demo/route.ts              # demo-mode entry
│   ├── robots.ts, sitemap.ts      # SEO metadata routes
│   └── layout.tsx, globals.css
├── components/
│   ├── marketing/marketing-site.tsx   # all marketing + legal page rendering + footer
│   ├── banking/teller-connect-button.tsx
│   ├── insights/                      # insight rendering components
│   ├── app-shell, purchase-form, category-card, bank-sync-card, charts, ui, settings-ui …
├── lib/
│   ├── ai/
│   │   ├── groq.ts                # the ONLY model client (OpenAI-compatible Groq endpoint)
│   │   ├── adaptive-fences.ts     # local rule engine for fence suggestions (the real brain)
│   │   ├── fence-learning.ts      # accept/dismiss feedback weighting
│   │   ├── premium/capabilities.ts# manifest of "planned" premium AI (not implemented)
│   │   └── types.ts
│   ├── insights/                  # behavioral-insights.ts (rule-based observations) + types
│   ├── reports/report-metrics.ts  # variance, trend, recurring, cycle-timing math
│   ├── rules/                     # user spending-rule engine + evaluator + types
│   ├── store.tsx                  # localStorage-backed app state (categories, purchases, etc.)
│   ├── budget.ts, categorization.ts, recurring.ts
│   ├── auth.tsx, server-auth.ts, supabase.ts, tier.ts, feature-flags.ts
│   ├── stripe/server.ts, teller/server.ts
│   └── mock-data.ts               # demo-mode seed data
├── supabase/                      # SQL migrations / schema (auth, bank_connections, subscriptions)
├── certificates/                  # Teller mTLS cert/key (gitignored)
└── public/                        # PWA manifest, service worker (sw.js), icons, brand assets
```

---

## 2. AI-related files

| File | Role |
|------|------|
| `lib/ai/groq.ts` | The single LLM client. `callGroqJson()` wraps the Groq chat-completions API in JSON mode, with a typed `fallback` returned whenever the key is missing or the call fails. Also exports `redactSensitiveFinancialText()` and `AI_TONE_INSTRUCTIONS`. |
| `app/api/ai/categorize-purchase/route.ts` | Suggests one category for a purchase. **Wired** (used by transaction-review). |
| `app/api/ai/receipt-analysis/route.ts` | Parses receipt text into line items + category splits. **Wired** (used by add-purchase). |
| `app/api/ai/categorize-transaction/route.ts` | One-line re-export of categorize-purchase. |
| `app/api/ai/analyze-receipt/route.ts` | One-line re-export of receipt-analysis. |
| `app/api/ai/fence-suggestions/route.ts` | Premium-only Groq *refinement* of local fence suggestions. **Orphaned** (no client caller). |
| `app/api/ai/spending-insight/route.ts` | Basic single insight. **Orphaned** (no client caller). |
| `app/api/ai/premium/route.ts` | Returns the premium capability manifest — all entries `status: "planned"`. |
| `lib/ai/premium/capabilities.ts` | Static list of unbuilt premium AI features. |
| `lib/ai/adaptive-fences.ts` | **Not AI** despite the folder — pure deterministic rule engine that generates fence suggestions; the AI route only post-edits its output. |
| `lib/ai/fence-learning.ts` | Adjusts suggestion ranking based on prior accept/dismiss events. |

---

## 3. Prompt files

There are **no dedicated prompt files / templates**. All prompts are inline string arrays inside the
route handlers, joined with the shared `AI_TONE_INSTRUCTIONS` constant from `lib/ai/groq.ts`:

- `AI_TONE_INSTRUCTIONS` (groq.ts): "calm, adult, concise, supportive, non-shaming … no financial advice … return strict JSON."
- System prompts live at: `categorize-purchase/route.ts` (~L34), `receipt-analysis/route.ts` (~L27),
  `fence-suggestions/route.ts` (~L33, the most defensive — explicit anti-hallucination guardrails),
  `spending-insight/route.ts` (~L19).

Every call uses `temperature: 0` and `response_format: { type: "json_object" }`.

---

## 4. OpenAI / Anthropic integrations

- **No Anthropic integration exists.**
- **No direct OpenAI integration exists** either. The only model provider is **Groq**, called at
  `https://api.groq.com/openai/v1/chat/completions` (Groq's OpenAI-*compatible* endpoint). Default
  model `llama-3.1-8b-instant`, overridable via `GROQ_MODEL`.
- ⚠️ `OPENAI_API_KEY` and `AI_PROVIDER` exist in `.env` but are **never read anywhere in code** — dead
  config that implies a provider abstraction that was never built. `hasGroqConfig()` only checks
  `GROQ_API_KEY`.

---

## 5. How observations are generated

"Observations" = **behavioral insights**, and they are **100% rule-based / deterministic — no AI**.

- Entry point: `generateBehavioralInsights(state, options)` in `lib/insights/behavioral-insights.ts`.
- It composes several pure generators: `emptyInsights`, `gentleCautionInsights`,
  `generateSpendingRuleInsights` (from `lib/rules/rule-engine.ts`), `recoveryInsights`,
  `positiveControlInsights`, `stabilizationInsights`, `trendInsights`, and `reportNarrativeInsights`.
- Math comes from `lib/reports/report-metrics.ts` (variance, trend deltas, recurring detection,
  cycle timing) and `lib/budget.ts` (cycle windows, category progress).
- Results are tagged, filtered by placement (`dashboard` | `category` | `reports`), de-duplicated,
  and sorted by a priority score (`buildInsightPriorityScore`).
- Placement selectors: `selectDashboardInsight` (top 1), `selectCategoryInsight`, `selectReportInsights`
  / `selectSmartReportInsights` (rotates by cycle, caps warnings at 1).
- The type carries a `source: "local_rules" | "future_ai"` field — today everything is `local_rules`.

---

## 6. How budget guidance is generated

"Budget guidance" = **adaptive fence suggestions**. This is the one place with a **hybrid** path,
but it is **local-rules-first**.

- Core engine: `generateLocalFenceSuggestions(input)` in `lib/ai/adaptive-fences.ts` — fully
  deterministic. Per category it evaluates: overrun / near-limit / projected-overage, recent-cycle
  averages, consistent underuse, pacing ahead of cycle, weekend clustering, recurring base; plus
  pacing rules promoted from the user's spending rules. Each suggestion ships with quantitative
  `evidence` (usage %, cycle progress %, projected end spend) and a confidence/priority.
- `lib/ai/fence-learning.ts` reweights ranking using prior accept/dismiss events.
- **What the UI actually renders:** `app/categories/page.tsx` calls `generateLocalFenceSuggestions`
  **directly, client-side** (no network, no AI) and maps suggestions onto category cards.
- **The optional AI layer:** `/api/ai/fence-suggestions` takes the local suggestions and asks Groq to
  *reword* them (premium tier only), under strict guardrails ("preserve categoryId/limits", "never
  invent pressure", "if evidence weak, keep local"). `normalizeAdaptiveSuggestions` re-validates the
  model output against the local evidence and `safeGroundedText` strips broad/unsupported claims.
  **This endpoint currently has no caller**, so in practice guidance is local-only today.

---

## 7. How reports are generated

- Report **metrics** are computed in `lib/reports/report-metrics.ts` (spending variance, trend
  changes, recurring behavior, category totals, cycle timing) — deterministic.
- Report **narrative** comes from rule-based behavioral insights via
  `selectReportInsights` → `selectSmartReportInsights` (placement `"reports"`), which rotates content
  per cycle and limits warnings so reports don't feel alarmist.
- `app/reports/page.tsx` renders these metrics + insights with Recharts visualizations.
- "AI-generated monthly reports" is listed in `premium/capabilities.ts` as `status: "planned"` — **not
  implemented**.

---

## 8. Are recommendations rule-based, AI-based, or hybrid?

| Surface | Classification | Notes |
|---------|----------------|-------|
| Behavioral observations (dashboard/category/reports) | **Rule-based** | No model call at all. |
| Fence / budget guidance | **Hybrid (local-first)** | Local rules generate + decide; Groq only rewords for premium, and that path is currently orphaned → effectively rule-based in production. |
| Purchase categorization | **Hybrid** | `categorizeTransaction` (local heuristics + merchant rules) is the fallback; Groq refines when the key is present. Output validated against allowed category IDs. |
| Receipt analysis | **Hybrid** | Regex/heuristic fallback parser; Groq does the real parsing when available. Always review-first. |
| Reports | **Rule-based** | Deterministic metrics + rule-based narrative. |
| Premium "predictive" features | **Neither (unbuilt)** | All `status: "planned"`. |

**Overall:** the product is fundamentally **rule-based**, with AI as an optional refinement/extraction
layer on two wired surfaces (categorization, receipts). Every AI path has a deterministic fallback and
re-validates model output, so the app degrades gracefully with no API key.

---

## 9. Data flow: user action → rendered insight

Example A — **manual purchase → dashboard observation** (no network):
```
User submits purchase (app/add-purchase → purchase-form)
  → store.addPurchase() mutates SpendFenceState (lib/store.tsx)
  → state persisted to localStorage (key: spendfence:<userId>)
  → dashboard reads state via useSpendFence()
  → selectDashboardInsight(state) → generateBehavioralInsights() [pure rules]
  → top insight rendered in app/dashboard/page.tsx
```

Example B — **imported transaction → AI category suggestion** (network):
```
Teller/Plaid import → store imported transactions (localStorage)
  → app/transaction-review POSTs to /api/ai/categorize-purchase
  → route builds local fallback (categorizeTransaction) then calls Groq (groq.ts)
  → output validated against allowed category IDs (normalizeCategorization)
  → user reviews/accepts → store.acceptImported() writes purchase + merchant rule
  → subsequent insights/guidance recompute from updated state
```

Example C — **fence guidance** (local, client-side):
```
app/categories/page.tsx → generateLocalFenceSuggestions(state slices) [pure rules]
  → suggestions mapped onto CategoryCard guidance
  → accept/dismiss → store records FenceLearningEvent → reweights future ranking
```

**Persistence reality:** categories, purchases, recurring items, rules, and suggestion caches live in
`localStorage` per user (`lib/store.tsx`). Supabase persists only **auth**, **`bank_connections`**, and
**`subscriptions`**. Stripe webhooks update the subscriptions table; Teller writes connection rows.

---

## 10. Technical debt and weaknesses

**Architecture / data**
1. **Financial data is localStorage-only.** Categories/purchases/rules never reach a server DB. This
   means no cross-device sync, no backup, and total data loss if the user clears site data or switches
   devices/browsers. For a distribution-ready finance app this is the single biggest risk.
2. **Bank-synced transactions also land in localStorage**, so connecting an account doesn't give the
   durability users will expect from a fintech product.

**AI layer**
3. **Dead provider config.** `OPENAI_API_KEY` / `AI_PROVIDER` are referenced nowhere; only Groq is
   wired. Either build the provider abstraction or remove the env vars to avoid implying a fallback
   that doesn't exist.
4. **Orphaned endpoints.** `/api/ai/spending-insight` and `/api/ai/fence-suggestions` have no client
   callers. The premium fence-refinement path (the only thing gating fences behind premium) is
   therefore unreachable in the UI — premium users get the same local guidance as free users.
5. **Single hard-coded model with no retry/abstraction.** `llama-3.1-8b-instant` on Groq; Groq has a
   history of deprecating models, and there's no provider failover. A bad model id silently degrades
   every AI feature to fallback (good for resilience, bad for silent quality loss — no logging/metrics).
6. **No observability on AI.** `callGroqJson` swallows all errors (`catch { return fallback }`) with no
   logging, so failures and quality regressions are invisible. Pair with the earlier note that the app
   has no Sentry/analytics at all.
7. **Misleading namespace.** `lib/ai/adaptive-fences.ts` and the `/api/ai/*` grouping suggest AI, but
   the real logic is deterministic. Fine internally, but worth keeping in mind when reasoning about
   "AI" claims in marketing/privacy copy.

**Product / packaging**
8. **Premium value is mostly aspirational.** Every entry in `premium/capabilities.ts` is `status:
   "planned"`, and the one implemented premium gate (fence refinement) is orphaned (#4). Worth auditing
   what a paying user actually receives today before charging via Stripe.
9. **Mock/demo data in the bundle.** `lib/mock-data.ts` / `createDemoState()` ship in the app; demo
   vs. real state is toggled in `store.tsx`. Verify the demo path can never bleed into a real user's
   persisted data (the keying looks correct, but it's a class of bug worth a test).
10. **Two bank providers (Plaid + Teller).** Double the integration surface, certs (`certificates/`),
    and webhook/edge-case maintenance for a solo dev. Consider committing to one.
11. **Service worker can serve stale shells** (noted separately): `sw.js` caches navigations with
    `skipWaiting()` and no update prompt.

**Suggested priority order:** (1) move budgeting data to Supabase with sync → (4) wire or delete the
orphaned AI endpoints and clarify the premium offering → (6) add AI error logging once observability
exists → (3) remove dead provider env → (10) pick one bank provider.
```
