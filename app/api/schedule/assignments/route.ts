// app/api/schedule/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { assignments, users, services, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schedulePeriodId = searchParams.get('schedulePeriodId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    let query = db
      .select({
        assignment: assignments,
        user: users,
        service: services
      })
      .from(assignments)
      .innerJoin(users, eq(assignments.userId, users.id))
      .innerJoin(services, eq(assignments.serviceId, services.id));
    // Apply filters
    const conditions = [];
    
    if (schedulePeriodId) {
      conditions.push(eq(assignments.schedulePeriodId, parseInt(schedulePeriodId)));
    }
    
    if (startDate) {
      conditions.push(gte(assignments.date, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(assignments.date, endDate));
    }
    
    if (userId) {
      conditions.push(eq(assignments.userId, parseInt(userId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(assignments.date);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}