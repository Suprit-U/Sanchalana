
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RootLayout } from "./components/RootLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Department from "./pages/Department";
import Event from "./pages/Event";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import { useState, useEffect } from "react";
import { ensureStorageBucketsExist } from "@/utils/storageUtils";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const { toast: hookToast } = useToast();
  const [storageVerificationAttempted, setStorageVerificationAttempted] = useState(false);
  
  // Ensure storage buckets exist when app mounts
  useEffect(() => {
    const setupStorage = async () => {
      if (storageVerificationAttempted) return;
      
      setStorageVerificationAttempted(true);
      try {
        console.log("App: Starting storage bucket verification at app startup");
        await ensureStorageBucketsExist();
        console.log("App: Storage buckets verified at app startup");
      } catch (error) {
        console.error("App: Error verifying storage buckets at app startup:", error);
        toast.warning("Storage warning: Could not verify all storage buckets. Some features might not work correctly.");
        
        // Try one more time with a delay
        setTimeout(async () => {
          try {
            console.log("App: Retrying storage bucket verification");
            await ensureStorageBucketsExist();
            console.log("App: Storage buckets verified on retry");
          } catch (retryError) {
            console.error("App: Error verifying storage buckets on retry:", retryError);
          }
        }, 3000);
      }
    };
    setupStorage();
  }, [storageVerificationAttempted]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/departments/:id" element={<Department />} />
              <Route path="/events/:id" element={<Event />} />
              <Route path="/search" element={<Search />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
