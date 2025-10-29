// lib/password-reset-email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email, resetCode, firstName) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TurboEssen <info@turboessen.de>',
      to: email,
      subject: 'Password Reset Code - TurboEssen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #ce5a46, #D22E26); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">TurboEssen</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #374151;">Hello ${firstName},</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">
              You requested to reset your password. Use the verification code below to proceed:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 12px; border: 2px solid #fbbf24; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ea580c;">
                ${resetCode}
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              This code will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px;">
                TurboEssen - Your favorite food delivery service
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }

    console.log('Password reset email sent:', data);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}