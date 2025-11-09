# Open Sound YTMusic Plugin

## Overview
This optional Node.js plugin extends Open Sound Core with the ability to fetch public metadata from YouTube Music. It can also download audio files locally for personal use.

## Features
- Fetch song titles, artists, and album artwork from YouTube Music.
- Optional audio download for offline use.
- Full local operation; no data is uploaded or shared externally.
- Built with Node.js and integrated through the Open Sound plugin system.

## Usage
1. Clone the repository:
   ```bash
   git clone https://github.com/opensoundmusic/ytmusic-plugin.git
   cd ytmusic-plugin
   ```
2. Install dependencies and start the service:
   ```bash
   npm install
   node index.js
   ```

Ensure `opensound-core` is running before using this plugin.

## Legal Disclaimer
This plugin is not affiliated with or endorsed by YouTube or Google LLC. It operates locally and does not distribute or host any copyrighted material. Use of this plugin must comply with YouTube’s Terms of Service.

See `DISCLAIMER.md` for more information.

## License
Licensed under the MIT License. See `LICENSE` for full terms.
