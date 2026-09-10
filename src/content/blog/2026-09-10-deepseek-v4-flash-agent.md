---
title: Everyone's talking about Astra. I'm running DeepSeek V4 Flash.
date: 2026-09-10
tags: AI, Agents, Experiments
---

There's a lot of talk about what Astra and the latest Fable (5.1) can do, and it's impressive, but I'm having more fun watching the fight on the flash scale, the cheaper (mostly) Chinese open weights, like GLM and DeepSeek Flash.

I'm not hardware rich so I'm not running Qwen or similar locally, but I do believe the level of impressive intelligence is fast approaching "useful" costs.

---

For me, Christmas was the switch. Claude Opus 4.5 was the model that made me go all in on agentic development, at work and outside it. I had a lot of fun doing small things with Claude Code Web, launched from my phone, with a basic wish-factory of "do this thing" and I could come back and see how it had gotten on, and generally it was good enough to merge for side projects. I also threw some work customer issues at Opus, and it could deconstruct our reporting clickhouse queries and suddenly isolate buggy query logic faster than I was doing a few weeks prior. That was a moment.

The main problem was that I was always conscious of the cost associated. Work was on an enterprise plan and I was generally staying within limits, but I was paying for a Pro plan with Claude and regularly going to touch grass when the usage limits hit, and I couldn't justify spending more.

---

The DeepSeek Flash 0731 checkpoint changed the math. Suddenly millions of tokens of usage was cents, not dollars, and it was feeling as capable, ~8-9 months later, compared to the Opus model that I felt made an impact on my work career.

Suddenly it didn't feel excessive to run Hermes or similar, when prior to that it felt like to get a competent system it would require a USD$200 Claude Max plan or similar, and suddenly I'm spending less than a dollar per day with very heavy usage, and not really minding/micromanaging the output for what I ask of it.

---

So the original question, "what could this do for staying organised", stopped being hypothetical. I run a general purpose agent (Hermes, on a tiny VM) against the boring parts of my week:

- A morning brief before the kids are up: calendar, inbox, the feeds I'd otherwise scroll.
- Email triage: label things, draft replies, flag the ones that actually need a human.
- Repo chores: open PRs, CI state, backlog digests, without opening GitHub.
- This blog: brain dump in, shaped draft out, slop scan, then I edit. This post went through that pipeline.

The list undersells it. The family history project that has stalled for years turns out to be perfect agent work: grinding through census records and shipping indexes for a surname, the kind of tedious-but-careful searching nobody actually enjoys. It runs my algotrading experiments overnight, pulling data and running backtests, then writing up what looked real versus what was noise, so I wake up to a summary instead of a terminal full of output. It trawls LinkedIn, Twitter, and a few dozen blogs for the interesting threads and folds the best ones into the morning brief, which has replaced most of my scrolling. And it nudges me when I haven't posted here in a while, usually pointing out I already half-wrote the post in my notes repo, which is annoying because it's right.

None of that needs a genius model. It needs a cheap model that's genuinely good at tool use, which is exactly what DeepSeek re-post-trained 0731 for. The bigger change is mental: the agent stopped being something I rationed and became something I keep around.

---

I'm posting this now because there's some early hints that the new DeepSeek Flash V4.1 is another example of lightning in a bottle, so I'll probably set that up shortly - I have been running GLM-5.3 Flash which I also love, and compared to 0731 it's multi-modal so I can feed it images and it can understand them which is pretty helpful for a lot of the jobs listed above. If you haven't yet tried it now's a great time, and if you want I can go into more detail on what my setup looks like. Right now it's simple, but it works for me!
