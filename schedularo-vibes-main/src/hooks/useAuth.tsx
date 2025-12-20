import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, userApi, setToken, removeToken, getToken } from "@/lib/api";

type AppRole = "customer" | "organizer" | "admin";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: { access_token: string } | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleMapping: Record<string, AppRole> = {
  CUSTOMER: "customer",
  ORGANISER: "organizer",
  ORGANIZER: "organizer",
  ADMIN: "admin",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const userData = await userApi.getMe();
      
      setUser({ id: userData.id, email: userData.email });
      setSession({ access_token: token });
      
      const mappedRole = userData.roles?.[0] 
        ? roleMapping[userData.roles[0].toUpperCase()] || "customer"
        : "customer";
      setRole(mappedRole);

      setProfile({
        id: userData.id,
        user_id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      removeToken();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    try {
      const roleUpper = selectedRole === "organizer" ? "ORGANISER" : "CUSTOMER";
      await authApi.register({
        full_name: fullName,
        email,
        password,
        role: roleUpper,
      });
      return { error: null };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await authApi.login({ email, password });
      await fetchProfile();
      return { error: null };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    authApi.logout();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
