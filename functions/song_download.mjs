import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
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

    return new Promise((resolve, reject) => {
        const ytDlp = spawn('yt-dlp', [
            '--cookies', cookieFile,
            '-f', 'bestaudio',
            '-x',                          // Extract audio
            '--audio-format', 'mp3',       // Convert to mp3
            '--audio-quality', '0',        // Best quality
            '-o', `${downloadDir}/${vidId}.%(ext)s`,
            `https://www.youtube.com/watch?v=${vidId}`
        ]);

        ytDlp.stdout.on('data', (data) => console.log(data.toString()));
        ytDlp.stderr.on('data', (data) => console.log(data.toString()));
        ytDlp.on('close', (code) => {
            if (code === 0) {
                console.log('Download complete!');
                resolve();
            } else {
                reject(new Error(`Failed with code ${code}`));
            }
        });
    });
}
