import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [emailVerifySetting, phoneVerifySetting] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: 'registerEmailVerify' } }),
      prisma.siteSetting.findUnique({ where: { key: 'registerPhoneVerify' } }),
    ]);

    return NextResponse.json({
      settings: {
        emailVerify: emailVerifySetting?.value === 'true',
        phoneVerify: phoneVerifySetting?.value === 'true',
      },
    });
  } catch (error) {
    console.error('Failed to get verification settings:', error);
    return NextResponse.json(
      { settings: { emailVerify: false, phoneVerify: false } },
      { status: 200 }
    );
  }
}
