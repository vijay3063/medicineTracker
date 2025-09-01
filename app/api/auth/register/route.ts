import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { generateOTP, sendOTP } from '@/lib/notifications';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, age, gender, height, weight } = body;

    console.log('🚀 Registration API called with data:', {
      name,
      email,
      phone,
      hasPassword: !!password,
      age,
      gender,
      height,
      weight
    });

    // ✅ Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ✅ Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ✅ Generate OTP
    const otp = generateOTP();

    // ✅ Send OTP (make sure sendOTP uses Twilio/Firebase/MSG91)
    const otpResult = await sendOTP(phone, otp);
    if (!otpResult.success) {
      console.warn('⚠️ OTP sending failed, but continuing with registration');
    }

    // ✅ Register user (store hash instead of plain password)
    const { user, token } = await registerUser({
      name,
      email,
      phone,
      password: hashedPassword, // 🔑 store hash
      age: age ? parseInt(age) : undefined,
      gender,
      height,
      weight
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        membership_type: user.membership_type
      },
      token,
      message: 'Registration successful! Please verify OTP sent to your phone.'
    });

  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'Registration failed';
    if (error instanceof Error) {
      if (error.message.includes('User already exists')) {
        errorMessage = 'User already exists with this email';
      } else if (error.message.includes('DNS')) {
        errorMessage = 'Database connection issue - please try again';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
