# Discord Quest Automation - Enhanced Version (Disquest)

A reliable automation script for Discord quests with improved stability and user feedback.
![Screenshot of Disquest in action.](https://i.imgur.com/UoE6Pv4.png)
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
1. **Open Discord** in your browser or Discord Canary app.
2. **⚠️Open the Quest page and accept a quest.⚠️**
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

### Troubleshooting
- If nothing happens: Ensure you're on a Discord page (not login screen)
- For desktop-only quests (games, streaming, etc): Switch to the Discord Canary Desktop application
- If errors appear: Check the console for color-coded error messages
- To stop early: Refresh the page (CTRL+R) - cleanup happens automatically in the script.

---

*Note: This tool automates activities that may be against Discord's Terms of Service. Use responsibly and at your own risk.*
