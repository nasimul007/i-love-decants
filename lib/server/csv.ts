/** CSV download (opens in Excel / Google Sheets). Cells that start with = + - @ are prefixed with ' so a spreadsheet never runs them as formulas. */
export function csvResponse(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = "\uFEFF" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n"); // BOM: Excel reads UTF-8 (৳, Bangla names) correctly
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" },
  });
}

