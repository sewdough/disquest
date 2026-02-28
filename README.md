# Disquest
> ⚠️ This project is an experimental, client-side exploration of Discord’s quest state handling.  
> It is provided for educational and research purposes and runs entirely within the local client environment.

![Screenshot of Disquest in action.](https://i.imgur.com/UoE6Pv4.png)

## What It Does

This script demonstrates how Discord quest progress is represented and updated within the client by observing and replaying expected client-side signals:

- **Identifies active quest states** within the client
- **Simulates game activity** for `PLAY_ON_DESKTOP` quests
- **Emulates expected video playback signals** for `WATCH_VIDEO` and `WATCH_VIDEO_ON_MOBILE` quests
- **Replicates streaming state transitions** for `STREAM_ON_DESKTOP` quests
- **Simulates voice activity** for `PLAY_ACTIVITY` quests
- **Dispatches progress events matching client expectations**

The script operates by temporarily altering client-side state and restores all changes upon completion.

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
- **Recursive Quest Completion** - You can now accept multiple quests at a time and let the script run through them all. :)

## Usage (Local Client)
First, almost every video related quest can be handled in the browser client, but for quests requiring you to play games, you *will* need the Discord dev branch (Canary) as the developer console is locked behind it and is not available in the normal stable branch of Discord. 
You can get this here: https://canary.discord.com/

### Quick Start
1. **Open Discord** in your browser or Discord Canary app.
2. **⚠️Open the Quest page and accept a quest.⚠️**
3. **Open Developer Console**:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J`
   - Firefox: Press `F12` or `Ctrl+Shift+K`
   - Discord Desktop (CANARY ONLY): `Ctrl+Shift+I`
4. **Navigate to the Console tab**
5. **If you've never done this before, you will see a bunch of warnings from Discord. This is normal. You will need to type "Allow Pasting" to proceed.**
6. **Copy the entire script** (disquest.js) and paste it into the console
7. **Press Enter** to execute

### What to Expect
After running the script:
- You'll see color-coded status messages in the console
- The script will automatically detect any active quests
- Note: You will need to reinvoke the script after quest completion. You do not need to paste it again, simply hit the ↑ arrow on your keyboard in the console to reinvoke the script and hit enter.
- Progress will be displayed with percentages and ETA
- When complete, you'll see a success message
- All modifications will be automatically cleaned up

### Platform Notes
- **OS**: Windows 10/11 (Though I can port this to MacOS / Linux if needed. It's relatively easy to do.)
- **Browser**: Works on Chrome, Firefox, Edge (latest versions)
- **Desktop App (Canary branch)**: Required for `PLAY_ON_DESKTOP` and `STREAM_ON_DESKTOP` quests
- **Video Quests**: Work in both browser and desktop app
- **Streaming Quests**: Require at least one other person in the voice channel (You do not need to stream the game. Just need to be in a voice channel with streaming permissions with someone.)

### Troubleshooting
- If nothing happens: Ensure you're on a Discord page (not login screen)
- For desktop-only quests (games, streaming, etc): Switch to the Discord Canary Desktop application
- If errors appear: Check the console for color-coded error messages
- To stop early: Refresh the page (CTRL+R) - cleanup happens automatically in the script.

---


## Disclaimer
This project is provided as-is and is intended for learning, experimentation, and client behavior analysis.
Users are responsible for how they choose to use the software.
