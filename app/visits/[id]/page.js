'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    Loader2, Sparkles, Save, Plus, X, RefreshCw, Lock, Trash2,
    ChevronLeft, AlertTriangle, Pill, Edit3, CheckCircle2, Camera, ImagePlus,
} from 'lucide-react';

const PAIN_CHARACTERS = ['Sharp', 'Dull', 'Burning', 'Pressure', 'Throbbing', 'Cramping'];
const ASSOCIATED_SYMPTOMS = ['Fever', 'Nausea', 'Vomiting', 'Fatigue', 'Dizziness', 'Shortness of breath', 'Headache', 'Loss of appetite'];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed', 'Weekly'];

const STATUS_STYLES = {
    'Draft': 'bg-blue-600 text-white',
    'Awaiting Doctor': 'bg-amber-500 text-white',
    'Completed': 'bg-green-600 text-white',
};

export default function VisitDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const prescriptionFileRef = useRef(null);
    const [visit, setVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [aiSummary, setAiSummary] = useState('');

    // Prescription state
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState(false);
    const [prescriptionSaving, setPrescriptionSaving] = useState(false);
    const [medicines, setMedicines] = useState([
        { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);

    // Prescription image state
    const [prescriptionImageUrl, setPrescriptionImageUrl] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Clinical form state
    const [form, setForm] = useState({});

    useEffect(() => {
        async function fetchVisit() {
            try {
                const res = await fetch(`/api/visits/${id}`);
                const data = await res.json();
                if (data.success && data.data.visit) {
                    const v = data.data.visit;
                    setVisit(v);
                    setAiSummary(v.aiGeneratedSummary || '');
                    setPrescriptionImageUrl(v.prescriptionImage || '');
                    setForm({
                        chiefComplaint: v.chiefComplaint || '',
                        problemStartDate: v.problemStartDate ? new Date(v.problemStartDate).toISOString().split('T')[0] : '',
                        onsetType: v.onsetType || '',
                        painLocation: v.painLocation || '',
                        painCharacter: v.painCharacter || [],
                        severityScore: v.severityScore || 5,
                        aggravatingFactors: v.aggravatingFactors || '',
                        relievingFactors: v.relievingFactors || '',
                        associatedSymptoms: v.associatedSymptoms || [],
                        medicineTaken: v.medicineTaken || '',
                        similarEpisodeBefore: v.similarEpisodeBefore || false,
                        similarEpisodeDetails: v.similarEpisodeDetails || '',
                        recentHistory: v.recentHistory || '',
                        questionsForDoctor: v.questionsForDoctor || [],
                        customNotes: v.customNotes || '',
                        doctorName: v.doctorName || '',
                        visitDate: v.visitDate ? new Date(v.visitDate).toISOString().split('T')[0] : '',
                    });
                    if (v.prescribedMedicines?.length > 0) {
                        setMedicines(v.prescribedMedicines.map((m) => ({
                            medicineName: m.medicineName || '',
                            dosage: m.dosage || '',
                            frequency: m.frequency || '',
                            duration: m.duration || '',
                            instructions: m.instructions || '',
                        })));
                    }
                } else {
                    setError('Visit not found');
                }
            } catch (err) {
                console.error('Fetch visit error:', err);
                setError('Failed to load visit');
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchVisit();
    }, [id]);

    // --- Status checks ---
    const isDraft = visit?.status === 'Draft';
    const isAwaitingDoctor = visit?.status === 'Awaiting Doctor';
    const isCompleted = visit?.status === 'Completed';
    // Phase 1: Draft only (editable form)
    // Phase 2: Awaiting Doctor or Completed (locked summary, prescription available)
    const isPhase2 = isAwaitingDoctor || isCompleted;

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toggleArrayField = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((v) => v !== value)
                : [...prev[field], value],
        }));
    };

    const addQuestion = () => {
        setForm((prev) => ({ ...prev, questionsForDoctor: [...prev.questionsForDoctor, ''] }));
    };

    const updateQuestion = (index, value) => {
        const updated = [...form.questionsForDoctor];
        updated[index] = value;
        setForm((prev) => ({ ...prev, questionsForDoctor: updated }));
    };

    const removeQuestion = (index) => {
        setForm((prev) => ({
            ...prev,
            questionsForDoctor: prev.questionsForDoctor.filter((_, i) => i !== index),
        }));
    };

    const handleGenerateSummary = async () => {
        if (!form.chiefComplaint?.trim()) return;
        setAiLoading(true);
        setError('');
        try {
            const res = await fetch('/api/visits/generate-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chiefComplaint: form.chiefComplaint,
                    problemStartDate: form.problemStartDate,
                    onsetType: form.onsetType,
                    painLocation: form.painLocation,
                    painCharacter: form.painCharacter,
                    severityScore: form.severityScore,
                    aggravatingFactors: form.aggravatingFactors,
                    relievingFactors: form.relievingFactors,
                    associatedSymptoms: form.associatedSymptoms,
                    medicineTaken: form.medicineTaken,
                    similarEpisodeBefore: form.similarEpisodeBefore,
                    similarEpisodeDetails: form.similarEpisodeDetails,
                    recentHistory: form.recentHistory,
                    questionsForDoctor: (form.questionsForDoctor || []).filter((q) => q.trim()),
                    customNotes: form.customNotes,
                    patientName: '',
                    patientGender: '',
                    patientAge: '',
                    activeConditions: [],
                    activeMedications: [],
                }),
            });
            const data = await res.json();
            if (data.success && data.summary) {
                setAiSummary(data.summary);
            } else {
                setError(data.error || 'Failed to generate summary');
            }
        } catch (err) {
            setError('Failed to generate summary');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async (status) => {
        if (!form.chiefComplaint?.trim()) {
            setError('Chief complaint is required');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const body = {
                chiefComplaint: form.chiefComplaint,
                problemStartDate: form.problemStartDate,
                onsetType: form.onsetType,
                painLocation: form.painLocation,
                painCharacter: form.painCharacter,
                severityScore: form.severityScore,
                aggravatingFactors: form.aggravatingFactors,
                relievingFactors: form.relievingFactors,
                associatedSymptoms: form.associatedSymptoms,
                medicineTaken: form.medicineTaken,
                similarEpisodeBefore: form.similarEpisodeBefore,
                similarEpisodeDetails: form.similarEpisodeDetails,
                recentHistory: form.recentHistory,
                questionsForDoctor: (form.questionsForDoctor || []).filter((q) => q.trim()),
                customNotes: form.customNotes,
                doctorName: form.doctorName,
                visitDate: form.visitDate,
                status,
                aiGeneratedSummary: aiSummary,
            };
            const res = await fetch(`/api/visits/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setVisit(data.data.visit);
                setSuccess(status === 'Draft' ? 'Draft saved!' : 'Visit saved successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/visits/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                router.push('/visits');
            } else {
                setError(data.error || 'Failed to delete');
                setDeleting(false);
            }
        } catch (err) {
            setError('Failed to delete visit');
            setDeleting(false);
        }
    };

    // Prescription handlers
    const addMedicineRow = () => {
        setMedicines([...medicines, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const removeMedicineRow = (index) => {
        if (medicines.length === 1) return;
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const updateMedicine = (index, field, value) => {
        const updated = [...medicines];
        updated[index] = { ...updated[index], [field]: value };
        setMedicines(updated);
    };

    const handleSavePrescription = async () => {
        const validMeds = medicines.filter((m) => m.medicineName.trim());
        if (validMeds.length === 0) {
            setError('At least one medicine name is required');
            return;
        }
        setPrescriptionSaving(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`/api/visits/${id}/prescription`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prescribedMedicines: validMeds }),
            });
            const data = await res.json();
            if (data.success) {
                setVisit(data.data.visit);
                setShowPrescriptionForm(false);
                setEditingPrescription(false);
                setSuccess('Prescription saved!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to save prescription');
            }
        } catch (err) {
            setError('Failed to save prescription');
        } finally {
            setPrescriptionSaving(false);
        }
    };

    const handleSavePrescriptionWithImage = async () => {
        const validMeds = medicines.filter((m) => m.medicineName.trim());
        if (validMeds.length === 0) {
            setError('At least one medicine name is required');
            return;
        }

        setError('');
        setSuccess('');

        // Step 1: Upload image if a new one is selected
        if (imagePreview && prescriptionFileRef.current?.files?.[0]) {
            setUploadingImage(true);
            try {
                const formData = new FormData();
                formData.append('image', prescriptionFileRef.current.files[0]);

                const uploadRes = await fetch(`/api/visits/${id}/upload-prescription`, {
                    method: 'POST',
                    body: formData,
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    setPrescriptionImageUrl(uploadData.data.imageUrl);
                } else {
                    setError(uploadData.error || 'Failed to upload image');
                    setUploadingImage(false);
                    return;
                }
            } catch (err) {
                setError('Failed to upload image');
                setUploadingImage(false);
                return;
            }
            setUploadingImage(false);
        }

        // Step 2: Save prescription medicines
        await handleSavePrescription();
        setImagePreview(null);
    };

    // --- Loading & Error states ---
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
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Visit not found</h2>
                    <p className="text-gray-500 mb-4">This visit may have been deleted.</p>
                    <button onClick={() => router.push('/visits')} className="btn-primary">← Back to Visits</button>
                </div>
            </>
        );
    }

    // =====================================================================
    // RENDER
    // =====================================================================
    return (
        <>
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 animate-fade-in">
                    <button onClick={() => router.push('/visits')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Back to Visits
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`badge ${STATUS_STYLES[visit.status]}`}>{visit.status}</span>
                        <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
                        {error}
                        <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm animate-fade-in flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {success}
                    </div>
                )}

                {/* ============================== */}
                {/* PHASE 2: Awaiting Doctor / Completed */}
                {/* ============================== */}
                {isPhase2 && (
                    <>
                        {/* Locked AI Summary */}
                        {aiSummary && (
                            <div className="mb-6 animate-slide-up">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-primary-500" />
                                    <h2 className="section-title">Clinical Summary</h2>
                                </div>
                                <div className="bg-gray-900 text-white font-mono text-sm rounded-lg p-4 max-h-96 overflow-auto whitespace-pre-wrap leading-relaxed">
                                    {aiSummary}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                    <Lock className="w-4 h-4" />
                                    <span>This visit summary has been saved and is now locked.</span>
                                </div>
                            </div>
                        )}

                        {/* Locked clinical form notice */}
                        <div className="mb-4 p-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-sm flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Visit summary locked. Edit not available.
                        </div>

                        {/* Read-only clinical form */}
                        <div className="card-static p-6 space-y-4 opacity-50 pointer-events-none mb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor&apos;s Name</label>
                                    <input type="text" className="input-field" value={form.doctorName || ''} disabled />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                                    <input type="date" className="input-field" value={form.visitDate || ''} disabled />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                                <input type="text" className="input-field" value={form.chiefComplaint || ''} disabled />
                            </div>
                            {form.painLocation && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pain Location</label>
                                    <input type="text" className="input-field" value={form.painLocation} disabled />
                                </div>
                            )}
                            {form.severityScore && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                    <input type="text" className="input-field" value={`${form.severityScore}/10`} disabled />
                                </div>
                            )}
                        </div>

                        {/* PRESCRIPTION SECTION */}
                        <div className="animate-slide-up">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="section-title flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-gray-400" />
                                    Prescription
                                </h2>
                                {isCompleted && !editingPrescription && (
                                    <button
                                        onClick={() => {
                                            setEditingPrescription(true);
                                            setShowPrescriptionForm(true);
                                            if (visit.prescribedMedicines?.length > 0) {
                                                setMedicines(visit.prescribedMedicines.map((m) => ({
                                                    medicineName: m.medicineName || '',
                                                    dosage: m.dosage || '',
                                                    frequency: m.frequency || '',
                                                    duration: m.duration || '',
                                                    instructions: m.instructions || '',
                                                })));
                                            }
                                        }}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                    >
                                        <Edit3 className="w-4 h-4" /> Edit Prescription
                                    </button>
                                )}
                            </div>

                            {/* Completed — read-only prescription table */}
                            {isCompleted && !editingPrescription && visit.prescribedMedicines?.length > 0 && (
                                <div className="card-static overflow-hidden">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">Medicine</th>
                                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">Dosage</th>
                                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">Frequency</th>
                                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">Duration</th>
                                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">Instructions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visit.prescribedMedicines.map((med, i) => (
                                                <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                                                    <td className="p-3 text-sm font-medium text-gray-900">{med.medicineName}</td>
                                                    <td className="p-3 text-sm text-gray-600">{med.dosage || '—'}</td>
                                                    <td className="p-3 text-sm text-gray-600">{med.frequency || '—'}</td>
                                                    <td className="p-3 text-sm text-gray-600">{med.duration || '—'}</td>
                                                    <td className="p-3 text-sm text-gray-600">{med.instructions || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Existing prescription image (read-only view) */}
                            {isCompleted && !editingPrescription && prescriptionImageUrl && (
                                <div className="mt-4 card-static p-4">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-gray-400" /> Prescription Photo
                                    </h3>
                                    <img src={prescriptionImageUrl} alt="Prescription" className="max-h-72 rounded-lg border border-gray-200" />
                                </div>
                            )}

                            {/* Completed with no medicines yet */}
                            {isCompleted && !editingPrescription && (!visit.prescribedMedicines || visit.prescribedMedicines.length === 0) && (
                                <div className="text-center py-8 card-static">
                                    <Pill className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No medicines prescribed.</p>
                                </div>
                            )}

                            {/* Awaiting Doctor — show Add Prescription button */}
                            {isAwaitingDoctor && !showPrescriptionForm && (
                                <button onClick={() => setShowPrescriptionForm(true)} className="btn-primary flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add Prescription
                                </button>
                            )}

                            {/* Prescription Form (for both Awaiting Doctor add and Completed edit) */}
                            {(showPrescriptionForm || editingPrescription) && (
                                <div className="card-static p-4 space-y-3 animate-fade-in">
                                    {medicines.map((med, i) => (
                                        <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Medicine {i + 1}</span>
                                                {medicines.length > 1 && (
                                                    <button type="button" onClick={() => removeMedicineRow(i)} className="p-1 text-red-400 hover:text-red-600">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <input type="text" className="input-field text-sm" placeholder="Medicine Name *" value={med.medicineName} onChange={(e) => updateMedicine(i, 'medicineName', e.target.value)} />
                                                <input type="text" className="input-field text-sm" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} />
                                                <select className="input-field text-sm" value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}>
                                                    <option value="">Frequency</option>
                                                    {FREQUENCIES.map((f) => (<option key={f} value={f}>{f}</option>))}
                                                </select>
                                                <input type="text" className="input-field text-sm" placeholder="e.g. 5 days, 1 month" value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} />
                                            </div>
                                            <input type="text" className="input-field text-sm" placeholder="e.g. After food" value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} />
                                        </div>
                                    ))}
                                    <button type="button" onClick={addMedicineRow} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add Row
                                    </button>
                                    {/* Prescription Photo Upload */}
                                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Camera className="w-4 h-4" /> Prescription Photo
                                        </label>
                                        {imagePreview && (
                                            <div className="relative mb-3 inline-block">
                                                <img src={imagePreview} alt="Prescription preview" className="max-h-48 rounded-lg border border-gray-200" />
                                                <button
                                                    type="button"
                                                    onClick={() => { setImagePreview(null); if (prescriptionFileRef.current) prescriptionFileRef.current.value = ''; }}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                        {prescriptionImageUrl && !imagePreview && (
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-500 mb-1">Current photo:</p>
                                                <img src={prescriptionImageUrl} alt="Prescription" className="max-h-48 rounded-lg border border-gray-200" />
                                            </div>
                                        )}
                                        <input
                                            ref={prescriptionFileRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (file.size > 5 * 1024 * 1024) {
                                                    setError('Image must be under 5MB');
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setImagePreview(ev.target.result);
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => prescriptionFileRef.current?.click()}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                        >
                                            <ImagePlus className="w-4 h-4" />
                                            {prescriptionImageUrl ? 'Change Photo' : 'Upload Photo'}
                                        </button>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button type="button" onClick={handleSavePrescriptionWithImage} disabled={prescriptionSaving || uploadingImage} className="btn-primary flex items-center gap-2">
                                            {(prescriptionSaving || uploadingImage) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {uploadingImage ? 'Uploading...' : 'Save Prescription'}
                                        </button>
                                        <button type="button" onClick={() => { setShowPrescriptionForm(false); setEditingPrescription(false); setImagePreview(null); }} className="btn-secondary">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ============================== */}
                {/* PHASE 1: Draft (editable form) */}
                {/* ============================== */}
                {isDraft && (
                    <>
                        <div className="card-static p-6 space-y-6 animate-slide-up">
                            {/* Visit Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor&apos;s Name</label>
                                    <input type="text" className="input-field" placeholder="Dr. John Smith" value={form.doctorName || ''} onChange={(e) => updateField('doctorName', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Visit Date</label>
                                    <input type="date" className="input-field" value={form.visitDate || ''} onChange={(e) => updateField('visitDate', e.target.value)} />
                                </div>
                            </div>
                            <hr className="border-gray-100" />

                            {/* 1 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">1. Chief Complaint <span className="text-red-500">*</span></label>
                                <input type="text" className="input-field" placeholder="What is your main problem today?" value={form.chiefComplaint || ''} onChange={(e) => updateField('chiefComplaint', e.target.value)} />
                            </div>
                            {/* 2 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">2. When did the problem start?</label>
                                <input type="date" className="input-field" value={form.problemStartDate || ''} onChange={(e) => updateField('problemStartDate', e.target.value)} />
                            </div>
                            {/* 3 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">3. How did it start?</label>
                                <div className="flex gap-4">
                                    {['Sudden', 'Gradual'].map((type) => (
                                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="onsetType" value={type} checked={form.onsetType === type} onChange={(e) => updateField('onsetType', e.target.value)} className="w-4 h-4 text-primary-600" />
                                            <span className="text-sm text-gray-700">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* 4 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">4. Where is the problem located?</label>
                                <input type="text" className="input-field" placeholder="e.g. chest, lower back, right knee" value={form.painLocation || ''} onChange={(e) => updateField('painLocation', e.target.value)} />
                            </div>
                            {/* 5 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">5. Describe the sensation</label>
                                <div className="flex flex-wrap gap-2">
                                    {PAIN_CHARACTERS.map((char) => (
                                        <label key={char} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.painCharacter?.includes(char) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                                            <input type="checkbox" checked={form.painCharacter?.includes(char) || false} onChange={() => toggleArrayField('painCharacter', char)} className="sr-only" />
                                            <span className="text-sm">{char}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* 6 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">6. Severity right now</label>
                                <div className="flex items-center gap-4">
                                    <input type="range" min="1" max="10" value={form.severityScore || 5} onChange={(e) => updateField('severityScore', parseInt(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                                    <span className="text-2xl font-bold text-primary-600 min-w-[40px] text-center">{form.severityScore || 5}</span>
                                </div>
                            </div>
                            {/* 7 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">7. What makes it worse?</label>
                                <input type="text" className="input-field" value={form.aggravatingFactors || ''} onChange={(e) => updateField('aggravatingFactors', e.target.value)} />
                            </div>
                            {/* 8 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">8. What makes it better?</label>
                                <input type="text" className="input-field" value={form.relievingFactors || ''} onChange={(e) => updateField('relievingFactors', e.target.value)} />
                            </div>
                            {/* 9 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">9. Other symptoms noticed</label>
                                <div className="flex flex-wrap gap-2">
                                    {ASSOCIATED_SYMPTOMS.map((sym) => (
                                        <label key={sym} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.associatedSymptoms?.includes(sym) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                                            <input type="checkbox" checked={form.associatedSymptoms?.includes(sym) || false} onChange={() => toggleArrayField('associatedSymptoms', sym)} className="sr-only" />
                                            <span className="text-sm">{sym}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* 10 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">10. Medicines already taken</label>
                                <input type="text" className="input-field" placeholder="e.g. Paracetamol 500mg" value={form.medicineTaken || ''} onChange={(e) => updateField('medicineTaken', e.target.value)} />
                            </div>
                            {/* 11 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">11. Similar problem before?</label>
                                <div className="flex gap-4 mb-2">
                                    {[true, false].map((val) => (
                                        <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="similarEpisodeBefore" checked={form.similarEpisodeBefore === val} onChange={() => updateField('similarEpisodeBefore', val)} className="w-4 h-4 text-primary-600" />
                                            <span className="text-sm text-gray-700">{val ? 'Yes' : 'No'}</span>
                                        </label>
                                    ))}
                                </div>
                                {form.similarEpisodeBefore && (
                                    <input type="text" className="input-field" placeholder="Describe previous episode" value={form.similarEpisodeDetails || ''} onChange={(e) => updateField('similarEpisodeDetails', e.target.value)} />
                                )}
                            </div>
                            {/* 12 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">12. Any recent changes?</label>
                                <input type="text" className="input-field" placeholder="e.g. travel, diet change, stress" value={form.recentHistory || ''} onChange={(e) => updateField('recentHistory', e.target.value)} />
                            </div>
                            {/* 13 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">13. Questions for your doctor</label>
                                <div className="space-y-2">
                                    {(form.questionsForDoctor || []).map((q, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input type="text" className="input-field flex-1" placeholder={`Question ${i + 1}`} value={q} onChange={(e) => updateQuestion(i, e.target.value)} />
                                            <button type="button" onClick={() => removeQuestion(i)} className="p-2.5 hover:bg-red-50 rounded-xl text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addQuestion} className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Add Question
                                </button>
                            </div>
                            {/* 14 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">14. Additional notes</label>
                                <textarea className="input-field min-h-[80px] resize-y" value={form.customNotes || ''} onChange={(e) => updateField('customNotes', e.target.value)} />
                            </div>
                        </div>

                        {/* AI Summary (Draft only) */}
                        {aiSummary && (
                            <div className="mt-6 animate-fade-in">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="section-title flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary-500" /> AI-Generated Clinical Summary
                                    </h3>
                                    <button type="button" onClick={handleGenerateSummary} disabled={aiLoading} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                        <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} /> Regenerate
                                    </button>
                                </div>
                                <div className="bg-gray-900 text-white font-mono text-sm rounded-lg p-4 max-h-96 overflow-auto whitespace-pre-wrap leading-relaxed">
                                    {aiSummary}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons (Draft only) */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                            <button type="button" onClick={() => handleSave('Draft')} disabled={saving} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save as Draft
                            </button>
                            <button type="button" onClick={handleGenerateSummary} disabled={aiLoading || !form.chiefComplaint?.trim()} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {aiLoading ? 'Generating...' : 'Generate Summary'}
                            </button>
                            <button type="button" onClick={() => handleSave('Awaiting Doctor')} disabled={saving} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Visit
                            </button>
                        </div>
                    </>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                        <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete this visit?</h3>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Cancel</button>
                                <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2">
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
