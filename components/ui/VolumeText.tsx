"use client";

import { useFullBottle, useVolumes } from "@/hooks/useServices";
import { formatRange, formatVolumes } from "@/lib/volumes";

/** Renders the admin-controlled size list (volumes + Full bottle while ON) inside otherwise static copy. */
export function VolumeList({ separator = "list" }: { separator?: "list" | "range" | "ml-list" }) {
  const v = useVolumes();
  const full = useFullBottle();
  if (separator === "range") {
    if (!full) return <>{formatRange(v)}</>;
    return <>{v.length ? `${v[0]} ml to a full bottle (${full.ml} ml)` : `a full bottle (${full.ml} ml)`}</>;
  }
  if (separator === "ml-list") {
    const items = [...v.map((x) => `${x} ml`), ...(full ? [`a full bottle (${full.ml} ml)`] : [])];
    return <>{items.join(", ").replace(/, ([^,]*)$/, ", or $1")}</>;
  }
  if (!full) return <>{formatVolumes(v)}</>;
  return <>{v.length ? `${formatVolumes(v)}, plus a full bottle (${full.ml} ml)` : `a full bottle (${full.ml} ml)`}</>;
}
