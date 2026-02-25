/**
 * Utility function to play sound effects
 * @param {string} soundPath - Path to the sound file (relative to public directory)
 * @param {number} volume - Volume level (0.0 to 1.0), default is 0.5
 * @returns {Promise} Promise that resolves when sound starts playing
 */
export const playSound = (soundPath, volume = 0.5) => {
    return new Promise((resolve, reject) => {
        try {
            console.log(`🔊 [Sound] Attempting to play: ${soundPath}`);
            const audio = new Audio(soundPath);
            audio.volume = Math.max(0, Math.min(1, volume)); // Clamp volume between 0 and 1

            audio.addEventListener('canplaythrough', () => {
                console.log(`🔊 [Sound] Audio loaded successfully: ${soundPath}`);
            });

            audio.addEventListener('error', (e) => {
                const error = audio.error;
                let errorMessage = 'Unknown error';

                if (error) {
                    switch (error.code) {
                        case 1: errorMessage = 'MEDIA_ERR_ABORTED - Fetching process aborted by user'; break;
                        case 2: errorMessage = 'MEDIA_ERR_NETWORK - Network error'; break;
                        case 3: errorMessage = 'MEDIA_ERR_DECODE - Decoding error'; break;
                        case 4: errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED - Audio source not supported or not found'; break;
                    }
                }

                console.error(`🔊 [Sound] Error loading audio: ${soundPath}`, {
                    code: error ? error.code : 'unknown',
                    message: errorMessage,
                    details: e
                });
                reject(new Error(errorMessage));
            });

            audio.play()
                .then(() => {
                    console.log(`🔊 [Sound] Playing: ${soundPath}`);
                    resolve();
                })
                .catch(error => {
                    console.warn(`🔊 [Sound] Failed to play: ${soundPath}`, error);
                    reject(error);
                });
        } catch (error) {
            console.error(`🔊 [Sound] Error creating audio: ${soundPath}`, error);
            reject(error);
        }
    });
};

/**
 * Play boxing ring bell sound twice (like a real boxing bell)
 */
export const playBoxingBell = async () => {
    try {
        console.log('🥊 [Boxing Bell] Starting bell sequence...');

        // Play first bell
        await playSound('/assets/boxing_bell_effect.mp3', 1);

        // Wait before second bell
        await new Promise(resolve => setTimeout(resolve, 800));

        // Play second bell
        await playSound('/assets/opening_bell_effect.mp3', 1);

        console.log('🥊 [Boxing Bell] Bell sequence completed!');
    } catch (error) {
        console.error('🥊 [Boxing Bell] Failed to play bell:', error);
    }
};
