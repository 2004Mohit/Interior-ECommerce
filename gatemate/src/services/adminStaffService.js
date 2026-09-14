import { supabase } from "../lib/supabaseClient";

export const adminStaffService = {
  /**
   * Fetches list of all platform admin staff members
   */
  async getStaffMembers() {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Creates a new admin staff member with initial login credentials
   */
  async createStaffMember({ email, password, fullName }) {
    const { data, error } = await supabase.rpc("admin_create_staff_member", {
      p_email: email.trim().toLowerCase(),
      p_password: password,
      p_full_name: fullName.trim(),
    });

    if (error) throw error;
    return data;
  },

  /**
   * Toggles active status of an admin account
   */
  async toggleStaffStatus(adminId, isActive) {
    const { data, error } = await supabase
      .from("admin_users")
      .update({ is_active: isActive })
      .eq("id", adminId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
