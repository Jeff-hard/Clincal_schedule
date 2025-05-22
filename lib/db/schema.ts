import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  time,
  pgEnum,
  json,
  decimal
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  
}

export const serviceTypeEnum = pgEnum('service_type', ['weekday', 'weekend', 'holiday', 'call']);
export const assignmentStatusEnum = pgEnum('assignment_status', ['scheduled', 'pending', 'completed', 'cancelled']);
export const preferenceTypeEnum = pgEnum('preference_type', ['prefer', 'available', 'unavailable', 'emergency_only']);
export const swapStatusEnum = pgEnum('swap_status', ['pending', 'approved', 'rejected', 'completed']);

// Services/Rotations table
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  serviceType: serviceTypeEnum('service_type').notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // Hex color for UI
  minStaffRequired: integer('min_staff_required').default(1),
  maxStaffAllowed: integer('max_staff_allowed').default(1),
  startTime: time('start_time'),
  endTime: time('end_time'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Schedule periods (rotations, blocks, etc.)
export const schedulePeriods = pgTable('schedule_periods', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isPublished: boolean('is_published').default(false),
  isLocked: boolean('is_locked').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User preferences for scheduling
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  teamId: integer('team_id').notNull().references(() => teams.id),
  
  // General preferences
  maxConsecutiveDays: integer('max_consecutive_days').default(7),
  maxWeekendsPerMonth: integer('max_weekends_per_month').default(1),
  preferBackToBackWeeks: boolean('prefer_back_to_back_weeks').default(false),
  preferTwoWeeksInRow: boolean('prefer_two_weeks_in_row').default(false),
  
  // Custom preferences as JSON for flexibility
  customPreferences: json('custom_preferences').$type<{
    preferredServices?: string[];
    blackoutDates?: string[];
    preferredDaysOff?: number[]; // 0-6 for days of week
    maxShiftsPerWeek?: number;
    minRestHoursBetweenShifts?: number;
  }>(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Availability submissions
export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  schedulePeriodId: integer('schedule_period_id').notNull().references(() => schedulePeriods.id),
  serviceId: integer('service_id').notNull().references(() => services.id),
  date: date('date').notNull(),
  preferenceType: preferenceTypeEnum('preference_type').notNull(),
  priority: integer('priority').default(3), // 1-5 scale
  notes: text('notes'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
});

// Actual assignments
export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  serviceId: integer('service_id').notNull().references(() => services.id),
  schedulePeriodId: integer('schedule_period_id').notNull().references(() => schedulePeriods.id),
  date: date('date').notNull(),
  status: assignmentStatusEnum('status').default('scheduled'),
  isCallDay: boolean('is_call_day').default(false),
  assignedBy: integer('assigned_by').references(() => users.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  notes: text('notes'),
});

// Swap requests
export const swapRequests = pgTable('swap_requests', {
  id: serial('id').primaryKey(),
  requesterId: integer('requester_id').notNull().references(() => users.id),
  requesterAssignmentId: integer('requester_assignment_id').notNull().references(() => assignments.id),
  
  // For 2-way swaps
  targetUserId: integer('target_user_id').references(() => users.id),
  targetAssignmentId: integer('target_assignment_id').references(() => assignments.id),
  
  // For 3-way swaps (stored as JSON for complexity)
  swapDetails: json('swap_details').$type<{
    type: '2-way' | '3-way';
    participants?: {
      userId: number;
      assignmentId: number;
      newAssignmentId?: number;
    }[];
  }>(),
  
  status: swapStatusEnum('status').default('pending'),
  reason: text('reason'),
  adminNotes: text('admin_notes'),
  
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  respondedAt: timestamp('responded_at'),
  respondedBy: integer('responded_by').references(() => users.id),
});

// Scheduling constraints and rules
export const schedulingRules = pgTable('scheduling_rules', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // 'max_consecutive', 'min_rest', etc.
  ruleConfig: json('rule_config').$type<{
    maxConsecutiveDays?: number;
    minRestHours?: number;
    maxWeekendsPerMonth?: number;
    requiredServices?: string[];
    weight?: number; // For rule priority in algorithm
  }>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const servicesRelations = relations(services, ({ one, many }) => ({
  team: one(teams, {
    fields: [services.teamId],
    references: [teams.id],
  }),
  availability: many(availability),
  assignments: many(assignments),
}));

export const schedulePeriodsRelations = relations(schedulePeriods, ({ one, many }) => ({
  team: one(teams, {
    fields: [schedulePeriods.teamId],
    references: [teams.id],
  }),
  availability: many(availability),
  assignments: many(assignments),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [userPreferences.teamId],
    references: [teams.id],
  }),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  user: one(users, {
    fields: [availability.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [availability.serviceId],
    references: [services.id],
  }),
  schedulePeriod: one(schedulePeriods, {
    fields: [availability.schedulePeriodId],
    references: [schedulePeriods.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, {
    fields: [assignments.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [assignments.serviceId],
    references: [services.id],
  }),
  schedulePeriod: one(schedulePeriods, {
    fields: [assignments.schedulePeriodId],
    references: [schedulePeriods.id],
  }),
  assignedBy: one(users, {
    fields: [assignments.assignedBy],
    references: [users.id],
  }),
}));

export const swapRequestsRelations = relations(swapRequests, ({ one }) => ({
  requester: one(users, {
    fields: [swapRequests.requesterId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [swapRequests.targetUserId],
    references: [users.id],
  }),
  requesterAssignment: one(assignments, {
    fields: [swapRequests.requesterAssignmentId],
    references: [assignments.id],
  }),
  targetAssignment: one(assignments, {
    fields: [swapRequests.targetAssignmentId],
    references: [assignments.id],
  }),
  respondedByUser: one(users, {
    fields: [swapRequests.respondedBy],
    references: [users.id],
  }),
}));

// Types
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type SchedulePeriod = typeof schedulePeriods.$inferSelect;
export type NewSchedulePeriod = typeof schedulePeriods.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type SwapRequest = typeof swapRequests.$inferSelect;
export type NewSwapRequest = typeof swapRequests.$inferInsert;
export type SchedulingRule = typeof schedulingRules.$inferSelect;
export type NewSchedulingRule = typeof schedulingRules.$inferInsert;