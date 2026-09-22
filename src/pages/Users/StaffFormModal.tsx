import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import { usersService } from "@/services/users.service";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import type { User } from "@/types";
import {
  ROLE_OPTIONS,
  emptyStaffErrors,
  emptyStaffForm,
  formFromUser,
  validatePassword,
  type StaffFormData,
  type StaffFormErrors,
  type StaffRole,
} from "./types";

type StaffFormModalProps = {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
};

export function StaffFormModal({
  open,
  user,
  onClose,
  onSaved,
}: StaffFormModalProps) {
  const isEdit = !!user;

  const [formData, setFormData] = useState<StaffFormData>(emptyStaffForm);
  const [errors, setErrors] = useState<StaffFormErrors>(emptyStaffErrors);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors(emptyStaffErrors);
    setShowPassword(false);
    setFormData(user ? formFromUser(user) : emptyStaffForm);
  }, [open, user]);

  const validateField = (field: keyof StaffFormErrors, value: string) => {
    setErrors((prev) => {
      const next = { ...prev };

      if (field === "fullName") {
        next.fullName = value.trim() ? "" : "Full name is required";
      }

      if (field === "email") {
        if (!value.trim()) next.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(value))
          next.email = "Please enter a valid email";
        else next.email = "";
      }

      if (field === "password") {
        // Create: required. Edit: optional — validate only when filled.
        next.password = validatePassword(value, !isEdit);
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim()) {
      validateField("fullName", formData.fullName);
      validateField("email", formData.email);
      return;
    }

    if (!isEdit) {
      const pwdErr = validatePassword(formData.password, true);
      if (pwdErr) {
        setErrors((p) => ({ ...p, password: pwdErr }));
        toast.error(
          "Please enter a valid password (min 8 characters, one lowercase).",
        );
        return;
      }
    } else if (formData.password) {
      const pwdErr = validatePassword(formData.password, false);
      if (pwdErr) {
        setErrors((p) => ({ ...p, password: pwdErr }));
        toast.error(
          "New password must be at least 8 characters and include one lowercase letter.",
        );
        return;
      }
    }

    try {
      setSaving(true);

      if (!isEdit) {
        await usersService.createUser({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || null,
          password: formData.password,
          role: formData.role,
        });
        toast.success("New staff account created successfully!");
      } else {
        const userId = Number(user!.id);
        if (!userId) {
          toast.error(
            "Cannot update staff: missing user id. Refresh the list and try again.",
          );
          return;
        }

        const payload: Record<string, unknown> = {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber?.trim() || null,
          role: formData.role,
          isActive: user!.isActive,
        };

        const newPassword = formData.password.trim();
        if (newPassword) {
          payload.password = newPassword;
        }

        await usersService.updateUser(userId, payload);
        toast.success(
          newPassword
            ? "Staff updated and password changed successfully!"
            : "Staff information updated successfully!",
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        "Failed to save staff.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell
      open={open}
      title={isEdit ? "Edit Staff Member" : "Add New Staff"}
      description="Create or update staff access and profile details."
      onClose={onClose}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection
          title="Profile details"
          description="This information appears in staff lists and account summaries."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Full name"
              description="Shown throughout the admin workspace."
              error={errors.fullName || undefined}
            >
              <Input
                placeholder="Maria Santos"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  validateField("fullName", e.target.value);
                }}
                className={errors.fullName ? "border-red-500" : ""}
                required
              />
            </FormField>

            <FormField
              label="Email address"
              description="Used for login and notifications."
              error={errors.email || undefined}
            >
              <Input
                type="email"
                placeholder="staff@streetpos.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  validateField("email", e.target.value);
                }}
                className={errors.email ? "border-red-500" : ""}
                required
                disabled={isEdit}
              />
            </FormField>
          </div>

          <FormField
            label="Phone number"
            description="Optional contact number for shift coordination."
          >
            <Input
              placeholder="0917 123 4567"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Access level"
          description="Choose the role that matches the employee's responsibilities."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {ROLE_OPTIONS.map((role: StaffRole) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, role })}
                className={`rounded-3xl border p-4 text-left transition-all ${
                  formData.role === role
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{role}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {role === "Admin"
                        ? "Full system access"
                        : role === "Manager"
                          ? "Operations and inventory"
                          : "POS-only access"}
                    </p>
                  </div>
                  {formData.role === role ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection
          title="Security"
          description={
            isEdit
              ? "Leave blank to keep the current password. Fill in only if you want to set a new one."
              : "Create the initial password for the new staff account."
          }
        >
          <FormField
            label={isEdit ? "New password" : "Password"}
            description="Minimum 8 characters and at least one lowercase letter."
            error={errors.password || undefined}
          >
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={
                  isEdit
                    ? "Leave blank to keep current password"
                    : "Enter a secure password"
                }
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  validateField("password", e.target.value);
                }}
                className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                required={!isEdit}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>
        </FormSection>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving
              ? "Saving…"
              : isEdit
                ? "Update staff"
                : "Create staff"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}