---
title: "Two days in: how I set up my laptop for a new job"
date: 2026-09-15
tags: AI, Claude Code, Nix, Engineering
---

I've been at a new role since Monday, two days and counting. It also meant a new laptop (my prior role was on a personal one), so I figured I should think in advance about how I want to work in Sept 2026. I'm starting slow on purpose, adding things as the work needs them so I can absorb each change.

Below is how I've structured things, and what I'm considering next...

## Pre-work: refactoring my nix-darwin config

My main laptop setup lives in a nix-darwin + Home Manager flake. It started life as a config for one M1 Pro MacBook Pro doing everything, and I'd been running it since before LLM coding, so I'd been on the Nix train for a while (deterministic config, more structured than dotfiles).

With a second laptop just for the new role, I needed to sort tools into ones both machines use, ones only work or personal needs, and ones left over from my last job (Clickhouse 😭). So I split the config into common/personal/work.

I picked Determinate Nix, which owns `/etc/nix/nix.conf` and includes `nix.custom.conf`. Before the refactor I overrode that file by hand. Now the Determinate darwin module writes it through `determinateNix.customSettings`: substituters, trusted users, lazy trees.

Standard nixpkgs didn't have recent versions of things like beads or herdr, so I also set up numtide's llm-agents.nix.

I made a few more quality-of-life fixes by asking Claude what was possible: Touch ID for `sudo`, press-and-hold turned off, and Finder and Dock tweaks.

Generally I prefer Nix packages for the obvious management benefits, but I have a few Homebrew casks where there are gaps. Having seen hype around Superlogical, I finally installed Ghostty, configured through Home Manager (option key as alt, Monaspace Neon, auto-updates off).

## Day 1: only what the work needed

**Tools, as they came up.** Getting the monorepo running locally meant adding:

- The Supabase and Doppler CLIs as Homebrew brews in `work.nix`. The nixpkgs Supabase CLI was behind the version our CI uses.
- CodexBar, to keep an eye on usage limits. At my last role I used SwiftBar with a custom script to see Claude usage. I'm unlikely to use only Claude here, so this time I went for something open source that handles both.

I restarted my `~/dw/notes` (dev work) folder ([more on that pattern here](/blog/2026-04-07-notes-repo-superpower)): plain markdown, where every Claude Code session starts, with the monorepo and a clones directory added as extra working directories. The layout:

- `context/`: things that stay true.
- `projects/`: ongoing work.
- `investigations/`: one question each.
- `weekly/`: a log.

The `CLAUDE.md` is short. It asks Claude to log each finished task as one line per topic per day, and to make edits in APFS clones (`cp -Rc`, about 30 seconds including `node_modules`) while validating in the main checkout.

My user-level `CLAUDE.md` holds my code-style preferences:

- YAGNI, small pure functions.
- No comments unless the reason isn't obvious.
- No tautological tests.
- Be subtractive: prefer fixes that remove code (added on day two).

**Skills added on day 1:**

- **`/reflect`**: a coaching retro. I relied on one at my last role, so I rebuilt it here. This version leans more on self-review of my workflows and asks more journaling questions. A script digests the last 24 hours of Claude Code transcripts: prompts, interrupts, rejections, and messages I sent while Claude was mid-turn. Claude asks me a few questions to ground the retro, suggests two to four concrete changes, and finishes with a short journaling prompt. Results go into `reflections/`. This is how I take in changes at a pace I can manage: a small, evidence-based adjustment each evening instead of a big redesign up front.

- **herdr's bundled skill**, so Claude can drive herdr panes and agents when I ask it to. herdr is basically tmux that recognises the coding agents running in its panes: it shows which ones need attention, lets you name and prompt them, and backs workspaces with git worktrees.

The first retro turned up a pattern: I was acting before I'd finished building context. It led to a rule. Before Claude spawns a coding subagent, it shows me the assumptions in the brief, each with a `file:line` source. One subagent had inherited a misreading of a design doc, and this rule is meant to catch that.

## Day 2: handing off side threads

The second retro found one session that had sprawled across seven side quests and never built the thing it set out to build. So I added a rule to my user-level `CLAUDE.md`: when a side thread would take more than about 10 minutes, Claude offers three options. It can park it in the project's next steps, run it as a background subagent, or hand it off.

**Skill added on day 2:**

- **`/claude-handoff`**, adapted from [mattpocock/skills](https://github.com/mattpocock/skills). A handoff writes a summary brief and starts a fresh session. It uses a herdr pane when I'm inside herdr, and `claude --bg` otherwise.

## MCP: added one at a time

I didn't turn on every MCP server the monorepo's `.mcp.json` offers. There are about ten. I added servers at user scope when a task needed one:

- **Slack, Notion and Linear** through the claude.ai connectors. For Slack, Claude can read and draft, and sending is explicitly denied in `settings.json`. I review every message before it goes out.
- **The internal support MCP.** It gives read-only access over de-identified views. A colleague mentioned it, and I needed it to answer a usage question with real numbers instead of guesses.
- **Chrome DevTools MCP** for testing a PR in the browser. One gotcha: with Chrome's newer inspect-mode remote debugging, `/json` endpoints return 404, so `--browser-url` fails. `--autoConnect` works, and it attaches to my real, signed-in Chrome profile.

Adding servers only when I needed them meant I learned each one's authentication and limits while I had a concrete question to answer.

## Where I want to go

I haven't set up beads yet. At my last role I used it as a lightweight factory: each task could kick off a new background Claude session. That kept work moving, but it also felt disjointed. At least initially, I'd rather have an orchestrator/sub-agent style workflow.

I've been using herdr partly because it can now attach over SSH to a herdr server on another machine, which opens the door to remote agents. I don't have anywhere to run one yet, so work stops during my commute when the laptop's closed, but I'll likely work through that. I have one Claude plan and one Codex plan. I had company OpenRouter credit at my last role and may pitch for that at some point, mostly so I'm across (and using) cheaper flash models to keep token costs low ([my notes on running one as a daily driver](/blog/2026-09-10-deepseek-v4-flash-agent/)).

So far I'm still very much ramping. Some of the workflows here are guardrails, and others I notice are different from other roles, but hopefully the above sparks some ideas for you. How are you building and managing your hardware and software configuration, and what does agent-first dev look like to you?
