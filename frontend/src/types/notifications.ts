export type NotificationType =
  | "split_invitation"
  | "payment_reminder"
  | "payment_received"
  | "split_completed"
  | "split_cancelled"
  | "friend_request"
  | "system_announcement";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO date
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  split_invitation: "Split invitation",
  payment_reminder: "Payment reminder",
  payment_received: "Payment received",
  split_completed: "Split completed",
  split_cancelled: "Split cancelled",
  friend_request: "Friend request",
  system_announcement: "System announcement",
};
