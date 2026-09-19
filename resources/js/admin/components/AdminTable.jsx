import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * AdminTable
 * Standardized data table component for the Sweet Spot Admin Portal.
 * Follows the Ember design system (Warm Linen + Deep Forest + Terracotta).
 *
 * Props:
 * - title: string (table card title, optional)
 * - subtitle: string or ReactNode (e.g. badge or helper text)
 * - countText: string (e.g. "Showing 1-10 of 42")
 * - columns: Array<{
 *     header: string,
 *     accessor?: string,
 *     align?: 'left' | 'center' | 'right',
 *     render?: (row: any, index: number) => ReactNode,
 *     className?: string,
 *     headerClassName?: string
 *   }>
 * - data: Array<any>
 * - keyField: string (default: 'id')
 * - emptyMessage?: string
 * - emptyState?: ReactNode
 * - pagination?: {
 *     currentPage: number,
 *     totalPages: number,
 *     onPageChange: (page: number) => void
 *   }
 * - actionsHeader?: string (default: 'Actions')
 * - actions?: (row: any) => ReactNode
 * - actionsAlign?: 'left' | 'center' | 'right' (default: 'right')
 * - rowClassName?: (row: any, index: number) => string | string
 * - headerActions?: ReactNode (buttons/filters placed in the card header)
 */
export default function AdminTable({
    title,
    subtitle,
    countText,
    columns = [],
    data = [],
    keyField = 'id',
    emptyMessage = 'No records found.',
    emptyState,
    pagination,
    actionsHeader = 'Actions',
    actions,
    actionsAlign = 'right',
    rowClassName = '',
    headerActions,
    className = '',
}) {
    return (
        <div className={`bg-surface border border-stone-200/70 rounded-xl shadow-2xs overflow-hidden text-left w-full ${className}`}>
            {/* Table Header / Title Bar */}
            {(title || countText || headerActions) && (
                <div className="px-5 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                        {title && (
                            <h2 className="font-serif font-black text-primary text-sm tracking-tight">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            typeof subtitle === 'string' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200/60">
                                    {subtitle}
                                </span>
                            ) : subtitle
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {countText && (
                            <span className="text-[11px] font-bold text-stone-400">
                                {countText}
                            </span>
                        )}
                        {headerActions}
                    </div>
                </div>
            )}

            {/* Table Content */}
            {data.length === 0 ? (
                emptyState || (
                    <div className="p-12 text-center">
                        <p className="text-stone-400 text-sm font-medium">{emptyMessage}</p>
                    </div>
                )
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-stone-200/60 bg-canvas/40 text-stone-500 uppercase tracking-wider font-bold text-[10px]">
                                {columns.map((col, idx) => {
                                    const alignClass =
                                        col.align === 'center'
                                            ? 'text-center'
                                            : col.align === 'right'
                                            ? 'text-right'
                                            : 'text-left';
                                    return (
                                        <th
                                            key={idx}
                                            className={`py-3 px-5 font-bold ${alignClass} ${col.headerClassName || ''}`}
                                        >
                                            {col.header}
                                        </th>
                                    );
                                })}
                                {actions && (
                                    <th
                                        className={`py-3 px-5 font-bold ${
                                            actionsAlign === 'center'
                                                ? 'text-center'
                                                : actionsAlign === 'left'
                                                ? 'text-left'
                                                : 'text-right'
                                        }`}
                                    >
                                        {actionsHeader}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700">
                            {data.map((row, rowIdx) => {
                                const customRowClass =
                                    typeof rowClassName === 'function'
                                        ? rowClassName(row, rowIdx)
                                        : rowClassName;
                                const key = row[keyField] ?? rowIdx;

                                return (
                                    <tr
                                        key={key}
                                        className={`hover:bg-canvas/30 transition-colors group ${customRowClass}`}
                                    >
                                        {columns.map((col, colIdx) => {
                                            const alignClass =
                                                col.align === 'center'
                                                    ? 'text-center'
                                                    : col.align === 'right'
                                                    ? 'text-right'
                                                    : 'text-left';

                                            let cellContent = null;
                                            if (col.render) {
                                                cellContent = col.render(row, rowIdx);
                                            } else if (col.accessor) {
                                                cellContent = row[col.accessor];
                                            }

                                            return (
                                                <td
                                                    key={colIdx}
                                                    className={`py-3.5 px-5 ${alignClass} ${col.className || ''}`}
                                                >
                                                    {cellContent}
                                                </td>
                                            );
                                        })}
                                        {actions && (
                                            <td
                                                className={`py-3.5 px-5 ${
                                                    actionsAlign === 'center'
                                                        ? 'text-center'
                                                        : actionsAlign === 'left'
                                                        ? 'text-left'
                                                        : 'text-right'
                                                }`}
                                            >
                                                {actions(row, rowIdx)}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Standard Pagination Footer */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-between items-center px-5 py-4 border-t border-stone-100 text-xs font-semibold text-stone-600 bg-surface">
                    <button
                        onClick={() => pagination.onPageChange(Math.max(pagination.currentPage - 1, 1))}
                        disabled={pagination.currentPage === 1}
                        className="px-3.5 py-1.5 bg-canvas/60 hover:bg-stone-200/70 border border-stone-200/70 text-stone-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                    >
                        <ChevronLeft size={13} />
                        Previous
                    </button>
                    <span className="text-[11px] font-bold text-stone-400">
                        Page <span className="text-primary font-black">{pagination.currentPage}</span> of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => pagination.onPageChange(Math.min(pagination.currentPage + 1, pagination.totalPages))}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3.5 py-1.5 bg-canvas/60 hover:bg-stone-200/70 border border-stone-200/70 text-stone-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                    >
                        Next
                        <ChevronRight size={13} />
                    </button>
                </div>
            )}
        </div>
    );
}
