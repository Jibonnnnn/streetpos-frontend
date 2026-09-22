import type { User } from "@/types";

export type StaffRole = "Admin" | "Manager" | "Cashier";

export type StaffFormData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: StaffRole;
  password: string;
};

export type StaffFormErrors = {
  fullName: string;
  email: string;
  password: string;
};

export const ROLE_OPTIONS: StaffRole[] = ["Cashier", "Manager", "Admin"];

export const emptyStaffForm: StaffFormData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  role: "Cashier",
  password: "",
};

export const emptyStaffErrors: StaffFormErrors = {
  fullName: "",
  email: "",
  password: "",
};

export function formFromUser(user: User): StaffFormData {
  return {
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    role: user.role,
    password: "",
  };
}

/** Matches Identity rules in Program.cs: min 8 chars, at least one lowercase. */
export function validatePassword(
  value: string,
  required: boolean,
): string {
  if (!value) {
    return required ? "Password is required" : "";
  }
  if (value.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[a-z]/.test(value)) {
    return "Password must contain at least one lowercase letter";
  }
  return "";
}
