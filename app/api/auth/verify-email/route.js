import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, code } = await request.json();
    await dbConnect();

    console.log('🔍 Verification attempt for:', email, 'with code:', code);

    // First, check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    console.log('🔍 User exists:', !!userExists);
    
    if (userExists) {
      // Check what verification data exists
      const userWithVerification = await User.findOne({ email: email.toLowerCase() })
        .select('+verificationCode +verificationCodeExpires');
      console.log('🔍 User verification data:', {
        hasCode: !!userWithVerification?.verificationCode,
        code: userWithVerification?.verificationCode,
        expires: userWithVerification?.verificationCodeExpires,
        isVerified: userWithVerification?.isVerified
      });
    }

    // Find user with verification code
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() }
    }).select('+verificationCode +verificationCodeExpires');

    console.log('🔍 User found for verification:', !!user);

    if (!user) {
      console.log('❌ No valid user found with matching code and expiration');
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Mark user as verified and clear verification data
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log('✅ User verified successfully:', user.email);

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Verification error:', error);
    return NextResponse.json(
      { error: 'Server error during verification' },
      { status: 500 }
    );
  }
}