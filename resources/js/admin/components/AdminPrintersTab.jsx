import React, { useState, useEffect } from 'react';
import { 
    Printer, RefreshCw, CheckCircle2, Clock, AlertTriangle, Play, FileText, Cpu, 
    Wifi, Layers, ShieldCheck, Check, Sparkles, XCircle, Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPrintersTab({ token }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [testingPrint, setTestingPrint] = useState(false);
    const [cancellingJobId, setCancellingJobId] = useState(null);
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

    const handleCancelJob = async (jobId) => {
        if (!confirm('Are you sure you want to cancel this pending print job?')) return;
        setCancellingJobId(jobId);
        try {
            const res = await fetch(`/api/admin/printer/jobs/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Print job cancelled successfully.');
                fetchPrintJobs(true);
            } else {
                toast.error(data.message || 'Could not cancel print job.');
            }
        } catch (err) {
            console.error('Failed to cancel print job', err);
            toast.error('Network error while cancelling print.');
        } finally {
            setCancellingJobId(null);
        }
    };

    useEffect(() => {
        fetchPrintJobs();
        // Auto-poll print queue every 10 seconds while on this tab
        const interval = setInterval(() => fetchPrintJobs(true), 10000);
        return () => clearInterval(interval);
    }, [token]);

    const [showTestModal, setShowTestModal] = useState(false);
    const [testNotes, setTestNotes] = useState('');

    const handleRunTestPrint = async (notes = null) => {
        setTestingPrint(true);
        try {
            const res = await fetch('/api/admin/printer/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    notes: notes || testNotes || 'Star CloudPRNT Hardware Test Slip triggered by Admin',
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Test receipt queued! Star TSP100 will fetch on next poll.');
                setShowTestModal(false);
                setTestNotes('');
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
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 text-[10px] font-bold uppercase tracking-wider">
                        <XCircle size={11} />
                        Cancelled
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[9.5px] font-bold uppercase tracking-wider mb-1">
                        <Cpu size={11} className="text-amber-600" />
                        <span>Star Micronics TSP100 Hardware Protocol</span>
                    </div>
                    <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Cloud Printers & Print Queue</h1>
                    <p className="text-[11px] text-neutral-500">
                        Monitor live Star CloudPRNT polling activity, inspect receipt tokens, and trigger manual reprints.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            setRefreshing(true);
                            fetchPrintJobs();
                        }}
                        disabled={loading || refreshing}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                        <span>Refresh Queue</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowTestModal(true)}
                        disabled={testingPrint}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                        title="Send diagnostic test print ticket to Star CloudPRNT printer"
                    >
                        <Printer size={14} className="text-amber-400" />
                        <span>{testingPrint ? 'Enqueuing...' : 'Print Test Slip'}</span>
                    </button>
                </div>
            </div>

            {/* Compact Hardware Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-neutral-400">Target Printer</span>
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            CloudPRNT Active
                        </span>
                    </div>
                    <div className="my-1.5">
                        <p className="text-sm font-black text-neutral-900 leading-tight">Star TSP143IV-UE</p>
                        <p className="text-[10px] text-neutral-500 font-mono">MAC: Star Micronics LAN / Ethernet</p>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 flex justify-between text-[10px] text-neutral-500">
                        <span>Format: Star Markup</span>
                        <span className="font-bold text-neutral-800">80mm / 48 chars</span>
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-neutral-400">Queue State</span>
                        <Layers size={13} className="text-amber-600" />
                    </div>
                    <div className="my-1.5 flex items-baseline justify-between">
                        <p className="text-lg font-black text-neutral-900 leading-tight">
                            {jobs.filter(j => j.status === 'queued' || j.status === 'printing').length} <span className="text-xs font-bold text-neutral-600">Pending</span>
                        </p>
                        <p className="text-[10px] text-neutral-400">
                            {jobs.filter(j => j.status === 'printed').length} printed today
                        </p>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 flex justify-between text-[10px] text-neutral-500">
                        <span>Poll: ~5s</span>
                        <span className="font-bold text-emerald-600">Auto-Cutting</span>
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-neutral-400">Polling Endpoint</span>
                        <Wifi size={13} className="text-neutral-600" />
                    </div>
                    <div className="my-1.5">
                        <p className="text-[10.5px] font-mono font-bold text-neutral-850 truncate bg-neutral-50 px-2 py-1 rounded-md border border-neutral-200">
                            POST /api/cloudprnt/poll
                        </p>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 flex justify-between text-[10px] text-neutral-500">
                        <span>Protocol: HTTP/S</span>
                        <span className="font-bold text-neutral-800">200 OK Ack</span>
                    </div>
                </div>
            </div>

            {/* Print Jobs Table */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
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
                                        <td className="py-3.5 px-6 text-right space-x-2 whitespace-nowrap">
                                            {['queued', 'printing'].includes(job.status) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancelJob(job.id)}
                                                    disabled={cancellingJobId === job.id}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                                    title="Cancel pending print job from queue"
                                                >
                                                    <XCircle size={11} />
                                                    <span>{cancellingJobId === job.id ? 'Cancelling...' : 'Cancel Print'}</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedJob(job)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-[10px] font-bold transition-colors cursor-pointer"
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
                    <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-neutral-200 max-h-[90vh] flex flex-col">
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
                                className="px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-bold cursor-pointer"
                            >
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Print Slip Modal */}
            {showTestModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-neutral-200">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-neutral-950 text-amber-400">
                                    <Printer size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-neutral-900">Hardware Test Print</h3>
                                    <p className="text-[10px] text-neutral-400">Star CloudPRNT TSP100 Series</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTestModal(false)}
                                className="text-neutral-400 hover:text-neutral-900 text-sm font-bold p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-neutral-600 leading-relaxed">
                            This will generate a diagnostic Star Markup ticket covering font styling, high-contrast inverted text, width/height scaling, line feeds, and the auto-cutter.
                        </p>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                Optional Operator Note / Test Message
                            </label>
                            <input
                                type="text"
                                value={testNotes}
                                onChange={(e) => setTestNotes(e.target.value)}
                                placeholder="e.g. Morning service check / Counter #1"
                                className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl px-3.5 py-2.5 text-xs text-neutral-800 focus:outline-none transition-all"
                            />
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setShowTestModal(false)}
                                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-bold transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRunTestPrint()}
                                disabled={testingPrint}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                <Printer size={14} className="text-amber-400" />
                                <span>{testingPrint ? 'Enqueuing...' : 'Dispatch Test Ticket'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
