// components/email-template.jsx
import * as React from 'react';

export function EmailTemplate({ firstName, verificationCode }) {
  return (
    <div>
      <h1>Welcome to TurboEssen, {firstName}!</h1>
      <p>Your verification code is: <strong>{verificationCode}</strong></p>
      <p>Enter this code on the verification page to complete your registration.</p>
      <p>This code will expire in 1 hour.</p>
      <br />
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  );
}