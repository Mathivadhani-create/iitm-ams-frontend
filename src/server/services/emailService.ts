import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const user = process.env.SMTP_USERNAME;
      const pass = process.env.SMTP_PASSWORD;

      if (host && user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });
        console.log(`[EmailService] SMTP transporter initialized for ${host}:${port}`);
      } else {
        console.log(`[EmailService] SMTP credentials not fully specified. Ready for production configuration.`);
      }
    } catch (err) {
      console.warn(`[EmailService] Non-fatal initialization warning:`, err);
      this.transporter = null;
    }
  }

  public isEmailEnabled(): boolean {
    return process.env.ENABLE_EMAIL === 'true' && this.transporter !== null;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const from = process.env.SMTP_FROM || 'noreply-ams@iitm.ac.in';

    try {
      if (this.isEmailEnabled() && this.transporter) {
        await this.transporter.sendMail({
          from: `IIT Madras AMS <${from}>`,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || `<p>${options.text.replace(/\n/g, '<br>')}</p>`,
        });
        console.log(`[EmailService] SMTP email sent successfully to: ${options.to}`);
        return true;
      } else {
        // Log that email was skipped because email is disabled
        console.log(`[EmailService] Email skipped for ${options.to} because email is disabled (ENABLE_EMAIL=${process.env.ENABLE_EMAIL || 'false'}).`);
        console.log(`[EmailService] Notification Subject: "${options.subject}"`);
        return true;
      }
    } catch (err) {
      // Graceful error logging: Email failure should NEVER crash the main grade transaction or app
      console.error(`[EmailService] Email sending error (gracefully handled):`, err);
      return false;
    }
  }

  async sendGradeNotification(
    studentEmail: string,
    studentName: string,
    courseCode: string,
    courseName: string,
    grade: string
  ): Promise<boolean> {
    const subject = `Your Grade Has Been Published for ${courseCode}`;
    const text = `Dear ${studentName},

Your grade for course ${courseCode} - ${courseName} has been published by the course faculty.

Grade: ${grade}

Please log in to the IIT Madras Academic Management System (IITM AMS) to view your updated transcript and grade record.

Regards,
Academic Section, IIT Madras
https://iitm.ac.in
`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #800000; color: #ffffff; padding: 16px; text-align: center; border-radius: 6px 6px 0 0;">
          <h2 style="margin: 0; font-size: 20px;">IIT Madras Academic Management System</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #333333;">Dear <strong>${studentName}</strong>,</p>
          <p style="font-size: 15px; color: #555555; line-height: 1.5;">
            Your official grade for <strong>${courseCode} - ${courseName}</strong> has been published by the faculty.
          </p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #800000; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; color: #800000;">Grade Awarded: <strong>${grade}</strong></p>
          </div>
          <p style="font-size: 14px; color: #666666;">
            Please log in to your IITM AMS portal to view complete semester details and updated CGPA.
          </p>
        </div>
        <div style="border-top: 1px solid #eeeeee; padding-top: 12px; font-size: 12px; color: #999999; text-align: center;">
          Indian Institute of Technology Madras, Chennai 600036
        </div>
      </div>
    `;

    return this.sendEmail({
      to: studentEmail,
      subject,
      text,
      html,
    });
  }
}

export const emailService = new EmailService();
