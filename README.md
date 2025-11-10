# Open Sound YTMusic Plugin

## Overview
The Open Sound YTMusic Plugin extends the Open Sound Core backend by adding the ability to search and download YouTube Music content for personal, self-hosted playback.  
It operates entirely on the user’s local machine and is not affiliated with or endorsed by YouTube, Google LLC, or any third-party service.

The plugin automates metadata retrieval and audio downloads using **unofficial** tools and libraries, and is intended solely for personal and educational use.

---

## Features
- Search and fetch metadata (title, artist, duration, artwork) from YouTube Music.
- Retrieve and download the best available audio stream locally as an MP3 file.
- Operates in a fully self-hosted environment; no external servers or data sharing.
- Uses automated browser sessions to collect cookies for authenticated downloads.

---

## Technical Overview
| Component | Purpose | Source |
|------------|----------|--------|
| **[yt-dlp-wrap](https://github.com/foxesdocode/yt-dlp-wrap)** | Wrapper around the open-source `yt-dlp` binary used to download and convert audio. | GitHub |
| **[puppeteer](https://pptr.dev)** | Launches a headless Chromium instance to generate session cookies from YouTube. | npm |
| **[ytmusic-api](https://github.com/zS1L3NT/ts-npm-ytmusic-api)** | Fetches metadata and search results from YouTube Music endpoints. | GitHub |
| **axios / node-fetch** | General HTTP utilities for API calls. | npm |

All code executes locally under the user’s control.

---

## Setup
1. Clone this repository:
   ```bash
   git clone https://github.com/opensoundmusic/ytmusic-plugin.git
   cd ytmusic-plugin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the service:
   ```bash
   node index.js
   ```

The plugin connects to a running instance of `opensound-core` through the plugin interface.

---

## Legal Notice
This project uses **unofficial interfaces** to access YouTube and YouTube Music.  
It is provided strictly for **personal, self-hosted, and educational use**.  

Downloading or storing copyrighted material from YouTube without permission may violate YouTube’s Terms of Service (Section 5B).  
The developers of Open Sound do **not** endorse or promote any unauthorized downloading or redistribution of copyrighted content.

For the complete statement of terms, see [DISCLAIMER.md](DISCLAIMER.md).

---

## License
Licensed under the MIT License.  
See [LICENSE](LICENSE) for full terms.
