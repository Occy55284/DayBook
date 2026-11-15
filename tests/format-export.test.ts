import { describe, expect, it } from "vitest";
import { buildCsv, exportFilename } from "../lib/export";
import { money, signed } from "../lib/format";

describe("money is shown in pounds", () => {
  it("uses £ with two decimals and thousands separators", () => {
    expect(money(1234.5)).toBe("£1,234.50");
    expect(money(41.1)).toBe("£41.10");
  });

  it("shows losses with a minus sign in front", () => {
    expect(money(-12.5)).toBe("-£12.50");
  });

  it("never shows -£0.00", () => {
    expect(money(0)).toBe("£0.00");
    expect(money(-0.001)).toBe("£0.00");
    expect(money(0.004)).toBe("£0.00");
  });

  it("signed (for tight spaces) has no symbol", () => {
    expect(signed(41.1)).toBe("+41.10");
    expect(signed(-5)).toBe("-5.00");
  });
});

describe("CSV export", () => {
  it("lists trades and commissions, oldest first, with lot sizes", () => {
    const csv = buildCsv(
      { "2026-11-10": 25.69, "2026-11-09": 41.1 },
      { "2026-11-09": 0.01 },
      { "2026-11-15": 39.89 }
    );
    expect(csv).toBe(
      "date,type,amount,lot_size\n" +
        "2026-11-09,trade,41.1,0.01\n" +
        "2026-11-10,trade,25.69,\n" +
        "2026-11-15,commission,39.89,\n"
    );
  });

  it("puts a trade before a commission on the same date", () => {
    const lines = buildCsv({ "2026-11-15": 3 }, {}, { "2026-11-15": 1 }).trim().split("\n");
    expect(lines[1]).toContain(",trade,");
    expect(lines[2]).toContain(",commission,");
  });

  it("is just the header when there is nothing", () => {
    expect(buildCsv({}, {}, {})).toBe("date,type,amount,lot_size\n");
  });

  it("names the file with today's date", () => {
    expect(exportFilename(new Date(2026, 10, 5))).toBe("daybook-export-2026-11-05.csv");
  });
});
