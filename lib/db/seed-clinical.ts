import { db } from './drizzle';
import { 
  users, 
  teams, 
  teamMembers,
  services,
  schedulePeriods,
  userPreferences,
  availability,
  assignments,
  schedulingRules
} from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seedClinicalData() {
  console.log('🏥 Seeding clinical scheduling data...');

  try {
    // Create additional users for clinical team
    const clinicalUsers = await db
      .insert(users)
      .values([
        {
          email: 'dr.johnson@hospital.com',
          passwordHash: await hashPassword('password123'),
          name: 'Dr. Emily Johnson',
          role: 'member',
        },
        {
          email: 'dr.williams@hospital.com',
          passwordHash: await hashPassword('password123'),
          name: 'Dr. Michael Williams',
          role: 'member',
        },
        {
          email: 'dr.brown@hospital.com',
          passwordHash: await hashPassword('password123'),
          name: 'Dr. Sarah Brown',
          role: 'member',
        },
        {
          email: 'dr.davis@hospital.com',
          passwordHash: await hashPassword('password123'),
          name: 'Dr. James Davis',
          role: 'member',
        },
        {
          email: 'dr.miller@hospital.com',
          passwordHash: await hashPassword('password123'),
          name: 'Dr. Lisa Miller',
          role: 'member',
        },
        {
          email: 'dr.wilson@hospital.com',
          passwordHash: await hashPassword('password123'),
          name: 'Dr. Robert Wilson',
          role: 'member',
        },
      ])
      .returning();

    console.log(`✅ Created ${clinicalUsers.length} clinical staff users`);

    // Get the existing team (should be created by main seed)
    const [existingTeam] = await db.select().from(teams).limit(1);
    
    if (!existingTeam) {
      throw new Error('No team found. Run main seed first.');
    }

    // Add new users to the existing team
    const newTeamMembers = await db
      .insert(teamMembers)
      .values(
        clinicalUsers.map(user => ({
          userId: user.id,
          teamId: existingTeam.id,
          role: 'member',
        }))
      )
      .returning();

    console.log(`✅ Added ${newTeamMembers.length} members to team`);

    // Create clinical services
    const clinicalServices = await db
      .insert(services)
      .values([
        {
          teamId: existingTeam.id,
          name: 'ICU',
          description: 'Intensive Care Unit',
          serviceType: 'weekday',
          color: '#3B82F6',
          minStaffRequired: 1,
          maxStaffAllowed: 2,
          startTime: '07:00',
          endTime: '19:00',
          isActive: true,
        },
        {
          teamId: existingTeam.id,
          name: 'Emergency Department',
          description: 'Emergency Department Coverage',
          serviceType: 'call',
          color: '#EF4444',
          minStaffRequired: 1,
          maxStaffAllowed: 1,
          startTime: '00:00',
          endTime: '23:59',
          isActive: true,
        },
        {
          teamId: existingTeam.id,
          name: 'Surgery',
          description: 'Surgical Services',
          serviceType: 'weekday',
          color: '#10B981',
          minStaffRequired: 2,
          maxStaffAllowed: 3,
          startTime: '06:00',
          endTime: '18:00',
          isActive: true,
        },
        {
          teamId: existingTeam.id,
          name: 'Weekend Call',
          description: 'Weekend Coverage',
          serviceType: 'weekend',
          color: '#8B5CF6',
          minStaffRequired: 1,
          maxStaffAllowed: 1,
          startTime: '08:00',
          endTime: '20:00',
          isActive: true,
        },
        {
          teamId: existingTeam.id,
          name: 'Night Float',
          description: 'Night Coverage',
          serviceType: 'call',
          color: '#F59E0B',
          minStaffRequired: 1,
          maxStaffAllowed: 1,
          startTime: '20:00',
          endTime: '08:00',
          isActive: true,
        },
        {
          teamId: existingTeam.id,
          name: 'Cardiology',
          description: 'Cardiology Service',
          serviceType: 'weekday',
          color: '#EC4899',
          minStaffRequired: 1,
          maxStaffAllowed: 2,
          startTime: '08:00',
          endTime: '17:00',
          isActive: true,
        },
      ])
      .returning();

    console.log(`✅ Created ${clinicalServices.length} clinical services`);

    // Create schedule periods
    const periods = await db
      .insert(schedulePeriods)
      .values([
        {
          teamId: existingTeam.id,
          name: 'January 2025',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          availabilityDeadline: '2024-12-20',
          isPublished: false,
          isLocked: false,
        },
        {
          teamId: existingTeam.id,
          name: 'February 2025',
          startDate: '2025-02-01',
          endDate: '2025-02-28',
          availabilityDeadline: '2025-01-20',
          isPublished: false,
          isLocked: false,
        },
        {
          teamId: existingTeam.id,
          name: 'December 2024',
          startDate: '2024-12-01',
          endDate: '2024-12-31',
          availabilityDeadline: '2024-11-20',
          isPublished: true,
          isLocked: true,
        },
      ])
      .returning();

    console.log(`✅ Created ${periods.length} schedule periods`);

    // Get all team members for preferences and availability
    const allTeamMembers = await db
      .select({
        user: users,
        member: teamMembers
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, existingTeam.id));

    // Create user preferences
    const preferences = await db
      .insert(userPreferences)
      .values(
        allTeamMembers.map((member, index) => ({
          userId: member.user.id,
          teamId: existingTeam.id,
          maxConsecutiveDays: 6 + (index % 3), // Vary between 6-8
          maxWeekendsPerMonth: 1 + (index % 2), // Vary between 1-2
          preferBackToBackWeeks: index % 3 === 0,
          preferTwoWeeksInRow: index % 4 === 0,
          customPreferences: {
            preferredServices: clinicalServices
              .filter((_, i) => (i + index) % 3 === 0)
              .map(s => s.id.toString()),
            blackoutDates: index % 2 === 0 ? ['2025-01-15', '2025-01-16'] : [],
            preferredDaysOff: index % 2 === 0 ? [0, 6] : [1, 2], // Vary preferred days off
            maxShiftsPerWeek: 4 + (index % 2),
            minRestHoursBetweenShifts: 12 + (index % 6),
          },
        }))
      )
      .returning();

    console.log(`✅ Created preferences for ${preferences.length} users`);

    // Create sample availability for January 2025
    const januaryPeriod = periods.find(p => p.name === 'January 2025');
    if (januaryPeriod) {
      const availabilityData = [];
      
      // Generate availability for first 10 days of January for each user and service
      for (let day = 1; day <= 10; day++) {
        const date = `2025-01-${day.toString().padStart(2, '0')}`;
        
        for (const member of allTeamMembers) {
          for (const service of clinicalServices) {
            // Generate realistic availability patterns
            let preferenceType: 'prefer' | 'available' | 'unavailable' | 'emergency_only';
            let priority = 3;
            
            // Weekend logic
            const dayOfWeek = new Date(date).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            if (isWeekend && service.serviceType === 'weekend') {
              preferenceType = Math.random() > 0.7 ? 'prefer' : 'available';
              priority = Math.random() > 0.5 ? 4 : 3;
            } else if (isWeekend && service.serviceType === 'weekday') {
              preferenceType = 'unavailable';
              priority = 1;
            } else if (!isWeekend && service.serviceType === 'weekday') {
              const rand = Math.random();
              if (rand > 0.8) preferenceType = 'prefer';
              else if (rand > 0.6) preferenceType = 'available';
              else if (rand > 0.1) preferenceType = 'available';
              else preferenceType = 'emergency_only';
              
              priority = preferenceType === 'prefer' ? 5 : 
                        preferenceType === 'available' ? 3 : 
                        preferenceType === 'emergency_only' ? 2 : 1;
            } else {
              // Call services
              const rand = Math.random();
              if (rand > 0.6) preferenceType = 'available';
              else if (rand > 0.3) preferenceType = 'emergency_only';
              else preferenceType = 'unavailable';
              
              priority = preferenceType === 'available' ? 3 : 
                        preferenceType === 'emergency_only' ? 2 : 1;
            }
            
            availabilityData.push({
              userId: member.user.id,
              schedulePeriodId: januaryPeriod.id,
              serviceId: service.id,
              date,
              preferenceType,
              priority,
              notes: preferenceType === 'unavailable' ? 
                ['Conference', 'Family commitment', 'Vacation', 'Prior engagement'][Math.floor(Math.random() * 4)] : 
                preferenceType === 'prefer' ? 
                ['Love this service', 'Good experience', 'Preferred rotation'][Math.floor(Math.random() * 3)] : '',
            });
          }
        }
      }
      
      // Insert availability in batches to avoid database limits
      const batchSize = 100;
      for (let i = 0; i < availabilityData.length; i += batchSize) {
        const batch = availabilityData.slice(i, i + batchSize);
        await db.insert(availability).values(batch);
      }
      
      console.log(`✅ Created ${availabilityData.length} availability entries for January`);
    }

    // Create some sample assignments for December (published period)
    const decemberPeriod = periods.find(p => p.name === 'December 2024');
    if (decemberPeriod) {
      const assignmentData = [];
      
      // Generate some sample assignments for first week of December
      for (let day = 1; day <= 7; day++) {
        const date = `2024-12-${day.toString().padStart(2, '0')}`;
        const dayOfWeek = new Date(date).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        for (const service of clinicalServices) {
          const shouldAssign = 
            (isWeekend && service.serviceType === 'weekend') ||
            (!isWeekend && service.serviceType === 'weekday') ||
            (service.serviceType === 'call');
          
          if (shouldAssign) {
            // Assign random team members
            const randomMember = allTeamMembers[Math.floor(Math.random() * allTeamMembers.length)];
            
            assignmentData.push({
              userId: randomMember.user.id,
              serviceId: service.id,
              schedulePeriodId: decemberPeriod.id,
              date,
              status: 'completed' as const,
              isCallDay: service.serviceType === 'call',
              assignedBy: null, // Algorithm assigned
              notes: 'Auto-generated assignment',
            });
          }
        }
      }
      
      await db.insert(assignments).values(assignmentData);
      console.log(`✅ Created ${assignmentData.length} sample assignments for December`);
    }

    // Create scheduling rules
    const rules = await db
      .insert(schedulingRules)
      .values([
        {
          teamId: existingTeam.id,
          name: 'Maximum Consecutive Days',
          ruleType: 'max_consecutive',
          ruleConfig: {
            maxConsecutiveDays: 7,
            weight: 10,
          },
          isActive: true,
        },
        {
          teamId: existingTeam.id,
          name: 'Weekend Distribution',
          ruleType: 'max_weekends',
          ruleConfig: {
            maxWeekendsPerMonth: 1,
            weight: 8,
          },
          isActive: true,
        },
        {
          teamId: existingTeam.id,
          name: 'Minimum Rest Period',
          ruleType: 'min_rest',
          ruleConfig: {
            minRestHours: 12,
            weight: 9,
          },
          isActive: true,
        },
        {
          teamId: existingTeam.id,
          name: 'Fair Distribution',
          ruleType: 'fairness',
          ruleConfig: {
            weight: 7,
          },
          isActive: true,
        },
      ])
      .returning();

    console.log(`✅ Created ${rules.length} scheduling rules`);

    console.log('🎉 Clinical scheduling data seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${clinicalUsers.length} clinical staff users`);
    console.log(`   • ${clinicalServices.length} clinical services`);
    console.log(`   • ${periods.length} schedule periods`);
    console.log(`   • ${preferences.length} user preference profiles`);
    console.log(`   • Sample availability data for January 2025`);
    console.log(`   • Sample assignments for December 2024`);
    console.log(`   • ${rules.length} scheduling rules`);
    console.log('');
    console.log('🔐 Login credentials for clinical staff:');
    clinicalUsers.forEach(user => {
      console.log(`   • ${user.email} / password123`);
    });
    console.log('');
    console.log('🏥 Access the clinical scheduler at /dashboard/schedule');

  } catch (error) {
    console.error('❌ Error seeding clinical data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedClinicalData()
    .catch((error) => {
      console.error('Seed process failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed process finished. Exiting...');
      process.exit(0);
    });
}

export { seedClinicalData };