import puppeteer from 'puppeteer';
import YTDlpWrap from 'yt-dlp-wrap';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pluginRoot = join(__dirname, '..');
const downloadDir = join(pluginRoot, 'downloads');

if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
}

async function getCookies(vidId) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`https://www.youtube.com/watch?v=${vidId}`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const client = await page.createCDPSession();
    const { cookies } = await client.send('Network.getCookies');
    await browser.close();

    // Convert to Netscape format
    const netscapeCookies = cookies.map(cookie =>
        `${cookie.domain}\tTRUE\t${cookie.path}\t${cookie.secure ? 'TRUE' : 'FALSE'}\t${Math.floor(cookie.expires || Date.now() / 1000 + 86400)}\t${cookie.name}\t${cookie.value}`
    ).join('\n');

    const cookieFilePath = join(pluginRoot, 'cookies.txt');
    writeFileSync(cookieFilePath, '# Netscape HTTP Cookie File\n' + netscapeCookies);

    return cookieFilePath;
}

export async function download(vidId) {
    const cookieFile = await getCookies(vidId);
    console.log('Got cookies, downloading...');

    const ytDlpWrap = new YTDlpWrap();
    
    const ytDlpProcess = ytDlpWrap.exec([
        '--cookies', cookieFile,
        '-f', 'bestaudio',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', `${downloadDir}/${vidId}.%(ext)s`,
        `https://www.youtube.com/watch?v=${vidId}`
    ]);

    return new Promise((resolve, reject) => {
        ytDlpProcess.on('progress', (progress) => {
            console.log(progress.percent, progress.totalSize, progress.currentSpeed, progress.eta);
        });

        ytDlpProcess.on('ytDlpEvent', (eventType, eventData) => {
            console.log(eventType, eventData);
        });

        ytDlpProcess.on('error', (error) => {
            reject(error);
        });

        ytDlpProcess.on('close', () => {
            console.log('Download complete!');
            resolve();
        });
    });
}
