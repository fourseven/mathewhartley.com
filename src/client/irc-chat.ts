import { randomChannel, escapeHtml, padTime } from "../lib/irc";
import type { ChannelContext } from "../lib/irc";
import { initLLM, generateChannelContext, generateResponses, generateAutoMessage } from "../lib/irc-llm";

interface ChatState {
  channel: string;
  users: ChannelContext["users"];
  history: { role: string; content: string }[];
  isGenerating: boolean;
}

const AUTO_CONTINUE_DELAY = 8000;
const AUTO_CONTINUE_CHANCE = 0.6;

class IRCChat {
  private chatLog: HTMLElement;
  private chatInput: HTMLInputElement;
  private sendBtn: HTMLButtonElement;
  private statusBar: HTMLElement;
  private userList: HTMLElement;
  private channelName: HTMLElement;
  private channelTopic: HTMLElement;
  private userCount: HTMLElement;
  private btnNewChannel: HTMLButtonElement;

  private state: ChatState;
  private autoTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.chatLog = document.getElementById("chat-log")!;
    this.chatInput = document.getElementById("chat-input") as HTMLInputElement;
    this.sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
    this.statusBar = document.getElementById("status-bar")!;
    this.userList = document.getElementById("user-list")!;
    this.channelName = document.getElementById("channel-name")!;
    this.channelTopic = document.getElementById("channel-topic")!;
    this.userCount = document.getElementById("user-count")!;
    this.btnNewChannel = document.getElementById("btn-new-channel") as HTMLButtonElement;

    this.state = {
      channel: "",
      users: [],
      history: [],
      isGenerating: false,
    };

    this.bindEvents();
  }

  private bindEvents() {
    this.sendBtn.addEventListener("click", () => this.handleSend());
    this.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    this.chatInput.addEventListener("input", () => this.resetAutoTimer());
    this.btnNewChannel.addEventListener("click", () => this.newChannel());
  }

  private handleSend() {
    const text = this.chatInput.value.trim();
    if (!text || this.state.isGenerating) return;
    this.chatInput.value = "";
    this.resetAutoTimer();
    this.processUserMessage(text);
  }

  private setStatus(msg: string) {
    this.statusBar.textContent = msg;
  }

  addMessage(user: string, text: string, type?: "system" | "action") {
    const div = document.createElement("div");
    div.className = `msg ${type || ""}`;

    if (type === "system") {
      div.innerHTML = `<span class="msg-text">${escapeHtml(text)}</span>`;
    } else if (type === "action") {
      div.innerHTML = `<span class="msg-user">* ${escapeHtml(user)}</span> <span class="msg-action">${escapeHtml(text)}</span>`;
    } else {
      const now = new Date();
      const ts = `${padTime(now.getHours())}:${padTime(now.getMinutes())}`;
      div.innerHTML = `<span class="msg-time">[${ts}]</span> <span class="msg-user">${escapeHtml(user)}</span>: <span class="msg-text">${escapeHtml(text)}</span>`;
    }

    this.chatLog.appendChild(div);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  }

  private addUserToList(user: string, prefix: string) {
    const div = document.createElement("div");
    div.className = "user-item";
    div.innerHTML = `<span class="user-prefix">${prefix}</span> ${escapeHtml(user)}`;
    this.userList.appendChild(div);
  }

  private clearUserList() {
    this.userList.innerHTML = "";
  }

  private updateUserCount() {
    this.userCount.textContent = `${this.state.users.length + 1} users`;
  }

  private resetAutoTimer() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }

  private scheduleAutoContinue() {
    this.resetAutoTimer();
    this.autoTimer = setTimeout(() => {
      if (this.state.isGenerating) return;
      if (Math.random() > AUTO_CONTINUE_CHANCE) {
        this.scheduleAutoContinue();
        return;
      }
      this.triggerAutoMessage();
    }, AUTO_CONTINUE_DELAY + Math.random() * 4000);
  }

  private async triggerAutoMessage() {
    if (!this.state.users.length) return;

    this.state.isGenerating = true;
    this.sendBtn.disabled = true;
    this.chatInput.disabled = true;
    this.setStatus("Chatting...");

    try {
      const resp = await generateAutoMessage(
        this.state.channel,
        this.state.users.map((u) => ({ name: u.name, personality: u.personality })),
        this.state.history
      );

      if (resp) {
        this.addMessage(resp.user, resp.message, resp.action ? "action" : undefined);
        this.state.history.push({
          role: "assistant",
          content: resp.action ? `* ${resp.user} ${resp.message}` : `${resp.user}: ${resp.message}`,
        });
      }
    } catch (e) {
      console.error("Auto message error:", e);
    }

    this.state.isGenerating = false;
    this.sendBtn.disabled = false;
    this.chatInput.disabled = false;
    this.chatInput.focus();
    this.setStatus(`Connected — #${this.state.channel}`);

    this.scheduleAutoContinue();
  }

  async joinChannel(channel: string) {
    console.log("joinChannel called for:", channel);
    this.state.channel = channel;
    this.state.history = [];
    this.chatLog.innerHTML = "";
    this.clearUserList();

    this.channelName.textContent = `#${channel}`;
    this.addMessage("", `--- Now talking in #${channel} ---`, "system");
    this.addMessage("", "Topic: loading...", "system");
    this.setStatus("Generating channel context...");

    const ctx = await generateChannelContext(channel, (msg) => this.setStatus(msg));

    if (!ctx) {
      this.addMessage("", "ERROR: Failed to generate channel context.", "system");
      this.setStatus("Context generation failed");
      return;
    }

    this.state.users = ctx.users;
    this.channelTopic.textContent = `Topic: ${ctx.topic}`;

    for (const user of ctx.users) {
      this.addUserToList(user.name, user.prefix);
    }
    this.updateUserCount();

    this.addMessage("", `*** ${ctx.users[0].name} sets mode: +nt`, "system");
    this.setStatus(`Connected — #${channel}`);

    // Initial greetings with staggered timing
    setTimeout(() => {
      this.addMessage(ctx.users[0].name, ctx.users[0].greeting);
    }, 1000);
    setTimeout(() => {
      this.addMessage(ctx.users[1].name, ctx.users[1].greeting);
    }, 2500);
    setTimeout(() => {
      this.addMessage(ctx.users[2].name, ctx.users[2].greeting);
    }, 4000);
    setTimeout(() => {
      this.scheduleAutoContinue();
    }, 6000);
  }

  private async processUserMessage(text: string) {
    if (this.state.isGenerating) return;

    this.state.isGenerating = true;
    this.sendBtn.disabled = true;
    this.chatInput.disabled = true;
    this.setStatus("Waiting for responses...");

    this.state.history.push({ role: "user", content: text });
    this.addMessage("You", text);

    try {
      const responses = await generateResponses(
        this.state.channel,
        this.state.users.map((u) => ({ name: u.name, personality: u.personality })),
        text,
        this.state.history
      );

      for (let i = 0; i < responses.length; i++) {
        const resp = responses[i];
        const delay = (i + 1) * (1500 + Math.random() * 2000);

        setTimeout(() => {
          this.addMessage(resp.user, resp.message, resp.action ? "action" : undefined);
          this.state.history.push({
            role: "assistant",
            content: resp.action ? `* ${resp.user} ${resp.message}` : `${resp.user}: ${resp.message}`,
          });
        }, delay);
      }

      const totalDelay = (responses.length + 1) * 3500;
      setTimeout(() => {
        this.state.isGenerating = false;
        this.sendBtn.disabled = false;
        this.chatInput.disabled = false;
        this.chatInput.focus();
        this.setStatus(`Connected — #${this.state.channel}`);
        this.scheduleAutoContinue();
      }, totalDelay);
    } catch (e) {
      this.addMessage("", `ERROR: ${(e as Error).message}`, "system");
      this.state.isGenerating = false;
      this.sendBtn.disabled = false;
      this.chatInput.disabled = false;
      this.chatInput.focus();
      this.setStatus("Error — retrying...");
    }
  }

  private newChannel() {
    const channel = randomChannel();
    window.location.search = `channel=${encodeURIComponent(channel)}`;
  }
}

export async function initIRCChat(channel: string): Promise<void> {
  const chat = new IRCChat();

  const ready = await initLLM((msg) => chat.setStatus(msg));
  if (!ready) {
    chat.addMessage("", "ERROR: Chrome built-in AI is required for this demo.", "system");
    return;
  }

  await chat.joinChannel(channel);
}
