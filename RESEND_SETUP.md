# Email Integration with Resend

This application uses Resend for email delivery. Here's how to set it up and use it:

## Setup

1. **Get a Resend API Key**
   - Go to [Resend](https://resend.com)
   - Sign up or log in
   - Navigate to API Keys and create a new key
   - Copy the key (it starts with `re_`)

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Set your Resend API key:
     ```
     RESEND_API_KEY=re_your_actual_api_key_here
     ```
   - Set your from email (must be verified in Resend):
     ```
     FROM_EMAIL=noreply@yourdomain.com
     ```
   - Set your site URL:
     ```
     NEXT_PUBLIC_SITE_URL=http://localhost:3001
     ```

3. **Verify Your Domain (Production)**
   - In Resend dashboard, go to Domains
   - Add and verify your domain
   - Use an email address from your verified domain as `FROM_EMAIL`

## Testing Email Functionality

The application includes several test endpoints:

### Test Direct Email Sending
```bash
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "testType": "direct"
  }'
```

### Test Welcome Email
```bash
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "testType": "welcome"
  }'
```

### Test Full Notification System
```bash
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "testType": "notification"
  }'
```

## Email Templates

The application includes:

- **Notification emails**: Sent when notifications are created with `DeliveryType.EMAIL`
- **Welcome emails**: For new user onboarding
- **Both HTML and plain text versions** for better compatibility

## Usage in Code

### Sending a direct email:
```typescript
import EmailService from '@/lib/email-service';

await EmailService.sendEmail({
  to: 'user@example.com',
  subject: 'Your Subject',
  html: '<p>HTML content</p>',
  text: 'Plain text content'
});
```

### Sending a notification email:
```typescript
await EmailService.sendNotificationEmail(
  'user@example.com',
  'Notification Title',
  'Notification message',
  NotificationType.REMINDER
);
```

### Creating a notification with email delivery:
```typescript
import { NotificationService } from '@/lib/notification-service';
import { DeliveryType, NotificationType } from '@prisma/client';

await NotificationService.create({
  type: NotificationType.REMINDER,
  title: 'Important Reminder',
  message: 'This is your reminder message',
  userId: 'user_123',
  deliveryType: DeliveryType.EMAIL, // This will trigger email sending
});
```

## Error Handling

The email service includes:
- Automatic retry logic for failed emails
- Error logging and tracking
- Graceful degradation when email service is unavailable

## Development vs Production

- **Development**: You can use any email address for testing (emails will still be sent)
- **Production**: You must verify your domain in Resend and use emails from that domain

## Notes

- Emails are sent asynchronously when notifications are created
- Failed emails are retried automatically via the cron job
- Email templates are defined in code (not database) for better version control
- The system supports both in-app notifications and email delivery
