"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

// Pages accessible by pharmacy role
const pharmacyAllowedPaths = ["/", "/prescriptions", "/pharmacy-orders"];

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }

    const role = localStorage.getItem("userRole");
    if (role === "pharmacy") {
      // Check if pharmacy user is trying to access admin-only page
      const isAllowed = pharmacyAllowedPaths.some(
        (path) => pathname === path || (path !== "/" && pathname.startsWith(path + "/"))
      );

      if (!isAllowed) {
        router.replace("/prescriptions");
        return;
      }
    }
    setChecked(true);
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <main className="w-full flex-1 overflow-y-auto">{children}</main>;
  }

  if (!checked) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        {children}
      </main>
    </>
  );
}
