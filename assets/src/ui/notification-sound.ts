const BASE_FREQUENCY_HZ = 600;
const PEAK_FREQUENCY_HZ = 1200;
const PEAK_GAIN = 0.1;
const FLOOR_GAIN = 0.01;
const SOUND_DURATION_S = 0.3;

export const playNotificationSound = (): void => {
    try {
        const AudioContextClass = window.AudioContext;
        const context = new AudioContextClass();
        if (context.state === 'suspended') return;

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(BASE_FREQUENCY_HZ, now);
        oscillator.frequency.exponentialRampToValueAtTime(PEAK_FREQUENCY_HZ, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(PEAK_GAIN, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(FLOOR_GAIN, now + SOUND_DURATION_S);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(now + SOUND_DURATION_S);
    } catch {
        /* audio is optional: autoplay policy or missing Web Audio support */
    }
};
