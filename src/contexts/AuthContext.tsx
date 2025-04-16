import { createContext, useState, useEffect, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Profile, Admin } from "@/types";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Omit<Profile, "id">) => Promise<void>;
  signOut: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  isAdmin: boolean;
  adminRole: Admin["role"] | null;
  adminDetails: Admin | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<Admin["role"] | null>(null);
  const [adminDetails, setAdminDetails] = useState<Admin | null>(null);

  useEffect(() => {
    // Handle initial session
    const handleInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await Promise.all([
          fetchProfile(initialSession.user.id),
          checkIfAdmin(initialSession.user.id),
        ]);
      }
      setIsLoading(false);
    };

    handleInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await Promise.all([
            fetchProfile(currentSession.user.id),
            checkIfAdmin(currentSession.user.id),
          ]);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setAdminRole(null);
          setAdminDetails(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    }
  }

  async function checkIfAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Error checking admin status:", error);
        }
        setIsAdmin(false);
        setAdminRole(null);
        setAdminDetails(null);
      } else if (data) {
        setIsAdmin(true);
        setAdminRole(data.role);
        setAdminDetails(data);
      } else {
        setIsAdmin(false);
        setAdminRole(null);
        setAdminDetails(null);
      }
    } catch (error) {
      console.error("Error in checkIfAdmin:", error);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      console.error("Error in signIn:", error);
      throw error;
    }
  }

  async function signUp(email: string, password: string, userData: Omit<Profile, "id">) {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            usn: userData.usn,
            phone: userData.phone,
          },
        },
      });

      if (signUpError) {
        toast({
          title: "Error signing up",
          description: signUpError.message,
          variant: "destructive",
        });
        throw signUpError;
      }

      toast({
        title: "Account created successfully!",
        description: "Welcome to Sanchalana 2025.",
      });
    } catch (error) {
      console.error("Error in signUp:", error);
      throw error;
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Signed out successfully",
      });
    } catch (error) {
      console.error("Error in signOut:", error);
      throw error;
    }
  }

  async function sendOtp(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin, // Optional, adjust if needed
        },
      });

      if (error) {
        toast({
          title: "Error sending OTP",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "OTP sent!",
        description: "Check your email for the one-time code.",
      });
    } catch (error) {
      console.error("Error in sendOtp:", error);
      throw error;
    }
  }

  async function verifyOtp(email: string, token: string) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) {
        toast({
          title: "Error verifying OTP",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Login successful!",
        description: "You have been logged in.",
      });
    } catch (error) {
      console.error("Error in verifyOtp:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        sendOtp,
        verifyOtp,
        isAdmin,
        adminRole,
        adminDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}