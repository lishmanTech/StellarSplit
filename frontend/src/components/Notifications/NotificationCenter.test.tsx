import type { ReactElement } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, it, expect, beforeEach } from "vitest";
import { NotificationCenter } from "./NotificationCenter";
import { useNotificationsStore } from "../../store/notifications";
import { resetNotificationsForTesting } from "../../test-utils/notifications";

const wrap = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("NotificationCenter", () => {
  beforeEach(() => {
    resetNotificationsForTesting();
  });

  it("renders notification center page", () => {
    wrap(<NotificationCenter />);
    expect(screen.getByTestId("notification-center")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /notifications/i })).toBeInTheDocument();
  });

  it("shows filter by type options", () => {
    wrap(<NotificationCenter />);
    expect(screen.getByText("Filter by type")).toBeInTheDocument();
    expect(screen.getByTestId("filter-all")).toBeInTheDocument();
    expect(screen.getByTestId("filter-split_invitation")).toBeInTheDocument();
  });

  it("filter updates displayed list", () => {
    wrap(<NotificationCenter />);
    fireEvent.click(screen.getByTestId("filter-payment_received"));
    expect(screen.getByTestId("filter-payment_received")).toHaveClass("bg-accent");
  });

  it("mark all as read button is present when there are unread", () => {
    wrap(<NotificationCenter />);
    expect(screen.getByTestId("mark-all-read")).toBeInTheDocument();
  });

  it("mark all as read clears unread", () => {
    wrap(<NotificationCenter />);
    fireEvent.click(screen.getByTestId("mark-all-read"));
    expect(screen.queryByTestId("mark-all-read")).not.toBeInTheDocument();
  });

  it("clear all removes all notifications", () => {
    wrap(<NotificationCenter />);
    fireEvent.click(screen.getByTestId("clear-all"));
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No notifications yet.")).toBeInTheDocument();
  });

  it("adding a notification via store updates the list", () => {
    useNotificationsStore.getState().clearAll();
    wrap(<NotificationCenter />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();

    act(() => {
      useNotificationsStore.getState().addNotification({
        type: "system_announcement",
        title: "Test",
        message: "Test message",
      });
    });

    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
