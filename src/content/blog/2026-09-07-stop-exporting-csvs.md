---
title: Stop exporting CSVs into ChatGPT
date: 2026-09-07
tags: AI, Experiments, Engineering
---

For most of the last year, my financial self-review ran on a ritual: export three months of transactions from the bank as CSV, feed the file into ChatGPT, ask where the money went, nod thoughtfully at the table it produced, and close the tab. Six weeks later I'd do the same thing again, because nothing from the last round had stuck.

The ritual worked, in the way that flossing after you remember works. Every pass surfaced something real: a subscription I'd forgotten about, a takeaway month that needed admitting to, a power bill quietly creeping up. The problem was the setup cost. Spare half hour, fresh export, enough will to open a spreadsheet. Miss any of the three and the whole thing slid another month.

The bank's own spending page was supposed to fill the gap. It never did. "Retail" is not an insight.

---

So when I started playing with Akahu, the obvious question was why the ritual existed at all. Akahu is NZ's regulated open banking API: you connect your bank once, and apps get read access to your transactions without your password ever touching their servers. The data arrives continuously instead of in quarterly dumps. My CSV export habit was a workaround for plumbing that quietly started existing.

I mentioned it here a month ago: better insight into where the money's going, would this be useful to others, probably needs effort to get presentable. The answer to the first question turned out to be yes often enough that I kept building. The thing is now a product with a name and a waitlist.

It's called Parlo. You connect your NZ bank accounts, and once a week it tells you what actually happened, in sentences. Spending spikes ("$420 on dining out this week; your usual is around $180"). New subscriptions (a $14.99 charge that started two weeks ago). Price jumps (the power bill up $43 on last month). A Monday digest, alerts when something's off, and no budgets to set up or categories to maintain. Your bank shows you transactions. Parlo tells you what they mean.

There's still an LLM in the loop, because turning a wall of transactions into a paragraph a tired parent will actually read is exactly the job they're good at. The difference from the old ritual is that the model sees live, classified data every week instead of a fresh CSV I had to remember to make. The insights stopped depending on me remembering to ask.

---

The gap between "works for me" and "works for strangers" has been most of the work. Transfers that look like spending. Refunds that look like income. Categories that are right for my household and baffling for anyone else. Every one of those is a bug report waiting to happen, which is a strange feeling after years of building software where the user was me and I could be talked out of filing complaints.

The waitlist is open at getparlo.app if you're in NZ and want to be an early guinea pig. Founding member pricing is a flat $10/month, there's a 14-day trial, and no credit card to start. What I need most right now isn't the money, it's accounts that aren't mine: different banks, different spending shapes, different definitions of "something's off."

Next up: making the alerts less eager, and deciding when this stops being a project I tinker with after the kids are asleep. The latter keeps not happening, because tinkering after the kids are asleep is the entire time budget. But the CSV ritual is gone, and I don't miss it.
