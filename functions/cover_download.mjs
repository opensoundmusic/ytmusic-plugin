import fetch from 'node-fetch';

export async function downloadImageBuffer(url) {
    try {
        if (!url) return null;

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Failed to fetch image: ${url} - ${response.statusText}`);
            return null;
        }

        const buffer = await response.buffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return { buffer, contentType };
    } catch (error) {
        console.warn(`Error downloading image: ${url}`, error.message);
        return null;
    }
}

export async function downloadCovers(coverUrls) {
    const covers = {
        cover_sm: null,
        cover_lg: null,
        cover_xl: null
    };

    // Download all covers in parallel
    const [sm, lg, xl] = await Promise.all([
        downloadImageBuffer(coverUrls.cover_sm),
        downloadImageBuffer(coverUrls.cover_lg),
        downloadImageBuffer(coverUrls.cover_xl)
    ]);

    if (sm) covers.cover_sm = sm;
    if (lg) covers.cover_lg = lg;
    if (xl) covers.cover_xl = xl;

    return covers;
}

export async function downloadArtistAvatars(avatarUrls) {
    const avatars = {
        avatar_sm: null,
        avatar_lg: null,
        avatar_xl: null
    };

    // Download all avatars in parallel
    const [sm, lg, xl] = await Promise.all([
        downloadImageBuffer(avatarUrls.avatar_sm),
        downloadImageBuffer(avatarUrls.avatar_lg),
        downloadImageBuffer(avatarUrls.avatar_xl)
    ]);

    if (sm) avatars.avatar_sm = sm;
    if (lg) avatars.avatar_lg = lg;
    if (xl) avatars.avatar_xl = xl;

    return avatars;
}