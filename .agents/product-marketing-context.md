# Product Marketing Context

*Last updated: 2026-04-11*

## Product Overview

**One-liner:** Vela is a bespoke jewellers digital concierge that guides clients from inspiration through design, 3D configuration, try-on, and ownership of their piece.

**What it does:** The app combines AI-assisted design exploration, a 3D jewellery configurator, AR try-on, journey tracking, ring sizing, and personal areas (profile, wishlist, jewellery box) in a luxury, mobile-first experience aligned with an atelier brand.

**Product category:** Luxury bespoke jewellery / high-end custom jewellery retail and client experience.

**Product type:** Client-facing web app (concierge + design tools); ties to AI Studio / Gemini for generative features.

**Business model:** TBD in business systems — treat as high-touch bespoke sales (consultation-led, not self-serve commodity). Pricing and fulfillment live outside this repo.

## Target Audience

**Target companies:** N/A (B2C / direct client).

**Decision-makers / buyers:** Affluent individuals and gift buyers commissioning or co-designing fine jewellery; often time-poor, quality- and heritage-sensitive.

**Primary use case:** Move from “I want something meaningful and unique” to a confident design direction, visualization, and relationship with the maker — without the friction of generic e-commerce.

**Jobs to be done:**

- “Help me imagine and refine a piece that reflects my story.”
- “Let me see it on me / in 3D before I commit.”
- “Keep me oriented in the process — I’m investing emotion and money.”

**Use cases:**

- Exploring AI-guided design directions.
- Configuring metal, stones, and details in 3D.
- AR try-on for rings or featured pieces.
- Tracking commission journey and milestones.
- Ring sizing and wishlist / saved pieces.

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| **Client (commissioner)** | Uniqueness, trust, craft proof, clarity of process | Fear of wrong choice, opacity, pushy sales | Calm guidance, visualization, atelier narrative |
| **Gift giver** | Emotional impact, confidence in fit/style | Guessing taste and size | Wishlist, sizing tools, consultative tone |
| **Concierge / staff** *(if internal tools grow)* | Consistency of brand, fewer rework loops | Fragmented client context | Single premium thread from browse to order |

## Problems & Pain Points

**Core problem:** Luxury jewellery buying online often feels either **generic** (mass templates) or **opaque** (hard to visualize, no sense of craft or process).

**Why alternatives fall short:**

- Traditional e-commerce grids don’t support emotional, bespoke decisions.
- Static imagery doesn’t answer “how will it look on me?” or “how do options combine?”
- Process anxiety: clients don’t know what happens after they express interest.

**What it costs them:** Wrong purchases, delayed decisions, lost trust, or defaulting to a safer but less meaningful competitor.

**Emotional tension:** Desire for something exceptional vs. fear of expensive mistakes; wanting to feel seen, not sold to.

## Competitive Landscape

**Direct:** Other bespoke / custom jewellery brands with digital configurators — often weaker mobile UX or less cohesive story-to-design flow.

**Secondary:** High-end marketplaces and big luxury maisons — strong brand but less personalization or local craft narrative.

**Indirect:** Off-the-shelf fine jewellery retailers, Pinterest/mood boards without execution path — inspiration without a guided path to a real piece.

## Differentiation

**Key differentiators:**

- Unified journey: AI design, 3D build, try-on, and journey tracking in one restrained luxury shell.
- Atelier positioning (craft, legacy, mastery) embedded in UX copy and visual tone.
- Performance-aware choices (e.g. avoiding gratuitous GPU on hero where CSS suffices).

**How we do it differently:** Fewer, clearer steps; premium typography and spacing; tooling that supports **decision confidence**, not feature sprawl.

**Why that's better:** Clients feel guided and in control, which matches high-ticket emotional purchases.

**Why customers choose us:** Trust in craft + ability to **see and personalize** before commitment.

## Objections

| Objection | Response |
|-----------|----------|
| “I can’t tell if it will look good on me.” | AR try-on, 3D views, consultative copy; invite human follow-up where needed. |
| “This looks like every ‘luxury’ app.” | Lean on specific craft story, restrained motion, and token discipline — not generic gold gradients. |
| “Is my data / design safe?” | Clear privacy and process copy; professional tone; technical diligence on API usage. |

**Anti-persona:** Bargain-hunters seeking fastest cheapest SKU; users who want zero human touch and instant checkout for complex bespoke pieces without consultation.

## Switching Dynamics

**Push:** Frustration with generic jewellery sites, poor visualization, or unclear bespoke process.

**Pull:** Beautiful, calm UX; tangible visualization; sense of heritage and mastery.

**Habit:** Returning to familiar big-brand sites or local jeweller without digital proof.

**Anxiety:** Price, timeline, and whether the digital experience matches real-world quality.

## Customer Language

**How they describe the problem:**

- “I want something no one else has.”
- “I need to *see* it before I spend this much.”
- “I don’t want to feel rushed or sold.”

**How they describe us (desired):**

- “It felt like an atelier, not a website.”
- “I could actually picture the ring on my hand.”

**Words to use:** Bespoke, atelier, craft, legacy, commission, piece, journey, yours.

**Words to avoid:** Cheap, deal, hack, insane, crushing it, generic “luxury lifestyle” filler.

**Glossary:**

| Term | Meaning |
|------|---------|
| **Configurator3D** | In-app 3D jewellery builder route (`/design/3d`). |
| **Try On** | AR / camera-assisted preview (`/try-on`). |
| **Journey** | Client-facing progress / milestones for their commission. |

## Brand Voice

**Tone:** Confident, warm, precise — never loud or gimmicky.

**Style:** Short lines; uppercase tracking for labels sparingly; serif for emotional headlines, sans for UI chrome.

**Personality:** Master craft, quiet luxury, trustworthy guide, patient expert.

## Proof Points

**Metrics:** TBD — fill when analytics and conversion definitions exist.

**Customers:** TBD — notable clients or press when available.

**Testimonials:**

> *[Add verified client quotes when available.]*

**Value themes:**

| Theme | Proof |
|-------|--------|
| Craft heritage | Named mastery / years of experience in hero and About-adjacent copy |
| Visualization | 3D + try-on flows |
| Process clarity | Journey tracker and calm step-by-step language |

## Goals

**Business goal:** Increase qualified bespoke enquiries and completed commissions with high satisfaction.

**Conversion action:** Deep engagement (configurator / try-on / journey) and contact or consultation booking — define exact CTA when funnel is finalized.

**Current metrics:** Not captured in-repo; align with stakeholder goals.
