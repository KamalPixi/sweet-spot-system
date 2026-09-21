import React, { useState, useMemo } from 'react';
import { 
    QrCode, Plus, Trash2, Printer, Download, ExternalLink, Check, Copy, UtensilsCrossed, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../AppContext';

export default function AdminTablesTab({ orders = [], configs: configsProp }) {
    const appContext = useApp ? useApp() : {};
    const configs = configsProp || appContext?.configs || {};
    const brandName = configs?.store_name || 'Sweet Spot';

    const [tables, setTables] = useState(() => {
        const saved = localStorage.getItem('sweet_spot_tables');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        // Defaults: 12 tables
        return Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            number: `${i + 1}`,
            label: `Table ${i + 1}`,
            capacity: (i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2),
            area: i < 6 ? 'Main Dining' : 'Patio / Window',
        }));
    });

    const [selectedTable, setSelectedTable] = useState(tables[0] || null);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState(4);
    const [newTableArea, setNewTableArea] = useState('Main Dining');
    const [copiedUrl, setCopiedUrl] = useState(false);

    // Save to localStorage whenever tables change
    const persistTables = (updated) => {
        setTables(updated);
        localStorage.setItem('sweet_spot_tables', JSON.stringify(updated));
    };

    // Calculate active orders per table
    const activeOrdersByTable = useMemo(() => {
        const map = {};
        orders.forEach(order => {
            if (order.type === 'dine_in' && order.table_number) {
                const num = String(order.table_number);
                if (['pending', 'preparing', 'ready'].includes(order.status)) {
                    map[num] = (map[num] || 0) + 1;
                }
            }
        });
        return map;
    }, [orders]);

    const handleAddTable = (e) => {
        e.preventDefault();
        const num = newTableNumber.trim();
        if (!num) return;
        if (tables.some(t => t.number.toLowerCase() === num.toLowerCase())) {
            toast.error(`Table ${num} already exists!`);
            return;
        }

        const newT = {
            id: Date.now(),
            number: num,
            label: `Table ${num}`,
            capacity: Number(newTableCapacity) || 4,
            area: newTableArea,
        };

        const updated = [...tables, newT];
        persistTables(updated);
        setSelectedTable(newT);
        setNewTableNumber('');
        toast.success(`Table ${num} added successfully.`);
    };

    const handleDeleteTable = (tableId) => {
        if (!window.confirm('Are you sure you want to remove this table?')) return;
        const updated = tables.filter(t => t.id !== tableId);
        persistTables(updated);
        if (selectedTable?.id === tableId) {
            setSelectedTable(updated[0] || null);
        }
        toast.success('Table removed.');
    };

    const origin = window.location.origin;
    const tableUrl = selectedTable ? `${origin}/categories?table=${encodeURIComponent(selectedTable.number)}` : '';
    const qrImageUrl = selectedTable 
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=15&format=svg&data=${encodeURIComponent(tableUrl)}` 
        : '';

    const handleCopyUrl = () => {
        if (!tableUrl) return;
        navigator.clipboard.writeText(tableUrl);
        setCopiedUrl(true);
        toast.success('Table ordering URL copied to clipboard!');
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const handlePrintSticker = () => {
        if (!selectedTable) return;
        const printWindow = window.open('', '_blank', 'width=600,height=750');
        if (!printWindow) {
            toast.error('Popup blocked. Please allow popups to print stickers.');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print QR Sticker - Table ${selectedTable.number}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #f4f4f5;
                    }
                    .card {
                        background: #fff;
                        width: 380px;
                        padding: 32px 24px;
                        border-radius: 24px;
                        border: 2px solid #e4e4e7;
                        text-align: center;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    }
                    .brand {
                        font-size: 13px;
                        font-weight: 900;
                        letter-spacing: 0.15em;
                        color: #b45309;
                        text-transform: uppercase;
                    }
                    .title {
                        font-size: 28px;
                        font-weight: 900;
                        color: #18181b;
                        margin: 6px 0 2px;
                    }
                    .subtitle {
                        font-size: 13px;
                        color: #71717a;
                        margin-bottom: 20px;
                    }
                    .qr-wrap {
                        background: #fff;
                        padding: 16px;
                        border: 2px dashed #f59e0b;
                        border-radius: 20px;
                        display: inline-block;
                        margin: 12px 0 18px;
                    }
                    .qr-wrap img {
                        width: 220px;
                        height: 220px;
                        display: block;
                    }
                    .instructions {
                        font-size: 14px;
                        font-weight: 700;
                        color: #27272a;
                    }
                    .details {
                        font-size: 11px;
                        color: #a1a1aa;
                        margin-top: 6px;
                    }
                    @media print {
                        body { background: transparent; }
                        .card { box-shadow: none; border: 1px solid #ddd; }
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="brand">${brandName}</div>
                    <div class="title">Table ${selectedTable.number}</div>
                    <div class="subtitle">Scan to browse our menu & order direct to your table</div>
                    <div class="qr-wrap">
                        <img src="${qrImageUrl}" alt="QR Code" />
                    </div>
                    <div class="instructions">Scan with your smartphone camera</div>
                    <div class="details">Free Store Wi-Fi Available · Freshly Prepared</div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-2">
                        <UtensilsCrossed size={12} className="text-amber-600" />
                        <span>Dine-In Management</span>
                    </div>
                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Tables & QR Ordering</h1>
                    <p className="text-xs text-neutral-500 mt-1">
                        Configure restaurant tables, generate QR codes that link directly to the dessert menu, and print table stickers.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handlePrintSticker}
                        disabled={!selectedTable}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                    >
                        <Printer size={15} className="text-amber-400" />
                        <span>Print Table Card</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyUrl}
                        disabled={!selectedTable}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
                    >
                        {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copiedUrl ? 'Copied Link' : 'Copy Table Link'}</span>
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Tables Grid / Directory (2 Cols) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-sm font-bold text-neutral-900">Configured Tables</h2>
                                <p className="text-xs text-neutral-400 mt-0.5">{tables.length} tables in your store floorplan</p>
                            </div>
                            <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-lg">
                                Click a table to inspect QR
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {tables.map(table => {
                                const isSelected = selectedTable?.id === table.id;
                                const activeOrders = activeOrdersByTable[table.number] || 0;

                                return (
                                    <div
                                        key={table.id}
                                        onClick={() => setSelectedTable(table)}
                                        className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
                                            isSelected 
                                                ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-sm' 
                                                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                                isSelected ? 'bg-amber-600 text-white' : 'bg-neutral-900 text-white'
                                            }`}>
                                                {table.number}
                                            </div>

                                            {activeOrders > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black animate-pulse">
                                                    {activeOrders} Active
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-neutral-400 font-bold">
                                                    {table.capacity}p
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3">
                                            <p className="text-xs font-black text-neutral-900">Table {table.number}</p>
                                            <p className="text-[10px] text-neutral-400 mt-0.5">{table.area}</p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTable(table.id);
                                            }}
                                            className="absolute top-2 right-2 p-1 text-neutral-300 hover:text-red-600 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete table"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add New Table Form */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                            <Plus size={16} className="text-amber-600" />
                            <span>Add New Dining Table</span>
                        </h2>

                        <form onSubmit={handleAddTable} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                                    Table Number / Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 13 or Booth A"
                                    value={newTableNumber}
                                    onChange={(e) => setNewTableNumber(e.target.value)}
                                    className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 rounded-xl focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                                    Capacity (Seats)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={newTableCapacity}
                                    onChange={(e) => setNewTableCapacity(e.target.value)}
                                    className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 rounded-xl focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                                    Dining Zone
                                </label>
                                <select
                                    value={newTableArea}
                                    onChange={(e) => setNewTableArea(e.target.value)}
                                    className="w-full bg-white border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 rounded-xl focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 font-semibold"
                                >
                                    <option value="Main Dining">Main Dining</option>
                                    <option value="Patio / Window">Patio / Window</option>
                                    <option value="Lounge / Bar">Lounge / Bar</option>
                                    <option value="Upstairs Area">Upstairs Area</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-colors shadow-sm"
                            >
                                Add Table
                            </button>
                        </form>
                    </div>
                </div>

                {/* QR Code Preview & Sticker Inspector (1 Col) */}
                <div className="space-y-6">
                    {selectedTable ? (
                        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider mb-4">
                                <span>Table QR Preview</span>
                            </div>

                            <p className="text-[11px] font-black text-amber-600 uppercase tracking-wider mb-1">
                                {brandName}
                            </p>
                            <h3 className="text-xl font-black text-neutral-900">Table #{selectedTable.number}</h3>
                            <p className="text-xs text-neutral-400 mt-1">
                                {selectedTable.area} · Seating for {selectedTable.capacity} guests
                            </p>

                            <div className="my-6 inline-block p-4 bg-white border-2 border-dashed border-amber-400 rounded-xl shadow-inner">
                                <img
                                    src={qrImageUrl}
                                    alt={`QR Code for Table ${selectedTable.number}`}
                                    className="w-52 h-52 object-contain mx-auto"
                                />
                            </div>

                            <div className="space-y-3 text-left">
                                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                                    <span className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                                        Destination URL
                                    </span>
                                    <p className="text-[11px] font-mono text-neutral-700 break-all">
                                        {tableUrl}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <a
                                        href={tableUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition-colors"
                                    >
                                        <ExternalLink size={13} />
                                        <span>Test Scan Link</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={handlePrintSticker}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                                    >
                                        <Printer size={13} className="text-amber-400" />
                                        <span>Print Card</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center text-neutral-400">
                            <QrCode size={36} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-semibold">Select a table to view its QR code</p>
                        </div>
                    )}

                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-5 flex items-start gap-3">
                        <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 leading-relaxed">
                            <span className="font-bold block mb-1">How Table QR Ordering Works:</span>
                            When guests scan the table QR code with their camera, they land directly on your category menu with their table number remembered automatically during checkout.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
