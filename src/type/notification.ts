export interface Notification {
  id: number;
  recipientId: number;
  recipientRole: 'CUSTOMER' | 'OWNER';
  type: string;
  title: string;
  message: string;
  reservationId?: number;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  isSent: boolean;
  sentAt: string;
  createdAt: string;
  expiresAt?: string;
}
