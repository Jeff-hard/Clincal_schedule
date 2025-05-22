// app/api/schedule/periods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { schedulePeriods, teams, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const userTeam = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, user.id),
      with: { team: true }
    });
    if (!userTeam) {
      return NextResponse.json({ error: 'User not part of any team' }, { status: 400 });
    }

    // Get schedule periods for the team
    const periods = await db
      .select()
      .from(schedulePeriods)
      .where(eq(schedulePeriods.teamId, userTeam.teamId))
      .orderBy(schedulePeriods.startDate);
    return NextResponse.json(periods);
  } catch (error) {
    console.error('Error fetching schedule periods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is owner
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can create schedule periods' }, { status: 403 });
    }

    const body = await request.json();
    const { name, startDate, endDate, availabilityDeadline, teamId } = body;
    // Validate user can create for this team
    const userTeam = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId))
    });
    if (!userTeam) {
      return NextResponse.json({ error: 'Cannot create period for this team' }, { status: 403 });
    }

    const [newPeriod] = await db
      .insert(schedulePeriods)
      .values({
        teamId,
        name,
        startDate,
        endDate,
        availabilityDeadline
      })
      .returning();
    return NextResponse.json(newPeriod, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}