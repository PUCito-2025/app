import { Resend } from "resend";

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

class EmailService {
  private static readonly DEFAULT_FROM = process.env.FROM_EMAIL || "noreply@yourdomain.com";

  /**
   * Send a single email
   */
  static async sendEmail(options: SendEmailOptions) {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: options.from || this.DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html || "",
      text: options.text || "",
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  }

  /**
   * Send notification email
   */
  static async sendNotificationEmail(userEmail: string, title: string, message: string, notificationType: string) {
    const template = this.getNotificationTemplate(title, message, notificationType);

    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Generate email template for notifications
   */
  private static getNotificationTemplate(title: string, message: string, type: string): EmailTemplate {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f4f4f4;
               font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;
                border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${title}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">
                Notificación de tu plataforma de estudios
              </p>
            </div>

            <div style="padding: 30px;">
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea;
                    padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px;">${message}</p>
              </div>

              <div style="margin: 20px 0;">
                <span style="background-color: #e3f2fd; color: #1976d2;
                      padding: 6px 12px; border-radius: 20px; font-size: 12px;
                      font-weight: 500; text-transform: uppercase;">
                  ${this.getTypeLabel(type)}
                </span>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                         color: white; padding: 14px 28px; text-decoration: none;
                         border-radius: 6px; font-weight: 500; display: inline-block;">
                  Ver en la plataforma
                </a>
              </div>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; text-align: center;
                  border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                Esta es una notificación automática de tu plataforma de estudios.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${title}

${message}

Tipo de notificación: ${this.getTypeLabel(type)}

Visita tu plataforma: ${siteUrl}

---
Esta es una notificación automática de tu plataforma de estudios.
    `.trim();

    return {
      subject: title,
      html,
      text,
    };
  }

  /**
   * Get human-readable label for notification type
   */
  private static getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      STUDY_PLAN: "Plan de Estudio",
      ASSIGNMENT: "Tarea",
      REMINDER: "Recordatorio",
      DEADLINE_WARNING: "Alerta de Fecha Límite",
      COURSE_UPDATE: "Actualización de Curso",
    };

    return labels[type] || type;
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(userEmail: string, userName: string) {
    const template = this.getWelcomeTemplate(userName);

    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Generate welcome email template
   */
  private static getWelcomeTemplate(userName: string): EmailTemplate {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>¡Bienvenido a tu plataforma de estudios!</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f4f4f4;
               font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;
                border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white; padding: 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600;">¡Bienvenido, ${userName}!</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">
                Tu plataforma de estudios está lista
              </p>
            </div>

            <div style="padding: 40px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                ¡Nos emociona tenerte a bordo! Tu cuenta ha sido creada exitosamente
                y ya puedes comenzar a organizar tus estudios de manera más eficiente.
              </p>

              <h2 style="color: #667eea; font-size: 20px; margin: 30px 0 15px 0;">
                ¿Qué puedes hacer ahora?
              </h2>

              <ul style="padding-left: 20px; margin-bottom: 30px;">
                <li style="margin-bottom: 10px;">📚 Organizar tus cursos y materias</li>
                <li style="margin-bottom: 10px;">📅 Crear planes de estudio personalizados</li>
                <li style="margin-bottom: 10px;">⏰ Recibir recordatorios importantes</li>
                <li style="margin-bottom: 10px;">📊 Monitorear tu progreso académico</li>
                <li style="margin-bottom: 10px;">🔔 Gestionar tus notificaciones</li>
              </ul>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${siteUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                         color: white; padding: 16px 32px; text-decoration: none;
                         border-radius: 6px; font-weight: 500; display: inline-block;
                         font-size: 16px;">
                  Comenzar ahora
                </a>
              </div>

              <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
              </p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; text-align: center;
                  border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                Gracias por unirte a nuestra plataforma de estudios.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
¡Bienvenido, ${userName}!

Tu plataforma de estudios está lista. Nos emociona tenerte a bordo!

¿Qué puedes hacer ahora?
- Organizar tus cursos y materias
- Crear planes de estudio personalizados
- Recibir recordatorios importantes
- Monitorear tu progreso académico
- Gestionar tus notificaciones

Comienza ahora: ${siteUrl}

Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
    `.trim();

    return {
      subject: "¡Bienvenido a tu plataforma de estudios!",
      html,
      text,
    };
  }
}

export default EmailService;
