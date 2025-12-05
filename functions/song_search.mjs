import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchYouTubeMusicCookies } from './get_cookies.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedConfig = null;
let cachedCookies = null;
let lastRefresh = null;
const REFRESH_INTERVAL = 86400000;

const artistAvatarCache = new Map();

export async function getConfigAndCookies(forceRefresh = false) {
    const now = Date.now();
    const projectRoot = path.join(__dirname, '..');
    const cookiesDir = path.join(projectRoot, 'cookies');
    const cookiePath = path.join(cookiesDir, 'search_cookies.txt');
    const configPath = path.join(cookiesDir, 'ytconfig.json');
    
    let needsRefresh = forceRefresh;
    
    if (!needsRefresh && fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const fetchedTimestamp = config.fetchedTimestamp || 0;
        const timeSinceFetch = now - fetchedTimestamp;
        
        needsRefresh = timeSinceFetch > REFRESH_INTERVAL || 
                       !fs.existsSync(cookiePath);
    } else {
        needsRefresh = true;
    }
    
    if (needsRefresh) {
        console.log('Fetching fresh cookies and config...');
        const result = await fetchYouTubeMusicCookies(true);
        
        if (!result.success) {
            throw new Error('Failed to fetch cookies: ' + result.error);
        }
        
        lastRefresh = now;
    }
    
    cachedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    const cookieContent = fs.readFileSync(cookiePath, 'utf-8');
    cachedCookies = cookieContent
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const parts = line.split('\t');
            if (parts.length >= 7) {
                return `${parts[5]}=${parts[6]}`;
            }
            return null;
        })
        .filter(Boolean)
        .join('; ');
    
    return { config: cachedConfig, cookies: cachedCookies };
}

async function getArtistAvatar(artistId, config, cookies) {
    if (!artistId || artistId === 'unknown') {
        return {
            avatar_sm: null,
            avatar_lg: null,
            avatar_xl: null
        };
    }

    if (artistAvatarCache.has(artistId)) {
        return artistAvatarCache.get(artistId);
    }

    try {
        const context = {
            client: {
                clientName: 'WEB_REMIX',
                clientVersion: config.INNERTUBE_CLIENT_VERSION || '1.20231219.01.00',
                hl: 'en',
                gl: 'US',
                ...config.INNERTUBE_CONTEXT?.client
            },
            user: config.INNERTUBE_CONTEXT?.user || {}
        };

        const requestBody = {
            context,
            browseId: artistId
        };

        const response = await axios.post(
            `https://music.youtube.com/youtubei/${config.INNERTUBE_API_VERSION}/browse`,
            requestBody,
            {
                params: {
                    key: config.INNERTUBE_API_KEY,
                    prettyPrint: false
                },
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://music.youtube.com',
                    'Referer': `https://music.youtube.com/channel/${artistId}`,
                    'Cookie': cookies,
                    'X-Goog-Visitor-Id': config.INNERTUBE_CONTEXT?.client?.visitorData || '',
                    'X-Youtube-Client-Name': '67',
                    'X-Youtube-Client-Version': config.INNERTUBE_CLIENT_VERSION || '1.20231219.01.00'
                }
            }
        );

        const thumbnails = response.data?.header?.musicImmersiveHeaderRenderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                          response.data?.header?.musicVisualHeaderRenderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];

        const avatars = {
            avatar_sm: thumbnails[0]?.url || null,
            avatar_lg: thumbnails[1]?.url || null,
            avatar_xl: thumbnails[thumbnails.length - 1]?.url || null
        };

        artistAvatarCache.set(artistId, avatars);
        return avatars;

    } catch (error) {
        console.error(`Error fetching artist avatar for ${artistId}:`, error.message);
        return {
            avatar_sm: null,
            avatar_lg: null,
            avatar_xl: null
        };
    }
}

export async function searchSongs(query, type = 'song', retryCount = 0) {
    try {
        const { config, cookies } = await getConfigAndCookies();
        
        console.log('Searching for:', query);
        
        const context = {
            client: {
                clientName: 'WEB_REMIX',
                clientVersion: config.INNERTUBE_CLIENT_VERSION || '1.20231219.01.00',
                hl: 'en',
                gl: 'US',
                ...config.INNERTUBE_CONTEXT?.client
            },
            user: config.INNERTUBE_CONTEXT?.user || {}
        };
        
        let params = null;
        if (type === 'song') {
            params = 'EgWKAQIIAWoKEAoQAxAEEAkQBQ%3D%3D';
        }
        
        const requestBody = {
            context,
            query,
            params
        };
        
        const response = await axios.post(
            `https://music.youtube.com/youtubei/${config.INNERTUBE_API_VERSION}/search`,
            requestBody,
            {
                params: {
                    key: config.INNERTUBE_API_KEY,
                    prettyPrint: false
                },
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://music.youtube.com',
                    'Referer': 'https://music.youtube.com/search',
                    'Cookie': cookies,
                    'X-Goog-Visitor-Id': config.INNERTUBE_CONTEXT?.client?.visitorData || '',
                    'X-Youtube-Client-Name': '67',
                    'X-Youtube-Client-Version': config.INNERTUBE_CLIENT_VERSION || '1.20231219.01.00'
                }
            }
        );
        
        const results = await parseSearchResults(response.data, config, cookies);
        
        return {
            success: true,
            statusCode: 200,
            data: results,
            length: results.length,
        };
        
    } catch (error) {
        console.error('Search error:', error.message);
        
        if (error.response?.status === 400 && retryCount === 0) {
            console.log('Got 400 error, refreshing and retrying...');
            await getConfigAndCookies(true);
            return searchSongs(query, type, retryCount + 1);
        }
        
        return {
            msg: "An error occurred while searching",
            statusCode: error.response?.status || 502,
            error: error.message
        };
    }
}

function parseDuration(durationText) {
    if (!durationText) return null;
    
    const parts = durationText.split(':').map(p => parseInt(p, 10));
    
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return null;
}

async function parseSearchResults(data, config, cookies) {
    const results = [];
    
    try {
        const contents = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
        
        if (!contents) return results;
        
        const artistIds = new Set();
        const tempResults = [];
        
        for (const section of contents) {
            const items = section?.musicShelfRenderer?.contents;
            if (!items) continue;
            
            for (const item of items) {
                const musicItem = item?.musicResponsiveListItemRenderer;
                if (!musicItem) continue;
                
                const flexColumns = musicItem.flexColumns || [];
                
                const titleRuns = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                const title = titleRuns[0]?.text || '';
                
                const secondColumnRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                const artistName = secondColumnRuns[0]?.text || '';
                const artistId = secondColumnRuns[0]?.navigationEndpoint?.browseEndpoint?.browseId || null;
                
                if (artistId) {
                    artistIds.add(artistId);
                }
                
                const videoId = musicItem.playlistItemData?.videoId || 
                               musicItem.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
                
                if (!videoId) continue;
                
                const fixedColumns = musicItem.fixedColumns || [];
                let durationSeconds = null;
                
                for (const column of fixedColumns) {
                    const text = column?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text;
                    if (text && text.includes(':')) {
                        durationSeconds = parseDuration(text);
                        break;
                    }
                }
                
                const thumbnails = musicItem.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                
                tempResults.push({
                    title: title || 'unknown',
                    artistId: artistId,
                    artistName: artistName,
                    type: 'SONG',
                    yt_id: videoId,
                    duration: durationSeconds,
                    cover: {
                        cover_sm: thumbnails[0]?.url || null,
                        cover_lg: thumbnails[1]?.url || null,
                        cover_xl: thumbnails[thumbnails.length - 1]?.url || null,
                    }
                });
            }
        }
        
        const artistAvatarPromises = Array.from(artistIds).map(id => 
            getArtistAvatar(id, config, cookies).then(avatars => ({ id, avatars }))
        );
        
        const artistAvatarsResults = await Promise.all(artistAvatarPromises);
        const artistAvatarsMap = new Map(
            artistAvatarsResults.map(({ id, avatars }) => [id, avatars])
        );
        
        for (const tempResult of tempResults) {
            const avatars = artistAvatarsMap.get(tempResult.artistId) || {
                avatar_sm: null,
                avatar_lg: null,
                avatar_xl: null
            };
            
            results.push({
                title: tempResult.title,
                artist: {
                    id: tempResult.artistId || 'unknown',
                    yt_id: tempResult.artistId || 'unknown',
                    name: tempResult.artistName || 'unknown',
                    avatar_sm: avatars.avatar_sm,
                    avatar_lg: avatars.avatar_lg,
                    avatar_xl: avatars.avatar_xl
                },
                type: tempResult.type,
                yt_id: tempResult.yt_id,
                duration: tempResult.duration,
                cover: tempResult.cover
            });
        }
    } catch (error) {
        console.error('Error parsing results:', error.message);
    }
    
    return results;
}