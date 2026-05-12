const ADJECTIVES = [
  "neon", "cyber", "sparkle", "sad", "radical", "cosmic", "mystic", "rad",
  "groovy", "tubular", "gnarly", "epic", "mega", "ultra", "hyper", "super",
  "wicked", "awesome", "fantastic", "magical", "enchanted", "mystical",
  "digital", "virtual", "turbo", "extreme", "ultimate", "infinite",
  "crystal", "electric", "atomic", "quantum", "laser", "plasma", "solar",
  "lunar", "stellar", "galactic", "intergalactic", "cosmic", "dreamy",
  "funky", "retro", "vintage", "classic", "golden", "silver", "crystal",
  "rainbow", "prismatic", "kaleidoscope", "psychedelic", "trippy",
  "wild", "crazy", "mad", "insane", "bonkers", "wacky", "zany",
  "silly", "goofy", "funny", "hilarious", "absurd", "bizarre", "weird",
  "strange", "odd", "peculiar", "curious", "mysterious", "secret",
  "hidden", "forbidden", "dangerous", "dark", "shadowy", "gloomy",
  "spooky", "haunted", "ghostly", "phantom", "spectral", "ethereal",
  "angelic", "divine", "holy", "sacred", "blessed", "cursed", "doomed",
  "lost", "forgotten", "abandoned", "lonely", "solitary", "rogue",
  "rebel", "punk", "grunge", "metal", "rock", "pop", "disco",
  "funky", "jazzy", "bluesy", "soulful", "rhythmic", "melodic",
];

const NOUNS = [
  "dragon", "hamster", "toaster", "dream", "mall", "wizard", "knight",
  "castle", "spaceship", "robot", "dinosaur", "unicorn", "phoenix",
  "ninja", "pirate", "samurai", "warrior", "hero", "villain",
  "princess", "prince", "king", "queen", "jester", "bard", "sorcerer",
  "witch", "warlock", "goblin", "troll", "elf", "dwarf", "fairy",
  "giant", "titan", "colossus", "behemoth", "leviathan", "kraken",
  "shark", "whale", "octopus", "squid", "jellyfish", "dolphin",
  "eagle", "hawk", "owl", "raven", "phoenix", "dragon", "wyvern",
  "computer", "laptop", "phone", "tablet", "console", "arcade",
  "joystick", "keyboard", "monitor", "printer", "scanner", "modem",
  "internet", "website", "homepage", "blog", "forum", "chat",
  "email", "message", "letter", "diary", "journal", "notebook",
  "book", "comic", "magazine", "newspaper", "zine", "fanzine",
  "music", "song", "album", "band", "concert", "festival",
  "movie", "film", "video", "show", "series", "episode",
  "game", "puzzle", "maze", "quest", "adventure", "journey",
  "planet", "star", "moon", "sun", "galaxy", "universe",
  "ocean", "sea", "river", "lake", "mountain", "forest",
  "city", "town", "village", "island", "desert", "jungle",
  "pizza", "burger", "taco", "sushi", "cookie", "cake",
  "coffee", "tea", "soda", "milkshake", "smoothie", "juice",
];

export function randomWord(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomSeed(): string {
  return `${randomWord(ADJECTIVES)}-${randomWord(NOUNS)}`;
}

export function decodeSeed(seed: string): string {
  const words = seed.toLowerCase().split("-").filter(Boolean);
  if (words.length === 0) return randomSeed();
  if (words.length === 1) return `${words[0]}-${randomWord(NOUNS)}`;
  return `${words[0]}-${words[1]}`;
}

export function cacheKey(seed: string): string {
  return `webring_${seed.toLowerCase()}`;
}

export function getCached(seed: string): string | null {
  try {
    return localStorage.getItem(cacheKey(seed));
  } catch {
    return null;
  }
}

export function setCached(seed: string, html: string): void {
  try {
    localStorage.setItem(cacheKey(seed), html);
  } catch {
    // localStorage full, silently ignore
  }
}

export function stripScripts(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

export const HISTORY_KEY = "webring_history";
export const HISTORY_INDEX_KEY = "webring_index";

export function getHistory(): string[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setHistory(history: string[]): void {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // silently ignore
  }
}

export function getHistoryIndex(): number {
  try {
    const raw = sessionStorage.getItem(HISTORY_INDEX_KEY);
    return raw ? parseInt(raw, 10) : -1;
  } catch {
    return -1;
  }
}

export function setHistoryIndex(index: number): void {
  try {
    sessionStorage.setItem(HISTORY_INDEX_KEY, String(index));
  } catch {
    // silently ignore
  }
}

export function pushToHistory(seed: string): void {
  const history = getHistory();
  const index = getHistoryIndex();
  // Truncate forward history if we're not at the end
  const newHistory = history.slice(0, index + 1);
  newHistory.push(seed);
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
}

export function prevInHistory(): string | null {
  const index = getHistoryIndex();
  if (index <= 0) return null;
  setHistoryIndex(index - 1);
  return getHistory()[index - 1];
}

export function nextInHistory(): string | null {
  const history = getHistory();
  const index = getHistoryIndex();
  if (index >= history.length - 1) return null;
  setHistoryIndex(index + 1);
  return history[index + 1];
}
