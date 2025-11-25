import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginRoot = join(__dirname, '..');
const downloadDir = join(pluginRoot, 'downloads');

if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
}

let lastCookiesFetched = null;

export async function getCookies(vidId) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        protocolTimeout: 60000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--single-process'
        ]
    });

    const page = await browser.newPage();

    await page.goto(`https://www.youtube.com/watch?v=${vidId}`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const client = await page.createCDPSession();
    const { cookies } = await client.send('Network.getCookies');
    await browser.close();

    // convert to Netscape format
    const netscapeCookies = cookies.map(cookie =>
        `${cookie.domain}\tTRUE\t${cookie.path}\t${cookie.secure ? 'TRUE' : 'FALSE'}\t${Math.floor(cookie.expires || Date.now() / 1000 + 86400)}\t${cookie.name}\t${cookie.value}`
    ).join('\n');

    const cookieFilePath = join(pluginRoot, 'cookies.txt');
    writeFileSync(cookieFilePath, '# Netscape HTTP Cookie File\n' + netscapeCookies);

    lastCookiesFetched = new Date();

    return cookieFilePath;
}



const YTDlpWrap = require('yt-dlp-wrap').default;
const binaryPath = path.join(pluginRoot, 'yt-dlp');

async function ensureYtDlp() {
    // Check if yt-dlp binary exists
    if (fs.existsSync(binaryPath)) {
        console.log('yt-dlp binary found');
        return binaryPath;
    }

    console.log('yt-dlp binary not found, downloading from GitHub...');

    try {
        // download the latest version for the current platform
        await YTDlpWrap.downloadFromGithub(binaryPath);
        console.log('yt-dlp binary downloaded successfully');
        return binaryPath;
    } catch (error) {
        throw new Error(`Failed to download yt-dlp: ${error.message}`);
    }
}

export async function download(vidId) {
    
    let cookieFile;
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    if (lastCookiesFetched > twelveHoursAgo) {
        cookieFile = join(pluginRoot, 'cookies.txt');
    } else {
        cookieFile = await getCookies(vidId);
    }
        
    console.log('Got cookies, downloading...');

    // ensure yt-dlp binary exists
    const ytDlpPath = await ensureYtDlp();
    const ytDlpWrap = new YTDlpWrap(ytDlpPath);

    return new Promise((resolve, reject) => {
        ytDlpWrap
            .exec([
                `https://www.youtube.com/watch?v=${vidId}`,
                '--cookies', cookieFile,
                '-f', 'bestaudio',
                '-x',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', `${downloadDir}/${vidId}.%(ext)s`
            ])
            .on('progress', (progress) => {
                console.log(
                    progress.percent,
                    progress.totalSize,
                    progress.currentSpeed,
                    progress.eta
                );
            })
            .on('ytDlpEvent', (eventType, eventData) => {
                console.log(eventType, eventData);
            })
            .on('error', (error) => {
                reject(error);
            })
            .on('close', () => {
                console.log('Download complete!');
                resolve();
            });
    });
}
