// ============================================================
// COMPONENT : LoadingSpinner
// PURPOSE  : Wrapper around the existing Loading component to keep
//            import paths consistent across the codebase.
// ============================================================

import React from "react";
import Loading, { LoadingProps } from "@/components/common/Loading";

/**
 * LoadingSpinner – thin wrapper that forwards all props to the original
 * `Loading` component.  The project imports `LoadingSpinner` in several
 * pages (e.g., RiwayatPage, RiwayatDetailPage).  Creating this file avoids
 * having to rename all imports.
 */
export default function LoadingSpinner(props: LoadingProps) {
  return <Loading {...props} />;
}

