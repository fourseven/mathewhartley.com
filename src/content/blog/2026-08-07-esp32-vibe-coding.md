---
title: ESP32s, vibe coding, and the projects that finally get finished
date: 2026-08-07
tags: Embedded, AI, Arduino, Experiments
---

My degree is in electrical engineering. I mostly chose it because it sounded cooler than "software engineer" at the time, and the idea of working at the intersection of physical and digital was genuinely exciting.

Arduinos were fun, but I was always time-poor and found the feedback loop slow. You'd carve out an evening, spend half of it re-learning the toolchain, another quarter debugging why the I2C addresses don't match the tutorial, and maybe get an LED to blink before bed. One stalled evening and the project goes back in the box.

ESP32s are what those early Arduinos always wished they were: WiFi and BLE built in, dual core, under $10. You don't think twice about ordering five.

But the real difference between now and five or ten years ago is that LLM coding tools exist. I'm comfortable working through an AI, and that changes the shape of what's viable when you're time-poor.

---

Last month I built a NeoPixel clock I'd stalled on for five years. The hardware had survived one kid and one house move. I gave the project to an AI and it one-shotted the whole thing in ten minutes. The missing link turned out to be state management in C++ classes. Something I'd never wrapped my head around solo.

That unblocked something. I started poking around and found projects like RSVPNano and the Waveshare ESP devices: prototyping platforms with everything enclosed. Instead of needing to be mailed a whole suite of parts and waiting for the next delivery to continue, you just unbox and go. That shift alone makes a difference when your tinkering time comes in unpredictable thirty-minute chunks.

I can say "read this sensor, post to a webhook when it's dry, deep sleep between readings" and get a working sketch in seconds. Not a template. Working code with error handling, ready to upload, and it remembers the pinout quirks I'd have to look up every single time. The ADC2 pins don't work during WiFi? The model knows. I don't have to learn it again.

The iteration loop shrinks from "an evening" to "twenty minutes while the kids finish dinner." You spend your mental energy on what you want to build, not on remembering which website had the working BLE example.

---

There seems to be a little renaissance happening in tech circles around these devices. It's really easy to ask a frontier model to write the firmware and have an okay-to-good time. The code writes itself, but you're still wiring real things in the physical world. You're still thinking about pull-up resistors and voltage dividers and why your sensor is returning nonsense at 3.3V. The hardware problems keep it grounded. The software problems mostly disappear.

I've also noticed my five-year-old is getting to the age where writing a prompt and seeing something happen in the real world is genuinely interesting to them. That's a whole other angle I hadn't considered when I blew the dust off that clock.

I have a few things in mind, mostly around an ed-tech physical device. So keep following this space.

For anyone who's wanted to play with hardware but never had the margin: this is the moment. You don't need to hold the full platform in your head anymore. You need to know what you want to build, and be able to describe it clearly. The rest is fast, cheap, and the LEDs light up on the first try more often than they have any right to.