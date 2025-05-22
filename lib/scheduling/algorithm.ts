
import { db } from '@/lib/db/drizzle';
import { 
  assignments, 
  availability, 
  services, 
  schedulePeriods, 
  userPreferences, 
  users,
  teamMembers,
  type Assignment,
  type Availability,
  type Service,
  type UserPreferences
} from '@/lib/db/schema';
import { eq, and, between, gte, lte, inArray } from 'drizzle-orm';

export interface SchedulingConstraints {
  maxConsecutiveDays: number;
  maxWeekendsPerMonth: number;
  minRestHoursBetweenShifts: number;
  fairnessWeight: number; // How much to prioritize equal distribution
  preferenceWeight: number; // How much to prioritize user preferences
}

export interface SchedulingResult {
  assignments: Assignment[];
  warnings: string[];
  unassignedSlots: { serviceId: number; date: string; reason: string }[];
  score: number; // Overall satisfaction score
}

export class ClinicalScheduler {
  private teamId: number;
  private schedulePeriodId: number;
  private constraints: SchedulingConstraints;
  
  constructor(teamId: number, schedulePeriodId: number, constraints?: Partial<SchedulingConstraints>) {
    this.teamId = teamId;
    this.schedulePeriodId = schedulePeriodId;
    this.constraints = {
      maxConsecutiveDays: 7,
      maxWeekendsPerMonth: 1,
      minRestHoursBetweenShifts: 12,
      fairnessWeight: 0.4,
      preferenceWeight: 0.6,
      ...constraints
    };
  }

  async generateSchedule(): Promise<SchedulingResult> {
    // 1. Get all required data
    const schedulePeriod = await this.getSchedulePeriod();
    const teamServices = await this.getTeamServices();
    const teamMembers = await this.getTeamMembers();
    const userAvailability = await this.getUserAvailability();
    const userPrefs = await this.getUserPreferences();
    const existingAssignments = await this.getExistingAssignments();

    // 2. Generate time slots that need to be filled
    const requiredSlots = this.generateRequiredSlots(schedulePeriod, teamServices);
    
    // 3. Create assignment matrix
    const assignments: Assignment[] = [];
    const warnings: string[] = [];
    const unassignedSlots: { serviceId: number; date: string; reason: string }[] = [];
    
    // 4. Sort slots by difficulty to fill (weekends, holidays first)
    const sortedSlots = this.prioritizeSlots(requiredSlots);
    
    // 5. For each slot, find the best assignment
    for (const slot of sortedSlots) {
      const assignment = await this.findBestAssignment(
        slot,
        teamMembers,
        userAvailability,
        userPrefs,
        assignments,
        existingAssignments
      );
      
      if (assignment) {
        assignments.push(assignment);
      } else {
        unassignedSlots.push({
          serviceId: slot.serviceId,
          date: slot.date,
          reason: 'No available staff found'
        });
        warnings.push(`Unable to assign ${slot.serviceName} on ${slot.date}`);
      }
    }

    // 6. Optimize assignments using constraint satisfaction
    const optimizedAssignments = await this.optimizeAssignments(assignments, userPrefs);
    
    // 7. Calculate satisfaction score
    const score = this.calculateSatisfactionScore(optimizedAssignments, userAvailability, userPrefs);

    return {
      assignments: optimizedAssignments,
      warnings,
      unassignedSlots,
      score
    };
  }

  private async getSchedulePeriod() {
    const [period] = await db
      .select()
      .from(schedulePeriods)
      .where(eq(schedulePeriods.id, this.schedulePeriodId))
      .limit(1);
    return period;
  }

  private async getTeamServices() {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.teamId, this.teamId), eq(services.isActive, true)));
  }

  private async getTeamMembers() {
    return await db
      .select({
        user: users,
        member: teamMembers
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, this.teamId));
  }

  private async getUserAvailability() {
    return await db
      .select()
      .from(availability)
      .where(eq(availability.schedulePeriodId, this.schedulePeriodId));
  }

  private async getUserPreferences() {
    return await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.teamId, this.teamId));
  }

  private async getExistingAssignments() {
    return await db
      .select()
      .from(assignments)
      .where(eq(assignments.schedulePeriodId, this.schedulePeriodId));
  }

  private generateRequiredSlots(period: any, teamServices: Service[]) {
    const slots: any[] = [];
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      for (const service of teamServices) {
        // Determine if this service runs on this day
        const shouldRun = this.shouldServiceRun(service, date, isWeekend);
        
        if (shouldRun) {
          for (let i = 0; i < service.minStaffRequired; i++) {
            slots.push({
              serviceId: service.id,
              serviceName: service.name,
              date: date.toISOString().split('T')[0],
              dayOfWeek,
              isWeekend,
              serviceType: service.serviceType,
              priority: this.calculateSlotPriority(service, date, isWeekend)
            });
          }
        }
      }
    }
    
    return slots;
  }

  private shouldServiceRun(service: Service, date: Date, isWeekend: boolean): boolean {
    switch (service.serviceType) {
      case 'weekday':
        return !isWeekend;
      case 'weekend':
        return isWeekend;
      case 'holiday':
        return this.isHoliday(date);
      case 'call':
        return true; // Call usually runs every day
      default:
        return true;
    }
  }

  private isHoliday(date: Date): boolean {
    // Add your holiday logic here
    // For now, just return false
    return false;
  }

  private calculateSlotPriority(service: Service, date: Date, isWeekend: boolean): number {
    let priority = 1;
    
    // Weekend shifts are harder to fill
    if (isWeekend) priority += 2;
    
    // Holiday shifts are hardest
    if (this.isHoliday(date)) priority += 3;
    
    // Call shifts might be harder
    if (service.serviceType === 'call') priority += 1;
    
    return priority;
  }

  private prioritizeSlots(slots: any[]) {
    return slots.sort((a, b) => b.priority - a.priority);
  }

  private async findBestAssignment(
    slot: any,
    teamMembers: any[],
    userAvailability: Availability[],
    userPrefs: UserPreferences[],
    currentAssignments: Assignment[],
    existingAssignments: Assignment[]
  ): Promise<Assignment | null> {
    
    const candidates = [];
    
    for (const member of teamMembers) {
      const userId = member.user.id;
      
      // Check availability
      const availability = userAvailability.find(a => 
        a.userId === userId && 
        a.serviceId === slot.serviceId && 
        a.date === slot.date
      );
      
      if (!availability || availability.preferenceType === 'unavailable') {
        continue;
      }
      
      // Check constraints
      const constraintViolations = await this.checkConstraints(
        userId,
        slot,
        currentAssignments,
        existingAssignments,
        userPrefs.find(p => p.userId === userId)
      );
      
      if (constraintViolations.length > 0) {
        continue;
      }
      
      // Calculate score for this assignment
      const score = this.calculateAssignmentScore(
        userId,
        slot,
        availability,
        userPrefs.find(p => p.userId === userId),
        currentAssignments
      );
      
      candidates.push({
        userId,
        score,
        availability,
        violations: constraintViolations
      });
    }
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Sort by score (higher is better)
    candidates.sort((a, b) => b.score - a.score);
    
    const bestCandidate = candidates[0];
    
    return {
      id: 0, // Will be set when inserted
      userId: bestCandidate.userId,
      serviceId: slot.serviceId,
      schedulePeriodId: this.schedulePeriodId,
      date: slot.date,
      status: 'scheduled',
      isCallDay: slot.serviceType === 'call',
      assignedBy: null, // Set to algorithm
      assignedAt: new Date(),
      notes: `Auto-assigned with score: ${bestCandidate.score.toFixed(2)}`
    } as Assignment;
  }

  private async checkConstraints(
    userId: number,
    slot: any,
    currentAssignments: Assignment[],
    existingAssignments: Assignment[],
    userPrefs?: UserPreferences
  ): Promise<string[]> {
    const violations: string[] = [];
    const allAssignments = [...currentAssignments, ...existingAssignments];
    const userAssignments = allAssignments.filter(a => a.userId === userId);
    
    // Check consecutive days constraint
    const maxConsecutive = userPrefs?.maxConsecutiveDays || this.constraints.maxConsecutiveDays;
    if (this.wouldViolateConsecutiveDays(slot.date, userAssignments, maxConsecutive)) {
      violations.push('Would exceed maximum consecutive days');
    }
    
    // Check weekends per month constraint
    if (slot.isWeekend) {
      const maxWeekends = userPrefs?.maxWeekendsPerMonth || this.constraints.maxWeekendsPerMonth;
      if (this.wouldExceedWeekendsPerMonth(slot.date, userAssignments, maxWeekends)) {
        violations.push('Would exceed maximum weekends per month');
      }
    }
    
    // Check minimum rest between shifts
    if (this.wouldViolateRestPeriod(slot, userAssignments)) {
      violations.push('Would violate minimum rest period');
    }
    
    return violations;
  }

  private wouldViolateConsecutiveDays(
    newDate: string,
    userAssignments: Assignment[],
    maxConsecutive: number
  ): boolean {
    const date = new Date(newDate);
    let consecutiveCount = 1; // Including the new assignment
    
    // Check backwards
    for (let i = 1; i < maxConsecutive; i++) {
      const checkDate = new Date(date);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (userAssignments.some(a => a.date === checkDateStr)) {
        consecutiveCount++;
      } else {
        break;
      }
    }
    
    // Check forwards
    for (let i = 1; i < maxConsecutive; i++) {
      const checkDate = new Date(date);
      checkDate.setDate(checkDate.getDate() + i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (userAssignments.some(a => a.date === checkDateStr)) {
        consecutiveCount++;
      } else {
        break;
      }
    }
    
    return consecutiveCount > maxConsecutive;
  }

  private wouldExceedWeekendsPerMonth(
    newDate: string,
    userAssignments: Assignment[],
    maxWeekends: number
  ): boolean {
    const date = new Date(newDate);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const weekendAssignmentsThisMonth = userAssignments.filter(a => {
      const assignmentDate = new Date(a.date);
      const dayOfWeek = assignmentDate.getDay();
      return assignmentDate.getMonth() === month &&
             assignmentDate.getFullYear() === year &&
             (dayOfWeek === 0 || dayOfWeek === 6);
    });
    
    return weekendAssignmentsThisMonth.length >= maxWeekends;
  }

  private wouldViolateRestPeriod(slot: any, userAssignments: Assignment[]): boolean {
    // Simplified - check if there's an assignment the day before or after
    const date = new Date(slot.date);
    
    const dayBefore = new Date(date);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayBeforeStr = dayBefore.toISOString().split('T')[0];
    
    const dayAfter = new Date(date);
    dayAfter.setDate(dayAfter.getDate() + 1);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];
    
    return userAssignments.some(a => a.date === dayBeforeStr || a.date === dayAfterStr);
  }

  private calculateAssignmentScore(
    userId: number,
    slot: any,
    availability: Availability,
    userPrefs?: UserPreferences,
    currentAssignments: Assignment[] = []
  ): number {
    let score = 0;
    
    // Base score from preference type
    switch (availability.preferenceType) {
      case 'prefer':
        score += 100;
        break;
      case 'available':
        score += 50;
        break;
      case 'emergency_only':
        score += 10;
        break;
      default:
        score += 25;
    }
    
    // Priority modifier
    score += (availability.priority || 3) * 10;
    
    // Fairness: prefer people with fewer assignments
    const userCurrentAssignments = currentAssignments.filter(a => a.userId === userId).length;
    score -= userCurrentAssignments * 5;
    
    // Weekend preference
    if (slot.isWeekend && userPrefs?.customPreferences?.preferredDaysOff?.includes(slot.dayOfWeek)) {
      score -= 20;
    }
    
    // Service preference
    if (userPrefs?.customPreferences?.preferredServices?.includes(slot.serviceId.toString())) {
      score += 30;
    }
    
    return score;
  }

  private async optimizeAssignments(assignments: Assignment[], userPrefs: UserPreferences[]): Promise<Assignment[]> {
    // Implement optimization algorithms here (genetic algorithm, simulated annealing, etc.)
    // For now, return as-is
    return assignments;
  }

  private calculateSatisfactionScore(
    assignments: Assignment[],
    userAvailability: Availability[],
    userPrefs: UserPreferences[]
  ): number {
    let totalScore = 0;
    let totalAssignments = assignments.length;
    
    for (const assignment of assignments) {
      const availability = userAvailability.find(a => 
        a.userId === assignment.userId &&
        a.serviceId === assignment.serviceId &&
        a.date === assignment.date
      );
      
      if (availability) {
        switch (availability.preferenceType) {
          case 'prefer':
            totalScore += 100;
            break;
          case 'available':
            totalScore += 75;
            break;
          case 'emergency_only':
            totalScore += 25;
            break;
        }
      }
    }
    
    return totalAssignments > 0 ? totalScore / totalAssignments : 0;
  }
}

// Utility functions for swap suggestions
export class SwapSuggestionEngine {
  private teamId: number;
  
  constructor(teamId: number) {
    this.teamId = teamId;
  }
  
  async suggestSwaps(requesterAssignmentId: number): Promise<{
    twoWaySwaps: any[];
    threeWaySwaps: any[];
  }> {
    // Get the original assignment
    const [originalAssignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, requesterAssignmentId))
      .limit(1);
    
    if (!originalAssignment) {
      return { twoWaySwaps: [], threeWaySwaps: [] };
    }
    
    // Find potential 2-way swaps
    const twoWaySwaps = await this.findTwoWaySwaps(originalAssignment);
    
    // Find potential 3-way swaps (more complex)
    const threeWaySwaps = await this.findThreeWaySwaps(originalAssignment);
    
    return { twoWaySwaps, threeWaySwaps };
  }
  
  private async findTwoWaySwaps(originalAssignment: Assignment) {
    // Find other assignments in the same period that could be swapped
    const potentialSwaps = await db
      .select({
        assignment: assignments,
        user: users
      })
      .from(assignments)
      .innerJoin(users, eq(assignments.userId, users.id))
      .where(
        and(
          eq(assignments.schedulePeriodId, originalAssignment.schedulePeriodId),
          eq(assignments.status, 'scheduled')
        )
      );
    
    const swapSuggestions = [];
    
    for (const potential of potentialSwaps) {
      if (potential.assignment.userId === originalAssignment.userId) continue;
      
      // Check if both users can work each other's shifts
      const canSwap = await this.canUsersSwap(originalAssignment, potential.assignment);
      
      if (canSwap) {
        swapSuggestions.push({
          targetUser: potential.user,
          targetAssignment: potential.assignment,
          compatibility: await this.calculateSwapCompatibility(originalAssignment, potential.assignment)
        });
      }
    }
    
    return swapSuggestions.sort((a, b) => b.compatibility - a.compatibility);
  }
  
  private async findThreeWaySwaps(originalAssignment: Assignment) {
    // More complex algorithm for 3-way swaps
    // This is a simplified version - real implementation would be more sophisticated
    return [];
  }
  
  private async canUsersSwap(assignment1: Assignment, assignment2: Assignment): Promise<boolean> {
    // Check availability, preferences, and constraints for both users
    // Simplified implementation
    return true;
  }
  
  private async calculateSwapCompatibility(assignment1: Assignment, assignment2: Assignment): Promise<number> {
    // Calculate how good this swap would be based on preferences
    // Return score 0-100
    return Math.random() * 100; // Placeholder
  }
}