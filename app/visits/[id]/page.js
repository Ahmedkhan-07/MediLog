'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function VisitDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [visit, setVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        async function fetchVisit() {
            try {
                const res = await fetch(`/api/visits/${id}`);
                const data = await res.json();
                if (data.visit) setVisit(data.visit);
            } catch (err) {
                console.error('Fetch visit error:', err);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchVisit();
    }, [id]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/visits/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/visits');
                router.refresh();
            }
        } catch (err) {
            console.error('Delete visit error:', err);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-[80vh] flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            </>
        );
    }

    if (!visit) {
        return (
            <>
                <Navbar />
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Visit not found</h2>
                    <p className="text-gray-500 mb-4">This visit may have been deleted or doesn&apos;t exist.</p>
                    <button onClick={() => router.push('/visits')} className="btn-primary">← Back to Visits</button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 animate-fade-in">
                    <button onClick={() => router.push('/visits')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Back to Visits
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                    </button>
                </div>

                {/* Visit Card Header */}
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden animate-slide-up">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-primary-200 text-sm">{visit.specialty}</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-1">Dr. {visit.doctorName}</h1>
                        {visit.hospitalName && (
                            <p className="text-primary-200 text-sm">{visit.hospitalName}</p>
                        )}
                        <p className="text-primary-100 text-sm mt-3">
                            {new Date(visit.visitDate).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                {/* Symptoms */}
                <div className="card-static p-6 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="section-title mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443h.077c6.627 0 12-5.373 12-12S18.627 0 12 0C5.373 0 0 5.373 0 12c0 3.169 1.232 6.051 3.243 8.195" />
                        </svg>
                        Symptoms
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Patient&apos;s Description</p>
                            <p className="text-gray-700 leading-relaxed">{visit.originalSymptoms}</p>
                        </div>
                        {visit.aiSummary && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-primary-700">AI Clinical Summary</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{visit.aiSummary}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Medicines */}
                {visit.medicines?.length > 0 && (
                    <div className="card-static p-6 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="section-title mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5" />
                            </svg>
                            Prescribed Medicines
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">#</th>
                                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">Medicine</th>
                                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">Dosage</th>
                                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3 pr-4">Frequency</th>
                                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visit.medicines.map((med, i) => (
                                        <tr key={i} className="border-b border-gray-50 last:border-0">
                                            <td className="py-3 pr-4 text-sm text-gray-400">{i + 1}</td>
                                            <td className="py-3 pr-4 text-sm font-medium text-gray-900">{med.name}</td>
                                            <td className="py-3 pr-4 text-sm text-gray-600">{med.dosage || '—'}</td>
                                            <td className="py-3 pr-4 text-sm text-gray-600">{med.frequency || '—'}</td>
                                            <td className="py-3 text-sm text-gray-600">{med.duration || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Prescription Image */}
                {visit.prescriptionUrl && (
                    <div className="card-static p-6 mb-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="section-title mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M3.75 3h16.5M3.75 3v18" />
                            </svg>
                            Prescription
                        </h2>
                        <a href={visit.prescriptionUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                                src={visit.prescriptionUrl}
                                alt="Prescription"
                                className="max-w-full rounded-xl border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                            />
                        </a>
                    </div>
                )}

                {/* Doctor Notes */}
                {visit.doctorNotes && (
                    <div className="card-static p-6 mb-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <h2 className="section-title mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Doctor Notes
                        </h2>
                        <p className="text-gray-700 leading-relaxed">{visit.doctorNotes}</p>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                        <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this visit?</h3>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. All visit data including prescription images will be permanently removed.</p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Cancel</button>
                                <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2">
                                    {deleting ? 'Deleting...' : 'Delete Visit'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
