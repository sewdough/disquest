console.log("Disquest v1.5");delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

// ────────────────────────────────────────────────
//   Clean UI BB 
// ────────────────────────────────────────────────
const originalConsole = {
  log:   console.log.bind(console),
  info:  console.info.bind(console),
  warn:  console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug?.bind(console) || (() => {}),
};

// Log Suppression
const allowedPatterns = [
  '%c', '━━━━━━━━', '[✓]', '[✗]', '[ℹ]',
  'Disquest', 'Processing Quest', 'Type:', 'Target:', 'Already:',
  'Spoofed', 'ETA', 'Spoofing', 'marked complete', 'completed!', 'Cleanup complete',
  '🎮', '🎬', '🔊', '🟣', 'Progress:'
];

console.log = (...args) => {
  if (!args[0]) return;
  const text = String(args[0]);

  // Block Sentry explicitly
  if (text.includes('sentry') || text.includes('Sentry')) return;

 
  if (allowedPatterns.some(pattern => text.includes(pattern))) {
    originalConsole.log(...args);
    return;
  }

  if (typeof args[1] === 'string' && args[1].includes('color:')) {
    originalConsole.log(...args);
  }
};

console.info = (...args) => {
  const text = String(args[0] || '');
  if (text.includes('[ℹ]') || text.includes('Target:')) originalConsole.info(...args);
};

console.warn = () => {};
console.error = (...args) => {
  const text = String(args[0] || '');
  if (text.includes('[✗]') || text.includes('Fatal') || text.includes('error')) {
    originalConsole.error(...args);
  }
};
console.debug = () => {};
console.assert = () => {};
console.time = () => {};
console.timeEnd = () => {};

// ────────────────────────────────────────────────
//   CLEAN UI
// ────────────────────────────────────────────────
const ui = {
  header: (title) => {
    originalConsole.log("%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #5865f2; font-weight: bold;");
    originalConsole.log(`%c${title}`, "color: #ffffff; font-size: 16px; font-weight: bold;");
    originalConsole.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "color: #5865f2; font-weight: bold;");
  },

  questStart: (questName, taskType) => {
    originalConsole.log(`%c🎮 Processing Quest`, "color: #5865f2; font-weight: 700; font-size: 14px;");
    originalConsole.log(`%c${questName}`, "color: #ffffff; font-size: 15px; font-weight: 600;");
    originalConsole.log(`%cType: ${taskType}`, "color: #a5b4fc; font-size: 13px;");
    originalConsole.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #5865f2;");
  },

  log: (emoji, msg, color = "#e0e0e0") => originalConsole.log(`%c${emoji} ${msg}`, `color: ${color}; font-weight: 500;`),
  info: msg => originalConsole.log(`%c[ℹ] ${msg}`, "color: #60a5fa; font-weight: 600;"),
  success: msg => originalConsole.log(`%c[✓] ${msg}`, "color: #22c55e; font-weight: 700; font-size: 14px;"),
  error: msg => originalConsole.log(`%c[✗] ${msg}`, "color: #ef4444; font-weight: 700; font-size: 14px;"),

  progress: (current, total) => {
    const percent = Math.round((current / total) * 100);
    let color = "#ef4444", emoji = "🔴";
    if (percent >= 85) { color = "#22c55e"; emoji = "🟢"; }
    else if (percent >= 65) { color = "#a855f7"; emoji = "🟣"; }
    else if (percent >= 45) { color = "#3b82f6"; emoji = "🔵"; }
    else if (percent >= 25) { color = "#eab308"; emoji = "🟡"; }

    const filled = Math.floor(percent / 5);
    const bar = "█".repeat(filled) + "▒".repeat(20 - filled);

    originalConsole.log(`%c${emoji} ${percent.toString().padStart(3)}% [${bar}] ${current}/${total}s`, `color: ${color}; font-weight: 700; font-size: 14px;`);
  }
};

// ────────────────────────────────────────────────
//   CLEANUP MANAGER REDUX
// ────────────────────────────────────────────────
const cleanup = {
  intervals: [],
  dispatchers: [],
  stores: [],
  addInterval: id => cleanup.intervals.push(id),
  addDispatcher: (event, handler) => cleanup.dispatchers.push({event, handler}),
  addStoreOverride: (store, method, original) => cleanup.stores.push({store, method, original}),

  restore: function() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];

    this.dispatchers.forEach(({event, handler}) => {
      try { FluxDispatcher.unsubscribe(event, handler); } catch {}
    });
    this.dispatchers = [];

    this.stores.forEach(({store, method, original}) => {
      try { store[method] = original; } catch {}
    });
    this.stores = [];

    Object.assign(console, originalConsole);
    ui.success("Cleanup complete + console restored");
  }
};

window.addEventListener('beforeunload', () => cleanup.restore());

// ────────────────────────────────────────────────
//   STORE & API GRAB
// ────────────────────────────────────────────────
let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.A;
let RunningGameStore         = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames)?.exports?.Ay;
let QuestsStore              = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest)?.exports?.A;
let ChannelStore             = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports?.A;
let GuildChannelStore        = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel)?.exports?.Ay;
let FluxDispatcher           = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue)?.exports?.h;
let api                      = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get)?.exports?.Bo;

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
const isDesktopApp   = typeof DiscordNative !== "undefined";

let quests = [...QuestsStore.quests.values()].filter(q =>
  q.userStatus?.enrolledAt &&
  !q.userStatus?.completedAt &&
  new Date(q.config.expiresAt).getTime() > Date.now() &&
  supportedTasks.some(t => (q.config.taskConfig ?? q.config.taskConfigV2)?.tasks?.[t])
);

if (quests.length === 0) {
  ui.info("No active, uncompleted quests found that this script supports.");
  cleanup.restore();
} else {
  ui.header(`Disquest V1.5 - ${quests.length} Quest${quests.length > 1 ? 's' : ''}`);

  async function processNextQuest() {
    const quest = quests.pop();
    if (!quest) {
      ui.success("All quests processed!");
      cleanup.restore();
      return;
    }

    const applicationId   = quest.config.application.id;
    const applicationName = quest.config.application.name;
    const questName       = quest.config.messages.questName;
    const taskConfig      = quest.config.taskConfig ?? quest.config.taskConfigV2;
    const taskName        = supportedTasks.find(t => taskConfig.tasks[t] != null);
    const secondsNeeded   = taskConfig.tasks[taskName].target;
    let   secondsDone     = quest.userStatus?.progress?.[taskName]?.value ?? 0;

    ui.questStart(questName, taskName);
    ui.info(`Target: ${secondsNeeded}s | Already: ${secondsDone}s`);

  
    if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
      const speed       = 3;
      const maxFuture   = 10;
      const intervalSec = 1.2;
      const enrolledAt  = new Date(quest.userStatus.enrolledAt).getTime();
      let completed     = false;

      ui.log("🎬", `Spoofing WATCH_VIDEO for "${questName}"`);

      async function spoofVideoProgress() {
        while (true) {
          const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
          const diff       = maxAllowed - secondsDone;
          if (diff < speed) break;

          const nextTs = Math.min(secondsNeeded, secondsDone + speed + Math.random() * 0.8 - 0.4);
          try {
            const res = await api.post({
              url: `/quests/${quest.id}/video-progress`,
              body: { timestamp: nextTs }
            });
            completed = res.body.completed_at != null;
            secondsDone = nextTs;
            ui.progress(secondsDone, secondsNeeded);
          } catch (err) {
            ui.error(`Video progress failed: ${err?.message || err}`);
            break;
          }

          if (secondsDone >= secondsNeeded) break;
          await new Promise(r => setTimeout(r, intervalSec * 1000));
        }

        if (!completed && secondsDone >= secondsNeeded - 2) {
          try {
            await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
          } catch {}
        }

        ui.success(`"${questName}" marked complete!`);
        processNextQuest();
      }

      spoofVideoProgress();
    }

    else if (taskName === "PLAY_ON_DESKTOP" || taskName === "STREAM_ON_DESKTOP") {
      if (!isDesktopApp) {
        ui.error(`"${questName}" requires Discord Desktop app (browser blocked)`);
        processNextQuest();
        return;
      }

      if (taskName === "PLAY_ON_DESKTOP") {
        try {
          const res = await api.get({ url: `/applications/public?application_ids=${applicationId}` });
          const appData = res.body[0];
          const exeObj  = appData.executables?.find(x => x.os === "win32");
          const exeName = exeObj?.name?.replace(">", "") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "");

          const pid = Math.floor(Math.random() * 30000) + 1000;

          const fakeGame = {
            cmdLine:     `C:\\Program Files\\${appData.name}\\${exeName}`,
            exeName,
            exePath:     `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
            hidden:      false,
            isLauncher:  false,
            id:          applicationId,
            name:        appData.name,
            pid,
            pidPath:     [pid],
            processName: appData.name,
            start:       Date.now(),
          };

          const realGetRunningGames = RunningGameStore.getRunningGames;
          const realGetGameForPID   = RunningGameStore.getGameForPID;

          RunningGameStore.getRunningGames = () => [fakeGame];
          RunningGameStore.getGameForPID   = p => p === pid ? fakeGame : null;

          cleanup.addStoreOverride(RunningGameStore, 'getRunningGames', realGetRunningGames);
          cleanup.addStoreOverride(RunningGameStore, 'getGameForPID',   realGetGameForPID);

          FluxDispatcher.dispatch({
            type: "RUNNING_GAMES_CHANGE",
            removed: RunningGameStore.getRunningGames(),
            added: [fakeGame],
            games: [fakeGame]
          });

          const onHeartbeat = data => {
            const progress = quest.config.configVersion === 1
              ? data.userStatus.streamProgressSeconds
              : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
            ui.progress(progress, secondsNeeded);

            if (progress >= secondsNeeded) {
              ui.success(`"${questName}" completed!`);
              RunningGameStore.getRunningGames = realGetRunningGames;
              RunningGameStore.getGameForPID   = realGetGameForPID;
              FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
              FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
              cleanup.restore();
              processNextQuest();
            }
          };

          FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
          cleanup.addDispatcher("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);

          const etaMin = Math.ceil((secondsNeeded - secondsDone) / 60);
          ui.info(`Spoofed game → ETA ~${etaMin} min${etaMin !== 1 ? 's' : ''}`);
        } catch (err) {
          ui.error(`Failed to spoof PLAY_ON_DESKTOP: ${err?.message || err}`);
          processNextQuest();
        }
      }

      else { // STREAM_ON_DESKTOP
        const pid = Math.floor(Math.random() * 30000) + 1000;
        const realGetMetadata = ApplicationStreamingStore.getStreamerActiveStreamMetadata;

        ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
          id: applicationId,
          pid,
          sourceName: null
        });

        cleanup.addStoreOverride(ApplicationStreamingStore, 'getStreamerActiveStreamMetadata', realGetMetadata);

        const onHeartbeat = data => {
          const progress = quest.config.configVersion === 1
            ? data.userStatus.streamProgressSeconds
            : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
          ui.progress(progress, secondsNeeded);

          if (progress >= secondsNeeded) {
            ui.success(`"${questName}" completed!`);
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = realGetMetadata;
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
            cleanup.restore();
            processNextQuest();
          }
        };

        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
        cleanup.addDispatcher("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);

        const etaMin = Math.ceil((secondsNeeded - secondsDone) / 60);
        ui.log("🟣", `Spoofed stream for ${applicationName}`);
        ui.info(`ETA ~${etaMin} min${etaMin !== 1 ? 's' : ''} — remember: stream in VC with at least 1 other person`);
      }
    }

    else if (taskName === "PLAY_ACTIVITY") {
      const channel = ChannelStore.getSortedPrivateChannels()[0] ??
        Object.values(GuildChannelStore.getAllGuilds()).find(g => g?.VOCAL?.length > 0)?.VOCAL[0]?.channel;

      if (!channel?.id) {
        ui.error("No suitable voice channel found for PLAY_ACTIVITY");
        processNextQuest();
        return;
      }

      const streamKey = `call:${channel.id}:1`;

      ui.log("🔊", `Spoofing PLAY_ACTIVITY in channel ${channel.id}`);

      async function sendHeartbeats() {
        while (true) {
          try {
            const res = await api.post({
              url: `/quests/${quest.id}/heartbeat`,
              body: { stream_key: streamKey, terminal: false }
            });
            const progress = res.body.progress.PLAY_ACTIVITY.value;
            ui.progress(progress, secondsNeeded);

            if (progress >= secondsNeeded) {
              await api.post({
                url: `/quests/${quest.id}/heartbeat`,
                body: { stream_key: streamKey, terminal: true }
              });
              ui.success(`"${questName}" completed!`);
              processNextQuest();
              break;
            }
          } catch (err) {
            ui.error(`Heartbeat failed: ${err?.message || err}`);
            break;
          }

          await new Promise(r => setTimeout(r, 20_000));
        }
      }

      sendHeartbeats();
    }
  }

  processNextQuest().catch(err => {
    ui.error(`Fatal error: ${err.message}`);
    originalConsole.error(err);
    cleanup.restore();
  });
}
