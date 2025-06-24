# Scheduled Notifications System

This system provides automated notifications for study planning and tracking, specifically designed for Chilean timezone (America/Santiago).

## 📅 Schedule Overview

### 1. Weekly Summary (Mondays at 8:00 AM)
- **Trigger**: Every Monday at 8:00 AM Chilean time
- **Content**: Summary of upcoming assignments and study plans for the week
- **Audience**: All active users with study plans or assignments

### 2. Daily Study Plan (Tuesday-Sunday at 8:00 AM)
- **Trigger**: Tuesday through Sunday at 8:00 AM Chilean time
- **Content**: Today's study plans and recommended hours
- **Audience**: Users with study plans for the current day

### 3. Daily Tracking Reminder (Daily at 2:00 PM)
- **Trigger**: Every day at 2:00 PM Chilean time
- **Content**: Reminder to update studied hours with progress tracking
- **Audience**: All active users

## 🔧 Technical Implementation

### Vercel Cron Jobs
The system uses Vercel's cron jobs with the following schedule:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-summary",
      "schedule": "0 11 * * 1"
    },
    {
      "path": "/api/cron/daily-study-plan",
      "schedule": "0 11 * * 2-7"
    },
    {
      "path": "/api/cron/tracking-reminder",
      "schedule": "0 17 * * *"
    }
  ]
}
```

**Note**: The cron schedule is in UTC. Chilean time (CLT/CLST) is UTC-3/UTC-4, so:
- 8 AM Chilean time = 11 AM UTC (during standard time)
- 2 PM Chilean time = 5 PM UTC (during standard time)

### API Endpoints

#### Weekly Summary
- **Endpoint**: `/api/cron/weekly-summary`
- **Method**: POST
- **Authentication**: Bearer token with `CRON_SECRET`
- **Functionality**: Creates weekly summary notifications for all active users

#### Daily Study Plan
- **Endpoint**: `/api/cron/daily-study-plan`
- **Method**: POST
- **Authentication**: Bearer token with `CRON_SECRET`
- **Functionality**: Creates daily study plan notifications (excludes Mondays)

#### Tracking Reminder
- **Endpoint**: `/api/cron/tracking-reminder`
- **Method**: POST
- **Authentication**: Bearer token with `CRON_SECRET`
- **Functionality**: Creates daily tracking reminder notifications

## 📧 Email Content (Spanish)

### Weekly Summary Email
```
Subject: 📅 Resumen Semanal - Lunes

¡Buenos días! 🌅

Aquí tienes tu resumen semanal:

📋 Tareas próximas esta semana:
• [Assignment Title] ([Course Name]) - [Due Date]
• ...

📚 Planes de estudio esta semana:
• [Number] sesiones planificadas
• Total de horas recomendadas: [X]h

**Lunes:**
  • [Course Name] - [X]h
**Martes:**
  • [Course Name] - [X]h
...

¡Que tengas una excelente semana de estudios! 💪
```

### Daily Study Plan Email
```
Subject: 📚 Plan de Estudio Diario

¡Buenos días! 🌅

Tu plan de estudio para [Day]:

📚 [X] sesiones planificadas ([X]h total):

1. **[Course Name]**
   ⏱️ [X] horas recomendadas
   ✅ Ya estudiaste: [X]h

💡 Consejos para hoy:
• Divide tu tiempo de estudio en bloques de 25-50 minutos
• Toma descansos de 5-10 minutos entre bloques
• Recuerda registrar tus horas estudiadas a las 2 PM

¡Mucho éxito en tus estudios hoy! 🎯
```

### Tracking Reminder Email
```
Subject: ⏱️ Recordatorio de Seguimiento

¡Hora de actualizar tu progreso! ⏰

📊 Resumen de tu día:
• Horas planificadas: [X]h
• Horas registradas: [X]h
• Horas restantes: [X]h

🎯 ¡Aún puedes aprovechar [X] horas más hoy!

Cursos pendientes:
• [Course Name]: [X]h restantes
• ...

📱 ¿Cómo registrar tu tiempo?
1. Ve a la sección de Seguimiento
2. Actualiza las horas estudiadas para cada materia
3. ¡Eso es todo!

¡Sigue así! 💪
```

## 🧪 Testing

### Manual Testing Endpoints

#### Test Scheduled Notifications
```bash
# Test weekly summary
curl -X POST http://localhost:3001/api/test/scheduled-notifications \
  -H "Content-Type: application/json" \
  -d '{"type": "weekly"}'

# Test daily study plan
curl -X POST http://localhost:3001/api/test/scheduled-notifications \
  -H "Content-Type: application/json" \
  -d '{"type": "daily"}'

# Test tracking reminder
curl -X POST http://localhost:3001/api/test/scheduled-notifications \
  -H "Content-Type: application/json" \
  -d '{"type": "tracking"}'
```

#### Test Cron Endpoints (requires CRON_SECRET)
```bash
# Test weekly summary cron
curl -X POST http://localhost:3001/api/cron/weekly-summary \
  -H "Authorization: Bearer your_cron_secret"

# Test daily study plan cron
curl -X POST http://localhost:3001/api/cron/daily-study-plan \
  -H "Authorization: Bearer your_cron_secret"

# Test tracking reminder cron
curl -X POST http://localhost:3001/api/cron/tracking-reminder \
  -H "Authorization: Bearer your_cron_secret"
```

## ⚙️ Configuration

### Environment Variables
```bash
# Required for cron job authentication
CRON_SECRET=your_random_cron_secret_here

# Required for email delivery
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourapp.vercel.app
```

### User Identification
Currently, the system identifies active users based on:
- Users who have study plans in the last 30 days
- Study plans contain a `userId` field for targeting

## 🔄 Data Flow

1. **Cron Trigger**: Vercel triggers the cron job at scheduled time
2. **Authentication**: Endpoint verifies `CRON_SECRET`
3. **Timezone Check**: Converts to Chilean time and validates day/time
4. **User Query**: Fetches active users from database
5. **Data Aggregation**: Gathers relevant assignments, study plans, and progress
6. **Content Generation**: Creates personalized Spanish messages
7. **Notification Creation**: Creates notifications in database with email delivery
8. **Email Sending**: Resend delivers beautiful HTML emails
9. **Status Tracking**: Records success/failure for retry logic

## 📊 Monitoring

### Success Metrics
- Number of notifications created per cron job
- Email delivery success rates
- User engagement with tracking reminders

### Error Handling
- Failed notifications are retried automatically
- Cron jobs include error logging and status responses
- Timezone validation prevents incorrect triggers

## 🚀 Deployment

1. **Set Environment Variables** in Vercel dashboard
2. **Deploy Application** with `vercel.json` cron configuration
3. **Verify Cron Jobs** are active in Vercel dashboard
4. **Test Email Delivery** using test endpoints
5. **Monitor Logs** for successful execution

## 📝 Notes

- All content is in Spanish for Chilean users
- Times are automatically adjusted for Chilean timezone
- System gracefully handles users with no data
- Email templates are responsive and professional
- Failed notifications are retried via existing cron job
- Active user detection based on recent study plan activity
