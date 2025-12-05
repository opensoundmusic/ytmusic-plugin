import { Router } from 'express';
import { searchSongs } from './functions/song_search.mjs';
import { download } from './functions/song_download.js';
import { initializeCookies } from './functions/get_cookies.mjs';
import { ytCronJob } from './functions/cron_job.mjs';

const router = Router();

class YouTubeMusicPlugin {
    constructor() {
        this.name = 'youtube-music';
        this.initialized = false;
    }

    async init() {
        console.log('Initializing YouTube Music plugin...');
        ytCronJob.start();
        try {
            await initializeCookies();
            this.initialized = true;
            console.log('YouTube Music plugin initialized');
        } catch (error) {
            console.error('Failed to initialize YouTube Music plugin:', error);
            throw error;
        }
    }

    async cleanup() {
        console.log('Cleaning up YouTube Music plugin...');
        this.initialized = false;
    }

    getRouter() {
        // Search endpoint
        router.get('/search', async (req, res) => {
            try {
                const { q, type = 'song' } = req.query;
                
                if (!q) {
                    return res.status(400).json({ 
                        error: 'Query parameter "q" is required' 
                    });
                }

                const result = await searchSongs(q, type);
                res.json(result);
            } catch (error) {
                res.status(500).json({ 
                    error: 'Search failed', 
                    message: error.message 
                });
            }
        });

        // Download endpoint
        router.post('/download', async (req, res) => {
            try {
                const { videoId } = req.body;
                
                if (!videoId) {
                    return res.status(400).json({ 
                        error: 'videoId is required' 
                    });
                }

                await download(videoId);
                res.json({ 
                    success: true, 
                    message: 'Download started',
                    videoId 
                });
            } catch (error) {
                res.status(500).json({ 
                    error: 'Download failed', 
                    message: error.message 
                });
            }
        });

        return router;
    }

    // Export functions for programmatic use
    async search(query, type = 'song') {
        if (!this.initialized) {
            throw new Error('Plugin not initialized');
        }
        return searchSongs(query, type);
    }

    async downloadVideo(videoId) {
        if (!this.initialized) {
            throw new Error('Plugin not initialized');
        }
        return download(videoId);
    }
}

export default new YouTubeMusicPlugin();
