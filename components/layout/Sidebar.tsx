"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShoppingBag, FolderTree, ClipboardList, Settings, LogOut, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Products", href: "/products", icon: ShoppingBag },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Subcategories", href: "/subcategories", icon: FolderTree },
  { name: "Orders", href: "/orders", icon: ClipboardList },
  { name: "Assessment", href: "/assessment-questions", icon: ClipboardCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login"; // We might need to build a login page later
  };

  return (
    <aside className="w-64 bg-white border-r border-[#0B132B]/10 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-[#0B132B]/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#0F3C3A] flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
            D
          </div>
          <span className="font-display font-semibold text-xl tracking-tight text-[#072A28]">
            Duraup <span className="text-[#D4AF37]">Admin</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
          Management
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#14B8A6]/10 text-[#0F3C3A] font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0B132B]"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-[#14B8A6]" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#0B132B]/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 text-slate-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}
