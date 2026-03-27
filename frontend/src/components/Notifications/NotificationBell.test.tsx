import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, it, expect, beforeEach } from "vitest";
import { NotificationBell } from "./NotificationBell";
import { resetNotificationsForTesting } from "../../test-utils/notifications";

const wrap = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("NotificationBell", () => {
  beforeEach(() => {
    resetNotificationsForTesting();
  });

  it("renders bell icon", () => {
    wrap(<NotificationBell />);
    const bell = screen.getByTestId("notification-bell");
    expect(bell).toBeInTheDocument();
  });

  it("shows badge count when there are unread notifications", () => {
    wrap(<NotificationBell />);
    const badge = screen.getByTestId("notification-badge");
    expect(badge).toBeInTheDocument();
    expect(Number(badge.textContent)).toBeGreaterThan(0);
  });

  it("opens dropdown when bell is clicked", () => {
    wrap(<NotificationBell />);
    fireEvent.click(screen.getByTestId("notification-bell"));
    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
  });

  it("dropdown shows notification list", () => {
    wrap(<NotificationBell />);
    fireEvent.click(screen.getByTestId("notification-bell"));
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });
});
