import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithPassword = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUpWithPassword = async (email, password, fullName) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
  };

  const loginWithOtp = async (phone) => {
    return await supabase.auth.signInWithOtp({ phone });
  };

  const verifyOtp = async (phone, token) => {
    return await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithPassword,
        signUpWithPassword,
        loginWithOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useCartAuth = () => useContext(AuthContext);
export const useAuth = () => useContext(AuthContext);
