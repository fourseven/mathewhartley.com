// "Popular Posts" shown on the homepage.
//
// Source: Plausible 30-day top pages for mathewhartley.com (pulled 2026-09-23).
// These are the only posts with meaningful traffic — everything else is 1
// visitor or less:
//   2026-09-15-two-days-in-device-setup  48
//   2026-09-10-deepseek-v4-flash-agent   22
//   2026-08-07-esp32-vibe-coding         14
//
// The ESP32 post is listed first because it is the one that earns search
// traffic (100% of its visitors arrive from Google organic), and it is the
// post most likely to age out of the "Latest Posts" block.
//
// Refresh monthly with the same Plausible call the daily nudge uses:
//   /api/v1/stats/breakdown?site_id=mathewhartley.com&period=30d&property=event:page
//
// Slugs must match the content collection id: the filename without ".md",
// including the full date prefix.
export const popularPosts: string[] = [
  "2026-08-07-esp32-vibe-coding",
  "2026-09-15-two-days-in-device-setup",
  "2026-09-10-deepseek-v4-flash-agent",
];
