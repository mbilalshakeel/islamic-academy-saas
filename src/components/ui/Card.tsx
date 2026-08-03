import { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

/** The one card surface used for content list rows, module tiles, and settings panels. */
export function Card({ interactive = false, className = "", ...props }: CardProps) {
  return <div className={`ds-card ${interactive ? "ds-card-interactive" : ""} ${className}`} {...props} />;
}
