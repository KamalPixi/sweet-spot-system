import React, { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2, Eye, EyeOff, MessageSquare, Check, X, RefreshCw } from 'lucide-react';

export default function AdminReviewsPage({ token }) {
    const [reviews, setReviews] = useState([]);
    const [meta, setMeta] = useState({ total: 0, active_count: 0, average_rating: 5.0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

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
    const [notification, setNotification] = useState(null);

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchReviews = async () => {
        setLoading(true);
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
            showNotification('Failed to load reviews', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [token]);

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
            showNotification('Author name and quote are required.', 'error');
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
                showNotification(editingReview ? 'Review updated successfully!' : 'Review created successfully!');
                handleCloseModal();
                fetchReviews();
            } else {
                showNotification(data.message || 'Error saving review', 'error');
            }
        } catch (err) {
            console.error('Error saving review:', err);
            showNotification('Failed to save review', 'error');
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
                showNotification(`Review status updated!`);
                fetchReviews();
            }
        } catch (err) {
            console.error('Error toggling active:', err);
            showNotification('Failed to update status', 'error');
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
                showNotification('Review deleted successfully!');
                setDeleteConfirmId(null);
                fetchReviews();
            }
        } catch (err) {
            console.error('Error deleting review:', err);
            showNotification('Failed to delete review', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header Notification Alert */}
            {notification && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                    notification.type === 'error' 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                    <span>{notification.msg}</span>
                    <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Top Bar: Title & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                        <MessageSquare className="text-rose-500" size={24} />
                        Local Love Reviews
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                        Manage customer testimonials shown in the "Local Love" section on your store's landing page.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchReviews}
                        className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors shadow-xs"
                        title="Refresh Reviews"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-neutral-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} />
                        Add New Review
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Total Reviews</span>
                        <div className="text-2xl font-black text-neutral-900 mt-0.5">{meta.total}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
                        <MessageSquare size={18} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Active Published</span>
                        <div className="text-2xl font-black text-emerald-600 mt-0.5">{meta.active_count}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Check size={18} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Average Rating</span>
                        <div className="text-2xl font-black text-amber-500 mt-0.5 flex items-center gap-1.5">
                            {meta.average_rating} <span className="text-xs font-normal text-neutral-400">/ 5.0</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                        <Star size={18} fill="currentColor" />
                    </div>
                </div>
            </div>

            {/* Reviews Table Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="animate-spin text-neutral-400" size={24} />
                        Loading reviews...
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <MessageSquare size={36} className="mx-auto text-neutral-300" />
                        <h3 className="text-sm font-bold text-neutral-700">No reviews found</h3>
                        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                            Add your first review to display authentic customer feedback on your homepage.
                        </p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-neutral-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer mt-2"
                        >
                            <Plus size={14} /> Add First Review
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                    <th className="py-3.5 px-4 text-center w-12">Order</th>
                                    <th className="py-3.5 px-4">Author</th>
                                    <th className="py-3.5 px-4">Review Content</th>
                                    <th className="py-3.5 px-4">Source</th>
                                    <th className="py-3.5 px-4">Rating</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700">
                                {reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="py-3.5 px-4 text-center font-bold text-neutral-400 text-[11px]">
                                            #{review.sort_order}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-neutral-900 whitespace-nowrap">
                                            {review.author_name}
                                        </td>
                                        <td className="py-3.5 px-4 max-w-md">
                                            <p className="line-clamp-2 text-neutral-600 font-light italic">
                                                "{review.quote}"
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="inline-block px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-semibold">
                                                {review.source}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
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
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleActive(review)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                                    review.is_active 
                                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                                }`}
                                            >
                                                {review.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                                                <span>{review.is_active ? 'Active' : 'Hidden'}</span>
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(review)}
                                                    className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                                                    title="Edit Review"
                                                >
                                                    <Edit2 size={14} />
                                                </button>

                                                {deleteConfirmId === review.id ? (
                                                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                                                        <button
                                                            onClick={() => handleDelete(review.id)}
                                                            className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded hover:bg-rose-700"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(null)}
                                                            className="text-[10px] text-neutral-500 hover:text-neutral-800 px-1"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirmId(review.id)}
                                                        className="p-1.5 rounded-lg border border-neutral-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                                        title="Delete Review"
                                                    >
                                                        <Trash2 size={14} />
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
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                            <h3 className="text-base font-bold text-neutral-900">
                                {editingReview ? 'Edit Review' : 'Add New Review'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-700">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <div>
                                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                                    Author Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sarah A."
                                    value={formData.author_name}
                                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                                    Review Quote / Feedback *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write the customer's review here..."
                                    value={formData.quote}
                                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                                        Source Platform
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Google Review"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                                        Star Rating (1 - 5)
                                    </label>
                                    <select
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
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
                                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900"
                                        />
                                        <span>Show on Storefront</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
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
