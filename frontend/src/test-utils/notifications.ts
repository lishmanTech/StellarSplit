import type { Notification } from "../types/notifications";
import { useNotificationsStore } from "../store/notifications";

/**
 * Demo notifications for tests only. Not shipped to production bundle when
 * tests are excluded.
 */
export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "demo-0",
    type: "split_invitation",
    title: "Split invitation",
    message: "Alex invited you to split \"Weekend dinner\".",
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    actionUrl: "/split/1",
  },
  {
    id: "demo-1",
    type: "payment_reminder",
    title: "Payment reminder",
    message: "You have a pending payment of $25.00 for \"Team lunch\".",
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    actionUrl: "/split/2",
  },
  {
    id: "demo-2",
    type: "payment_received",
    title: "Payment received",
    message: "Jordan paid $15.00 for \"Coffee run\".",
    read: true,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "demo-3",
    type: "split_completed",
    title: "Split completed",
    message: "\"Trip to the beach\" has been settled.",
    read: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    actionUrl: "/split/3",
  },
  {
    id: "demo-4",
    type: "friend_request",
    title: "Friend request",
    message: "Sam wants to add you as a friend.",
    read: true,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    actionUrl: "/friends",
  },
  {
    id: "demo-5",
    type: "system_announcement",
    title: "New feature",
    message: "Multi-currency splits are now available.",
    read: false,
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
];

/**
 * Reset notifications store to demo state. For use in tests only; not part of
 * production store API.
 */
export function resetNotificationsForTesting(): void {
  useNotificationsStore.setState({
    notifications: DEMO_NOTIFICATIONS.map((n) => ({ ...n })),
    typeFilter: "all",
  });
}
