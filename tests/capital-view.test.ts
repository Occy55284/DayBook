import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CapitalView from "../components/CapitalView";
import type { CapitalEntry } from "../lib/store";

const entries: CapitalEntry[] = [
  { id: "a", date: "2026-10-01", kind: "start", amount: 1234.5, note: "" },
  { id: "b", date: "2026-10-02", kind: "bonus", amount: 321, note: "secret bonus note" },
  { id: "c", date: "2026-11-03", kind: "withdrawal", amount: 77, note: "" },
];
const render = (props: { hidden?: boolean; entries?: CapitalEntry[] }) =>
  renderToStaticMarkup(
    createElement(CapitalView, {
      entries: props.entries ?? entries, net: 456.78, today: new Date(2026, 10, 17),
      onAdd: async () => null, onRemove: () => {}, hidden: props.hidden, onToggleHidden: () => {},
    })
  );

describe("CapitalView", () => {
  it("shows the figures normally, with a Hide button", () => {
    const html = render({ hidden: false });
    expect(html).toContain("+37.0%");            // 456.78 / 1234.50
    expect(html).toContain("£456.78");
    expect(html).toContain("£1,234.50");
    expect(html).toContain("Hide");
  });

  it("when hidden, not one figure is on the page", () => {
    const html = render({ hidden: true });
    for (const secret of ["37.0", "456", "1,234", "321", "£77", "balance", "Balance", "bonus", "secret", "2026-10", "Add capital", "History"]) {
      expect(html, `"${secret}" should not appear while hidden`).not.toContain(secret);
    }
    expect(html).toContain("••••••");
    expect(html).toContain("Show");
    expect(html).toContain("Hidden");
  });

  it("when hidden, the button says Show and is marked as pressed", () => {
    const html = render({ hidden: true });
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Show return on your money"');
    expect(render({ hidden: false })).toContain('aria-label="Hide return on your money"');
  });

  it("with nothing entered yet there is nothing to hide, so no button", () => {
    for (const hidden of [true, false]) {
      const html = render({ hidden, entries: [] });
      expect(html).not.toContain("Hide return");
      expect(html).not.toContain("Show return");
      expect(html).toContain("Add capital");
    }
  });
});
