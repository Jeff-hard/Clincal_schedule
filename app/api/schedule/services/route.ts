// app/api/schedule/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { services, teamMembers } from '@/lib/db/schema';
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

    // Get services for the team
    const teamServices = await db
      .select()
      .from(services)
      .where(and(eq(services.teamId, userTeam.teamId), eq(services.isActive, true)))
      .orderBy(services.name);
return NextResponse.json(teamServices);
  } catch (error) {
    console.error('Error fetching services:', error);
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
      return NextResponse.json({ error: 'Only owners can create services' }, { status: 403 });
}

    const body = await request.json();
    const { name, description, serviceType, color, minStaffRequired, maxStaffAllowed, startTime, endTime, teamId } = body;
// Validate user can create for this team
    const userTeam = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId))
    });
if (!userTeam) {
      return NextResponse.json({ error: 'Cannot create service for this team' }, { status: 403 });
}

    const [newService] = await db
      .insert(services)
      .values({
        teamId,
        name,
        description,
        serviceType,
        color: color || '#3B82F6',
        minStaffRequired: minStaffRequired || 1,
        maxStaffAllowed: maxStaffAllowed || 1,
        startTime,
endTime
      })
      .returning();

    return NextResponse.json(newService, { status: 201 });
} catch (error) {
    console.error('Error creating service:', error);
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}