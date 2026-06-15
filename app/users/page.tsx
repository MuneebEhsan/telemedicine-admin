"use client";


import { useToast } from "@/lib/toast-context";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useEffect, useState } from "react";
import { Shield, Ban, CheckCircle, Trash2, Eye, Pill, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function Users() {
  const { showSuccess, showError, showWarning } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [total, setTotal] = useState(0);

  // Ban Modal State
  const [banModal, setBanModal] = useState({
    isOpen: false,
    userId: "",
    reason: ""
  });

  const [unbanModal, setUnbanModal] = useState({
    isOpen: false,
    userId: "",
    userName: ""
  });


  const loadUsers = async () => {
    try {
      setLoading(true);
      let query = `page=${page}&search=${search}`;
      if (roleFilter) query += `&role=${roleFilter}`;
      if (dateFrom) query += `&dateFrom=${dateFrom}`;
      if (dateTo) query += `&dateTo=${dateTo}`;
      const data = await adminApi.getAdminUsers(query);
      if (data.success) {
        setUsers(data.data);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter, dateFrom, dateTo]);

  const toggleBanStatus = async (userId: string, isBanned: boolean, userName: string) => {
    if (isBanned) {
      setUnbanModal({ isOpen: true, userId, userName });
    } else {
      setBanModal({ isOpen: true, userId, reason: "" });
    }
  };

  const confirmUnban = async () => {
    try {
      await adminApi.unbanUser(unbanModal.userId);
      setUnbanModal({ isOpen: false, userId: "", userName: "" });
      loadUsers();
    } catch (error) {
      console.error(error);
      showError("Unban failed.");
    }
  };

  const confirmBan = async () => {
    if (!banModal.reason.trim()) {
      showError("Please enter a reason for the ban.");
      return;
    }
    try {
      await adminApi.banUser(banModal.userId, banModal.reason);
      setBanModal({ isOpen: false, userId: "", reason: "" });
      loadUsers();
    } catch (error) {
      console.error(error);
      showError("Ban failed.");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Permanently delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(userId);
      loadUsers();
    } catch (e: any) {
      showError(getErrorMessage(e));
    }
  };


  const handleMakePharmacy = async (userId: string, userName: string) => {
    if (!confirm(`Make "${userName}" a Pharmacy user? They will be able to log into the pharmacy panel.`)) return;
    try {
      await adminApi.updateUserRole(userId, "pharmacy");
      loadUsers();
    } catch (e: any) {
      showError(getErrorMessage(e));
    }
  };

  const handleRevokePharmacy = async (userId: string, userName: string) => {
    if (!confirm(`Revoke pharmacy access for "${userName}"? They will become a regular patient.`)) return;
    try {
      await adminApi.updateUserRole(userId, "patient");
      loadUsers();
    } catch (e: any) {
      showError(getErrorMessage(e));
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      doctor: "bg-blue-100 text-blue-800",
      pharmacy: "bg-violet-100 text-violet-800",
      patient: "bg-slate-100 text-slate-800",
    };
    const icons: Record<string, React.ReactNode> = {
      admin: <Shield className="w-3 h-3" />,
      pharmacy: <Pill className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[role] || styles.patient}`}>
        {icons[role]}
        {role}
      </span>
    );
  };

  // The Status column shows the account status for most users, but for doctors it
  // shows their application/approval status (Pending/Approved/Rejected/Incomplete)
  // — a new doctor's account is "active" but their application is still pending.
  const getStatusBadge = (user: any): { label: string; cls: string } => {
    if (user.status === "banned") return { label: "Banned", cls: "bg-red-100 text-red-800" };
    if (user.status === "suspended") return { label: "Suspended", cls: "bg-red-100 text-red-800" };

    if (user.role === "doctor") {
      const appStatus =
        user.doctorProfile?.applicationStatus ??
        (user.doctorProfile?.isApproved ? "approved" : "pending");
      const map: Record<string, { label: string; cls: string }> = {
        approved: { label: "Approved", cls: "bg-green-100 text-green-800" },
        pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800" },
        rejected: { label: "Rejected", cls: "bg-red-100 text-red-800" },
        not_filled: { label: "Incomplete", cls: "bg-slate-100 text-slate-600" },
      };
      return map[appStatus] || map.pending;
    }

    if (user.status === "active") return { label: "Active", cls: "bg-green-100 text-green-800" };
    return { label: user.status, cls: "bg-yellow-100 text-yellow-800" };
  };

  const limit = 20;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <>
      <Header title="User Management" />
      
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search name, phone, email..."
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="admin">Admins</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                />
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="date"
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{total} total users</span>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                            user.role === "pharmacy"
                              ? "bg-gradient-to-br from-[#8B5CF6]/20 to-[#6D28D9]/10 text-[#6D28D9]"
                              : "bg-gradient-to-br from-[#14B8A6]/20 to-[#0F3C3A]/10 text-[#0B132B]"
                          }`}>
                            {user.role === "pharmacy" ? <Pill className="w-4 h-4" /> : user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-[#0B132B]">{user.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{user._id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{user.phone}</p>
                        <p className="text-xs text-slate-500">{user.email || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const badge = getStatusBadge(user);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${badge.cls}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Link
                            href={`/users/${user._id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {/* Make Pharmacy / Revoke Pharmacy */}
                          {user.role === "patient" && (
                            <button
                              onClick={() => handleMakePharmacy(user._id, user.name)}
                              className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 transition-colors"
                              title="Make Pharmacy User"
                            >
                              <Pill className="w-4 h-4" />
                            </button>
                          )}
                          {user.role === "pharmacy" && (
                            <button
                              onClick={() => handleRevokePharmacy(user._id, user.name)}
                              className="text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg border border-violet-200 transition-colors"
                              title="Revoke Pharmacy Access"
                            >
                              Revoke
                            </button>
                          )}
                          {/* Ban / Unban */}
                          {user.role !== "admin" && (
                            <button
                              onClick={() => toggleBanStatus(user._id, user.status === "banned", user.name)}
                              className={`p-1.5 rounded-lg transition-colors ${user.status === "banned" ? "text-green-600 hover:bg-green-50" : "text-amber-500 hover:bg-amber-50"}`}
                              title={user.status === "banned" ? "Unban User" : "Ban User"}
                            >
                              {user.status === "banned" ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                          )}
                          {/* Delete */}
                          {user.role !== "admin" && (
                            <button
                              onClick={() => handleDelete(user._id, user.name)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <div className="space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Ban Reason Modal */}
      {banModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-up border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" /> Ban User
            </h2>
            <p className="text-slate-500 text-sm mb-6">Please provide a reason for banning this user. This will be logged for administrative purposes.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ban Reason</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                  rows={3}
                  placeholder="e.g. Repeated violation of community guidelines..."
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
            <h2 className="text-xl font-bold text-slate-900 mb-2">Unban User?</h2>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to restore access for <span className="font-bold text-slate-700">"{unbanModal.userName}"</span>? 
              They will be able to log in and use the platform immediately.
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
