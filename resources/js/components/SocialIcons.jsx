import React from 'react';
import { Globe } from 'lucide-react';

export const SOCIAL_PLATFORMS = [
    { id: 'instagram', name: 'Instagram', defaultPlaceholder: 'https://instagram.com/yourhandle', defaultLabel: 'Instagram' },
    { id: 'tiktok', name: 'TikTok', defaultPlaceholder: 'https://tiktok.com/@yourhandle', defaultLabel: 'TikTok' },
    { id: 'facebook', name: 'Facebook', defaultPlaceholder: 'https://facebook.com/yourpage', defaultLabel: 'Facebook' },
    { id: 'twitter', name: 'Twitter / X', defaultPlaceholder: 'https://x.com/yourhandle', defaultLabel: 'Twitter / X' },
    { id: 'youtube', name: 'YouTube', defaultPlaceholder: 'https://youtube.com/@yourchannel', defaultLabel: 'YouTube' },
    { id: 'snapchat', name: 'Snapchat', defaultPlaceholder: 'https://snapchat.com/add/yourhandle', defaultLabel: 'Snapchat' },
    { id: 'whatsapp', name: 'WhatsApp', defaultPlaceholder: 'https://wa.me/441234567890', defaultLabel: 'WhatsApp' },
    { id: 'threads', name: 'Threads', defaultPlaceholder: 'https://threads.net/@yourhandle', defaultLabel: 'Threads' },
    { id: 'pinterest', name: 'Pinterest', defaultPlaceholder: 'https://pinterest.com/yourprofile', defaultLabel: 'Pinterest' },
    { id: 'linkedin', name: 'LinkedIn', defaultPlaceholder: 'https://linkedin.com/company/yourbrand', defaultLabel: 'LinkedIn' },
    { id: 'website', name: 'Custom Website', defaultPlaceholder: 'https://yourwebsite.com', defaultLabel: 'Website' },
];

export function getPlatformInfo(platformId) {
    return SOCIAL_PLATFORMS.find(p => p.id === platformId) || {
        id: platformId || 'website',
        name: platformId ? platformId.charAt(0).toUpperCase() + platformId.slice(1) : 'Link',
        defaultPlaceholder: 'https://...',
        defaultLabel: platformId || 'Link'
    };
}

export function SocialIcon({ platform, className = "w-4 h-4", size = 16 }) {
    const key = (platform || '').toLowerCase().trim();

    switch (key) {
        case 'instagram':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
            );

        case 'tiktok':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.33 6.33 0 0 0 6.33-6.32V8.92a8.28 8.28 0 0 0 4.84 1.57v-3.8z"/>
                </svg>
            );

        case 'facebook':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            );

        case 'twitter':
        case 'x':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            );

        case 'youtube':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            );

        case 'snapchat':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.007 2c-3.708 0-6.19 2.584-6.19 6.275 0 1.25.438 2.568.795 3.42.12.287.164.44.11.58-.09.232-.486.438-.895.535-.41.096-.92.176-1.127.425-.23.278-.184.678.106.914.542.44 1.488.58 2.215.707.382.067.625.267.625.56 0 .428-.43.914-1.22 1.25-.568.24-.954.542-1.002.936-.06.495.34.935.95 1.098.814.218 1.83.056 2.652-.392.518-.284.975-.125 1.253.11.472.4 1.09 1.587 1.728 1.587.638 0 1.256-1.186 1.728-1.587.278-.235.735-.394 1.253-.11.822.448 1.838.61 2.652.392.61-.163 1.01-.603.95-1.098-.048-.394-.434-.696-1.002-.936-.79-.336-1.22-.822-1.22-1.25 0-.293.243-.493.625-.56.727-.127 1.673-.267 2.215-.707.29-.236.336-.636.106-.914-.207-.249-.717-.329-1.127-.425-.41-.097-.805-.303-.895-.535-.054-.14-.01-.293.11-.58.357-.852.795-2.17.795-3.42 0-3.691-2.482-6.275-6.19-6.275z"/>
                </svg>
            );

        case 'whatsapp':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.662 1.442 5.177L2 22l4.981-1.306C8.423 21.534 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
            );

        case 'threads':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.186 24C5.454 24 0 18.618 0 12.016 0 5.415 5.454.032 12.186.032c6.643 0 11.967 5.228 11.967 11.984 0 .61-.044 1.218-.13 1.815a1.144 1.144 0 0 1-1.127.973h-2.148a1.145 1.145 0 0 1-1.139-.997 7.765 7.765 0 0 0-7.423-6.529c-4.405 0-8.026 3.57-8.026 7.97 0 4.401 3.621 7.972 8.026 7.972 3.125 0 6.002-1.873 7.228-4.708.303-.7.994-1.143 1.76-1.143h1.838c1.139 0 1.942 1.136 1.543 2.195C20.655 21.433 16.71 24 12.186 24z"/>
                </svg>
            );

        case 'pinterest':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.365-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.62-5.373-11.987-12-11.987z"/>
                </svg>
            );

        case 'linkedin':
            return (
                <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
            );

        default:
            return <Globe className={className} size={size} />;
    }
}
