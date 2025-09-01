import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

//
// ---------- Helpers ----------
//
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): AuthUser | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
};

//
// ---------- Register ----------
//
export const registerUser = async (userData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  age?: number;
  gender?: string;
  height?: string;
  weight?: string;
}) => {
  console.log('📝 Registering new user with email:', userData.email);

  // 1. Check if user exists
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    console.log('❌ User already exists:', userData.email);
    throw new Error('User already exists with this email');
  }

  // 2. Hash password
  const hashedPassword = await hashPassword(userData.password);

  // 3. Create user in DB
  const newUser = await createUser({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    password_hash: hashedPassword,
    age: userData.age,
    gender: userData.gender,
    height: userData.height,
    weight: userData.weight,
    membership_type: 'Gold Member',
  } as any);

  console.log('✅ User created successfully:', newUser.email);

  // 4. Generate token
  const token = generateToken({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
  });

  return { user: newUser, token };
};

//
// ---------- Login ----------
//
export const loginUser = async (email: string, password: string) => {
  console.log('🔍 Login attempt for email:', email);

  // 1. Find user
  const user = await getUserByEmail(email);
  console.log('👤 User found in DB:', !!user);

  if (!user) {
    console.log('❌ No user with this email');
    throw new Error('Invalid email or password');
  }

  // 2. Verify password
  console.log('🔐 Verifying password...');
  const isValidPassword = await comparePassword(password, user.password_hash);
  console.log('✅ Password valid:', isValidPassword);

  if (!isValidPassword) {
    console.log('❌ Invalid password for email:', email);
    throw new Error('Invalid email or password');
  }

  // 3. Generate token
  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  console.log('🎉 Login successful for:', user.email);

  return { user, token };
};
