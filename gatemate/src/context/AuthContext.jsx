import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { roleService, USER_ROLES } from "../services/roleService";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const getDestinationForRole = (userRole, vendorStatus = null) => {
    switch (userRole) {
      case USER_ROLES.ADMIN:
        return "/admin";
      case USER_ROLES.VENDOR:
        return vendorStatus === "APPROVED"
          ? "/vendor/dashboard"
          : "/vendor/verification";
      case USER_ROLES.CUSTOMER:
      default:
        return null;
    }
  };

  const handleSessionResolution = useCallback(async (currentSession) => {
    if (!currentSession?.user) {
      setUser(null);
      setRole(null);
      setSession(null);
      setLoading(false);
      return;
    }

    setSession(currentSession);
    const resolvedUser = currentSession.user;
    setUser(resolvedUser);

    try {
      const detectedRole = await roleService.resolveUserRole(resolvedUser);
      setRole(detectedRole || USER_ROLES.CUSTOMER);
    } catch {
      setRole(USER_ROLES.CUSTOMER);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleSessionResolution(initialSession);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        await handleSessionResolution(newSession);
      },
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [handleSessionResolution]);

  const loginWithPassword = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || "").trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    const authenticatedUser = data.user;
    setUser(authenticatedUser);
    setSession(data.session);

    const detectedRole = await roleService.resolveUserRole(authenticatedUser);
    setRole(detectedRole);
    setLoading(false);

    let destination = null;
    if (detectedRole === USER_ROLES.ADMIN) {
      destination = "/admin";
    } else if (detectedRole === USER_ROLES.VENDOR) {
      destination = "/vendor/dashboard";
    }

    return {
      user: authenticatedUser,
      session: data.session,
      role: detectedRole,
      destination,
    };
  };

  const registerWithEmailPassword = async (
    fullName,
    email,
    phone,
    password,
  ) => {
    setLoading(true);
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPhone = (phone || "").trim().replace(/\D/g, "");

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone: cleanPhone,
          role: USER_ROLES.CUSTOMER,
        },
      },
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    // When email confirmation is ON, session is null until user confirms via email
    if (data.user && !data.session) {
      setLoading(false);
      return {
        user: data.user,
        session: null,
        requiresEmailConfirmation: true,
        message: `A verification link has been sent to ${cleanEmail}. Please verify your email before logging in.`,
      };
    }

    await handleSessionResolution(data.session);
    return {
      user: data.user,
      session: data.session,
      role: USER_ROLES.CUSTOMER,
    };
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignored fallback
    } finally {
      setUser(null);
      setRole(null);
      setSession(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        session,
        loading,
        loginWithPassword,
        registerWithEmailPassword,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin: role === USER_ROLES.ADMIN,
        isVendor: role === USER_ROLES.VENDOR,
        isCustomer: role === USER_ROLES.CUSTOMER,
        getDestinationForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
