import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it("shows the risk in Russian", () => {
    render(<RiskBadge risk="high" />);
    expect(screen.getByText("Высокий риск")).toBeInTheDocument();
  });

  it("shows a pending state without a result", () => {
    render(<RiskBadge risk={null} />);
    expect(screen.getByText("Ожидает анкеты")).toBeInTheDocument();
  });
});
