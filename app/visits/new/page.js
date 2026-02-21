'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

const SPECIALTIES = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'ENT Specialist',
    'Gastroenterologist', 'Neurologist', 'Ophthalmologist', 'Orthopedic',
    'Pediatrician', 'Psychiatrist', 'Pulmonologist', 'Urologist',
    'Gynecologist', 'Dentist', 'Other',
];

const STEPS = ['Visit Info', 'Symptoms', 'Medicines & Rx', 'Review & Save'];

export default function NewVisitPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState('');

    const [visitInfo, setVisitInfo] = useState({
        doctorName: '',
        hospitalName: '',
        specialty: '',
        visitDate: new Date().toISOString().split('T')[0],
    });

    const [symptoms, setSymptoms] = useState({
        original: '',
        aiSummary: '',
    });

    const [medicines, setMedicines] = useState([]);
    const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', frequency: '', duration: '' });
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [prescriptionPreview, setPrescriptionPreview] = useState('');
    const [doctorNotes, setDoctorNotes] = useState('');

    const handleGenerateAI = async () => {
        if (!symptoms.original.trim()) return;
        setAiLoading(true);
        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms: symptoms.original }),
            });
            const data = await res.json();
            if (data.summary) {
                setSymptoms({ ...symptoms, aiSummary: data.summary });
            } else {
                setError(data.error || 'Could not generate AI summary');
            }
        } catch (err) {
            setError('Failed to generate summary');
        } finally {
            setAiLoading(false);
        }
    };

    const addMedicine = () => {
        if (!newMedicine.name.trim()) return;
        setMedicines([...medicines, { ...newMedicine }]);
        setNewMedicine({ name: '', dosage: '', frequency: '', duration: '' });
    };

    const removeMedicine = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPrescriptionFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setPrescriptionPreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('doctorName', visitInfo.doctorName);
            formData.append('hospitalName', visitInfo.hospitalName);
            formData.append('specialty', visitInfo.specialty);
            formData.append('visitDate', visitInfo.visitDate);
            formData.append('originalSymptoms', symptoms.original);
            formData.append('aiSummary', symptoms.aiSummary);
            formData.append('medicines', JSON.stringify(medicines));
            formData.append('doctorNotes', doctorNotes);
            if (prescriptionFile) {
                formData.append('prescription', prescriptionFile);
            }

            const res = await fetch('/api/visits', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to save visit');
                return;
            }

            router.push('/visits');
            router.refresh();
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 0: return visitInfo.doctorName && visitInfo.specialty && visitInfo.visitDate;
            case 1: return symptoms.original.trim().length > 0;
            case 2: return true;
            case 3: return true;
            default: return false;
        }
    };

    return (
        <>
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-8 animate-fade-in">
                    <h1 className="page-header">Log New Visit</h1>
                    <p className="page-subtitle">Record your medical visit details step by step</p>
                </div>

                {/* Step Indicator */}
                <div className="mb-8 animate-slide-up">
                    <div className="flex items-center justify-between mb-2">
                        {STEPS.map((label, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${i < step ? 'bg-emerald-500 text-white' :
                                        i === step ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' :
                                            'bg-gray-100 text-gray-400'
                                    }`}>
                                    {i < step ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : i + 1}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-700' : 'text-gray-400'}`}>
                                    {label}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-8 sm:w-16 h-0.5 mx-1 transition-colors ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
                        {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="card-static p-6 animate-fade-in" key={step}>
                    {step === 0 && (
                        <div className="space-y-5">
                            <h2 className="section-title mb-4">Visit Information</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor&apos;s Name *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Dr. John Smith"
                                    value={visitInfo.doctorName}
                                    onChange={(e) => setVisitInfo({ ...visitInfo, doctorName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital / Clinic Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="City Hospital (optional)"
                                    value={visitInfo.hospitalName}
                                    onChange={(e) => setVisitInfo({ ...visitInfo, hospitalName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialty *</label>
                                <select
                                    className="input-field"
                                    value={visitInfo.specialty}
                                    onChange={(e) => setVisitInfo({ ...visitInfo, specialty: e.target.value })}
                                >
                                    <option value="">Select specialty</option>
                                    {SPECIALTIES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Visit *</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={visitInfo.visitDate}
                                    onChange={(e) => setVisitInfo({ ...visitInfo, visitDate: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5">
                            <h2 className="section-title mb-4">Symptoms & Problem Description</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Describe what you were feeling *
                                </label>
                                <p className="text-xs text-gray-400 mb-2">Write in your own words — casual language is perfectly fine.</p>
                                <textarea
                                    className="input-field min-h-[120px] resize-y"
                                    placeholder="e.g., I had a bad headache for 3 days and felt dizzy sometimes. Also had a mild fever at night..."
                                    value={symptoms.original}
                                    onChange={(e) => setSymptoms({ ...symptoms, original: e.target.value })}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={!symptoms.original.trim() || aiLoading}
                                className="btn-secondary flex items-center gap-2"
                            >
                                {aiLoading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                        </svg>
                                        Generate AI Summary
                                    </>
                                )}
                            </button>

                            {symptoms.aiSummary && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 animate-fade-in">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-primary-700">AI-Generated Clinical Summary</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{symptoms.aiSummary}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="section-title mb-4">Medicines & Prescription</h2>

                            {/* Add medicine form */}
                            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                                <p className="text-sm font-medium text-gray-700">Add Medicine</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="input-field text-sm"
                                        placeholder="Medicine Name *"
                                        value={newMedicine.name}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="input-field text-sm"
                                        placeholder="Dosage (e.g., 500mg)"
                                        value={newMedicine.dosage}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="input-field text-sm"
                                        placeholder="Frequency (e.g., Twice daily)"
                                        value={newMedicine.frequency}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="input-field text-sm"
                                        placeholder="Duration (e.g., 5 days)"
                                        value={newMedicine.duration}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                                    />
                                </div>
                                <button type="button" onClick={addMedicine} disabled={!newMedicine.name.trim()} className="btn-secondary text-sm py-2">
                                    + Add Medicine
                                </button>
                            </div>

                            {/* Medicine list */}
                            {medicines.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Added Medicines ({medicines.length})</p>
                                    {medicines.map((med, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl animate-slide-up">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{med.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ') || 'No details'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeMedicine(i)}
                                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Prescription upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prescription Photo</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors">
                                    {prescriptionPreview ? (
                                        <div className="relative">
                                            <img src={prescriptionPreview} alt="Prescription" className="max-h-48 mx-auto rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => { setPrescriptionFile(null); setPrescriptionPreview(''); }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M3.75 3h16.5M3.75 3v18" />
                                            </svg>
                                            <p className="text-sm text-gray-500 mb-2">Upload a photo of your prescription</p>
                                            <label className="btn-secondary text-sm py-2 cursor-pointer inline-block">
                                                Choose File
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Doctor notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor Notes (optional)</label>
                                <textarea
                                    className="input-field min-h-[80px] resize-y"
                                    placeholder="Any additional notes from the doctor..."
                                    value={doctorNotes}
                                    onChange={(e) => setDoctorNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="section-title mb-4">Review Your Visit</h2>

                            {/* Visit Info Summary */}
                            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Visit Information</p>
                                <SummaryRow label="Doctor" value={`Dr. ${visitInfo.doctorName}`} />
                                {visitInfo.hospitalName && <SummaryRow label="Hospital" value={visitInfo.hospitalName} />}
                                <SummaryRow label="Specialty" value={visitInfo.specialty} />
                                <SummaryRow label="Date" value={new Date(visitInfo.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                            </div>

                            {/* Symptoms Summary */}
                            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Symptoms</p>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Your description</p>
                                    <p className="text-sm text-gray-700">{symptoms.original}</p>
                                </div>
                                {symptoms.aiSummary && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-xs text-primary-500 mb-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l" />
                                            </svg>
                                            AI Clinical Summary
                                        </p>
                                        <p className="text-sm text-gray-700">{symptoms.aiSummary}</p>
                                    </div>
                                )}
                            </div>

                            {/* Medicines Summary */}
                            {medicines.length > 0 && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Medicines ({medicines.length})</p>
                                    <div className="space-y-2">
                                        {medicines.map((med, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                <span className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center text-xs font-medium text-primary-700">{i + 1}</span>
                                                <span className="font-medium text-gray-900">{med.name}</span>
                                                {med.dosage && <span className="text-gray-500">· {med.dosage}</span>}
                                                {med.frequency && <span className="text-gray-500">· {med.frequency}</span>}
                                                {med.duration && <span className="text-gray-500">· {med.duration}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {prescriptionPreview && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Prescription</p>
                                    <img src={prescriptionPreview} alt="Prescription" className="max-h-40 rounded-lg" />
                                </div>
                            )}

                            {doctorNotes && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Doctor Notes</p>
                                    <p className="text-sm text-gray-700">{doctorNotes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        type="button"
                        onClick={() => step === 0 ? router.push('/visits') : setStep(step - 1)}
                        className="btn-secondary"
                    >
                        {step === 0 ? 'Cancel' : '← Back'}
                    </button>

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="btn-primary"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
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
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Save Visit
                                </>
                            )}
                        </button>
                    )}
                </div>
            </main>
        </>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
    );
}
