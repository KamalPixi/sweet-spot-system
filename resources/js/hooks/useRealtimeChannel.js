import { useEffect, useRef, useState } from 'react';
import { acquireEcho, releaseEcho } from '../lib/realtime';

export default function useRealtimeChannel({
    token,
    channel,
    eventName = '.realtime.event',
    onMessage,
    fallbackPoll,
    fallbackInterval = 20000,
    enabled = true,
}) {
    const onMessageRef = useRef(onMessage);
    const fallbackPollRef = useRef(fallbackPoll);
    const connectedRef = useRef(false);
    const fallbackModeLoggedRef = useRef(false);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        fallbackPollRef.current = fallbackPoll;
    }, [fallbackPoll]);

    useEffect(() => {
        connectedRef.current = connected;
    }, [connected]);

    useEffect(() => {
        if (!enabled || !token || !channel) return undefined;

        const echo = acquireEcho(token);
        if (!echo) return undefined;

        const privateChannel = echo.private(channel);
        const handleMessage = (payload) => {
            onMessageRef.current?.(payload, { source: 'socket', channel });
        };
        privateChannel.listen(eventName, handleMessage);

        const pusherConnection = echo.connector?.pusher?.connection;
        const handleStateChange = (state) => {
            setConnected(state.current === 'connected');
        };
        const handleConnected = () => setConnected(true);
        const handleDisconnected = () => setConnected(false);

        if (pusherConnection) {
            setConnected(pusherConnection.state === 'connected');
            pusherConnection.bind('state_change', handleStateChange);
            pusherConnection.bind('connected', handleConnected);
            pusherConnection.bind('disconnected', handleDisconnected);
            pusherConnection.bind('error', handleDisconnected);
        }

        const fallbackIntervalId = setInterval(() => {
            if (!connectedRef.current) {
                if (!fallbackModeLoggedRef.current) {
                    console.info(`[realtime] Falling back to polling for "${channel}"`);
                    fallbackModeLoggedRef.current = true;
                }
                fallbackPollRef.current?.({ source: 'poll' });
            } else if (fallbackModeLoggedRef.current) {
                console.info(`[realtime] Realtime reconnected for "${channel}"`);
                fallbackModeLoggedRef.current = false;
            }
        }, fallbackInterval);

        return () => {
            clearInterval(fallbackIntervalId);
            privateChannel.stopListening(eventName);
            fallbackModeLoggedRef.current = false;

            if (pusherConnection) {
                pusherConnection.unbind('state_change', handleStateChange);
                pusherConnection.unbind('connected', handleConnected);
                pusherConnection.unbind('disconnected', handleDisconnected);
                pusherConnection.unbind('error', handleDisconnected);
            }

            releaseEcho();
        };
    }, [token, channel, eventName, fallbackInterval, enabled]);

    return { connected };
}
