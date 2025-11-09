# Open Sound YTMusic Plugin

## Overview
The Open Sound YTMusic Plugin extends the Open Sound Core backend by adding support for searching and downloading music content from YouTube Music.  
It operates entirely on the user’s local machine and is not affiliated with or endorsed by YouTube or Google LLC.

This plugin uses open-source, unofficial YouTube interfaces and libraries to fetch metadata and audio for personal, self-hosted use.

---

## Features
- Search songs, artists, and albums on YouTube Music using unofficial APIs.
- Fetch song metadata, duration, and cover images.
- Download audio files for offline playback within the Open Sound ecosystem.
- Works entirely offline after download; no remote data storage or sharing.

---

## Technical Implementation
- **APIs:** Uses [youtubei.js](https://github.com/LuanRT/YouTube.js) and [ytmusic-api](https://github.com/Emxal/ytmusic-api) for interacting with YouTube Music’s internal endpoints.
- **Downloads:** Uses [ytdl-core](https://github.com/fent/node-ytdl-core) to retrieve audio streams.
- **Scraping:** Performs limited scraping of YouTube Music pages using cookies and headers to obtain configuration data and artist thumbnails.

All operations happen locally on the user’s server environment.

---

## Usage
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

This plugin expects a running `opensound-core` backend and connects through its plugin system.

---

## Disclaimer
This project uses **unofficial YouTube Music APIs** and web scraping techniques.  
It is intended **solely for personal, self-hosted, and educational use**.  
Using this software to download or store copyrighted music from YouTube may violate YouTube’s Terms of Service.  
The authors of Open Sound do **not encourage or endorse** any unauthorized downloading or redistribution of copyrighted material.

For complete legal details, see [DISCLAIMER.md](DISCLAIMER.md).

---

## License
Licensed under the MIT License.  
See [LICENSE](LICENSE) for full terms.
