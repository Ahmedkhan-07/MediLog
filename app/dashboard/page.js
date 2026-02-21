'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function DashboardPage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ totalVisits: 0, latestVisit: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [profileRes, visitsRes] = await Promise.all([
                    fetch('/api/user/profile'),
                    fetch('/api/visits?limit=1'),
                ]);
                const profileData = await profileRes.json();
                const visitsData = await visitsRes.json();

                if (profileData.user) setProfile(profileData.user);
                if (visitsData) {
                    setStats({
                        totalVisits: visitsData.total || 0,
                        latestVisit: visitsData.visits?.[0] || null,
                    });
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

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

    if (!isLoaded || !isSignedIn) {
        return null;
    }

    // Redirect to profile setup if not complete
    if (profile && !profile.profileComplete) {
        if (typeof window !== 'undefined') {
            window.location.href = '/profile/setup';
        }
        return null;
    }

    const bmi = profile?.height && profile?.weight
        ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
        : null;

    const getBmiStatus = (bmi) => {
        if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-600' };
        if (bmi < 25) return { label: 'Normal', color: 'text-emerald-600' };
        if (bmi < 30) return { label: 'Overweight', color: 'text-amber-600' };
        return { label: 'Obese', color: 'text-red-600' };
    };

    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
                    <div>
                        <h1 className="page-header">
                            Welcome back, <span className="text-primary-600">{profile?.fullName?.split(' ')[0] || 'there'}</span> 👋
                        </h1>
                        <p className="page-subtitle">Here&apos;s your health overview at a glance</p>
                    </div>
                    <Link href="/visits/new" className="btn-primary flex items-center gap-2 w-fit">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Log New Visit
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Medical ID Card */}
                    <div className="lg:col-span-2 animate-slide-up">
                        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />

                            <div className="relative">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-5 h-5 text-primary-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a4.5 4.5 0 019 0" />
                                    </svg>
                                    <span className="text-sm font-medium text-primary-200 uppercase tracking-wider">Medical ID Card</span>
                                </div>

                                <h2 className="text-2xl font-bold mb-4">{profile?.fullName || 'N/A'}</h2>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <InfoBlock label="Age" value={profile?.age ? `${profile.age} yrs` : 'N/A'} />
                                    <InfoBlock label="Gender" value={profile?.gender || 'N/A'} />
                                    <InfoBlock
                                        label="Blood Group"
                                        value={profile?.bloodGroup || 'N/A'}
                                        highlight
                                    />
                                    <InfoBlock label="BMI" value={bmi ? `${bmi}` : 'N/A'} />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                                    <InfoBlock label="Height" value={profile?.height ? `${profile.height} cm` : 'N/A'} />
                                    <InfoBlock label="Weight" value={profile?.weight ? `${profile.weight} kg` : 'N/A'} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="card-static p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.108 0 2.062.768 2.287 1.858m-5.801 0H6.75A2.25 2.25 0 004.5 6.108V19.5a2.25 2.25 0 002.25 2.25h6" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
                                    <p className="text-sm text-gray-500">Total Visits</p>
                                </div>
                            </div>
                            <Link href="/visits" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                View all visits →
                            </Link>
                        </div>

                        <div className="card-static p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {stats.latestVisit
                                            ? new Date(stats.latestVisit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : 'No visits yet'}
                                    </p>
                                    <p className="text-sm text-gray-500">Last Visit</p>
                                </div>
                            </div>
                            {stats.latestVisit && (
                                <p className="text-xs text-gray-400">Dr. {stats.latestVisit.doctorName} — {stats.latestVisit.specialty}</p>
                            )}
                        </div>

                        {bmi && (
                            <div className="card-static p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className={`text-lg font-bold ${getBmiStatus(bmi).color}`}>{bmi}</p>
                                        <p className="text-sm text-gray-500">BMI — {getBmiStatus(bmi).label}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Health Details Section */}
                {profile && (profile.allergies?.length > 0 || profile.chronicConditions?.length > 0 || profile.currentMedications?.length > 0 || profile.diabetes?.hasCondition || profile.bloodPressure || profile.emergencyContact?.name) && (
                    <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="section-title">Health Details</h2>
                            <Link href="/profile" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                Edit →
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {profile.diabetes?.hasCondition && (
                                <DetailCard icon="🩸" label="Diabetes" value={`Yes — ${profile.diabetes.type || 'Type unspecified'}`} />
                            )}
                            {profile.bloodPressure && (
                                <DetailCard icon="💓" label="Blood Pressure" value={profile.bloodPressure} />
                            )}
                            {profile.allergies?.length > 0 && (
                                <DetailCard icon="⚠️" label="Allergies" value={profile.allergies.join(', ')} />
                            )}
                            {profile.chronicConditions?.length > 0 && (
                                <DetailCard icon="📋" label="Chronic Conditions" value={profile.chronicConditions.join(', ')} />
                            )}
                            {profile.currentMedications?.length > 0 && (
                                <DetailCard icon="💊" label="Current Medications" value={profile.currentMedications.join(', ')} />
                            )}
                            {profile.emergencyContact?.name && (
                                <DetailCard
                                    icon="🆘"
                                    label="Emergency Contact"
                                    value={`${profile.emergencyContact.name} (${profile.emergencyContact.relation}) — ${profile.emergencyContact.phone}`}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Recent Visit */}
                {stats.latestVisit && (
                    <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="section-title">Latest Visit</h2>
                            <Link href="/visits" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                View all →
                            </Link>
                        </div>
                        <Link href={`/visits/${stats.latestVisit._id}`} className="block">
                            <div className="card p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Dr. {stats.latestVisit.doctorName}</p>
                                            <p className="text-sm text-gray-500">{stats.latestVisit.specialty}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-400">
                                        {new Date(stats.latestVisit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                    {stats.latestVisit.originalSymptoms}
                                </p>
                            </div>
                        </Link>
                    </div>
                )}
            </main>
        </>
    );
}

function InfoBlock({ label, value, highlight }) {
    return (
        <div>
            <p className="text-xs text-primary-200/80 uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-semibold ${highlight ? 'text-lg text-white bg-white/10 px-2 py-0.5 rounded-lg inline-block' : 'text-white'}`}>
                {value}
            </p>
        </div>
    );
}

function DetailCard({ icon, label, value }) {
    return (
        <div className="card-static p-4 flex items-start gap-3">
            <span className="text-xl">{icon}</span>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-sm text-gray-900 mt-0.5">{value}</p>
            </div>
        </div>
    );
}
