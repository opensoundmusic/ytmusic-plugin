import axios from "axios";

export async function getSongLyrics(title, artist) {
    try {
        const res = await axios.get(`https://lrclib.net/api/get?artist_name=${artist}&track_name=${title}`)
        
        if (res.status === 200) {
            return res.data.syncedLyrics;
        }

        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
}