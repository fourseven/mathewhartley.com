---
title: Local LLMs in Chrome and what I'm building with them
date: 2026-05-14
tags: AI, Chrome, JavaScript, Experiments
---

You may have heard that Google shipped a small local language model inside Chrome. Gemini Nano lives on your device — no API keys, no cloud calls, works offline. This has caused a bit of a rift online, mostly because Chrome downloads it in the background without asking first, and people are understandably annoyed at finding a 4GB file they never agreed to. I get it.

But I still like the underlying idea. An LLM that lives at the edge, where we're not sending everything we type to a company. Google's a bad company to make the "your data stays local" pitch, but it still proves the model works.

So what's actually possible here? The obvious ones are a Grammarly-style tool or translation service as a browser extension — something that proofreads your writing and never sends a byte anywhere. No subscription, no company in the middle. Or a concierge system that watches what you're doing and offers help contextually — which is basically what I've ended up building on my personal site.

My first experiment was Clippy. A replica of the old Microsoft Office assistant, except this one actually works. He watches visitor behavior — scroll depth, idle time, rage clicks — and makes sarcastic comments about it. He remembers conversations across page navigations because I feed his previous lines back in each time. He changes mood based on whether you've dismissed him or come back to a page. All of it runs locally in the browser. It's a toy, but it's also a toy I couldn't have built with a cloud API — the site's static, so there's nowhere to stash an API key, and the cost of running inference for every visitor would get silly fast.

I've also got a never-ending story page (linked from my works section) where the model just keeps generating content. You land on it, it starts a story, and it never really stops. The jank is part of the appeal — the model hallucinates, it goes on weird tangents, it occasionally generates text that reads like a warehouse safety manual. But there's something charming about a story engine that lives entirely on your device and just keeps going.

I'm not sure what to build next, but I want to keep going. I like the quirkiness of the old pre-social-media web — the weird experiments people built because they could, not because they were products. Local models feel like they could enable more of that. Smaller, weirder, more personal things that don't need a business model or a privacy policy. If you've got ideas for experiments I should try, I'm all ears.
