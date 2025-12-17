// lib/email.js
import { sendVerificationEmail } from '@/lib/email-verification';
import { sendOrderStatusEmail } from '@/lib/order-email-notifications';
import { sendPasswordResetEmail } from '@/lib/password-reset-email';

/**
 * Centralized email sending function
 * Handles different types of emails with appropriate templates
 */
export async function sendEmail({ to, subject, template, data }) {
  try {
    switch (template) {
      case 'shift-scheduled':
        // You'll need to create a function for shift notifications
        // For now, we'll create a simple implementation
        const { employeeName, restaurantName, shiftDate, shiftTime, role, notes } = data;
        
        // Using Resend directly as an example
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { data: emailData, error } = await resend.emails.send({
          from: 'TurboEssen <info@turboessen.de>',
          to: to,
          subject: subject || `New Shift Scheduled - ${restaurantName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(to right, #ce5a46, #D22E26); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">TurboEssen - Shift Notification</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #374151;">Hello ${employeeName},</h2>
                <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">
                  A new shift has been scheduled for you at <strong>${restaurantName}</strong>.
                </p>
                
                <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 2px solid #fbbf24;">
                  <h3 style="color: #ea580c; margin: 0 0 10px 0;">📅 Shift Details</h3>
                  <p style="margin: 5px 0; color: #374151;"><strong>Date:</strong> ${shiftDate}</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Time:</strong> ${shiftTime}</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Role:</strong> ${role}</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Location:</strong> ${data.location || 'Main Restaurant'}</p>
                  ${notes ? `<p style="margin: 5px 0; color: #374151;"><strong>Notes:</strong> ${notes}</p>` : ''}
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                  Please log in to your TurboEssen dashboard to confirm or view details about this shift.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px;">
                    TurboEssen - Restaurant Management System
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        if (error) {
          console.error('Error sending shift email:', error);
          return false;
        }

        console.log('Shift email sent successfully');
        return true;

      case 'verification':
        return await sendVerificationEmail(to, data.verificationCode, data.firstName);
      
      case 'order-status':
        return await sendOrderStatusEmail(to, data.order, data.status, data.firstName);
      
      case 'password-reset':
        return await sendPasswordResetEmail(to, data.resetCode, data.firstName);
      
      default:
        console.error(`Unknown email template: ${template}`);
        return false;
    }
  } catch (error) {
    console.error('Error in sendEmail function:', error);
    return false;
  }
}

// Export existing functions for direct use if needed
export { sendVerificationEmail, sendOrderStatusEmail, sendPasswordResetEmail };