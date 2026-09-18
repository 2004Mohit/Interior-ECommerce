import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const VendorAuthContext = createContext(null);

export const VendorAuthProvider = ({ children }) => {
  const [vendorUser, setVendorUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /*
   * ---------------------------------------------------------
   * INITIAL SESSION
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        /*
         * No session is a normal logged-out state.
         */
        if (sessionError) {
          console.error("Failed to get vendor session:", sessionError);

          if (mounted) {
            setVendorUser(null);
          }

          return;
        }

        if (mounted) {
          setVendorUser(session?.user ?? null);
        }
      } catch (err) {
        /*
         * A missing session should not break the application.
         */
        console.error("Error getting initial vendor session:", err);

        if (mounted) {
          setVendorUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    /*
     * Listen for login/logout/session changes.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setVendorUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * VENDOR LOGIN
   * ---------------------------------------------------------
   */
  const login = async (email, password) => {
    setError(null);

    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      const err = new Error("Please enter your email address.");
      setError(err.message);
      throw err;
    }

    if (!password) {
      const err = new Error("Please enter your password.");
      setError(err.message);
      throw err;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: cleanEmail,
        password,
      },
    );

    if (signInError) {
      console.error("Vendor login failed:", signInError);

      setError(signInError.message);
      throw signInError;
    }

    const authUser = data?.user;

    if (!authUser?.id) {
      const err = new Error("Unable to identify the authenticated vendor.");

      setError(err.message);
      throw err;
    }

    setVendorUser(authUser);

    return {
      user: authUser,
      session: data?.session ?? null,
    };
  };

  /*
   * ---------------------------------------------------------
   * VENDOR REGISTRATION
   * ---------------------------------------------------------
   *
   * Creates ONLY the Supabase Auth account here.
   *
   * Identity:
   *
   * auth.users.id
   *      ↓
   * vendor_applications.user_id
   *
   * The vendor profile should be created by the
   * Admin approval/backend workflow.
   */
  const registerVendor = async ({
    businessName,
    contactPerson,
    email,
    password,
  }) => {
    setError(null);

    const cleanBusinessName = businessName?.trim();

    const cleanContactPerson = contactPerson?.trim();

    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanBusinessName) {
      const err = new Error("Please enter your business name.");

      setError(err.message);
      throw err;
    }

    if (!cleanContactPerson) {
      const err = new Error("Please enter the contact person's name.");

      setError(err.message);
      throw err;
    }

    if (!cleanEmail) {
      const err = new Error("Please enter a valid business email.");

      setError(err.message);
      throw err;
    }

    if (!password || password.length < 6) {
      const err = new Error("Password must contain at least 6 characters.");

      setError(err.message);
      throw err;
    }

    try {
      /*
       * Create Supabase Auth account.
       *
       * The business/contact information is stored
       * in user_metadata temporarily so the backend/
       * onboarding flow can use the same authenticated
       * user identity.
       */
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            business_name: cleanBusinessName,
            contact_person: cleanContactPerson,
            account_type: "VENDOR",
          },
        },
      });

      if (signUpError) {
        console.error("Supabase vendor registration failed:", signUpError);

        setError(signUpError.message);
        throw signUpError;
      }

      const authUser = data?.user;

      if (!authUser?.id) {
        const err = new Error("Supabase Auth did not return a user ID.");

        setError(err.message);
        throw err;
      }

      /*
       * Important:
       *
       * authUser.id is the ONLY ID we use for the
       * vendor application's user_id.
       *
       * Do NOT use:
       * - vnd-pune-001
       * - mock-user-1
       * - vendor business name
       * - email address
       */

      setVendorUser(authUser);

      /*
       * Return the Auth result to VendorRegister.jsx.
       */
      return {
        user: authUser,
        session: data?.session ?? null,
        needsEmailConfirmation: !data?.session,
      };
    } catch (err) {
      console.error("Vendor registration failed:", err);

      setError(err?.message || "Registration failed. Please try again.");

      throw err;
    }
  };

  /*
   * ---------------------------------------------------------
   * BACKWARD COMPATIBILITY
   * ---------------------------------------------------------
   *
   * Some existing components may still call:
   *
   * register(email, password)
   *
   * Keep this alias so those components do not
   * immediately break.
   */
  const register = async (email, password) => {
    return registerVendor({
      businessName: "",
      contactPerson: "",
      email,
      password,
    });
  };

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */
  const logout = async () => {
    setError(null);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Vendor logout failed:", signOutError);

      setError(signOutError.message);
      throw signOutError;
    }

    setVendorUser(null);
  };

  /*
   * ---------------------------------------------------------
   * CONTEXT VALUE
   * ---------------------------------------------------------
   */
  const value = {
    vendorUser,
    user: vendorUser,
    loading,
    error,

    login,

    registerVendor,

    /*
     * Backward-compatible aliases
     */
    register,
    signup: registerVendor,

    logout,
  };

  return (
    <VendorAuthContext.Provider value={value}>
      {children}
    </VendorAuthContext.Provider>
  );
};

/*
 * ---------------------------------------------------------
 * HOOK
 * ---------------------------------------------------------
 */
export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);

  if (!context) {
    throw new Error("useVendorAuth must be used within a VendorAuthProvider");
  }

  return context;
};
