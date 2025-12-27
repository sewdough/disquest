# Discord Quest Automation - Enhanced Version (Disquest)

A reliable automation script for Discord quests with improved stability and user feedback.

## What It Does

This script automatically detects and completes Discord quests by simulating the required activities:

- **Detects active quests** from Discord's internal system
- **Simulates game activity** for `PLAY_ON_DESKTOP` quests
- **Fakes video watching** for `WATCH_VIDEO` and `WATCH_VIDEO_ON_MOBILE` quests
- **Spoofs streaming status** for `STREAM_ON_DESKTOP` quests
- **Simulates voice activity** for `PLAY_ACTIVITY` quests
- **Sends progress updates** to Discord's API to mark quests as complete

The script temporarily modifies Discord's client state during operation and automatically restores everything when finished.

## What Has Been Added

### Enhanced Reliability
- **Automatic cleanup system** - Restores all modified Discord functions after completion
- **Comprehensive error handling** - Graceful recovery from API failures and edge cases
- **Page navigation protection** - Auto-cleans on refresh or tab close
- **Resource tracking** - Manages intervals, dispatchers, and store modifications

### Better User Experience
- **Color-coded console output** - Easy-to-read status messages
- **Visual progress tracking** - Percentage completion with emoji indicators
- **ETA calculations** - Estimated time remaining for time-based tasks
- **Detailed status updates** - Clear feedback at every step of the process

### Code Improvements
- **Modular architecture** - Separated UI helpers, cleanup logic, and core functionality
- **Safe iteration patterns** - Replaced risky loops with controlled intervals
- **Centralized configuration** - Organized settings for easier maintenance
- **State management** - Proper handling of quest progression and completion

## How to Run It
First, almost every video related quest can be handled in the browser client, but for quests requiring you to play games, you *will* need the discord dev branch (Canary) as the developer console is locked behind it and is not available in the normal stable branch of Discord. 
You can get this here: https://canary.discord.com/

### Quick Start
1. **Open Discord** in your browser
2. **Open the Quest page and accept a quest.
3. **Open Developer Console**:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J`
   - Firefox: Press `F12` or `Ctrl+Shift+K`
   - Discord Desktop (CANARY ONLY): `Ctrl+Shift+I`
4. **Navigate to the Console tab**
5. **Copy the entire script** and paste it into the console
6. **Press Enter** to execute

### What to Expect
After running the script:
- You'll see color-coded status messages in the console
- The script will automatically detect any active quests
- Progress will be displayed with percentages and ETA
- When complete, you'll see a success message
- All modifications will be automatically cleaned up

### Platform Notes
- **OS**: Windows 10/11 (Though I can port this to MacOS / Linux if needed. It's relatively easy to do.)
- **Browser**: Works on Chrome, Firefox, Edge (latest versions)
- **Desktop App (Canary branch)**: Required for `PLAY_ON_DESKTOP` and `STREAM_ON_DESKTOP` quests
- **Video Quests**: Work in both browser and desktop app
- **Streaming Quests**: Require at least one other person in the voice channel (You do not need to stream the game. Just need to be in a voice channel with streaming permissions with someone.)

##Script Download:
<details>
<summary>Click to reveal the script</summary>
   ```js
   delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

// ============ RESILIENCE ADDITIONS ============
const cleanup = {
    intervals: [],
    dispatchers: [],
    stores: [],
    restore: function() {
        this.intervals.forEach(id => clearInterval(id));
        this.dispatchers.forEach(({event, handler}) => {
            try { FluxDispatcher.unsubscribe(event, handler); } catch(e) {}
        });
        this.stores.forEach(({store, method, original}) => {
            try { store[method] = original; } catch(e) {}
        });
        console.log("%c[✓] Cleanup complete", "color: #a3a3a3");
    }
};
// Auto-cleanup on errors
window.addEventListener('beforeunload', () => cleanup.restore());
// ==============================================

try {
    let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata).exports.Z;
    let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames).exports.ZP;
    let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
    let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent).exports.Z;
    let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel).exports.ZP;
    let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue).exports.Z;
    let api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;

    let quest = [...QuestsStore.quests.values()].find(x => x.id !== "1412491570820812933" && x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now())
    let isApp = typeof DiscordNative !== "undefined"
    
    if(!quest) {
        console.log("%c[ℹ] No active quests found", "color: #a3a3a3");
    } else {
        const pid = Math.floor(Math.random() * 30000) + 1000
        
        const applicationId = quest.config.application.id
        const applicationName = quest.config.application.name
        const questName = quest.config.messages.questName
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2
        const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null)
        const secondsNeeded = taskConfig.tasks[taskName].target
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0

        // ============ UI HELPER FUNCTIONS ============
        const ui = {
            log: (emoji, message, color = "#ffffff") => {
                console.log(`%c${emoji} ${message}`, `color: ${color}; font-weight: 500`);
            },
            progress: (current, total) => {
                const percent = Math.round((current / total) * 100);
                let color, emoji;
                if (percent < 25) {
                    color = "#ef4444"; emoji = "🔴"; // Red
                } else if (percent < 50) {
                    color = "#f59e0b"; emoji = "🟡"; // Yellow
                } else if (percent < 75) {
                    color = "#3b82f6"; emoji = "🔵"; // Blue
                } else if (percent < 100) {
                    color = "#8b5cf6"; emoji = "🟣"; // Purple
                } else {
                    color = "#10b981"; emoji = "🟢"; // Green
                }
                console.log(`%c${emoji} Progress: ${current}/${total} (${percent}%)`, `color: ${color}; font-weight: 500`);
            },
            error: (message) => {
                console.log(`%c[✗] ${message}`, "color: #ef4444; font-weight: 500");
            },
            success: (message) => {
                console.log(`%c[✓] ${message}`, "color: #10b981; font-weight: 500");
            },
            info: (message) => {
                console.log(`%c[ℹ] ${message}`, "color: #60a5fa; font-weight: 500");
            }
        };
        // ============================================
        
        ui.log("🎮", `Starting "${questName}"`);
        ui.info(`Task: ${taskName} | Need: ${secondsNeeded}s`);
        
        if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            const maxFuture = 10, speed = 7, interval = 1
            const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime()
            let completed = false
            
            ui.log("🎬", `Spoofing video for ${questName}`);
            
            const videoInterval = setInterval(async () => {			
                try {
                    const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture
                    const diff = maxAllowed - secondsDone
                    const timestamp = secondsDone + speed
                    
                    if(diff >= speed) {
                        const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}})
                        completed = res.body.completed_at != null
                        secondsDone = Math.min(secondsNeeded, timestamp)
                        
                        if (secondsDone > 0) {
                            ui.progress(secondsDone, secondsNeeded);
                        }
                    }
                    
                    if(timestamp >= secondsNeeded) {
                        clearInterval(videoInterval)
                        if(!completed) {
                            await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}})
                        }
                        ui.success("Quest completed!");
                        cleanup.restore()
                    }
                } catch (err) {
                    ui.error(`Video error: ${err.message}`)
                }
            }, interval * 1000)
            
            cleanup.intervals.push(videoInterval)
            
        } else if(taskName === "PLAY_ON_DESKTOP") {
            if(!isApp) {
                ui.error(`Desktop required. Use Canary method for "${questName}"`);
            } else {
                ui.log("🟣", `Spoofing ${applicationName}...`);
                
                api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
                    const appData = res.body[0]
                    const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","")
                    
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
                    }
                    const realGames = RunningGameStore.getRunningGames()
                    const fakeGames = [fakeGame]
                    const realGetRunningGames = RunningGameStore.getRunningGames
                    const realGetGameForPID = RunningGameStore.getGameForPID
                    
                    RunningGameStore.getRunningGames = () => fakeGames
                    RunningGameStore.getGameForPID = (targetPid) => fakeGames.find(x => x.pid === targetPid)
                    
                    cleanup.stores.push(
                        { store: RunningGameStore, method: 'getRunningGames', original: realGetRunningGames },
                        { store: RunningGameStore, method: 'getGameForPID', original: realGetGameForPID }
                    )
                    
                    FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames})
                    
                    let fn = data => {
                        try {
                            let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value)
                            
                            if (progress > 0) {
                                ui.progress(progress, secondsNeeded);
                            }
                            
                            if(progress >= secondsNeeded) {
                                ui.success("Quest completed!");
                                
                                RunningGameStore.getRunningGames = realGetRunningGames
                                RunningGameStore.getGameForPID = realGetGameForPID
                                FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []})
                                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                                cleanup.restore()
                            }
                        } catch (err) {
                            ui.error(`Progress error: ${err.message}`)
                        }
                    }
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                    
                    cleanup.dispatchers.push({
                        event: "QUESTS_SEND_HEARTBEAT_SUCCESS",
                        handler: fn
                    })
                    
                    const remainingMins = Math.ceil((secondsNeeded - secondsDone) / 60);
                    ui.log("🟣", `${applicationName} spoofed`);
                    ui.info(`ETA: ~${remainingMins} minute${remainingMins !== 1 ? 's' : ''}`);
                    
                }).catch(err => {
                    ui.error(`Failed to fetch app data: ${err.message}`)
                })
            }
            
        } else if(taskName === "STREAM_ON_DESKTOP") {
            if(!isApp) {
                ui.error(`Desktop required. Use Canary method for "${questName}"`);
            } else {
                let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata
                
                ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                    id: applicationId,
                    pid,
                    sourceName: null
                })
                
                cleanup.stores.push({
                    store: ApplicationStreamingStore,
                    method: 'getStreamerActiveStreamMetadata',
                    original: realFunc
                })
                
                ui.log("🟣", `Spoofing stream for ${applicationName}`);
                ui.info("Stream any window in VC");
                ui.info("Required: 1+ other person in VC");
                
                let fn = data => {
                    try {
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value)
                        
                        if (progress > 0) {
                            ui.progress(progress, secondsNeeded);
                        }
                        
                        if(progress >= secondsNeeded) {
                            ui.success("Quest completed!");
                            
                            ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                            cleanup.restore()
                        }
                    } catch (err) {
                        ui.error(`Progress error: ${err.message}`)
                    }
                }
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                
                cleanup.dispatchers.push({
                    event: "QUESTS_SEND_HEARTBEAT_SUCCESS",
                    handler: fn
                })
                
                const remainingMins = Math.ceil((secondsNeeded - secondsDone) / 60);
                ui.info(`ETA: ~${remainingMins} minute${remainingMins !== 1 ? 's' : ''}`);
            }
            
        } else if(taskName === "PLAY_ACTIVITY") {
            const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id
            const streamKey = `call:${channelId}:1`
            
            ui.log("🔊", `Starting activity in channel ${channelId}`);
            ui.info(`Quest: ${questName}`);
            
            const activityInterval = setInterval(async () => {
                try {
                    const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}})
                    const progress = res.body.progress.PLAY_ACTIVITY.value
                    
                    if (progress > 0) {
                        ui.progress(progress, secondsNeeded);
                    }
                    
                    if(progress >= secondsNeeded) {
                        clearInterval(activityInterval)
                        await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}})
                        ui.success("Quest completed!");
                        cleanup.restore()
                    }
                } catch (err) {
                    ui.error(`Heartbeat error: ${err.message}`)
                }
            }, 20 * 1000)
            
            cleanup.intervals.push(activityInterval)
        }
    }
} catch (error) {
    console.log(`%c[✗] Fatal error: ${error.message}`, "color: #ef4444; font-weight: 500");
    if (error.stack) console.error(error.stack);
    if (cleanup.restore) cleanup.restore();
}
```
</details>

### Troubleshooting
- If nothing happens: Ensure you're on a Discord page (not login screen)
- For desktop-only quests: Switch to Discord Desktop application
- If errors appear: Check the console for color-coded error messages
- To stop early: Refresh the page - cleanup happens automatically

---

*Note: This tool automates activities that may be against Discord's Terms of Service. Use responsibly and at your own risk.*
