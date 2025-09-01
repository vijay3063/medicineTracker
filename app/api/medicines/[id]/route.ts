import { NextRequest, NextResponse } from 'next/server';
import {
  sendMedicineReminder,
  sendCriticalMedicineReminder,
  sendAppointmentReminder,
  sendRefillReminder,
} from '@/lib/notificationService'; // 👈 updated import
import { verifyToken } from '@/lib/auth';
import { NotificationData } from '@/lib/notificationService';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body as { type: string; data: NotificationData };

    let result;

    switch (type) {
      case 'medicine_reminder':
        result = await sendMedicineReminder(data);
        break;

      case 'critical_medicine_reminder':
        result = await sendCriticalMedicineReminder(data);
        break;

      case 'appointment_reminder':
        result = await sendAppointmentReminder(data);
        break;

      case 'refill_reminder':
        result = await sendRefillReminder(data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
