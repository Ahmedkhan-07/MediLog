'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('basic');

    const [basicInfo, setBasicInfo] = useState({
        fullName: '', age: '', gender: '', bloodGroup: '', height: '', weight: '',
    });

    const [healthDetails, setHealthDetails] = useState({
        diabetes: { hasCondition: false, type: '' },
        bloodPressure: '',
        allergies: '',
        chronicConditions: '',
        currentMedications: '',
        emergencyContact: { name: '', phone: '', relation: '' },
    });

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/user/profile');
                const data = await res.json();
                if (data.user) {
                    setProfile(data.user);
                    setBasicInfo({
                        fullName: data.user.fullName || '',
                        age: data.user.age || '',
                        gender: data.user.gender || '',
                        bloodGroup: data.user.bloodGroup || '',
                        height: data.user.height || '',
                        weight: data.user.weight || '',
                    });
                    setHealthDetails({
                        diabetes: data.user.diabetes || { hasCondition: false, type: '' },
                        bloodPressure: data.user.bloodPressure || '',
                        allergies: (data.user.allergies || []).join(', '),
                        chronicConditions: (data.user.chronicConditions || []).join(', '),
                        currentMedications: (data.user.currentMedications || []).join(', '),
                        emergencyContact: data.user.emergencyContact || { name: '', phone: '', relation: '' },
                    });
                }
            } catch (err) {
                console.error('Profile fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const payload = activeTab === 'basic'
                ? {
                    ...basicInfo,
                    age: Number(basicInfo.age),
                    height: basicInfo.height ? Number(basicInfo.height) : undefined,
                    weight: basicInfo.weight ? Number(basicInfo.weight) : undefined,
                }
                : {
                    diabetes: healthDetails.diabetes,
                    bloodPressure: healthDetails.bloodPressure,
                    allergies: healthDetails.allergies.split(',').map(s => s.trim()).filter(Boolean),
                    chronicConditions: healthDetails.chronicConditions.split(',').map(s => s.trim()).filter(Boolean),
                    currentMedications: healthDetails.currentMedications.split(',').map(s => s.trim()).filter(Boolean),
                    emergencyContact: healthDetails.emergencyContact,
                };

            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ text: data.error || 'Failed to save', type: 'error' });
            } else {
                setMessage({ text: 'Profile updated successfully!', type: 'success' });
                if (activeTab === 'basic') {
                    // Clerk user update can be done here if we wanted to mirror fullName to Clerk
                    if (user && basicInfo.fullName !== user.fullName) {
                        try {
                            const [firstName, ...lastNameParts] = basicInfo.fullName.split(' ');
                            await user.update({
                                firstName: firstName || '',
                                lastName: lastNameParts.join(' ') || ''
                            });
                        } catch (e) {
                            console.error('Failed to update Clerk user:', e);
                        }
                    }
                }
            }
        } catch (err) {
            setMessage({ text: 'Something went wrong', type: 'error' });
        } finally {
            setSaving(false);
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

    if (!isLoaded || !isSignedIn) {
        return null;
    }

    return (
        <>
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-8 animate-fade-in">
                    <h1 className="page-header">My Profile</h1>
                    <p className="page-subtitle">Manage your personal and health information</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 animate-slide-up">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'basic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Basic Info
                    </button>
                    <button
                        onClick={() => setActiveTab('health')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'health' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Health Details
                    </button>
                </div>

                {message.text && (
                    <div className={`mb-4 p-3 rounded-xl text-sm animate-fade-in ${message.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                        : 'bg-red-50 border border-red-100 text-red-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="animate-slide-up">
                    {activeTab === 'basic' ? (
                        <div className="card-static p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={basicInfo.fullName}
                                    onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={basicInfo.age}
                                        onChange={(e) => setBasicInfo({ ...basicInfo, age: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                                    <select
                                        className="input-field"
                                        value={basicInfo.gender}
                                        onChange={(e) => setBasicInfo({ ...basicInfo, gender: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                                <select
                                    className="input-field"
                                    value={basicInfo.bloodGroup}
                                    onChange={(e) => setBasicInfo({ ...basicInfo, bloodGroup: e.target.value })}
                                >
                                    <option value="">Select</option>
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
                                        className="input-field"
                                        value={basicInfo.height}
                                        onChange={(e) => setBasicInfo({ ...basicInfo, height: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={basicInfo.weight}
                                        onChange={(e) => setBasicInfo({ ...basicInfo, weight: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card-static p-6 space-y-5">
                            {/* Diabetes */}
                            <div>
                                <label className="flex items-center gap-3 mb-3">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        checked={healthDetails.diabetes.hasCondition}
                                        onChange={(e) =>
                                            setHealthDetails({
                                                ...healthDetails,
                                                diabetes: { ...healthDetails.diabetes, hasCondition: e.target.checked },
                                            })
                                        }
                                    />
                                    <span className="text-sm font-medium text-gray-700">Diabetes</span>
                                </label>
                                {healthDetails.diabetes.hasCondition && (
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Type (e.g., Type 1, Type 2)"
                                        value={healthDetails.diabetes.type}
                                        onChange={(e) =>
                                            setHealthDetails({
                                                ...healthDetails,
                                                diabetes: { ...healthDetails.diabetes, type: e.target.value },
                                            })
                                        }
                                    />
                                )}
                            </div>

                            {/* Blood Pressure */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Pressure Status</label>
                                <select
                                    className="input-field"
                                    value={healthDetails.bloodPressure}
                                    onChange={(e) => setHealthDetails({ ...healthDetails, bloodPressure: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Low">Low</option>
                                    <option value="High">High</option>
                                    <option value="Controlled with medication">Controlled with medication</option>
                                </select>
                            </div>

                            {/* Allergies */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Known Allergies <span className="text-gray-400 font-normal">(comma separated)</span>
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., Penicillin, Peanuts, Dust"
                                    value={healthDetails.allergies}
                                    onChange={(e) => setHealthDetails({ ...healthDetails, allergies: e.target.value })}
                                />
                            </div>

                            {/* Chronic Conditions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Chronic Conditions <span className="text-gray-400 font-normal">(comma separated)</span>
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., Asthma, Migraine"
                                    value={healthDetails.chronicConditions}
                                    onChange={(e) => setHealthDetails({ ...healthDetails, chronicConditions: e.target.value })}
                                />
                            </div>

                            {/* Current Medications */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Ongoing Medications <span className="text-gray-400 font-normal">(comma separated)</span>
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., Metformin 500mg, Aspirin"
                                    value={healthDetails.currentMedications}
                                    onChange={(e) => setHealthDetails({ ...healthDetails, currentMedications: e.target.value })}
                                />
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</p>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Contact Name"
                                        value={healthDetails.emergencyContact.name}
                                        onChange={(e) =>
                                            setHealthDetails({
                                                ...healthDetails,
                                                emergencyContact: { ...healthDetails.emergencyContact, name: e.target.value },
                                            })
                                        }
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="tel"
                                            className="input-field"
                                            placeholder="Phone Number"
                                            value={healthDetails.emergencyContact.phone}
                                            onChange={(e) =>
                                                setHealthDetails({
                                                    ...healthDetails,
                                                    emergencyContact: { ...healthDetails.emergencyContact, phone: e.target.value },
                                                })
                                            }
                                        />
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Relation (e.g., Father)"
                                            value={healthDetails.emergencyContact.relation}
                                            onChange={(e) =>
                                                setHealthDetails({
                                                    ...healthDetails,
                                                    emergencyContact: { ...healthDetails.emergencyContact, relation: e.target.value },
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                            {saving ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </>
    );
}
