// lib/email-verification.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email, verificationCode, firstName) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TurboEssen <info@turboessen.de>',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div>
          <h1>Welcome to TurboEssen, ${firstName}!</h1>
          <p>Your verification code is: <strong>${verificationCode}</strong></p>
          <p>Enter this code on the verification page to complete your registration.</p>
          <p>This code will expire in 1 hour.</p>
          <br />
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log('Verification email sent:', data);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}