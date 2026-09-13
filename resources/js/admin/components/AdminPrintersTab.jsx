import React, { useState, useEffect } from 'react';
import { 
    Printer, RefreshCw, CheckCircle2, Clock, AlertTriangle, Play, FileText, Cpu, 
    Wifi, Layers, ShieldCheck, Check, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPrintersTab({ token }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [testingPrint, setTestingPrint] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    const fetchPrintJobs = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/admin/printer/jobs', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                setJobs(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load print jobs', err);
            if (!silent) toast.error('Could not load printer queue.');
        } finally {
            if (!silent) setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPrintJobs();
        // Auto-poll print queue every 10 seconds while on this tab
        const interval = setInterval(() => fetchPrintJobs(true), 10000);
        return () => clearInterval(interval);
    }, [token]);

    const handleManualTestPrint = async () => {
        // Enqueue a test print job by calling manual print on the latest order or test payload
        if (jobs.length === 0 && !jobs[0]?.order_id) {
            toast.error('No orders available to run test receipt.');
            return;
        }

        const targetOrderId = jobs[0]?.order_id;
        setTestingPrint(true);
        try {
            const res = await fetch(`/api/admin/orders/${targetOrderId}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Test receipt queued! Star TSP100 will fetch on next poll.');
                fetchPrintJobs(true);
            } else {
                toast.error(data.message || 'Failed to enqueue test receipt.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Printer dispatch error.');
        } finally {
            setTestingPrint(false);
        }
    };

    const statusBadge = (status) => {
        switch (status) {
            case 'printed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={11} />
                        Printed
                    </span>
                );
            case 'printing':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        <RefreshCw size={11} className="animate-spin" />
                        Printing
                    </span>
                );
            case 'queued':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                        <Clock size={11} />
                        Queued
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider">
                        <AlertTriangle size={11} />
                        {status || 'Unknown'}
                    </span>
                );
        }
    };

    const formatTime = (ts) => {
        if (!ts) return '—';
        const d = new Date(ts);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' +
               d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-2">
                        <Cpu size={12} className="text-amber-600" />
                        <span>Star Micronics TSP100 Hardware Protocol</span>
                    </div>
                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Cloud Printers & Print Queue</h1>
                    <p className="text-xs text-neutral-500 mt-1">
                        Monitor live Star CloudPRNT polling activity, inspect receipt tokens, and trigger manual reprints.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setRefreshing(true);
                            fetchPrintJobs();
                        }}
                        disabled={loading || refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-bold transition-colors shadow-xs"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        <span>Refresh Queue</span>
                    </button>
                    {jobs.length > 0 && (
                        <button
                            type="button"
                            onClick={handleManualTestPrint}
                            disabled={testingPrint}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                            <Printer size={15} className="text-amber-400" />
                            <span>{testingPrint ? 'Enqueuing...' : 'Print Test Slip'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Hardware Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Target Printer</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            CloudPRNT Active
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-lg font-black text-neutral-900">Star TSP143IV-UE</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">MAC: Star Micronics LAN / Ethernet</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between text-[11px] text-neutral-500">
                        <span>Format: Star Markup</span>
                        <span className="font-bold text-neutral-800">80mm / 48 chars</span>
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Queue State</span>
                        <Layers size={15} className="text-amber-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-neutral-900">
                            {jobs.filter(j => j.status === 'queued' || j.status === 'printing').length} Pending
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                            {jobs.filter(j => j.status === 'printed').length} jobs completed today
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between text-[11px] text-neutral-500">
                        <span>Polling Cycle: ~5 seconds</span>
                        <span className="font-bold text-emerald-600">Auto-Cutting</span>
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Polling Endpoint</span>
                        <Wifi size={15} className="text-neutral-600" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs font-mono font-bold text-neutral-850 truncate bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                            POST /api/cloudprnt/poll
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-1.5">
                            Standard HTTP/HTTPS CloudPRNT protocol
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between text-[11px] text-neutral-500">
                        <span>Content: Star Markup</span>
                        <span className="font-bold text-neutral-800">200 OK Ack</span>
                    </div>
                </div>
            </div>

            {/* Print Jobs Table */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-neutral-900">Hardware Print Queue</h2>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Real-time log of receipt tickets dispatched to the kitchen printer</p>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        {jobs.length} total jobs
                    </span>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center gap-3">
                        <RefreshCw size={24} className="animate-spin text-amber-600" />
                        <span className="text-xs font-medium">Reading printer queue...</span>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="py-16 text-center text-neutral-400">
                        <Printer size={36} className="mx-auto mb-2 opacity-40 text-neutral-400" />
                        <p className="text-sm font-bold text-neutral-700">No print jobs in history</p>
                        <p className="text-xs text-neutral-400 mt-1">
                            Print jobs will automatically appear here when orders are placed or printed manually.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 uppercase tracking-wider font-bold text-[10px]">
                                    <th className="py-3 px-6 text-left">Job Token</th>
                                    <th className="py-3 px-6 text-left">Order Reference</th>
                                    <th className="py-3 px-6 text-left">Status</th>
                                    <th className="py-3 px-6 text-left">Format</th>
                                    <th className="py-3 px-6 text-left">Enqueued At</th>
                                    <th className="py-3 px-6 text-left">Printed At</th>
                                    <th className="py-3 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 text-neutral-700">
                                {jobs.map(job => (
                                    <tr key={job.id} className="hover:bg-neutral-50/60 transition-colors">
                                        <td className="py-3.5 px-6 font-mono text-[11px] font-bold text-neutral-900">
                                            {job.job_token}
                                        </td>
                                        <td className="py-3.5 px-6">
                                            {job.order ? (
                                                <div>
                                                    <span className="font-bold text-neutral-900">#{job.order.order_number}</span>
                                                    <span className="text-[10px] text-neutral-400 block capitalize">
                                                        {job.order.type === 'dine_in' ? `Table ${job.order.table_number || '?'}` : job.order.type}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400">System Test Slip</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-6">
                                            {statusBadge(job.status)}
                                        </td>
                                        <td className="py-3.5 px-6 text-neutral-500 font-mono text-[10px]">
                                            {job.content_type?.split(';')[0] || 'text/vnd.star.markup'}
                                        </td>
                                        <td className="py-3.5 px-6 text-neutral-500">
                                            {formatTime(job.created_at)}
                                        </td>
                                        <td className="py-3.5 px-6 text-neutral-500">
                                            {formatTime(job.printed_at)}
                                        </td>
                                        <td className="py-3.5 px-6 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedJob(job)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-[10px] font-bold transition-colors"
                                            >
                                                <FileText size={11} />
                                                <span>Inspect Markup</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Inspect Modal */}
            {selectedJob && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-neutral-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                            <div>
                                <h3 className="text-sm font-black text-neutral-900">Receipt Ticket Content</h3>
                                <p className="text-[10px] font-mono text-neutral-400 mt-0.5">{selectedJob.job_token}</p>
                            </div>
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="text-neutral-400 hover:text-neutral-900 text-sm font-bold p-1 rounded-lg hover:bg-neutral-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-neutral-950 rounded-xl p-4 font-mono text-xs text-amber-300 whitespace-pre-wrap leading-relaxed border border-neutral-800">
                            {selectedJob.content}
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-bold"
                            >
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
