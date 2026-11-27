"use client";

import { useFullBottle, useVolumes } from "@/hooks/useServices";
import { formatRange, formatVolumes } from "@/lib/volumes";
import { useT } from "@/components/providers/PrefsProvider";

/** Renders the admin-controlled size list (volumes + Full bottle while ON) inside otherwise static copy. */
export function VolumeList({ separator = "list" }: { separator?: "list" | "range" | "ml-list" }) {
  const v = useVolumes();
  const full = useFullBottle();
  const t = useT();
  const bottle = full && t("a full bottle ({ml} ml)", { ml: full.ml });
  if (separator === "range") {
    if (!full) return <>{formatRange(v).replace(" to ", t(" to "))}</>;
    return <>{v.length ? `${v[0]} ml${t(" to ")}${bottle}` : bottle}</>;
  }
  if (separator === "ml-list") {
    const items = [...v.map((x) => `${x} ml`), ...(bottle ? [bottle] : [])];
    return <>{items.join(", ").replace(/, ([^,]*)$/, `${t(", or ")}$1`)}</>;
  }
  const list = formatVolumes(v).replace(" & ", t(" & "));
  if (!full) return <>{list}</>;
  return <>{v.length ? t("{list}, plus {bottle}", { list, bottle: bottle as string }) : bottle}</>;
}

/** "Choose from 3 ml, 6 ml … 50 ml, each priced size by size." in the visitor's language. */
export function SizesAvailable() {
  const t = useT();
  return <>{t("Choose from")} <VolumeList />{t(", each priced size by size.")}</>;
}
