// app/api/test-email/route.js
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    console.log('Testing Resend connection...');
    
    const { data, error } = await resend.emails.send({
      from: 'TurboEssen <info@turboessen.de>',
      to: 'jafaralsubaine@gmail.com', // Your email for testing
      subject: 'Test Connection',
      html: '<p>This is a test email to check Resend connectivity.</p>',
    });

    if (error) {
      console.error('Resend test error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Resend test successful:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Resend test exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}