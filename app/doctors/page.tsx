"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import Header from "@/components/layout/Header";
import { X, CheckCircle, AlertCircle, FileText, User as UserIcon, Calendar, GraduationCap, Briefcase, DollarSign, Search, RefreshCw } from "lucide-react";

export default function PendingDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPendingDoctors();
      setDoctors(res.data.doctors || []);
    } catch (error: any) {
      alert(error.message || "Failed to fetch pending doctors.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    (d.name + d.doctorProfile?.professionalName + d.doctorProfile?.licenseNumber)
    .toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    if (!confirm(`Authorize this doctor to join the platform?`)) return;

    try {
      setActionLoading(true);
      await adminApi.approveDoctor(selectedDoctor._id);
      alert("Doctor approved successfully!");
      setSelectedDoctor(null);
      fetchPendingDoctors();
    } catch (error: any) {
      alert(error.message || "Failed to approve doctor.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert("Please provide a reason for rejection.");
      return;
    }

    if (!confirm("Are you sure you want to reject this application?")) return;

    try {
      setActionLoading(true);
      await adminApi.rejectDoctor(selectedDoctor._id, rejectionReason);
      alert("Application rejected.");
      setSelectedDoctor(null);
      fetchPendingDoctors();
    } catch (error: any) {
      alert(error.message || "Failed to reject application.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>;

  return (
    <main className="flex-1 w-full relative min-h-screen">
      <Header title="Med-Team Verification" />
      
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or license..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchPendingDoctors} 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Roster
          </button>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Applicant Profile</th>
                  <th className="px-6 py-4 text-center">Department</th>
                  <th className="px-6 py-4 text-center">Tenure</th>
                  <th className="px-6 py-4 text-right">Verification</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 font-light italic">
                    No matching applications found.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-accent/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg uppercase overflow-hidden border border-slate-200 group-hover:border-accent/40 transition-colors">
                          {doctor.avatar ? <img src={doctor.avatar} alt="" className="w-full h-full object-cover" /> : doctor.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-primary-deep text-base">{doctor.doctorProfile?.professionalName || doctor.name}</div>
                          <div className="text-[11px] text-muted-light font-medium tracking-tight">ID: {doctor._id.slice(-8).toUpperCase()} · LIC: {doctor.doctorProfile?.licenseNumber || "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        {doctor.doctorProfile?.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center text-slate-500 font-medium">{doctor.doctorProfile?.experience} Years</td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => { setSelectedDoctor(doctor); setRejectionReason(""); }}
                        className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-deep transition-all shadow-sm shadow-primary/10"
                      >
                        Review Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Review Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-deep/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-scale-up border border-white/20 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-8 pb-0 flex justify-between items-start">
              <div className="flex gap-6">
                <div className="w-24 h-24 rounded-3xl bg-surface-alt overflow-hidden border-2 border-white shadow-md shrink-0">
                  {selectedDoctor.avatar ? (
                    <img src={selectedDoctor.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-light text-3xl font-bold uppercase">
                      {selectedDoctor.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary-deep">{selectedDoctor.doctorProfile?.professionalName || selectedDoctor.name}</h2>
                  <p className="text-accent font-semibold flex items-center gap-1.5 text-sm">
                    <GraduationCap className="w-4 h-4" /> {selectedDoctor.doctorProfile?.specialization}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-surface-alt text-muted text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 border border-border">
                      <Briefcase className="w-3 h-3" /> {selectedDoctor.doctorProfile?.experience} Yrs Tenure
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary-light text-[10px] font-bold tracking-widest uppercase border border-secondary/20 font-display">Awaiting Verification</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="p-2 rounded-full hover:bg-surface-alt transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-muted-light" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-8 overflow-y-auto flex-grow space-y-8 custom-scrollbar">
              {/* Bio Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-muted-light tracking-[0.2em] uppercase flex items-center gap-2">
                  <UserIcon className="w-3 h-3 text-accent" /> Clinical Narrative
                </h3>
                <p className="text-ink/80 text-sm leading-relaxed bg-surface-alt p-5 rounded-2xl italic border border-border">
                  "{selectedDoctor.doctorProfile?.bio || "No clinical narrative provided."}"
                </p>
              </div>

              {/* Qualifications & Documents */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-muted-light tracking-[0.2em] uppercase flex items-center gap-2">
                    <GraduationCap className="w-3 h-3 text-accent" /> Credentials
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoctor.doctorProfile?.qualifications?.length > 0 ? (
                      selectedDoctor.doctorProfile.qualifications.map((q: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-accent/5 text-accent font-semibold text-[11px] rounded-lg border border-accent/10">{q}</span>
                      ))
                    ) : (
                      <span className="text-muted-light text-xs italic">Not documented</span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-muted-light tracking-[0.2em] uppercase flex items-center gap-2">
                    <FileText className="w-3 h-3 text-accent" /> License Authentication
                  </h3>
                  <div className="p-4 bg-primary-deep text-white rounded-2xl shadow-inner shadow-black/20">
                    <div className="text-[9px] text-accent font-bold uppercase tracking-widest mb-1">Medical Registration Number</div>
                    <div className="text-sm font-mono font-bold tracking-wider">{selectedDoctor.doctorProfile?.licenseNumber || "UNAVAILABLE"}</div>
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-muted-light tracking-[0.2em] uppercase flex items-center gap-2">
                  <FileText className="w-3 h-3 text-accent" /> Verification Documents
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedDoctor.doctorProfile?.documents?.length > 0 ? (
                    selectedDoctor.doctorProfile.documents.map((doc: string, i: number) => (
                      <a 
                        key={i} 
                        href={doc} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-accent/30 hover:bg-accent/5 transition-all group bg-white shadow-sm"
                      >
                        <div className="w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-colors shrink-0 shadow-sm border border-border">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-primary-deep block truncate">License Doc {i+1}</span>
                          <span className="text-[10px] text-muted-light font-medium uppercase tracking-tighter">View Source</span>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="col-span-2 text-muted-light text-xs italic py-2">No verification documents attached.</div>
                  )}
                </div>
              </div>

              {/* Action Inputs */}
              <div className="pt-6 border-t border-border space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-muted-light tracking-[0.2em] uppercase mb-3 text-red-400">Application Rejection Rationale</label>
                  <textarea 
                    placeholder="Provide specific feedback if rejecting..."
                    className="w-full p-5 bg-white border border-border rounded-2xl text-sm focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all resize-none h-24 shadow-sm"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 pt-6 bg-surface-alt/80 backdrop-blur-md border-t border-border flex gap-4">
              <button 
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-8 py-4 rounded-2xl bg-white border border-red-100 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <AlertCircle className="w-4 h-4" /> Decline
              </button>
              <button 
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-[2] px-8 py-4 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary-deep shadow-xl shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-display"
              >
                <CheckCircle className="w-4 h-4" /> Authorize Professional
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
