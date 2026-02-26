'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ClipboardList, Plus, Search, Calendar, Pill } from 'lucide-react';

const STATUS_STYLES = {
    'Draft': 'bg-blue-600 text-white',
    'Awaiting Doctor': 'bg-amber-500 text-white',
    'Completed': 'bg-green-600 text-white',
};

export default function VisitsPage() {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const res = await fetch(`/api/visits?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setVisits(data.data.visits || []);
                setTotal(data.data.total || 0);
            }
        } catch (err) {
            console.error('Fetch visits error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVisits();
    };

    return (
        <>
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
                    <div>
                        <h1 className="page-header">Visit Preparation</h1>
                        <p className="page-subtitle">{total} visit{total !== 1 ? 's' : ''} recorded</p>
                    </div>
                    <Link href="/visits/new" className="btn-primary flex items-center gap-2 w-fit">
                        <Plus className="w-5 h-5" />
                        New Visit
                    </Link>
                </div>

                {/* Search */}
                <div className="mb-6 animate-slide-up">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                className="input-field pl-10"
                                placeholder="Search by complaint, doctor, or location..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-primary">Search</button>
                    </form>
                </div>

                {/* Visit List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-16 animate-fade-in">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No visits yet</h3>
                        <p className="text-gray-500 mb-4">Start preparing for your next doctor visit.</p>
                        <Link href="/visits/new" className="btn-primary inline-flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Prepare First Visit
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visits.map((visit, i) => (
                            <Link key={visit._id} href={`/visits/${visit._id}`} className="block animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="card p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                                                <ClipboardList className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-900 line-clamp-1">
                                                    {visit.chiefComplaint}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`badge text-xs ${STATUS_STYLES[visit.status] || STATUS_STYLES['Draft']}`}>
                                                        {visit.status}
                                                    </span>
                                                    {visit.doctorName && (
                                                        <span className="text-xs text-gray-400">Dr. {visit.doctorName}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(visit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(visit.visitDate).getFullYear()}
                                            </p>
                                            {visit.status === 'Completed' && visit.prescribedMedicines?.length > 0 && (
                                                <div className="flex items-center gap-1 mt-1.5 justify-end">
                                                    <span className="badge-green text-[10px] flex items-center gap-1">
                                                        <Pill className="w-3 h-3" />
                                                        {visit.prescribedMedicines.length}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
