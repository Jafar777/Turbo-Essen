// app/api/auth/forgot-password/route.js
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/password-reset-email';
import { NextResponse } from 'next/server';

function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists or not for security
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json(
        { message: 'If the email exists, a reset code has been sent' },
        { status: 200 }
      );
    }

    // Generate reset code
    const resetCode = generateResetCode();
    const resetCodeExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset code to user
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpires = resetCodeExpires;
    await user.save();

    // Send email
    const emailSent = await sendPasswordResetEmail(email, resetCode, user.firstName);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Reset code sent to your email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}