// app/api/schedule/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { assignments, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { ClinicalScheduler } from '@/lib/scheduling/algorithm';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is owner
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can generate schedules' }, { status: 403 });
    }

    const body = await request.json();
    const { schedulePeriodId, teamId, constraints } = body;
    // Validate user can generate for this team
    const userTeam = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId))
    });
    if (!userTeam) {
      return NextResponse.json({ error: 'Cannot generate schedule for this team' }, { status: 403 });
    }

    // Clear existing assignments for this period (if any)
    await db
      .delete(assignments)
      .where(eq(assignments.schedulePeriodId, schedulePeriodId));
    // Generate schedule using algorithm
    const scheduler = new ClinicalScheduler(teamId, schedulePeriodId, constraints);
    const result = await scheduler.generateSchedule();
    // Save assignments to database
    if (result.assignments.length > 0) {
      await db.insert(assignments).values(
        result.assignments.map(assignment => ({
          ...assignment,
          assignedBy: user.id
        }))
      );
    }

    return NextResponse.json({
      success: true,
      assignmentsCreated: result.assignments.length,
      warnings: result.warnings,
      unassignedSlots: result.unassignedSlots,
      satisfactionScore: result.score
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}