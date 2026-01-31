delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

// ────────────────────────────────────────────────
//   CONSOLE SUPPRESSION (quiet mode)
// ────────────────────────────────────────────────
const originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug?.bind(console) || function(){},
};

const isOurMessage = (args) => {
    if (typeof args[0] !== 'string') return false;
    const str = args[0];
    return str.includes('%c') && (
        str.includes('[✓]') ||
        str.includes('[✗]') ||
        str.includes('[ℹ]') ||
        str.includes('Progress:') && /🔴|🟡|🔵|🟣|🟢/.test(str) ||
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
console.warn  = () => {};     // suppress all warns
console.error = (...args) => {
    if (isOurMessage(args)) originalConsole.error(...args);
    // else silently drop (or log quietly: originalConsole.debug('Suppressed:', ...args))
};
console.debug = () => {};
console.assert = () => {};
console.time   = () => {};
console.timeEnd = () => {};

// ────────────────────────────────────────────────
//   UI with original console (bypasses suppression)
// ────────────────────────────────────────────────
const ui = {
    log: (emoji, msg, color = "#ffffff") =>
        originalConsole.log(`%c${emoji} ${msg}`, `color: ${color}; font-weight: 500`),
    info: msg =>
        originalConsole.log(`%c[ℹ] ${msg}`, "color: #60a5fa; font-weight: 500"),
    success: msg =>
        originalConsole.log(`%c[✓] ${msg}`, "color: #10b981; font-weight: 500"),
    error: msg =>
        originalConsole.log(`%c[✗] ${msg}`, "color: #ef4444; font-weight: 500"),
    progress: (current, total) => {
        const percent = Math.round((current / total) * 100);
        let color, emoji;
        if (percent < 25) { color = "#ef4444"; emoji = "🔴"; }
        else if (percent < 50) { color = "#f59e0b"; emoji = "🟡"; }
        else if (percent < 75) { color = "#3b82f6"; emoji = "🔵"; }
        else if (percent < 100) { color = "#8b5cf6"; emoji = "🟣"; }
        else { color = "#10b981"; emoji = "🟢"; }
        originalConsole.log(`%c${emoji} Progress: ${current}/${total} (${percent}%)`, `color: ${color}; font-weight: 500`);
    }
};

// ────────────────────────────────────────────────
//   CLEANUP
// ────────────────────────────────────────────────
const cleanup = {
    intervals: [],
    dispatchers: [],
    stores: [],
    restore: function() {
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];
        this.dispatchers.forEach(({event, handler}) => {
            try { FluxDispatcher.unsubscribe(event, handler); } catch(e) {}
        });
        this.dispatchers = [];
        this.stores.forEach(({store, method, original}) => {
            try { store[method] = original; } catch(e) {}
        });
        this.stores = [];
        // Restore original console when everything is done
        Object.assign(console, originalConsole);
        ui.success("Cleanup complete + console restored");
    }
};
window.addEventListener('beforeunload', () => cleanup.restore());

// ────────────────────────────────────────────────
//   MAIN SCRIPT
// ────────────────────────────────────────────────
try {
    let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
    let RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api;

    if (!ApplicationStreamingStore) {
        ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.A;
        RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames)?.exports?.Ay;
        QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest)?.exports?.A;
        ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports?.A;
        GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel)?.exports?.Ay;
        FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue)?.exports?.h;
        api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get)?.exports?.Bo;
    } else {
        RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames)?.exports?.ZP;
        QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z;
        ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent)?.exports?.Z;
        GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel)?.exports?.ZP;
        FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue)?.exports?.Z;
        api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get)?.exports?.tn;
    }

    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
    let quests = [...QuestsStore.quests.values()].filter(x =>
        x.userStatus?.enrolledAt &&
        !x.userStatus?.completedAt &&
        new Date(x.config.expiresAt).getTime() > Date.now() &&
        supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y))
    );

    let isApp = typeof DiscordNative !== "undefined";

    if (quests.length === 0) {
        ui.info("You don't have any uncompleted quests!");
        cleanup.restore();
    } else {
        ui.log("🚀", `Starting ${quests.length} quest${quests.length > 1 ? 's' : ''}`);

        let doJob = function() {
            const quest = quests.pop();
            if (!quest) {
                ui.success("All quests processed!");
                cleanup.restore();
                return;
            }

            const pid = Math.floor(Math.random() * 30000) + 1000;
            const applicationId = quest.config.application.id;
            const applicationName = quest.config.application.name;
            const questName = quest.config.messages.questName;
            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
            const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
            const secondsNeeded = taskConfig.tasks[taskName].target;
            let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

            ui.log("🎮", `Processing "${questName}" (${taskName})`);
            ui.info(`Target: ${secondsNeeded}s | Done: ${secondsDone}s`);

            if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
                const maxFuture = 10, speed = 7, interval = 1;
                const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
                let completed = false;

                ui.log("🎬", `Spoofing video for "${questName}"`);

                let fn = async () => {
                    while (true) {
                        const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture;
                        const diff = maxAllowed - secondsDone;
                        const timestamp = secondsDone + speed;

                        if (diff >= speed) {
                            const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}});
                            completed = res.body.completed_at != null;
                            secondsDone = Math.min(secondsNeeded, timestamp);
                            ui.progress(secondsDone, secondsNeeded);
                        }

                        if (timestamp >= secondsNeeded) break;
                        await new Promise(resolve => setTimeout(resolve, interval * 1000));
                    }

                    if (!completed) {
                        await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}});
                    }

                    ui.success(`"${questName}" completed!`);
                    doJob();
                };
                fn();
            } else if (taskName === "PLAY_ON_DESKTOP") {
                if (!isApp) {
                    ui.error(`Desktop app required for "${questName}"`);
                    doJob();
                    return;
                }

                api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
                    const appData = res.body[0];
                    const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","");

                    const fakeGame = {
                        cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                        exeName,
                        exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                        hidden: false,
                        isLauncher: false,
                        id: applicationId,
                        name: appData.name,
                        pid: pid,
                        pidPath: [pid],
                        processName: appData.name,
                        start: Date.now(),
                    };

                    const realGames = RunningGameStore.getRunningGames();
                    const fakeGames = [fakeGame];
                    const realGetRunningGames = RunningGameStore.getRunningGames;
                    const realGetGameForPID = RunningGameStore.getGameForPID;

                    RunningGameStore.getRunningGames = () => fakeGames;
                    RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);

                    cleanup.stores.push(
                        {store: RunningGameStore, method: 'getRunningGames', original: realGetRunningGames},
                        {store: RunningGameStore, method: 'getGameForPID', original: realGetGameForPID}
                    );

                    FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames});

                    let fn = data => {
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                        ui.progress(progress, secondsNeeded);

                        if (progress >= secondsNeeded) {
                            ui.success(`"${questName}" completed!`);
                            RunningGameStore.getRunningGames = realGetRunningGames;
                            RunningGameStore.getGameForPID = realGetGameForPID;
                            FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []});
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                            cleanup.restore(); // partial restore here is safe
                            doJob();
                        }
                    };
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    cleanup.dispatchers.push({event: "QUESTS_SEND_HEARTBEAT_SUCCESS", handler: fn});

                    const etaMins = Math.ceil((secondsNeeded - secondsDone) / 60);
                    ui.info(`Spoofed game → ETA ~${etaMins} minute${etaMins !== 1 ? 's' : ''}`);
                }).catch(err => {
                    ui.error(`Failed to fetch app data: ${err}`);
                    doJob();
                });
            } else if (taskName === "STREAM_ON_DESKTOP") {
                if (!isApp) {
                    ui.error(`Desktop app required for "${questName}"`);
                    doJob();
                    return;
                }

                let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
                ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({id: applicationId, pid, sourceName: null});
                cleanup.stores.push({store: ApplicationStreamingStore, method: 'getStreamerActiveStreamMetadata', original: realFunc});

                ui.log("🟣", `Spoofing stream for ${applicationName}`);
                ui.info("Remember: stream any window in VC with ≥1 other person");

                let fn = data => {
                    let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                    ui.progress(progress, secondsNeeded);

                    if (progress >= secondsNeeded) {
                        ui.success(`"${questName}" completed!`);
                        ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                        cleanup.restore();
                        doJob();
                    }
                };
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                cleanup.dispatchers.push({event: "QUESTS_SEND_HEARTBEAT_SUCCESS", handler: fn});

                const etaMins = Math.ceil((secondsNeeded - secondsDone) / 60);
                ui.info(`ETA ~${etaMins} minute${etaMins !== 1 ? 's' : ''}`);
            } else if (taskName === "PLAY_ACTIVITY") {
                const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ??
                    Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL?.length > 0)?.VOCAL[0].channel.id;
                const streamKey = `call:${channelId}:1`;

                ui.log("🔊", `Starting PLAY_ACTIVITY in channel ${channelId}`);

                let fn = async () => {
                    while (true) {
                        const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
                        const progress = res.body.progress.PLAY_ACTIVITY.value;
                        ui.progress(progress, secondsNeeded);

                        if (progress >= secondsNeeded) {
                            await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
                            ui.success(`"${questName}" completed!`);
                            doJob();
                            break;
                        }
                        await new Promise(r => setTimeout(r, 20 * 1000));
                    }
                };
                fn();
            }
        };

        doJob();
    }
} catch (err) {
    ui.error(`Fatal script error: ${err.message}`);
    originalConsole.error(err);
    cleanup.restore();
}
