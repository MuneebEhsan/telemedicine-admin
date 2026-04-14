"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Shield, Ban, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAdminUsers(`page=${page}&search=${search}`);
      if (data.success) {
        setUsers(data.data); // data.data is the array for paginated responses
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const toggleBanStatus = async (userId: string, isBanned: boolean) => {
    try {
      if (isBanned) {
        await adminApi.unbanUser(userId);
      } else {
        const reason = prompt("Enter ban reason:") || "Violation of terms";
        await adminApi.banUser(userId, reason);
      }
      loadUsers();
    } catch (error) {
      console.error(error);
      alert("Action failed.");
    }
  };

  return (
    <>
      <Header title="User Management" />
      
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <input
               type="text"
               placeholder="Search name, phone, email..."
               className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
               value={search}
               onChange={(e) => {
                 setSearch(e.target.value);
                 setPage(1);
               }}
            />
            <div className="flex gap-2">
               <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 hover:bg-slate-50">Export YAML</button>
            </div>
          </div>
          
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
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user._id || user.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-[#0B132B]">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[#0B132B]">{user.name}</p>
                            <p className="text-xs text-slate-400">{user._id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p>{user.phone}</p>
                        <p className="text-xs text-slate-500">{user.email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'}`}>
                          {user.role === 'admin' && <Shield className="w-3 h-3" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
                            user.status === 'banned' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleBanStatus(user._id, user.status === 'banned')}
                          className={`p-1.5 rounded-lg transition-colors ${user.status === 'banned' ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                          title={user.status === 'banned' ? 'Unban User' : 'Ban User'}
                        >
                          {user.status === 'banned' ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
             <span className="text-sm text-slate-500">Page {page}</span>
             <div className="space-x-2">
                <button
                   disabled={page === 1}
                   onClick={() => setPage(page => Math.max(1, page - 1))}
                   className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                   Previous
                </button>
                <button
                   onClick={() => setPage(page => page + 1)}
                   className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50"
                >
                   Next
                </button>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
