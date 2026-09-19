import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  supabaseCustomer,
  supabaseAdmin,
  supabaseVendor,
  transferAuthSession,
} from "../lib/supabaseClient";
import { roleService, USER_ROLES } from "../services/roleService";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);
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
    supabaseCustomer.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        handleSessionResolution(initialSession);
      });

    const { data: authListener } = supabaseCustomer.auth.onAuthStateChange(
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
    setError(null);

    try {
      const cleanEmail = email?.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error("Please enter your email address.");
      }

      if (!password) {
        throw new Error("Please enter your password.");
      }

      /*
       * Authenticate through the common Customer client first.
       */
      const { data, error } = await supabaseCustomer.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw error;
      }

      const authenticatedUser = data?.user;
      const authenticatedSession = data?.session;

      if (!authenticatedUser || !authenticatedSession) {
        throw new Error("Authentication session could not be established.");
      }

      /*
       * Resolve the account role.
       */
      const detectedRole = await roleService.resolveUserRole(authenticatedUser);

      /*
       * Normalize role.
       */
      const normalizedRole = String(
        detectedRole ||
          authenticatedUser?.app_metadata?.role ||
          authenticatedUser?.app_metadata?.ROLE ||
          "CUSTOMER",
      ).toUpperCase();

      let activeSession = authenticatedSession;

      /*
       * =========================================================
       * ADMIN
       * =========================================================
       *
       * The login happened through supabaseCustomer.
       *
       * Move the session to the dedicated Admin client before
       * navigating to the Admin portal.
       */
      if (normalizedRole === "ADMIN") {
        const transferred = await transferAuthSession(
          authenticatedSession,
          supabaseAdmin,
        );

        activeSession = transferred?.session || authenticatedSession;

        /*
         * Remove only the temporary Customer-client session.
         *
         * scope: "local" is important.
         */
        await supabaseCustomer.auth.signOut({
          scope: "local",
        });

        setUser(authenticatedUser);
        setSession(activeSession);
        setRole("ADMIN");

        return {
          user: authenticatedUser,
          session: activeSession,
          role: "ADMIN",
          destination: "/admin/dashboard",
        };
      }

      /*
       * =========================================================
       * VENDOR
       * =========================================================
       */
      if (normalizedRole === "VENDOR") {
        const transferred = await transferAuthSession(
          authenticatedSession,
          supabaseVendor,
        );

        activeSession = transferred?.session || authenticatedSession;

        await supabaseCustomer.auth.signOut({
          scope: "local",
        });

        setUser(authenticatedUser);
        setSession(activeSession);
        setRole("VENDOR");

        return {
          user: authenticatedUser,
          session: activeSession,
          role: "VENDOR",
          destination: "/vendor/dashboard",
        };
      }

      /*
       * =========================================================
       * CUSTOMER
       * =========================================================
       */
      setUser(authenticatedUser);
      setSession(activeSession);
      setRole("CUSTOMER");

      return {
        user: authenticatedUser,
        session: activeSession,
        role: "CUSTOMER",
        destination: "/",
      };
    } catch (err) {
      console.error("Login failed:", err);

      setError(err?.message || "Unable to sign in. Please try again.");

      throw err;
    } finally {
      setLoading(false);
    }
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

    const { data, error } = await supabaseCustomer.auth.signUp({
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

    // Email Confirmation is ON: data.user exists but data.session is null
    if (data.user && !data.session) {
      setLoading(false);
      return {
        user: data.user,
        session: null,
        requiresEmailConfirmation: true,
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
      await supabaseCustomer.auth.signOut({
        scope: "local",
      });
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
