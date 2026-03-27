import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, it, expect, beforeEach } from "vitest";
import { NotificationDropdown } from "./NotificationDropdown";
import { resetNotificationsForTesting } from "../../test-utils/notifications";

const wrap = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("NotificationDropdown", () => {
  beforeEach(() => {
    resetNotificationsForTesting();
  });

  it("renders dropdown with notifications list", () => {
    wrap(<NotificationDropdown />);
    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("shows Mark all as read when there are unread", () => {
    wrap(<NotificationDropdown />);
    expect(screen.getByRole("button", { name: /mark all as read/i })).toBeInTheDocument();
  });

  it("mark all as read clears unread state", () => {
    wrap(<NotificationDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }));
    expect(screen.queryByRole("button", { name: /mark all as read/i })).not.toBeInTheDocument();
  });

  it("shows View all notifications when there are many items", () => {
    wrap(<NotificationDropdown maxItems={2} />);
    expect(screen.getByText("View all notifications")).toBeInTheDocument();
  });
});
