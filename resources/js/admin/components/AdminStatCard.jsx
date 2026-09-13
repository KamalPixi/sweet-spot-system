import React from 'react';

/**
 * AdminStatCard & AdminStatGrid
 * Reusable compact count/metric boxes for the Sweet Spot Admin Portal.
 * Follows the Ember design system (Warm Linen + Deep Forest + Terracotta).
 */
export function AdminStatCard({
    label,
    value,
    sub,
    icon: Icon,
    trend,
    badge,
    className = '',
}) {
    return (
        <div className={`bg-surface border border-stone-200/70 rounded-xl px-4 py-3 shadow-2xs text-left transition-all hover:border-stone-300 flex items-center justify-between gap-3 ${className}`}>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider truncate block">
                        {label}
                    </span>
                    {badge}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-serif font-black text-primary tracking-tight leading-none">
                        {value}
                    </span>
                    {trend && (
                        <span className="text-[10px] font-bold text-emerald-600">
                            {trend}
                        </span>
                    )}
                </div>
                {sub && (
                    <div className="text-[10px] text-stone-400 mt-1 truncate">
                        {sub}
                    </div>
                )}
            </div>
            {Icon && (
                <div className="p-2 rounded-lg bg-canvas text-stone-500 shrink-0">
                    <Icon size={16} className="text-primary/70" />
                </div>
            )}
        </div>
    );
}

export function AdminStatGrid({ children, columns = 'default', className = '' }) {
    const colClass = {
        2: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
        3: 'grid grid-cols-1 sm:grid-cols-3 gap-3',
        4: 'grid grid-cols-2 lg:grid-cols-4 gap-3',
        default: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3',
    }[columns] || columns;

    return (
        <div className={`${colClass} ${className}`}>
            {children}
        </div>
    );
}

export default AdminStatCard;
