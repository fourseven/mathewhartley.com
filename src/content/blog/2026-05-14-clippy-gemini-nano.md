---
title: Local LLMs in Chrome and what I'm building with them
date: 2026-05-14
tags: AI, Chrome, JavaScript, Experiments
---

Google shipped a small language model inside Chrome. Gemini Nano runs on your device: no API keys, no cloud calls, works offline. It also downloads itself in the background without asking first, which is why people are annoyed to find a 4GB file they never agreed to. I was too, at first.

But I still like the underlying idea: a model that runs entirely on your machine, so nothing you type leaves the browser. Google's a bad company to make the "your data stays local" pitch, but it still proves the model works.

The obvious build is an extension: a Grammarly-style proofreader or translator that never sends a byte anywhere. No subscription, no company in the middle. The more ambitious version is a concierge that watches what you're doing and offers help, which is basically what I've ended up building on my personal site.

My first experiment was Clippy, a replica of the old Microsoft Office assistant. Except this one actually works. He watches visitor behavior (scroll depth, idle time, rage clicks) and makes sarcastic comments about it. He remembers conversations across page navigations, because I feed his previous lines back in each time. He changes mood depending on whether you've dismissed him or come back to a page. All of it runs locally in the browser. It's a toy, but one I couldn't have built with a cloud API: the site's static, so there's nowhere to stash an API key, and paying for inference for every visitor would get silly fast.

I've also got a never-ending story page (linked from my works section) where the model just keeps generating. You land on it, it starts a story, and it never really stops. The jank is part of the appeal: it hallucinates, goes on weird tangents, occasionally generates text that reads like a warehouse safety manual. None of it is good writing, but it runs on your machine for free and it doesn't stop.

I'm not sure what to build next, but I want to keep going. I like the quirkiness of the old pre-social-media web: weird experiments people built because they could, not because they were products. Local models feel like they could enable more of that. Smaller, weirder, more personal things that don't need a business model or a privacy policy. If you've got ideas for experiments I should try, send them over.
