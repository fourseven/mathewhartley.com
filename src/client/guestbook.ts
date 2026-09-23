export {};

interface GuestbookEntry {
  name: string;
  message: string;
  created_at: string;
}

interface TurnstileApi {
  reset: () => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const form = document.querySelector<HTMLFormElement>("#guestbook-form");
const entriesEl = document.querySelector<HTMLDivElement>("#guestbook-entries");
const statusEl = document.querySelector<HTMLParagraphElement>("#guestbook-status");

function renderEntry(entry: GuestbookEntry): HTMLElement {
  const item = document.createElement("p");
  const name = document.createElement("span");
  const date = document.createElement("span");
  name.className = "name";
  name.textContent = `${entry.name}:`;
  date.className = "date";
  const parsed = new Date(entry.created_at);
  const formattedDate = Number.isNaN(parsed.valueOf())
    ? ""
    : Intl.DateTimeFormat("en-NZ", { year: "numeric", month: "short", day: "numeric" }).format(parsed);
  date.textContent = formattedDate ? ` (${formattedDate})` : "";
  item.appendChild(name);
  item.appendChild(document.createTextNode(` ${entry.message}`));
  item.appendChild(date);
  return item;
}

async function loadEntries(): Promise<void> {
  if (!entriesEl) return;
  try {
    const response = await fetch("/api/guestbook", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Unable to load entries");
    const result = (await response.json()) as { entries: GuestbookEntry[] };
    entriesEl.replaceChildren(...result.entries.map(renderEntry));
    if (result.entries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "guestbook-empty";
      empty.textContent = "No approved notes yet. Be the first!";
      entriesEl.appendChild(empty);
    }
  } catch {
    entriesEl.textContent = "Guestbook entries are temporarily unavailable.";
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form || !statusEl) return;

  const submitButton = form.querySelector<HTMLButtonElement>("button[type=submit]");
  const data = new FormData(form);
  const token = data.get("cf-turnstile-response");
  if (typeof token !== "string" || !token) {
    statusEl.textContent = "Please complete the bot check first.";
    return;
  }

  if (submitButton) submitButton.disabled = true;
  statusEl.textContent = "Sending…";

  try {
    const response = await fetch("/api/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        message: data.get("message"),
        website: data.get("website"),
        turnstileToken: token,
      }),
    });
    const result = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) throw new Error(result.error || "Could not submit your note.");
    form.reset();
    window.turnstile?.reset();
    statusEl.textContent = result.message || "Thanks. Your entry is awaiting approval.";
  } catch (error) {
    statusEl.textContent = error instanceof Error ? error.message : "Could not submit your note.";
    window.turnstile?.reset();
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

void loadEntries();
