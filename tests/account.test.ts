import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AccountView from "../components/AccountView";
import { PrivacyProvider } from "../components/Privacy";
import { accountBalance } from "../lib/capital";
import type { CapitalEntry } from "../lib/store";

const e = (kind: CapitalEntry["kind"], amount: number): CapitalEntry => ({ id: kind + amount, date: "2026-10-01", kind, amount, note: "" });
const visible = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

describe("accountBalance: the total value of the account", () => {
  const trades = { "2026-11-02": 100, "2026-11-03": -20 };
  const commissions = { "2026-11-08": 24 };

  it("is unknown (null) until some capital has been entered", () => {
    expect(accountBalance([], trades, commissions)).toBeNull();
  });

  it("is own money + bonus + profit after commission - withdrawals", () => {
    const entries = [e("start", 1000), e("deposit", 500), e("bonus", 100), e("withdrawal", 150)];
    expect(accountBalance(entries, trades, commissions)).toBe(1000 + 500 + 100 - 150 + (100 - 20 - 24));
  });

  it("can fall below the money put in, and below zero", () => {
    expect(accountBalance([e("start", 1000)], { "2026-11-02": -300 }, {})).toBe(700);
    expect(accountBalance([e("start", 100)], { "2026-11-02": -300 }, {})).toBe(-200);
  });
});

describe("AccountView", () => {
  it("shows the value with its label", () => {
    const text = visible(renderToStaticMarkup(createElement(AccountView, { balance: 2299.3 })));
    expect(text).toContain("Account value");
    expect(text).toContain("£2,299.30");
  });

  it("shows a loss-making total in the loss colour", () => {
    const html = renderToStaticMarkup(createElement(AccountView, { balance: -200 }));
    expect(html).toContain("account-val neg");
    expect(visible(html)).toContain("-£200.00");
  });

  it("without capital it asks for the starting balance instead of showing a number", () => {
    const html = renderToStaticMarkup(createElement(AccountView, { balance: null }));
    expect(visible(html)).toContain("Add your starting balance");
    expect(visible(html)).not.toMatch(/[0-9]/);
    expect(html).toContain('href="/analytics"');
  });

  it("inside the app it starts masked, until the saved privacy choice has been read", () => {
    const html = renderToStaticMarkup(createElement(PrivacyProvider, null, createElement(AccountView, { balance: 2299.3 })));
    expect(visible(html)).not.toMatch(/[0-9]/);
    expect(visible(html)).toContain("£•••••");
  });
});
