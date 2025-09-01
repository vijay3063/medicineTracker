import { NextRequest, NextResponse } from 'next/server';
import { updateMedicine, deleteMedicine } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// ✅ Use Next.js RouteContext type
interface RouteContext {
  params: { id: string };
}

export async function PUT(request: NextRequest, context: RouteContext) {
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
    const medicine = await updateMedicine(context.params.id, body);
    return NextResponse.json(medicine);
  } catch (error) {
    console.error('Update medicine error:', error);
    return NextResponse.json(
      { error: 'Failed to update medicine' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await deleteMedicine(context.params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete medicine error:', error);
    return NextResponse.json(
      { error: 'Failed to delete medicine' },
      { status: 500 }
    );
  }
}
