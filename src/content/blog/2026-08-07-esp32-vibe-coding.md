---
title: ESP32s, vibe coding, and the projects that finally get finished
date: 2026-08-07
tags: Embedded, AI, Arduino, Experiments
---

I spent most of the 2010s tinkering with microcontrollers — a MIDI interface for the Korg Monotribe, the usual sensor-and-LED projects. Somewhere between kids and a staff engineer role, that box of parts went into storage and stayed there.

ESP32s are what Arduinos always wished they were: WiFi and BLE built in, dual core, under $10. You don't think twice about ordering five.

The barrier was never really the hardware though. It was the context switching. You carve out an evening, spend half of it re-learning the toolchain, another quarter debugging why the I2C addresses don't match the tutorial, and maybe get an LED to blink before bed. A single stalled evening and the project goes back in the box for another year.

---

Last month I built a NeoPixel clock I'd stalled on for five years. The hardware had survived one kid and one house move. I gave the project to an AI and it one-shotted the whole thing in ten minutes. The missing link turned out to be state management in C++ classes — something I'd never wrapped my head around solo.

That experience changed how I think about hardware projects. Vibe coding makes them *actually viable* when you're time-poor, not just theoretically possible.

I can say "read this sensor, post to a webhook when it's dry, deep sleep between readings" and get a working sketch in seconds. Not a template I have to fill in — working code with error handling, ready to upload, and it remembers the pinout quirks I'd have to look up every single time. The ADC2 pins don't work during WiFi? The model knows that. I don't have to learn it again.

The iteration loop shrinks from "an evening" to "twenty minutes while the kids finish dinner." You spend your mental energy on what you want to build, not on remembering whether it's `digitalWrite` or `gpio_set_level` or which website had the working BLE example.

---

There's something genuinely satisfying about it that I didn't expect. The code writes itself, but you're still wiring real things in the physical world. You still have to think about pull-up resistors and voltage dividers and why your sensor is returning nonsense at 3.3V. The hardware problems keep it grounded. The software problems mostly disappear.

I have a stack of different ESP32s and Arduinos that might have a new lease of life now. A desk trinket that shows build status. A soil moisture monitor for the vege garden. A BLE bridge that does something mildly useful. None of these are ambitious projects, but they're projects I'd have thought about for six months and never started before.

For anyone who's wanted to play with hardware but never had the margin — this is the moment. You don't need to hold the full platform in your head anymore. You need to know what you want to build, and be able to describe it clearly. The rest is fast, cheap, and the LEDs light up on the first try more often than they have any right to.