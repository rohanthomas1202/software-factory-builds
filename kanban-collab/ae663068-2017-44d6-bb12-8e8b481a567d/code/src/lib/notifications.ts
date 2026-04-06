/**
 * Notification and email utilities.
 * In MVP, emails are logged to console.
 */

import type { Notification, Invite } from './types';
import { createNotification as createNotificationInStore } from './store';

/**
 * Send an email (logs to console in MVP)
 */
export function sendEmail(to: string, subject: string, body: string): void {
  console.log(`[EMAIL] To: ${to}\nSubject: ${subject}\nBody:\n${body}`);
}

/**
 * Send an invite email
 */
export function sendInviteEmail(
  to: string,
  workspaceName: string,
  inviterName: string,
  inviteUrl: string
): void {
  const subject = `You've been invited to join ${workspaceName} on Kanban Collab`;
  const body = `
Hello,

${inviterName} has invited you to join the workspace "${workspaceName}" on Kanban Collab.

Click the link below to accept your invitation:
${inviteUrl}

This invitation will expire in 7 days.

Best regards,
The Kanban Collab Team
  `.trim();

  sendEmail(to, subject, body);
}

/**
 * Send a notification email
 */
export function sendNotificationEmail(
  to: string,
  notification: Pick<Notification, 'title' | 'message' | 'link'>
): void {
  const subject = `Notification: ${notification.title}`;
  const body = `
${notification.message}

${notification.link ? `View details: ${notification.link}` : ''}

You can manage your notification preferences in the app.

Best regards,
The Kanban Collab Team
  `.trim();

  sendEmail(to, subject, body);
}

/**
 * Send a verification email
 */
export function sendVerificationEmail(
  to: string,
  verificationUrl: string
): void {
  const subject = 'Verify your email for Kanban Collab';
  const body = `
Welcome to Kanban Collab!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Kanban Collab Team
  `.trim();

  sendEmail(to, subject, body);
}

/**
 * Send a password reset email
 */
export function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): void {
  const subject = 'Reset your Kanban Collab password';
  const body = `
You requested to reset your password.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The Kanban Collab Team
  `.trim();

  sendEmail(to, subject, body);
}

/**
 * Format a notification message based on type
 */
export function formatNotificationMessage(
  type: Notification['type'],
  data: Record<string, string>
): { title: string; message: string } {
  switch (type) {
    case 'invite':
      return {
        title: `Invitation to ${data.workspaceName}`,
        message: `${data.inviterName} has invited you to join the workspace "${data.workspaceName}".`,
      };
    case 'mention':
      return {
        title: `You were mentioned in a card`,
        message: `${data.userName} mentioned you in card "${data.cardTitle}".`,
      };
    case 'assignment':
      return {
        title: `You were assigned to a card`,
        message: `${data.userName} assigned you to card "${data.cardTitle}".`,
      };
    case 'due_date':
      return {
        title: `Card due date approaching`,
        message: `Card "${data.cardTitle}" is due soon (${data.dueDate}).`,
      };
    default:
      return {
        title: 'Notification',
        message: 'You have a new notification.',
      };
  }
}

/**
 * Create and send a notification
 */
export function createAndSendNotification(
  notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'>,
  sendEmailNotification = false
): Notification {
  const notification = createNotificationInStore({
    ...notificationData,
    read: false,
  });

  if (sendEmailNotification) {
    // Get user email (in a real app, we'd fetch the user)
    // For MVP, we'll skip the email lookup and just log
    sendNotificationEmail('user@example.com', {
      title: notification.title,
      message: notification.message,
      link: notification.link,
    });
  }

  return notification;
}