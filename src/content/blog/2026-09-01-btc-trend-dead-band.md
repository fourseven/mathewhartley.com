---
title: The dead band that only cost money
date: 2026-09-01
tags: Experiments, Engineering
---

My BTC momentum bot has one job: work out whether the market is going up or down, and lean into it. Every parameter in it has been through a proper sweep at some point this year. Leverage, volume lookback, hysteresis band, trend confirmation. All tested, all validated, most left exactly where they were.

Except one. The trend threshold: how far price has to travel from the 100-day moving average before the bot is allowed to call it an uptrend or a downtrend. Inside the band, the bot sits in a "neutral" regime and does something safer instead.

It's the knob every trading backtest inherits. Nobody I know has ever tested whether it earns its keep, including me.

---

So I swept it. Six band widths, production config, full price history, 2x leverage, 0.13% fees per trade, funding costs on. These are backtest numbers on a leveraged BTC strategy, so the raw magnitudes are silly. The shape is what matters.

| Band | Annual | Sharpe | Max drawdown | Days in neutral |
|---|---|---|---|---|
| 0% (live) | +842% | 2.75 | -41% | 0 |
| 1% | +696% | 2.61 | -41% | 56 |
| 2% (the default) | +654% | 2.55 | -41% | 107 |
| 3% | +776% | 2.72 | -39% | 161 |
| 5% | +592% | 2.52 | -39% | 267 |
| 10% | +421% | 2.32 | -37% | 573 |

At the widest band, total return drops from +98,735% to +15,912%. Same market, same signals, same everything except a safety feature nobody asked for.

---

The dead band advertises two jobs: less churn, and softer drawdowns. It does neither.

Turnover is flat at about 17.5% at every band width. The bot already has a hysteresis band for exactly this: once a regime flip is confirmed, it doesn't un-flip for wiggles. The dead band was a second copy of a mechanism the bot already owns.

What the band actually does is send days to the neutral regime, where the bot splits capital evenly across the long and short books. Over the full history the long book made roughly +49,000% and the short book made +23%. Neutral days are days the configuration that makes the money isn't running. Every day inside the band is a small tax.

To be fair, it does deliver one thing it claims: max drawdown improves from 41% to 37.5% at the widest band. Two to three points of relief, for somewhere between half and ninety percent of the annual return. On any risk-adjusted measure that's a terrible exchange rate.

There's a tempting bump at 3%: +776% annual, Sharpe 2.72. Squint and it looks like a sweet spot. It isn't. The curve isn't monotonic and that point is sandwiched between worse values on both sides, which is noise doing an impression of signal. Chasing it is how backtests start lying to you.

---

So the threshold stays at zero. That was the last untested parameter class in the bot: leverage, volume lookback, hysteresis, trend confirmation, and now the dead band are all swept. The engine shipped with a 2% default. The live config has run at zero the whole time, on instinct rather than evidence, and it turns out the instinct was right. The sweep still took an afternoon I could have spent a year ago.

The uncomfortable bit: most safety defaults in a strategy aren't chosen, they're inherited. This one had never earned a test in the entire life of the bot. Now it has one, and the result is a table I'll be ignoring the next time I get the urge to add a safety margin.
