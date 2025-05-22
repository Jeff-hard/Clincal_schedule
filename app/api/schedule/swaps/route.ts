// app/api/schedule/swaps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { swapRequests, assignments, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
// import { SwapSuggestionEngine } from '@/lib/scheduling/algorithm'; // If you move suggestions here
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get swap requests for user
    const userSwapRequests = await db
      .select({
        swapRequest: swapRequests,
        requester: users,
        targetUser: users // This alias might need adjustment based on your schema and how you join users table twice
      })
      .from(swapRequests)
      .innerJoin(users, eq(swapRequests.requesterId, users.id)) // For requester
      .leftJoin(users, eq(swapRequests.targetUserId, users.id)) // For targetUser, aliased as targetUser_alias or similar if needed
      .where(
        and(
          eq(swapRequests.requesterId, user.id), // Or filter for targetUserId = user.id for incoming
          eq(swapRequests.status, 'pending')
        )
      );
    return NextResponse.json(userSwapRequests);
  } catch (error) {
    console.error('Error fetching swap requests:', error);
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
    const { requesterAssignmentId, targetAssignmentId, reason } = body;
    // Validate the requester owns the assignment
    const [requesterAssignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, requesterAssignmentId))
      .limit(1);
    if (!requesterAssignment || requesterAssignment.userId !== user.id) {
      return NextResponse.json({ error: 'Invalid assignment' }, { status: 400 });
    }

    // Get target assignment info
    let targetUserIdToStore = null;
    if (targetAssignmentId) {
        const [targetAssignment] = await db
          .select()
          .from(assignments)
          .where(eq(assignments.id, targetAssignmentId))
          .limit(1);
        if (!targetAssignment) {
          return NextResponse.json({ error: 'Target assignment not found' }, { status: 400 });
        }
        targetUserIdToStore = targetAssignment.userId;
    }


    // Create swap request
    const [newSwapRequest] = await db
      .insert(swapRequests)
      .values({
        requesterId: user.id,
        requesterAssignmentId,
        targetUserId: targetUserIdToStore,
        targetAssignmentId, // Can be null for open requests
        swapDetails: {
          type: targetAssignmentId ? '2-way' : 'open', // Example, adjust as needed
          participants: targetAssignmentId ? [
            { userId: user.id, assignmentId: requesterAssignmentId },
            { userId: targetUserIdToStore, assignmentId: targetAssignmentId }
          ] : [{ userId: user.id, assignmentId: requesterAssignmentId }]
        },
        reason,
        status: 'pending'
      })
      .returning();
    return NextResponse.json(newSwapRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating swap request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}