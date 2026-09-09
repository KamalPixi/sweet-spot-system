import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;
let currentToken = null;
let consumerCount = 0;

const resolveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const buildEcho = (token) => {
    window.Pusher = Pusher;

    const isHttps = window.location.protocol === 'https:';
    const scheme = isHttps ? 'https' : (import.meta.env.VITE_REVERB_SCHEME || 'http');
    
    let host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
    if ((host === 'localhost' || host === '127.0.0.1') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        host = window.location.hostname;
    }

    const port = isHttps ? 443 : resolveNumber(import.meta.env.VITE_REVERB_PORT, scheme === 'https' ? 443 : 80);

    return new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: host,
        wsPath: '/live-ws',
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/api/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });
};

export const acquireEcho = (token) => {
    if (!token) return null;

    if (!echoInstance || currentToken !== token) {
        if (echoInstance) {
            echoInstance.disconnect();
        }

        echoInstance = buildEcho(token);
        currentToken = token;
    }

    consumerCount += 1;
    return echoInstance;
};

export const getEchoSocketId = () => {
    if (!echoInstance?.socketId) return null;
    return echoInstance.socketId();
};

export const releaseEcho = () => {
    consumerCount = Math.max(0, consumerCount - 1);

    if (consumerCount === 0 && echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
        currentToken = null;
    }
};
