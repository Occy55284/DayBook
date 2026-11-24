import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LotView from "../components/LotView";

const today = new Date(2026, 10, 17); // Tue 17 Nov 2026
type P = Partial<Parameters<typeof LotView>[0]>;
const render = (p: P = {}) =>
  renderToStaticMarkup(createElement(LotView, {
    balance: 2149.3, avg: { perDay: 35, days: 20 }, last: { key: "2026-11-16", lot: 0.03 }, today, todayLogged: true, ...p,
  }));

describe("LotView", () => {
  it("shows the lot your balance supports, the step to go and a countdown", () => {
    const html = render();
    expect(html).toContain("0.02");                 // £2,149.30 -> 0.02
    expect(html).toContain("£850.70 to go");        // up to £3,000
    expect(html).toContain("0.03 lots at £3,000.00");
    expect(html).toContain("About 25 trading days"); // 850.70 / 35 = 24.3 -> 25
    expect(html).toContain("last 20 logged days");
  });

  it("flags a last lot above what the balance supports, and approves one within it", () => {
    expect(render({ last: { key: "2026-11-16", lot: 0.03 } })).toContain("Above the 0.02 your balance supports");
    const ok = render({ last: { key: "2026-11-16", lot: 0.02 } });
    expect(ok).toContain("Within your rule");
    expect(ok).not.toContain("Above the");
  });

  it("under £1,000 the rule has not started yet", () => {
    const html = render({ balance: 640 });
    expect(html).toContain("0.00");
    expect(html).toContain("starts at 0.01 lots once the account reaches £1,000.00");
    expect(html).toContain("£360.00 to go");
  });

  it("explains itself when there is no countdown", () => {
    expect(render({ avg: { perDay: -5, days: 8 } })).toContain("no countdown");
    expect(render({ avg: null })).toContain("Log some trading days");
    expect(render({ avg: { perDay: 0.5, days: 20 } })).toContain("More than a year away");
    expect(render({ avg: { perDay: 40, days: 3 } })).toContain("treat it as rough");
  });

  it("asks for a starting balance when no capital has been entered", () => {
    const html = render({ balance: null });
    expect(html).toContain("Add your starting balance");
    expect(html).not.toContain("lots at");
  });

  it("in privacy mode no figure at all is on the page", () => {
    const html = render({ hidden: true });
    const visible = html.replace(/<[^>]*>/g, " ");   // the words on the page, without the styling inside the tags
    expect(visible).not.toMatch(/[0-9]/);
    expect(visible).toContain("••••");
    expect(visible).not.toContain("lots");
  });
});
