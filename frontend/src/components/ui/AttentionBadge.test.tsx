import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AttentionBadge } from "./AttentionBadge";

describe("AttentionBadge", () => {
  it("shows a red flag alert", () => {
    render(<AttentionBadge attention />);
    expect(screen.getByText("Есть red flags")).toBeInTheDocument();
  });

  it("shows a pending state without a result", () => {
    render(<AttentionBadge attention={null} />);
    expect(screen.getByText("Ожидает анкеты")).toBeInTheDocument();
  });
});
