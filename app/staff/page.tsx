"use client";

import { useEffect, useState } from "react";
import { Shield, Ban, CheckCircle, Trash2, Edit, UserCog, Plus, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'users', label: 'Users' },
  { id: 'pharmacy-users', label: 'Pharmacy Users' },
  { id: 'staff', label: 'Staff Management' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'self-tests', label: 'Self-Tests' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'coupons', label: 'Coupons' }
];

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; staff: any }>({ isOpen: false, staff: null });
  const [banModal, setBanModal] = useState({ isOpen: false, userId: "", reason: "" });
  const [unbanModal, setUnbanModal] = useState({ isOpen: false, userId: "", userName: "" });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    permissions: [] as string[],
  });
  const [formLoading, setFormLoading] = useState(false);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAdminStaff();
      if (data.success) {
        setStaffList(data.data?.staff || []);
      }
    } catch (error) {
      console.error("Failed to load staff:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const togglePermission = (moduleId: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(moduleId)
        ? prev.permissions.filter(p => p !== moduleId)
        : [...prev.permissions, moduleId]
    }));
  };

  const handleCreateStaff = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
      alert("Name, phone, and password are required.");
      return;
    }
    try {
      setFormLoading(true);
      await adminApi.createStaff(form);
      setCreateModal(false);
      setForm({ name: "", phone: "", password: "", permissions: [] });
      loadStaff();
    } catch (e: any) {
      alert(e.message || "Failed to create staff.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editModal.staff) return;
    try {
      setFormLoading(true);
      const updateData: any = {
        name: form.name,
        phone: form.phone,
        permissions: form.permissions,
      };
      if (form.password.trim()) {
        updateData.password = form.password;
      }
      await adminApi.updateStaff(editModal.staff._id, updateData);
      setEditModal({ isOpen: false, staff: null });
      setForm({ name: "", phone: "", password: "", permissions: [] });
      loadStaff();
    } catch (e: any) {
      alert(e.message || "Failed to update staff.");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (staff: any) => {
    setForm({
      name: staff.name,
      phone: staff.phone,
      password: "", // Only update if typed
      permissions: staff.permissions || [],
    });
    setEditModal({ isOpen: true, staff });
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Permanently delete staff "${userName}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteStaff(userId);
      loadStaff();
    } catch (e: any) {
      alert(e.message || "Failed to delete staff.");
    }
  };

  const confirmBan = async () => {
    if (!banModal.reason.trim()) {
      alert("Please enter a reason for the ban.");
      return;
    }
    try {
      await adminApi.banUser(banModal.userId, banModal.reason);
      setBanModal({ isOpen: false, userId: "", reason: "" });
      loadStaff();
    } catch (error) {
      console.error(error);
      alert("Ban failed.");
    }
  };

  const confirmUnban = async () => {
    try {
      await adminApi.unbanUser(unbanModal.userId);
      setUnbanModal({ isOpen: false, userId: "", userName: "" });
      loadStaff();
    } catch (error) {
      console.error(error);
      alert("Unban failed.");
    }
  };

  return (
    <>
      <Header title="Staff Management" />
      
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#8B5CF6]" />
              Internal Staff Members
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setForm({ name: "", phone: "", password: "", permissions: [] });
                  setCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg text-sm font-medium hover:bg-[#7C3AED] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Staff
              </button>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Access Modules</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
                        Loading staff...
                      </div>
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No staff members found.</td>
                  </tr>
                ) : (
                  staffList.map((staff: any) => (
                    <tr key={staff._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-sm text-slate-600 overflow-hidden">
                            {staff.avatar ? (
                              <img src={staff.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              staff.name?.charAt(0)?.toUpperCase() || "?"
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#0B132B]">{staff.name}</p>
                            <p className="text-xs text-slate-400 font-mono">Added: {formatDate(staff.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{staff.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${staff.status === "active" ? "bg-green-100 text-green-800" :
                            staff.status === "banned" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(staff.permissions || []).map((p: string) => (
                            <span key={p} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600">
                              {MODULES.find(m => m.id === p)?.label || p}
                            </span>
                          ))}
                          {(!staff.permissions || staff.permissions.length === 0) && (
                            <span className="text-xs text-slate-400 italic">No access</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(staff)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit Staff"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => staff.status === "banned" 
                              ? setUnbanModal({ isOpen: true, userId: staff._id, userName: staff.name })
                              : setBanModal({ isOpen: true, userId: staff._id, reason: "" })}
                            className={`p-1.5 rounded-lg transition-colors ${staff.status === "banned" ? "text-green-600 hover:bg-green-50" : "text-amber-500 hover:bg-amber-50"}`}
                            title={staff.status === "banned" ? "Unban Staff" : "Ban Staff"}
                          >
                            {staff.status === "banned" ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDelete(staff._id, staff.name)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete Staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Staff Modal */}
      {(createModal || editModal.isOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-scale-up border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-xl flex items-center justify-center">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-[#0B132B]">
                  {createModal ? "Add New Staff" : "Edit Staff"}
                </h2>
                <p className="text-xs text-slate-500">Configure details and platform access</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Staff Details</h3>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Password {createModal ? "*" : "(Leave blank to keep unchanged)"}
                  </label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] transition-all"
                  />
                </div>
              </div>

              {/* Right Column: Permissions */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2 mb-4">Module Access</h3>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                  {MODULES.map(module => {
                    const isChecked = form.permissions.includes(module.id);
                    return (
                      <label key={module.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors
                          ${isChecked ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white' : 'bg-white border-slate-300'}`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{module.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setCreateModal(false);
                  setEditModal({ isOpen: false, staff: null });
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createModal ? handleCreateStaff : handleUpdateStaff}
                disabled={formLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-[#8B5CF6] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/20 transition-all disabled:opacity-60"
              >
                {formLoading ? "Saving..." : "Save Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Reason Modal */}
      {banModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-up border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" /> Ban Staff
            </h2>
            <p className="text-slate-500 text-sm mb-6">Please provide a reason for banning this staff member. This will be logged for administrative purposes.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ban Reason</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                  rows={3}
                  value={banModal.reason}
                  onChange={(e) => setBanModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setBanModal({ isOpen: false, userId: "", reason: "" })}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBan}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                >
                  Confirm Ban
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {unbanModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-up border border-slate-100 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Unban Staff?</h2>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to restore access for <span className="font-bold text-slate-700">"{unbanModal.userName}"</span>? 
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setUnbanModal({ isOpen: false, userId: "", userName: "" })}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnban}
                className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
              >
                Confirm Unban
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
