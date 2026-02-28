delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

// ────────────────────────────────────────────────
//   CONSOLE SUPPRESSION + NICE UI LOGGING
// ────────────────────────────────────────────────
const originalConsole = {
  log:   console.log.bind(console),
  info:  console.info.bind(console),
  warn:  console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug?.bind(console) || (() => {}),
};

const isOurMessage = (args) => {
  if (typeof args[0] !== 'string') return false;
  const str = args[0];
  return str.includes('%c') && (
    str.includes('[✓]') ||
    str.includes('[✗]') ||
    str.includes('[ℹ]') ||
    (str.includes('Progress:') && /🔴|🟡|🔵|🟣|🟢/.test(str)) ||
    str.includes('Spoofing') ||
    str.includes('Quest completed!') ||
    str.includes('ETA') ||
    str.includes('Starting') ||
    str.includes('No active') ||
    str.includes('All quests') ||
    str.includes('Cleanup complete')
  );
};

console.log   = (...args) => { if (isOurMessage(args)) originalConsole.log(...args); };
console.info  = (...args) => { if (isOurMessage(args)) originalConsole.info(...args); };
console.warn  = () => {}; // suppress Discord warnings
console.error = (...args) => { if (isOurMessage(args)) originalConsole.error(...args); };
console.debug = () => {};
console.assert = () => {};
console.time   = () => {};
console.timeEnd = () => {};

const ui = {
  log: (emoji, msg, color = "#ffffff") =>
    originalConsole.log(`%c${emoji} ${msg}`, `color: ${color}; font-weight: 500;`),
  info: msg =>
    originalConsole.log(`%c[ℹ] ${msg}`, "color: #60a5fa; font-weight: 500;"),
  success: msg =>
    originalConsole.log(`%c[✓] ${msg}`, "color: #10b981; font-weight: 500;"),
  error: msg =>
    originalConsole.log(`%c[✗] ${msg}`, "color: #ef4444; font-weight: 500;"),
  progress: (current, total) => {
    const percent = Math.round((current / total) * 100);
    let color, emoji;
    if      (percent < 25) { color = "#ef4444"; emoji = "🔴"; }
    else if (percent < 50) { color = "#f59e0b"; emoji = "🟡"; }
    else if (percent < 75) { color = "#3b82f6"; emoji = "🔵"; }
    else if (percent < 100){ color = "#8b5cf6"; emoji = "🟣"; }
    else                   { color = "#10b981"; emoji = "🟢"; }
    originalConsole.log(`%c${emoji} Progress: ${current}/${total} (${percent}%)`, `color: ${color}; font-weight: 500;`);
  }
};

// ────────────────────────────────────────────────
//   CLEANUP MANAGER
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

    // Restore original console methods
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
  ui.log("🚀", `Starting processing of ${quests.length} quest${quests.length > 1 ? 's' : ''}`);

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

    ui.log("🎮", `Handling "${questName}" (${taskName})`);
    ui.info(`Target: ${secondsNeeded}s | Already: ${secondsDone}s`);

    if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
      // Adjustable — lower = stealthier, higher = faster but riskier
      const speed       = 3;         // was 7 — quite detectable
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
            await api.post({
              url: `/quests/${quest.id}/video-progress`,
              body: { timestamp: secondsNeeded }
            });
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
              cleanup.restore(); // safe partial restore
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
        ui.info(`ETA ~${etaMin} min${etaMin !== 1 ? 's' : ''} — remember: stream in VC with ≥1 other person`);
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
