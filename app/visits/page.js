'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function VisitsPage() {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (specialty) params.set('specialty', specialty);
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);

            const res = await fetch(`/api/visits?${params.toString()}`);
            const data = await res.json();
            setVisits(data.visits || []);
            setTotal(data.total || 0);
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

    const clearFilters = () => {
        setSearch('');
        setSpecialty('');
        setDateFrom('');
        setDateTo('');
        setTimeout(fetchVisits, 0);
    };

    return (
        <>
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
                    <div>
                        <h1 className="page-header">Visit History</h1>
                        <p className="page-subtitle">{total} visit{total !== 1 ? 's' : ''} recorded</p>
                    </div>
                    <Link href="/visits/new" className="btn-primary flex items-center gap-2 w-fit">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Log New Visit
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="mb-6 animate-slide-up">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                className="input-field pl-10"
                                placeholder="Search by doctor, specialty, hospital, or symptoms..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-primary">Search</button>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn-secondary ${showFilters ? 'bg-primary-50 border-primary-200' : ''}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                            </svg>
                        </button>
                    </form>

                    {showFilters && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Specialty</label>
                                <input
                                    type="text"
                                    className="input-field text-sm"
                                    placeholder="e.g., Cardiologist"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
                                <input
                                    type="date"
                                    className="input-field text-sm"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
                                <input
                                    type="date"
                                    className="input-field text-sm"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                            <div className="sm:col-span-3 flex gap-2 justify-end">
                                <button type="button" onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
                                    Clear filters
                                </button>
                                <button type="button" onClick={fetchVisits} className="btn-primary text-sm py-1.5">Apply</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Visit List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-16 animate-fade-in">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.108 0 2.062.768 2.287 1.858" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No visits yet</h3>
                        <p className="text-gray-500 mb-4">Start tracking your medical visits by logging your first one.</p>
                        <Link href="/visits/new" className="btn-primary inline-flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Log First Visit
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visits.map((visit, i) => (
                            <Link key={visit._id} href={`/visits/${visit._id}`} className="block animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="card p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-900">Dr. {visit.doctorName}</h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="badge-blue">{visit.specialty}</span>
                                                    {visit.hospitalName && (
                                                        <span className="text-xs text-gray-400">{visit.hospitalName}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-2 line-clamp-1">{visit.originalSymptoms}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(visit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(visit.visitDate).getFullYear()}
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                {visit.medicines?.length > 0 && (
                                                    <span className="badge-green text-[10px]">💊 {visit.medicines.length}</span>
                                                )}
                                                {visit.prescriptionUrl && (
                                                    <span className="badge-amber text-[10px]">📷</span>
                                                )}
                                            </div>
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
