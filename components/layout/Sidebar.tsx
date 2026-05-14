"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FolderTree,
  ClipboardList,
  Settings,
  LogOut,
  ClipboardCheck,
  Video,
  Activity,
  FileCheck,
  Pill,
  Package,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles: ("admin" | "pharmacy")[];
}

const allNavItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "pharmacy"] },

  // --- Admin-only section ---
  { name: "Users", href: "/users", icon: Users, roles: ["admin"] },
  { name: "Pharmacy Users", href: "/pharmacy-users", icon: Pill, roles: ["admin"] },
  { name: "Doctor Applications", href: "/doctors/applications", icon: ClipboardCheck, roles: ["admin"] },
  { name: "Consultations", href: "/consultations", icon: Video, roles: ["admin"] },
  { name: "Self Tests", href: "/self-tests", icon: Activity, roles: ["admin"] },
  { name: "Products", href: "/products", icon: ShoppingBag, roles: ["admin"] },
  { name: "Categories", href: "/categories", icon: FolderTree, roles: ["admin"] },
  { name: "Subcategories", href: "/subcategories", icon: FolderTree, roles: ["admin"] },
  { name: "Orders", href: "/orders", icon: ClipboardList, roles: ["admin"] },
  { name: "Coupons", href: "/coupons", icon: Ticket, roles: ["admin"] },
  { name: "Assessment", href: "/assessment-questions", icon: ClipboardCheck, roles: ["admin"] },

  // --- Pharmacy section (visible to both admin and pharmacy) ---
  { name: "Prescription Reviews", href: "/prescriptions", icon: FileCheck, roles: ["admin", "pharmacy"] },
  { name: "Pharmacy Orders", href: "/pharmacy-orders", icon: Package, roles: ["admin", "pharmacy"] },

  // --- Admin-only settings ---
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"admin" | "pharmacy">("admin");

  useEffect(() => {
    const role = localStorage.getItem("userRole") as "admin" | "pharmacy";
    if (role) setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  const visibleItems = allNavItems.filter((item) => item.roles.includes(userRole));

  // Group items for visual sections
  const pharmacyItems = visibleItems.filter((item) =>
    ["/prescriptions", "/pharmacy-orders"].includes(item.href)
  );
  const mainItems = visibleItems.filter(
    (item) => !["/prescriptions", "/pharmacy-orders"].includes(item.href)
  );

  const isPharmacy = userRole === "pharmacy";

  return (
    <aside className="w-64 bg-white border-r border-[#0B132B]/10 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-[#0B132B]/10">
        <Link href={isPharmacy ? "/prescriptions" : "/"} className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-bold text-lg shadow-sm",
            isPharmacy
              ? "bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"
              : "bg-gradient-to-br from-[#14B8A6] to-[#0F3C3A]"
          )}>
            {isPharmacy ? "P" : "D"}
          </div>
          <span className="font-display font-semibold text-xl tracking-tight text-[#072A28]">
            Duraup{" "}
            <span className={isPharmacy ? "text-[#8B5CF6]" : "text-[#D4AF37]"}>
              {isPharmacy ? "Pharmacy" : "Admin"}
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        {/* Main Management Section */}
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
          {isPharmacy ? "Pharmacy" : "Management"}
        </div>
        <nav className="space-y-1">
          {mainItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/") && !(item.href === "/doctors" && pathname.startsWith("/doctors/applications")));
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

        {/* Pharmacy Section */}
        {pharmacyItems.length > 0 && (
          <>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-4 px-2 flex items-center gap-2">
              <Pill className="w-3.5 h-3.5" />
              {isPharmacy ? "Orders & Dispatch" : "Pharmacy"}
            </div>
            <nav className="space-y-1">
              {pharmacyItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#8B5CF6]/10 text-[#6D28D9] font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#0B132B]"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-[#8B5CF6]" : "text-slate-400")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </div>

      <div className="p-4 border-t border-[#0B132B]/10">
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isPharmacy ? "bg-[#8B5CF6]" : "bg-[#14B8A6]"
          )} />
          <span className="text-xs text-slate-500 font-medium capitalize">{userRole} Account</span>
        </div>
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
