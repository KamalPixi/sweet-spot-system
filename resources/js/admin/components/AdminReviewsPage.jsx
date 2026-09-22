import React, { useState, useEffect, useMemo } from 'react';
import { 
    Star, Plus, Edit2, Trash2, Eye, EyeOff, MessageSquare, Check, X, RefreshCw, 
    Search, Filter, Heart, SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminStatCard, AdminStatGrid } from './AdminStatCard';

export default function AdminReviewsPage({ token }) {
    const [reviews, setReviews] = useState([]);
    const [meta, setMeta] = useState({ total: 0, active_count: 0, average_rating: 5.0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'hidden'

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [formData, setFormData] = useState({
        author_name: '',
        quote: '',
        source: 'Google Review',
        rating: 5,
        sort_order: 0,
        is_active: true,
    });

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const fetchReviews = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/admin/reviews', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await res.json();
            if (data.success) {
                setReviews(data.data || []);
                setMeta(data.meta || { total: 0, active_count: 0, average_rating: 5.0 });
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            if (!silent) toast.error('Failed to load reviews.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [token]);

    const filteredReviews = useMemo(() => {
        return reviews.filter((review) => {
            const matchesSearch = 
                (review.author_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (review.quote || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (review.source || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = 
                statusFilter === 'all' ? true :
                statusFilter === 'active' ? review.is_active :
                statusFilter === 'hidden' ? !review.is_active : true;

            return matchesSearch && matchesStatus;
        });
    }, [reviews, searchQuery, statusFilter]);

    const handleOpenModal = (review = null) => {
        if (review) {
            setEditingReview(review);
            setFormData({
                author_name: review.author_name || '',
                quote: review.quote || '',
                source: review.source || 'Google Review',
                rating: review.rating || 5,
                sort_order: review.sort_order || 0,
                is_active: review.is_active ?? true,
            });
        } else {
            setEditingReview(null);
            setFormData({
                author_name: '',
                quote: '',
                source: 'Google Review',
                rating: 5,
                sort_order: reviews.length + 1,
                is_active: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingReview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.author_name.trim() || !formData.quote.trim()) {
            toast.error('Author name and review content are required.');
            return;
        }

        setActionLoading(true);
        try {
            const url = editingReview ? `/api/admin/reviews/${editingReview.id}` : '/api/admin/reviews';
            const method = editingReview ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editingReview ? 'Review updated successfully!' : 'Review created successfully!');
                handleCloseModal();
                fetchReviews(true);
            } else {
                toast.error(data.message || 'Error saving review');
            }
        } catch (err) {
            console.error('Error saving review:', err);
            toast.error('Failed to save review');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleActive = async (review) => {
        try {
            const res = await fetch(`/api/admin/reviews/${review.id}/toggle-active`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Review set to ${!review.is_active ? 'Active' : 'Hidden'}`);
                fetchReviews(true);
            }
        } catch (err) {
            console.error('Error toggling active:', err);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Review deleted successfully!');
                setDeleteConfirmId(null);
                fetchReviews(true);
            }
        } catch (err) {
            console.error('Error deleting review:', err);
            toast.error('Failed to delete review');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 w-full text-left">
            {/* Top Page Header - Matched with Customer Directory */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-black text-primary tracking-tight">
                        Local Love Reviews
                    </h1>
                    <p className="text-xs text-stone-500 mt-1">
                        Manage customer testimonials shown in the "Local Love" section on your store's landing page.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="text-[11px] font-bold text-stone-400 mr-1 hidden sm:block">
                        Showing <span className="font-black text-primary">{filteredReviews.length}</span> reviews
                    </div>

                    <button
                        onClick={() => fetchReviews(false)}
                        className="w-9 h-9 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                        title="Refresh Reviews"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer shrink-0"
                    >
                        <Plus size={16} />
                        <span>Add New Review</span>
                    </button>
                </div>
            </div>

            {/* Metrics Row (Matching Admin Stat Cards) */}
            <AdminStatGrid columns={3}>
                <AdminStatCard
                    label="Total Reviews"
                    value={meta.total}
                    sub="Customer feedback count"
                    icon={MessageSquare}
                />
                <AdminStatCard
                    label="Active Published"
                    value={meta.active_count}
                    sub="Currently visible on landing page"
                    icon={Check}
                    badge={
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-bold">
                            Live
                        </span>
                    }
                />
                <AdminStatCard
                    label="Average Rating"
                    value={`${meta.average_rating} / 5.0`}
                    sub="Calculated from active reviews"
                    icon={Star}
                />
            </AdminStatGrid>

            {/* Search & Filter Bar */}
            <div className="bg-surface border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search author, text, source..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-canvas border border-stone-200/80 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline">
                        Status:
                    </span>
                    <div className="flex items-center bg-canvas p-1 rounded-xl border border-stone-200/80">
                        {['all', 'active', 'hidden'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                                    statusFilter === status
                                        ? 'bg-white text-stone-900 shadow-2xs border border-stone-200/60'
                                        : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Container - Full Width Card */}
            <div className="bg-surface border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden w-full">
                {/* Section Title Header Bar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 bg-surface">
                    <h3 className="text-sm font-bold text-stone-900">Review Accounts & Feedback</h3>
                    <span className="text-[11px] font-bold text-stone-400">
                        {filteredReviews.length} records found
                    </span>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="animate-spin text-stone-400" size={24} />
                        <span>Loading reviews...</span>
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                        <MessageSquare size={36} className="mx-auto text-stone-300" />
                        <h3 className="text-sm font-bold text-stone-700">No reviews found</h3>
                        <p className="text-xs text-stone-400 max-w-xs mx-auto">
                            {searchQuery || statusFilter !== 'all' 
                                ? 'Try adjusting your search query or status filter.' 
                                : 'Add your first review to display on the landing page.'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                            <button
                                onClick={() => handleOpenModal()}
                                className="bg-primary hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer mt-2"
                            >
                                <Plus size={14} /> Add First Review
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50/70 border-b border-stone-200/80 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                    <th className="py-3.5 px-5 text-center w-14">Order</th>
                                    <th className="py-3.5 px-5">Author</th>
                                    <th className="py-3.5 px-5">Review Content</th>
                                    <th className="py-3.5 px-5">Source</th>
                                    <th className="py-3.5 px-5">Rating</th>
                                    <th className="py-3.5 px-5 text-center">Status</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                                {filteredReviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="py-3.5 px-5 text-center font-mono font-bold text-stone-400 text-[11px]">
                                            #{review.sort_order}
                                        </td>
                                        <td className="py-3.5 px-5 font-bold text-stone-900 whitespace-nowrap">
                                            {review.author_name}
                                        </td>
                                        <td className="py-3.5 px-5 max-w-md">
                                            <p className="line-clamp-2 text-stone-600 font-light italic">
                                                "{review.quote}"
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-5 whitespace-nowrap">
                                            <span className="inline-block px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold border border-stone-200/60">
                                                {review.source}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5 whitespace-nowrap">
                                            <div className="flex items-center gap-0.5 text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={13} 
                                                        fill={i < review.rating ? "currentColor" : "none"}
                                                        stroke={i < review.rating ? "none" : "#d4d4d4"}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleActive(review)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                                                    review.is_active 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70 hover:bg-emerald-100' 
                                                        : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                                }`}
                                            >
                                                {review.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                                                <span>{review.is_active ? 'Active' : 'Hidden'}</span>
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenModal(review)}
                                                    className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                                                    title="Edit Review"
                                                >
                                                    <Edit2 size={13} />
                                                </button>

                                                {deleteConfirmId === review.id ? (
                                                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => handleDelete(review.id)}
                                                            className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded hover:bg-rose-700 cursor-pointer"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(null)}
                                                            className="text-[10px] text-stone-500 hover:text-stone-800 px-1 cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirmId(review.id)}
                                                        className="p-1.5 rounded-lg border border-stone-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Delete Review"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-scaleIn">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={18} className="text-rose-500" />
                                <h3 className="text-base font-bold text-stone-900">
                                    {editingReview ? 'Edit Review' : 'Add New Review'}
                                </h3>
                            </div>
                            <button onClick={handleCloseModal} className="text-stone-400 hover:text-stone-700 p-1 rounded-md">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                    Author Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sarah A."
                                    value={formData.author_name}
                                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                    className="w-full bg-canvas border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                    Review Content / Quote *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write the customer's testimonial quote..."
                                    value={formData.quote}
                                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                    className="w-full bg-canvas border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                        Source Platform
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Google Review"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className="w-full bg-canvas border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                        Star Rating (1 - 5)
                                    </label>
                                    <select
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                        className="w-full bg-canvas border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors cursor-pointer"
                                    >
                                        <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                                        <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                                        <option value={3}>3 Stars ⭐⭐⭐</option>
                                        <option value={2}>2 Stars ⭐⭐</option>
                                        <option value={1}>1 Star ⭐</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-canvas border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                                        />
                                        <span>Show on Storefront</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-black transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                >
                                    {actionLoading ? 'Saving...' : editingReview ? 'Save Changes' : 'Create Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
