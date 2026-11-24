import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/useAuthStore";
import { AppShell } from "./AppShell";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("AppShell doctor navigation", () => {
  afterEach(cleanup);

  beforeEach(() => {
    navigation.pathname = "/";
    useAuthStore.setState({
      token: "test-token",
      user: { public_id: "D-000001", role: "doctor", patient_id: null },
    });
  });

  it("links each section to its own page", () => {
    render(<AppShell>Содержимое</AppShell>);

    expect(screen.getByRole("link", { name: "Обзор" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Пациенты" })).toHaveAttribute("href", "/patients");
    expect(screen.getByRole("link", { name: "Опросник" })).toHaveAttribute("href", "/surveys");
    expect(screen.getByRole("link", { name: "Red flags" })).toHaveAttribute("href", "/red-flags");
  });

  it.each([
    ["/", "Обзор"],
    ["/patients", "Пациенты"],
    ["/patients/patient-id", "Пациенты"],
    ["/surveys", "Опросник"],
    ["/survey/survey-id", "Опросник"],
    ["/red-flags", "Red flags"],
  ])("marks %s as the active section", (pathname, label) => {
    navigation.pathname = pathname;
    render(<AppShell>Содержимое</AppShell>);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  });
});
