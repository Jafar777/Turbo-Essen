// app/api/auth/signup/route.js
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { hashPassword } from '@/lib/passwordUtils';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    await dbConnect();

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists with this email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      coins: 50
    });

    await newUser.save();
    
    console.log(`User created with email: ${newUser.email}`);
    
    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email address already registered' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error during registration' },
      { status: 500 }
    );
  }
}

// Optional: Add other HTTP methods if needed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}