---
title: Everyone's talking about Astra. I'm running DeepSeek V4 Flash.
date: 2026-09-10
tags: AI, Agents, Experiments
---

Everyone's talking about Fable 5.1 and GPT-6 Astra, and fair enough, that fight is fun to watch. But the fight I'm actually enjoying is happening a few rungs down the price ladder, with the small fast models. I'm not rich with hardware, so I'm not running Qwen locally or anything like that. But when DeepSeek released V4 Flash (the 0731 checkpoint) I finally got the unlock I needed to set up a general purpose agent.

---

Christmas was the switch. Claude Opus was the model that made me go all in on agentic development, at work and outside it. For the first time the loop of "describe it, let it loose, check the result" was reliable enough to hand real work to.

The problem was the meter. Agent loops burn tokens by design: tool calls, retries, re-reading context, long thinking bursts that end in one shell command. At frontier prices every failed run stings. So you stop experimenting. The agent becomes a vending machine: one careful request, one answer, please don't miss.

---

The 0731 checkpoint changed the math. It's the same 284B mixture-of-experts architecture as the April preview, 13B active parameters, a million token context. DeepSeek re-post-trained it on agent workloads and Terminal Bench went from 61.8 to 82.7, which puts the small model above their own much bigger Pro preview (72.1). The weights are open under MIT, and the API is $0.14 per million tokens in, $0.28 out.

Fable 5.1 and Astra both list at $10 in and $50 out for comparison.

The number I keep coming back to isn't on a benchmark chart: SOTA intelligence from Christmas now costs about a dollar a day to have sitting there helping me whenever I need it. During the OpenClaw craze, the same level of usage and intelligence ran USD $200 a month on subscription. The capability curve didn't move that far in nine months. The price curve collapsed.

---

So the original question, "what could this do for staying organised", stopped being hypothetical. I run a general purpose agent (Hermes, on a tiny VM) against the boring parts of my week:

- A morning brief before the kids are up: calendar, inbox, the feeds I'd otherwise scroll.
- Email triage: label things, draft replies, flag the ones that actually need a human.
- Repo chores: open PRs, CI state, backlog digests, without opening GitHub.
- This blog: brain dump in, shaped draft out, slop scan, then I edit. This post went through that pipeline.

None of that needs a genius model. It needs a cheap model that's genuinely good at tool use, which is exactly what DeepSeek re-post-trained 0731 for. The bigger change is mental: the agent stopped being something I rationed and became something I keep around.

---

Update, September 10: DeepSeek just ran a two day beta of V4.1 Flash (native multimodal, community benchmarks around 350-430 tokens/second), and starting today every V4 Pro API request routes to V4.1 Flash at Flash pricing. The flag tier got demoted into the cheap tier. That's the whole thesis in one changelog entry.

I don't know where the floor is. Every frontier release, I expect the gap to hold, and nine months later a checkpoint I can afford does the thing that made me go all in. For once the cheap model is the interesting one. Next up: teaching the agent to read the school newsletters so the calendar stops depending on me remembering them.
