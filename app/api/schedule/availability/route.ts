// app/api/schedule/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { availability, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schedulePeriodId = searchParams.get('schedulePeriodId');
    const userId = searchParams.get('userId') || user.id.toString();

    if (!schedulePeriodId) {
      return NextResponse.json({ error: 'Schedule period ID required' }, { status: 400 });
    }

    // Get availability for user
    const userAvailability = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.userId, parseInt(userId)),
          eq(availability.schedulePeriodId, parseInt(schedulePeriodId))
        )
      );
    return NextResponse.json(userAvailability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schedulePeriodId, serviceId, date, preferenceType, priority, notes } = body;
    // Insert or update availability
    const [result] = await db
      .insert(availability)
      .values({
        userId: user.id,
        schedulePeriodId,
        serviceId,
        date,
        preferenceType,
        priority: priority || 3,
        notes: notes || ''
      })
      .onConflictDoUpdate({
        target: [availability.userId, availability.schedulePeriodId, availability.serviceId, availability.date],
        set: {
          preferenceType,
          priority: priority || 3,
          notes: notes || '',
          submittedAt: new Date()
        }
      })
      .returning();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}