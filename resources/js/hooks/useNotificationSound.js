import { useCallback, useEffect, useRef } from 'react';

const SOUND_PATTERNS = {
    'order.created': [
        { frequency: 784, duration: 0.09, type: 'sine' },
        { frequency: 988, duration: 0.11, type: 'sine', delay: 0.11 },
        { frequency: 1175, duration: 0.15, type: 'triangle', delay: 0.24 },
    ],
    'notification.created': [
        { frequency: 659, duration: 0.08, type: 'sine' },
        { frequency: 784, duration: 0.12, type: 'sine', delay: 0.11 },
    ],
    'order.updated': [
        { frequency: 523, duration: 0.08, type: 'sine' },
        { frequency: 659, duration: 0.11, type: 'sine', delay: 0.12 },
    ],
    default: [
        { frequency: 698, duration: 0.08, type: 'sine' },
        { frequency: 880, duration: 0.12, type: 'sine', delay: 0.12 },
    ],
};

const resolveAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    return new AudioContextCtor();
};

export default function useNotificationSound() {
    const audioContextRef = useRef(null);
    const unlockedRef = useRef(false);
    const lastPlayedAtRef = useRef(0);

    const unlockAudioContext = useCallback(async () => {
        if (typeof window === 'undefined') return;

        if (!audioContextRef.current) {
            audioContextRef.current = resolveAudioContext();
        }

        const context = audioContextRef.current;
        if (!context) return;

        try {
            if (context.state === 'suspended') {
                await context.resume();
            }
            unlockedRef.current = context.state === 'running';
        } catch (err) {
            console.debug('[audio] Unable to unlock admin notification sound.', err);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleUnlock = () => {
            unlockAudioContext();
        };

        window.addEventListener('pointerdown', handleUnlock, { passive: true, once: true });
        window.addEventListener('keydown', handleUnlock, { passive: true, once: true });
        window.addEventListener('touchstart', handleUnlock, { passive: true, once: true });

        return () => {
            window.removeEventListener('pointerdown', handleUnlock);
            window.removeEventListener('keydown', handleUnlock);
            window.removeEventListener('touchstart', handleUnlock);
        };
    }, [unlockAudioContext]);

    const playNotificationSound = useCallback(async (eventType = 'default', priority = 'normal') => {
        if (typeof window === 'undefined') return;

        const now = Date.now();
        if (now - lastPlayedAtRef.current < 250) return;
        lastPlayedAtRef.current = now;

        if (!audioContextRef.current) {
            audioContextRef.current = resolveAudioContext();
        }

        const context = audioContextRef.current;
        if (!context) return;

        try {
            if (context.state === 'suspended') {
                await context.resume();
            }
        } catch (err) {
            console.debug('[audio] Unable to resume admin notification sound.', err);
            return;
        }

        const pattern = SOUND_PATTERNS[eventType] || SOUND_PATTERNS.default;
        const gainValue = priority === 'high' ? 0.045 : 0.03;
        const startAt = context.currentTime + 0.02;

        pattern.forEach((step) => {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.type = step.type || 'sine';
            oscillator.frequency.value = step.frequency;
            gainNode.gain.value = 0.0001;

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            const stepStart = startAt + (step.delay || 0);
            const stepEnd = stepStart + step.duration;
            gainNode.gain.setValueAtTime(0.0001, stepStart);
            gainNode.gain.exponentialRampToValueAtTime(gainValue, stepStart + 0.015);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, stepEnd);

            oscillator.start(stepStart);
            oscillator.stop(stepEnd + 0.04);
        });
    }, []);

    return {
        playNotificationSound,
        audioUnlocked: unlockedRef.current,
    };
}
