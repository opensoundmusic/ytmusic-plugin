import { CronJob } from 'cron';
import { getConfigAndCookies } from './song_search.mjs';
import { getCookies }  from './song_download.js';

console.log("========= yt-cookies cron job =========");

// cron job to update yt cookies every 12 hours
export const ytCronJob = new CronJob(
	'0 0 */12 * * *', // cronTime
	async function () {
		console.log('fetch new yt-cookies job starting...');
        try {
            await Promise.all([
                getConfigAndCookies(),
                getCookies() 
            ]);
        } catch (error) {
           console.log(`failed to refresh cookies due to: ${error}`); 
        }
	}, // onTick
	function () {
        console.log('yt-cookies job just finished');
    }, // onComplete
	false, // start
);