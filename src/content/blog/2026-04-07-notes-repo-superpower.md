---
title: The notes repo that accidentally became a superpower
date: 2026-04-07
tags: AI, Claude Code, Engineering
---

Every engineer has the same ritual come performance review time. Open a blank doc, stare at it, then spend two hours trawling git logs trying to remember what you actually did for the last six months. You find commit messages like "fix tests" and "address review feedback" and wonder if you did anything meaningful at all.

We all say we'll keep better notes next time. We never do. Every few months I'd spin up a fresh Obsidian vault, full of good intentions. Two weeks later it's abandoned - the overhead of switching context to write things down mid-flow is just enough to kill the habit every time.

But since late last year, I haven't really hand-written code. I work almost entirely through Claude Code, pair programming with an AI agent. And if there's one thing LLMs are good at, it's outputting text. So - why couldn't it write my notes as I go?

---

Turns out, my notes problem wasn't the only context problem I had.

I work across about ten repos - Shopify apps, data pipelines, infrastructure. I'm a staff engineer, mostly solo, with two young kids, working from home with a team spread across timezones. As much as I try to have clean breaks between work and not-work, it's not always possible. And Slack alone is enough to pull your attention away from deep work - let alone hand-writing notes about the deep work you just lost focus on.

When I started working with Claude Code full-time, a new version of the same problem appeared. Every session starts fresh. The agent has no memory of what you did yesterday, what's blocked, which PR is waiting on review, or why you made that decision last Tuesday. So you spend the first few minutes waiting for it to re-gather context - or correcting it when it's decided on a completely different approach to yesterday.

Six months of work across multiple products doesn't fit in anyone's head, and my AI couldn't remember yesterday.

---

The fix started small. I created a markdown repo - just a place to keep weekly notes. But instead of writing them myself, I told Claude Code to do it.

The setup is simple. There's a `CLAUDE.md` file with instructions: on session start, read this week's notes. During work, log decisions, blockers, and next steps. Before ending a session, write down where you left off. The repo has read/write access to all my downstream product repos, so I always start sessions from here.

That's it. No fancy tooling, no database, no app. Just markdown files and instructions to an AI that's already in the loop on everything I'm doing.

The key insight was that the agent is already doing the work - it knows what decisions were made, what's blocked, what just shipped. Getting it to write that down is almost free. The context it needs to do good work and the context I need for good notes are the same thing.

---

The repo structure grew organically but settled into something pretty simple:

```
weeks/2026-W14.md        # Weekly work logs
projects/*.md            # Multi-week initiative context  
investigations/*.md      # Deep-dives, data analysis, incident write-ups
testing/*.md             # Manual validation playbooks
```

The weekly file is the core of it. Each day gets a section with what happened - not at the commit level, but at the decision level. What was done, why, what's next. At the bottom of every week is a "Remaining Items" checklist - the single source of truth for open work. Items never get deleted, only marked done. It's both a working list and a history.

A typical session start looks like Claude reading the current week's notes, seeing "Blocked on Chris for auth token decision, moved to bundles cleanup in the meantime", and picking up exactly there. No re-explanation needed.

When something turns into a multi-week effort, it gets a project file. When I do a deep investigation or hit a production incident, that gets a detailed write-up in `investigations/` - the timeline, the queries, what we found. That detail is already in the format you need when someone asks for a post-incident review.

---

I built this to have something to show at performance review time. That problem is solved - a quarter's worth of work is already written down, structured by week, with decisions and rationale attached. But the real payoffs were the ones I didn't plan for.

**The AI got better.** Sessions that start with context are dramatically more useful than sessions that start cold. Claude reads the week's notes, knows what's in flight, what's blocked, and picks up where we left off. The notes I was capturing for myself turned out to be exactly what the agent needed too.

**Cross-repo coordination from one place.** I start every session from the notes repo now. It has access to all my downstream product repos, so Claude can spin up worktrees, read code, and create PRs across any of them - all while keeping the high-level context of what we're actually trying to achieve.

**Bespoke analytics on how work happens.** Because every investigation, decision, and blocker is logged in structured markdown, it's easy to query. How long did that initiative actually take? How many times were we blocked waiting on a decision? Which repos are generating the most incident write-ups? The data is just sitting there.

**Showcases write themselves.** We do weekly showcases, and the hardest part is usually distilling a week of context into a two-minute story. Because work gets seeded from Linear tickets, investigations, or Slack conversations - and that context is logged when the work starts - pulling together a showcase is just summarising what's already there.

**Incidents and investigations pay forward.** Every deep-dive gets a detailed write-up as it happens. When someone asks "what went wrong?" or "can you write up a PIR?", the answer is already there. No reconstructing timelines from memory.

---

If you're working with AI coding agents regularly, the single best thing you can do is give them somewhere to write things down.

You don't need to build what I built. Start with a markdown file for the week. Tell your agent to log decisions and next steps before ending a session. That's it. You'll be surprised how quickly it compounds - both for you and for the agent.

The notes repo wasn't planned. It grew out of a simple need to remember what I'd done. But it's become the thing that makes working across multiple products with a stateless AI actually sustainable.

And come performance review time, the doc writes itself.
