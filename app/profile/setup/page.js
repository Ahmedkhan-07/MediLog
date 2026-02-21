'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileSetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        gender: '',
        bloodGroup: '',
        height: '',
        weight: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    age: Number(formData.age),
                    height: formData.height ? Number(formData.height) : undefined,
                    weight: formData.weight ? Number(formData.weight) : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to save profile');
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-lg animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
                    <p className="text-gray-500 mt-1">Tell us about yourself to create your medical passport</p>
                </div>

                <div className="card-static p-8">
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                className="input-field"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Age *</label>
                                <input
                                    type="number"
                                    name="age"
                                    required
                                    min="1"
                                    max="150"
                                    className="input-field"
                                    placeholder="25"
                                    value={formData.age}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
                                <select
                                    name="gender"
                                    required
                                    className="input-field"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group *</label>
                            <select
                                name="bloodGroup"
                                required
                                className="input-field"
                                value={formData.bloodGroup}
                                onChange={handleChange}
                            >
                                <option value="">Select blood group</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Height (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    min="1"
                                    className="input-field"
                                    placeholder="170"
                                    value={formData.height}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    min="1"
                                    className="input-field"
                                    placeholder="70"
                                    value={formData.weight}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Complete Profile'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
