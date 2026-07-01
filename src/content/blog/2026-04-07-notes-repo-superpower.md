---
title: The notes repo that runs itself
date: 2026-04-07
tags: AI, Claude Code, Engineering
---

Tidied up Jul 1 after other AI thought-leaders have stumbled across this pattern too.

End of January, and I was staring at the same blank doc I'd stared at six months earlier - what did I actually do? Our reviews run twice a year, and every time I'd end up digging through git logs for commit messages like "fix tests" and "address review feedback", trying to reconstruct something that felt meaningful from outside my own head.

I'd tried keeping notes the normal way. Every few months a fresh Obsidian vault, full of good intentions, abandoned inside two weeks - switching context to write something down mid-flow is just enough friction to kill the habit, every time.

The thing that changed it wasn't a notes app. Since late last year I've barely hand-written code; I work almost entirely through Claude Code, pair programming with an agent, and an LLM is, if nothing else, very good at outputting text. At some point the obvious question landed: if it's already in the loop on everything I'm doing, why am I still the one writing the notes?

---

This was the visible end of a deeper context problem. I work across about ten repos - Shopify apps, data pipelines, infrastructure - as a mostly-solo staff engineer, with two young kids, working from home across a spread of timezones. Slack alone is enough to pull you out of deep work; stopping to hand-document that work never really stood a chance.

Working with Claude Code full-time added a new shape of the same problem. Every session starts fresh. The agent has no memory of what we did yesterday, what's blocked, which PR is waiting on review, or why we decided that thing last Tuesday, so the first few minutes go to re-gathering context or to correcting it when it's locked onto a completely different approach to yesterday's. Six months of work across multiple products doesn't fit in anyone's head, and my AI couldn't remember yesterday.

---

The fix was embarrassingly small. A markdown repo for weekly notes, and instead of writing them myself I told Claude Code to do it.

The setup is a `CLAUDE.md` with a few instructions: on session start, read this week's notes; during work, log decisions, blockers, and next steps; before ending a session, write down where we left off. The repo has read and write access to all my downstream product repos, and I start every session from there. That's the whole thing - markdown files and instructions to an AI that's already in the loop on everything I'm doing, no fancy tooling, no database, no app.

What I didn't appreciate at the time is that the agent is already doing the work, so it already knows what was decided, what's blocked, what just shipped. The context it needs to do good work and the context I need for good notes are the same thing, which makes getting it written down almost free.

---

The structure grew organically into something simple:

```
weeks/2026-W14.md        # weekly work logs
projects/*.md            # multi-week initiative context
investigations/*.md      # deep-dives, data analysis, incident write-ups
testing/*.md             # manual validation playbooks
```

The weekly file is the core. Each day gets a section at the decision level - what was done, why, what's next - rather than the commit level, and at the bottom of every week is a "Remaining Items" checklist that's the single source of truth for open work. Items never get deleted, only marked done, so it reads as a working list and a history at the same time.

A session start usually looks like Claude reading the current week, seeing "Blocked on Chris for auth token decision, moved to bundles cleanup in the meantime", and picking up exactly there with no re-explanation. When something turns into a multi-week effort it gets a project file, and when I hit a deep investigation or a production incident the write-up lands in `investigations/` - timeline, queries, what we found - already in the shape someone needs when they ask for a post-incident review.

---

I built it to have something to show at performance review time, and that problem is genuinely solved: a quarter's work, structured by week, with the decisions and rationale attached. The payoffs I didn't plan for were the interesting ones.

The biggest is that the notes I was capturing for myself were exactly what the agent needed too. Sessions that start warm - reading the week's notes, knowing what's in flight and what's blocked - are dramatically more useful than sessions that start cold, and the two contexts I'd been maintaining separately collapsed into one.

And because I start every session from the notes repo and it can reach all the product repos, Claude can spin up worktrees, read code, and open PRs across any of them without losing the high-level thread of what we're actually trying to do. There's a stranger payoff in that the same logs make decent analytics on how the work happens - how long an initiative really took, how often we were blocked on a decision, which repos keep generating incident write-ups - because every decision and blocker is already structured markdown. The data was going to get written either way; querying it is the bonus.

A friend messaged me a LinkedIn post the other day where Matt Pollock had landed on the same pattern independently - start every session from a notes folder that reaches the repos. I'd been doing it since the fifth week of the year. It's a strange thing when a workflow you stumbled into shows up in someone else's feed.

---

If you're working with coding agents regularly, the lowest-effort version of this is a markdown file for the week and an instruction to log decisions and next steps before ending a session. What surprised me is how quickly it stops being a notes system and starts being shared memory - I'm honestly not sure anymore where my own recollection of a project ends and the repo's begins. The performance review doc more or less writes itself, which was the whole point. The part I didn't plan for is that I now trust a session more when it starts from those notes than I trust my own memory of what happened.
