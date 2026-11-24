import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeFmt } from "../lib/privacy";
import { money, moneyParts, signed } from "../lib/format";
import { pctText } from "../lib/capital";
import Money from "../components/Money";

describe("makeFmt", () => {
  it("when not hidden it is exactly the normal formatting", () => {
    const f = makeFmt(false);
    expect(f.money(1234.5)).toBe(money(1234.5));
    expect(f.signed(-12.5)).toBe(signed(-12.5));
    expect(f.pct(46.6)).toBe(pctText(46.6));
    expect(f.parts(1234.5)).toEqual(moneyParts(1234.5));
    expect(f.plainPct(30.4)).toBe("30%");
    expect(f.moneyCompact(1000)).toBe("£1,000");
    expect(f.moneyCompact(1250.5)).toBe("£1,250.50");
  });

  it("when hidden, no digit survives in any output, for any amount", () => {
    const f = makeFmt(true);
    for (const n of [0, 5, -5, 74.35, -18.4, 1234.5, 987654.32, 1000]) {
      for (const out of [f.money(n), f.moneyCompact(n), f.signed(n), f.pct(n), f.plainPct(n), JSON.stringify(f.parts(n))]) {
        expect(out, `${n} -> ${out}`).not.toMatch(/[0-9]/);
      }
    }
  });

  it("when hidden, amounts still look like amounts (symbol and dots), and a sign stays on the small cell figures", () => {
    const f = makeFmt(true);
    expect(f.money(100)).toBe("£•••••");
    expect(f.signed(5)).toBe("+•••");
    expect(f.signed(-5)).toBe("-•••");
    expect(f.pct(12)).toBe("••••");
    expect(f.plainPct(30)).toBe("••%");
  });
});

describe("Money (the big totals)", () => {
  it("shows the real amount when not in privacy mode", () => {
    expect(renderToStaticMarkup(createElement(Money, { value: 1234.5 }))).toContain("£1,234<span class=\"pence\">.50</span>");
  });
});
