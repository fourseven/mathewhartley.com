---
title: Five weeks, seven generators, one bunny
date: 2026-09-10
tags: AI, Experiments, Embedded
---

It's a small ESP32-S3 AI assistant. A few people on Twitter have been doing cool things with these, and I tried to replicate them without any luck. The sticking point turned out to be the face: a small creature character, plush-toy energy, that reads well on a little AMOLED screen. You'd think five weeks of AI tooling would make short work of a mascot.

It took seven attempts across five approaches, and the only one that went smoothly was the one where I didn't let the model decide anything.

---

The first round was pure image generation. Gemini variants through OpenRouter, prompted to draw 2×2 and 4×4 grids of creatures so I'd have a style menu. Sounds like a one-prompt job. What it actually needed was an entire QA subsystem: flood-fill scripts to detect broken shapes, automated verifiers, and a style guideline document extracted from the model's own failures. Three rounds on one reference image alone. v1 ignored the brief entirely, v2 drifted off-silhouette, v3 passed. The models also had quirks nobody warns you about: they'd ignore grid layouts I asked for, and invert backgrounds on dark prompts.

---

So I went procedural. A canvas 2D creature prototype one evening. Then a pencil-drawn logo generator with hard rules baked in: six to ten shapes, exactly three colors, readable at 32×32. v2 tightened it further: one silhouette, four to seven large shapes, the character emerging from the lower corner of the frame. These shipped same-day. Deterministic, seed-reproducible, single file each. No QA harness needed because the rules did the work.

That's the pattern that kept repeating: where I specified the rules and made the machine follow them, it worked in a day. Where I asked a model to figure out what the shape should be, it took weeks.

---

Then came 3D, which is where the war started.

The Three.js parametric rig was fine. Robot, ghost, egg, puppy, dino, bunny archetypes with palettes and faces, PNG export. Stylized-good. But it never felt plush. Flat-shaded mascots, not the soft thing I wanted on the device.

The fuzz factory was the same fight in shader form. A WebGPU fur shader chasing one reference image's texture, through four rewrites: scratchy strands, then speckle, then dither-dissolve, then a version I honestly described in the commit history as "we've regressed." Each rewrite got closer to the texture and each one exposed a new way for procedural fur to look wrong.

---

The low point was the image-to-3D shortcut. Feed a bunny image to a model, get a mesh, done. What came out was a Gaussian-splat-derived mesh with 933,000 faces and 186,790 disconnected islands. The largest island was 3,364 faces. Pure fuzz, no solid body underneath. Cleaning it into something usable took a pipeline: voxel distance-field shrink-wrap, fill, morphological closing, marching cubes, then iterated decimation. Six variants failed before one worked. Poisson reconstruction with the bad normals gave me swiss cheese. The wrong erosion gave me hollow lace. Over-smoothing gave me a faceless blob. Aggressive decimation ate the ears.

The final mesh is 600 faces. 298 vertices. A hand-sculpted grade of simple, produced by an afternoon of geometry surgery on a model output that had none.

---

2D canvas mascot: one evening. Plausible-looking 3D bunny: five weeks, seven approaches, and the AI-generated one still needed manual surgery to become a mesh a microcontroller could draw.

The lesson I keep landing on: AI is a fast way to explore a style space and a slow way to land a look. The stuff that shipped was procedural, hand-ruled, and boring on purpose. The device face ended up being firmware-drawn lowpoly expressions, server-driven, and honestly that's the right answer for a screen this small.

Next step is wiring the bunny face onto the device firmware and seeing how it reads on the actual screen. That's the QA process that actually matters.
