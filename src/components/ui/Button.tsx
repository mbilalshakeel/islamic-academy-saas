import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm";
}

/**
 * The one button definition used everywhere (Super Admin, Institute Admin,
 * Public App). Variants map 1:1 onto the design-system proposal: primary
 * (tenant-color filled), secondary (outlined neutral), ghost (text-only),
 * danger (destructive actions only, e.g. delete). Always a 44px min-height
 * touch target (36px for the explicit `sm` size, used inline in tables).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    const variantClass =
      variant === "primary"
        ? "ds-btn-primary"
        : variant === "secondary"
        ? "ds-btn-secondary"
        : variant === "danger"
        ? "ds-btn-danger"
        : "ds-btn-ghost";
    const sizeClass = size === "sm" ? "ds-btn-sm" : "";
    return <button ref={ref} className={`ds-btn ${variantClass} ${sizeClass} ${className}`} {...props} />;
  }
);
Button.displayName = "Button";
