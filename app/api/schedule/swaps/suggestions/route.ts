// app/api/schedule/swaps/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { SwapSuggestionEngine } from '@/lib/scheduling/algorithm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
}

    // Get user's team ID (simplified - you'd get this from the database)
    const teamId = 1;
// This should come from your team lookup

    const swapEngine = new SwapSuggestionEngine(teamId);
const suggestions = await swapEngine.suggestSwaps(parseInt(assignmentId));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error getting swap suggestions:', error);
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}