/**
 * Type-only boundary for `sections.jsx` (unchanged implementation).
 * `renderDocSection` returns the section renderer result, or null when missing.
 */
import type { ReactNode } from "react";

export function renderDocSection(
  sectionId?: string | null
): ReactNode | null;
