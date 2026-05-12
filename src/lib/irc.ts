export const ADJECTIVES = [
  "neon","cyber","sparkle","sad","radical","cosmic","mystic","rad","groovy","tubular",
  "gnarly","epic","mega","ultra","hyper","super","wicked","awesome","fantastic","magical",
  "enchanted","mystical","digital","virtual","turbo","extreme","ultimate","infinite",
  "crystal","electric","atomic","quantum","laser","plasma","solar","lunar","stellar",
  "galactic","dreamy","funky","retro","vintage","classic","golden","silver","rainbow",
  "prismatic","psychedelic","trippy","wild","crazy","mad","insane","bonkers","wacky",
  "zany","silly","goofy","funny","hilarious","absurd","bizarre","weird","strange","odd",
  "peculiar","curious","mysterious","secret","hidden","forbidden","dangerous","dark",
  "shadowy","gloomy","spooky","haunted","ghostly","phantom","spectral","ethereal",
  "angelic","divine","holy","sacred","blessed","cursed","doomed","lost","forgotten",
  "abandoned","lonely","solitary","rogue","rebel","punk","grunge","metal","rock","pop",
  "disco","jazzy","bluesy","soulful","rhythmic","melodic",
];

export const NOUNS = [
  "dragon","hamster","toaster","dream","mall","wizard","knight","castle","spaceship",
  "robot","dinosaur","unicorn","phoenix","ninja","pirate","samurai","warrior","hero",
  "villain","princess","prince","king","queen","jester","bard","sorcerer","witch",
  "warlock","goblin","troll","elf","dwarf","fairy","giant","titan","colossus","behemoth",
  "leviathan","kraken","shark","whale","octopus","squid","jellyfish","dolphin","eagle",
  "hawk","owl","raven","computer","laptop","phone","tablet","console","arcade","joystick",
  "keyboard","monitor","printer","scanner","modem","internet","website","homepage","blog",
  "forum","chat","email","message","letter","diary","journal","notebook","book","comic",
  "magazine","newspaper","zine","fanzine","music","song","album","band","concert",
  "festival","movie","film","video","show","series","episode","game","puzzle","maze",
  "quest","adventure","journey","planet","star","moon","sun","galaxy","universe","ocean",
  "sea","river","lake","mountain","forest","city","town","village","island","desert",
  "jungle","pizza","burger","taco","sushi","cookie","cake","coffee","tea","soda",
  "milkshake","smoothie","juice",
];

export interface ChannelUser {
  name: string;
  prefix: string;
  personality: string;
  greeting: string;
}

export interface ChannelContext {
  topic: string;
  users: ChannelUser[];
}

export function randomChannel(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${noun}`;
}

export function cacheKey(seed: string): string {
  return `irc_${seed}`;
}

export function contextCacheKey(seed: string): string {
  return `irc_ctx_${seed}`;
}

export function getCachedContext(seed: string): ChannelContext | null {
  try {
    const raw = localStorage.getItem(contextCacheKey(seed));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function setCachedContext(seed: string, ctx: ChannelContext): void {
  try {
    localStorage.setItem(contextCacheKey(seed), JSON.stringify(ctx));
  } catch { /* ignore */ }
}

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

export function padTime(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
