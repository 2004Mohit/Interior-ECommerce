import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const VendorAuthContext = createContext(null);

const VENDOR_LOGIN_PATH = "/vendor/login";
const VENDOR_CALLBACK_PATH = "/vendor/auth/callback";

export const VendorAuthProvider = ({ children }) => {
  const [vendorUser, setVendorUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Failed to get vendor session:", sessionError);

          if (mounted) {
            setVendorUser(null);
          }

          return;
        }

        if (mounted) {
          const authUser = session?.user ?? null;

          const accountType =
            authUser?.user_metadata?.account_type ||
            authUser?.user_metadata?.accountType;

          if (authUser && accountType === "VENDOR") {
            setVendorUser(authUser);
          } else {
            setVendorUser(null);
          }
        }
      } catch (err) {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const authUser = session?.user ?? null;

      if (!authUser) {
        setVendorUser(null);
        return;
      }

      const accountType =
        authUser.user_metadata?.account_type ||
        authUser.user_metadata?.accountType;

      // Only treat VENDOR accounts as vendor-authenticated users.
      if (accountType === "VENDOR") {
        setVendorUser(authUser);
      } else {
        setVendorUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Vendor login
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

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        throw signInError;
      }

      const authUser = data?.user;

      if (!authUser?.id) {
        const err = new Error(
          "Unable to identify the authenticated vendor account.",
        );

        setError(err.message);
        throw err;
      }

      /*
       * Make sure this account is actually a vendor account.
       *
       * Vendor registration sets account_type=VENDOR in user metadata.
       */
      const accountType =
        authUser.user_metadata?.account_type ||
        authUser.user_metadata?.accountType;

      if (accountType && accountType !== "VENDOR") {
        await supabase.auth.signOut();

        const err = new Error(
          "This account is not registered as a vendor account. Please use the customer login.",
        );

        setError(err.message);
        throw err;
      }

      setVendorUser(authUser);

      return {
        user: authUser,
        session: data.session,
      };
    } catch (err) {
      console.error("Vendor login failed:", err);
      setError(err?.message || "Vendor login failed.");
      throw err;
    }
  };

  /**
   * Vendor registration
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
      const err = new Error("Please enter your email address.");
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
       * IMPORTANT:
       * Send the user to the vendor-specific callback after
       * email verification.
       *
       * Never use the normal customer dashboard as the email
       * confirmation destination.
       */
      const redirectUrl = `${window.location.origin}${VENDOR_CALLBACK_PATH}`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,

          /*
           * These values are stored in auth.users.user_metadata.
           * They are useful before vendor_profiles exists.
           */
          data: {
            business_name: cleanBusinessName,
            contact_person: cleanContactPerson,
            account_type: "VENDOR",
            registration_source: "VENDOR_PORTAL",
          },
        },
      });

      if (signUpError) {
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
       * With email confirmation enabled, Supabase normally returns
       * a user but no active session.
       *
       * Do NOT redirect to dashboard here.
       */
      setVendorUser(data?.session ? authUser : null);

      return {
        user: authUser,
        session: data?.session ?? null,
        needsEmailConfirmation: !data?.session,
      };
    } catch (err) {
      console.error("Vendor registration failed:", err);
      setError(err?.message || "Vendor registration failed.");
      throw err;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
        throw signOutError;
      }

      setVendorUser(null);
    } catch (err) {
      console.error("Vendor logout failed:", err);
      throw err;
    }
  };

  /**
   * Handle the temporary session created by the
   * Supabase email verification link.
   *
   * The vendor should NOT remain logged into the customer
   * portal after clicking the verification link.
   */
  const completeVendorEmailVerification = async () => {
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      /*
       * Verification has already happened by the time the
       * callback page is reached.
       *
       * We intentionally sign out the temporary session.
       * The user will then explicitly sign in through
       * /vendor/login.
       */
      if (session) {
        await supabase.auth.signOut();
      }

      setVendorUser(null);

      return true;
    } catch (err) {
      console.error("Vendor email verification callback failed:", err);

      setError(err?.message || "Email verification could not be completed.");

      throw err;
    }
  };

  const value = {
    vendorUser,
    user: vendorUser,
    loading,
    error,

    login,
    loginVendor: login,

    registerVendor,

    /*
     * Backward compatibility for components that may still
     * reference register/signup.
     */
    register: registerVendor,
    signup: registerVendor,

    logout,

    completeVendorEmailVerification,
  };

  return (
    <VendorAuthContext.Provider value={value}>
      {children}
    </VendorAuthContext.Provider>
  );
};

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);

  if (!context) {
    throw new Error("useVendorAuth must be used within a VendorAuthProvider");
  }

  return context;
};
