/**
 * GateMate Password Reset & Self-Service Recovery Service
 * Supports role-isolated reset workflows:
 * - CUSTOMER
 * - VENDOR
 * - ADMIN
 */

const RESET_TOKENS_STORAGE_KEY = "gatemate_password_reset_records";
const VENDOR_ACCOUNTS_STORAGE_KEY = "gatemate_vendor_registered_accounts";

export const passwordRecoveryService = {
  /**
   * Generates a password reset session token for an account
   */
  async requestPasswordReset(email, role = "CUSTOMER") {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error("Please enter a valid account email address.");
    }

    if (role === "VENDOR") {
      const accounts = JSON.parse(
        localStorage.getItem(VENDOR_ACCOUNTS_STORAGE_KEY) || "[]",
      );
      const found =
        accounts.find((a) => a.email === cleanEmail) ||
        cleanEmail === "depot@punemegaconstruct.in";
      if (!found) {
        throw new Error(
          "No registered vendor account was found for this email.",
        );
      }
    }

    const resetToken = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const records = JSON.parse(
      localStorage.getItem(RESET_TOKENS_STORAGE_KEY) || "[]",
    );

    records.push({
      email: cleanEmail,
      role,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour validity
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem(RESET_TOKENS_STORAGE_KEY, JSON.stringify(records));

    return {
      success: true,
      email: cleanEmail,
      resetToken,
      message: `A password reset link and verification code have been dispatched to ${cleanEmail}.`,
    };
  },

  /**
   * Resets password using the generated token or verified email
   */
  async resetPassword({ email, newPassword, role = "CUSTOMER" }) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }

    if (role === "VENDOR") {
      const accounts = JSON.parse(
        localStorage.getItem(VENDOR_ACCOUNTS_STORAGE_KEY) || "[]",
      );
      const index = accounts.findIndex((a) => a.email === cleanEmail);

      if (index !== -1) {
        accounts[index].password = newPassword;
        localStorage.setItem(
          VENDOR_ACCOUNTS_STORAGE_KEY,
          JSON.stringify(accounts),
        );
      }
    }

    return {
      success: true,
      message:
        "Password successfully updated! You can now sign in with your new credentials.",
    };
  },
};
