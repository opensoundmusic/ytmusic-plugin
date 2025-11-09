import YTMusic from "ytmusic-api"
import { getSongLyrics } from "./fetch_lyrics.mjs";

const ytmusic = new YTMusic()

export async function getSongInfo(id) {
    try {
        await ytmusic.initialize();
        const info = await ytmusic.getSong(id);
        const artist = await getArtistData(info.artist.artistId);
        const lyrics = await getSongLyrics(info.name, artist.name);

        return {
            yt_id: id,
            title: info.name,
            duration: info.duration,
            cover: {
                cover_sm: info.thumbnails.at(0).url,
                cover_lg: info.thumbnails.at(1).url,
                cover_xl: info.thumbnails.at(info.thumbnails.length - 1).url,
            },
            artist: artist,
            lyrics: lyrics,
        };
    } catch (err) {
        console.error(err);
    }
}

export async function getArtistData(id) {
    try {
        const info = await ytmusic.getArtist(id);

        return {
            yt_id: info.artistId,
            name: info.name,
            avatar: {
                avatar_sm: info.thumbnails.at(0).url,
                avatar_lg: info.thumbnails.length === 2 ? null : info.thumbnails.at(1).url,
                avatar_xl: info.thumbnails.at(info.thumbnails.length - 1).url
            }
        }

    } catch (error) {
        console.log(error);
        throw error;
    }
}