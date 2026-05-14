"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/layout/Header";
import { User, Camera, Lock, CheckCircle, Smartphone, UserCircle, Loader2 } from "lucide-react";
import { adminApi, updateProfile, updatePassword } from "@/lib/api";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole") || "admin";
    setRole(userRole);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Wait, there's no direct getProfile in adminApi. Oh wait, /users/me is what we added.
      // But we didn't export `getProfile` in api.ts? Let's check api.ts
      // I forgot to export `getProfile`. I'll use raw fetch with token.
      const token = localStorage.getItem("adminToken");
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1") + "/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data.user);
        setForm({
          name: data.data.user.name || "",
          phone: data.data.user.phone || "",
          email: data.data.user.email || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const formData = new FormData();
      if (role !== "staff") formData.append("name", form.name);
      formData.append("phone", form.phone);
      if (form.email) formData.append("email", form.email);
      
      if (fileInputRef.current?.files?.[0]) {
        formData.append("avatar", fileInputRef.current.files[0]);
      }

      await updateProfile(formData);
      setMessage({ text: "Profile updated successfully!", type: "success" });
      loadProfile();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage({ text: "", type: "" });

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMessage({ text: "Password changed successfully!", type: "success" });
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      setPasswordMessage({ text: err.message || "Failed to change password", type: "error" });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Header title="My Profile" />
      
      <div className="p-8 max-w-4xl mx-auto animate-fade-in space-y-6">
        {/* Profile Card */}
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#14B8A6] rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-[#0F3C3A] transition-colors shadow-md group-hover:scale-110"
                title="Change Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-display font-bold text-[#0B132B]">{profile?.name}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <span className="px-3 py-1 bg-violet-100 text-violet-800 text-xs font-semibold rounded-full capitalize">
                  {profile?.role} Account
                </span>
                <span className="text-slate-500 text-sm font-mono">{profile?.phone}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <UserCircle className="w-5 h-5 text-slate-400" /> Personal Information
            </h3>

            {message.text && (
              <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full bg-red-500 text-white flex justify-center items-center font-bold text-[10px]">!</div>}
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Name {role === 'staff' && '(Locked)'}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  disabled={role === "staff"}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {role === "staff" && <p className="text-xs text-slate-400 mt-1">Staff cannot change their name. Contact Admin.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Phone Number</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address (Optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#14B8A6] text-white font-bold text-sm rounded-xl hover:bg-[#0F3C3A] transition-colors shadow-lg shadow-[#14B8A6]/20 flex items-center gap-2 disabled:opacity-70"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-slate-400" /> Change Password
            </h3>

            {passwordMessage.text && (
              <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {passwordMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full bg-red-500 text-white flex justify-center items-center font-bold text-[10px]">!</div>}
                {passwordMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-3 bg-slate-800 text-white font-bold text-sm rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-800/20 flex items-center gap-2 disabled:opacity-70"
              >
                {passwordSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
