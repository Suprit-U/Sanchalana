
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { disableRightClick } from "@/utils/disableRightClick";

export function RootLayout() {
  const location = useLocation();
  
  useEffect(() => {
    // Always scroll to top when changing routes
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });

    // Disable right-clicking
    disableRightClick();
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
