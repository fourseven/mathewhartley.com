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

The interesting part is probably how I use it? It's been a fun experiment, and I'm still finding the boundaries, but the best parts so far have been:

- Giving it hypotheses for my algo-trading hobby, where it can do the backtests and tell me the outcomes
- Pulling in interesting posts to come back to and feed into the early ideas I have bubbling away, art-styles for an ESP32 companion, how people are using AI in their work that I could learn from
- prodding me to write more on Twitter, LinkedIn, my blog, and helping me brainstorm and structure the writing.
- A few morning briefs across the topics above
- keeping my personal email inbox tidy
- small changes to any repo in my github (headless, ask and it makes a PR)

None of that needs a genius model. It needs a model that's good enough and that I trust enough that it's giving value, because like I said above, I've got no interest spending Opus or Sol prices to get the assists that it's able to provide.

---

I'm posting this now because there's some early hints that the new DeepSeek Flash V4.1 is another example of lightning in a bottle, so I'll probably set that up shortly - I have been running GLM-5.3 Flash which I also love, and compared to 0731 it's multi-modal so I can feed it images and it can understand them which is pretty helpful for a lot of the jobs listed above. If you haven't yet tried it now's a great time, and if you want I can go into more detail on what my setup looks like. Right now it's simple, but it works for me!
