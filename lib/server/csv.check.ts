// Run: npx tsx lib/server/csv.check.ts — UTF-8 BOM for Excel; formula cells neutralised; quotes, commas and newlines escaped.
import assert from "node:assert";
import { csvResponse } from "./csv";

void csvResponse("x.csv", ["a", "b"], [["=HYPERLINK(1)", 'say "hi", ok'], ["line\nbreak", 5], ["-5", null]]).arrayBuffer().then((buf) => {
  const b = new Uint8Array(buf);
  assert.deepEqual([...b.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(new TextDecoder().decode(b.slice(3)), 'a,b\r\n\'=HYPERLINK(1),"say ""hi"", ok"\r\n"line\nbreak",5\r\n\'-5,');
  console.log("csv: all checks passed");
});
