import { PrismaClient, UserRole, ShiftTeam, LeaveTypeId, LeaveRequestStatus, ShiftPeriod, AccountAccessStatusValue, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.shiftSwap.deleteMany(),
    prisma.accountAccess.deleteMany(),
    prisma.shift.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.teamShiftAssignment.deleteMany(),
    prisma.environment.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Database cleared. Creating new seed data...');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      team: ShiftTeam.NONE,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: 'Manager Mike',
      email: 'manager@example.com',
      password: hashedPassword,
      role: UserRole.MANAGER,
      team: ShiftTeam.NONE,
    },
  });

  const pasUser = await prisma.user.create({
    data: {
      name: 'Pat Coordinator',
      email: 'pas@example.com',
      password: hashedPassword,
      role: UserRole.PAS,
      team: ShiftTeam.NONE,
    },
  });

  const aliceUser = await prisma.user.create({
    data: {
      name: 'Alice Engineer (Shift A)',
      email: 'alice@example.com',
      password: hashedPassword,
      role: UserRole.VAR_SHIFT,
      team: ShiftTeam.A,
    },
  });

  const bobUser = await prisma.user.create({
    data: {
      name: 'Bob Engineer (Shift B)',
      email: 'bob@example.com',
      password: hashedPassword,
      role: UserRole.VAR_SHIFT,
      team: ShiftTeam.B,
    },
  });

  const charlieUser = await prisma.user.create({
    data: {
      name: 'Charlie Engineer (Shift C)',
      email: 'charlie@example.com',
      password: hashedPassword,
      role: UserRole.VAR_SHIFT,
      team: ShiftTeam.C,
    },
  });

  const dianaUser = await prisma.user.create({
    data: {
      name: 'Diana Engineer (Shift D)',
      email: 'diana@example.com',
      password: hashedPassword,
      role: UserRole.VAR_SHIFT,
      team: ShiftTeam.D,
    },
  });

  const eveUser = await prisma.user.create({
    data: {
      name: 'Eve Engineer (BAU)',
      email: 'eve@example.com',
      password: hashedPassword,
      role: UserRole.VAR_BAU,
      team: ShiftTeam.BAU,
    },
  });

  console.log('Users created.');

  // Create customers
  const acmeCustomer = await prisma.customer.create({
    data: {
      name: 'Acme Corp',
    },
  });

  const betaCustomer = await prisma.customer.create({
    data: {
      name: 'Beta Solutions',
    },
  });

  console.log('Customers created.');

  // Create environments
  const acmeProdEnv = await prisma.environment.create({
    data: {
      customerId: acmeCustomer.id,
      name: 'Production',
      requestInstructions: 'Submit ticket to IT with justification.',
    },
  });

  const acmeUatEnv = await prisma.environment.create({
    data: {
      customerId: acmeCustomer.id,
      name: 'UAT',
      requestInstructions: 'Contact project manager for access.',
    },
  });

  const betaDevEnv = await prisma.environment.create({
    data: {
      customerId: betaCustomer.id,
      name: 'Development',
      requestInstructions: 'Self-service portal: dev-access.betasolutions.com',
    },
  });

  console.log('Environments created.');

  // Create account access
  await prisma.accountAccess.create({
    data: {
      userId: aliceUser.id,
      environmentId: acmeProdEnv.id,
      status: AccountAccessStatusValue.GRANTED,
    },
  });

  console.log('Account access created.');

  // Create shifts
  const today = new Date();
  const shiftUsers = [aliceUser, bobUser, charlieUser, dianaUser];
  
  for (const user of shiftUsers) {
    for (let i = -5; i < 15; i++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + i);
      let shiftPeriod: ShiftPeriod = ShiftPeriod.OFF;
      
      // Simple alternating shift pattern for demo
      if (user.team === ShiftTeam.A || user.team === ShiftTeam.C) {
        // Teams A & C
        const userIndex = user.team === ShiftTeam.A ? 0 : 2;
        if ((i + userIndex * 2) % 8 < 4) {
          shiftPeriod = (i % 2 === 0) ? ShiftPeriod.AM : ShiftPeriod.PM;
        }
      } else if (user.team === ShiftTeam.B || user.team === ShiftTeam.D) {
        // Teams B & D
        const userIndex = user.team === ShiftTeam.B ? 1 : 3;
        if ((i + userIndex * 2 + 4) % 8 < 4) {
          shiftPeriod = (i % 2 === 0) ? ShiftPeriod.AM : ShiftPeriod.PM;
        }
      }

      if (shiftPeriod !== ShiftPeriod.OFF) {
        const startTime = new Date(shiftDate);
        const endTime = new Date(shiftDate);
        
        if (shiftPeriod === ShiftPeriod.AM) {
          startTime.setHours(7, 0, 0);
          endTime.setHours(19, 0, 0);
        } else {
          startTime.setHours(19, 0, 0);
          endTime.setHours(7, 0, 0);
          endTime.setDate(endTime.getDate() + 1); // Night shift ends next day
        }
        
        await prisma.shift.create({
          data: {
            date: shiftDate,
            userId: user.id,
            teamId: user.team,
            shiftPeriod,
            startTime,
            endTime,
          },
        });
      }
    }
  }

  // BAU shifts (Monday-Friday day shifts)
  for (let i = -5; i < 15; i++) {
    const shiftDate = new Date(today);
    shiftDate.setDate(today.getDate() + i);
    const dayOfWeek = shiftDate.getDay();
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Mon-Fri
      const startTime = new Date(shiftDate);
      const endTime = new Date(shiftDate);
      
      startTime.setHours(9, 0, 0);
      endTime.setHours(17, 0, 0);
      
      await prisma.shift.create({
        data: {
          date: shiftDate,
          userId: eveUser.id,
          teamId: ShiftTeam.BAU,
          shiftPeriod: ShiftPeriod.AM,
          startTime,
          endTime,
        },
      });
    }
  }

  console.log('Shifts created.');

  // Create leave requests
  const leaveStartDate = new Date(today);
  leaveStartDate.setDate(today.getDate() + 5);
  
  const leaveEndDate = new Date(leaveStartDate);
  leaveEndDate.setDate(leaveStartDate.getDate() + 2);
  
  await prisma.leaveRequest.create({
    data: {
      userId: bobUser.id,
      leaveTypeId: LeaveTypeId.ANNUAL,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: 'Family vacation',
      status: LeaveRequestStatus.APPROVED,
      managerId: managerUser.id,
      approvedAt: new Date(),
    },
  });

  const pendingLeaveStartDate = new Date(today);
  pendingLeaveStartDate.setDate(today.getDate() + 10);
  
  const pendingLeaveEndDate = new Date(pendingLeaveStartDate);
  pendingLeaveEndDate.setDate(pendingLeaveStartDate.getDate() + 1);
  
  await prisma.leaveRequest.create({
    data: {
      userId: charlieUser.id,
      leaveTypeId: LeaveTypeId.SICK,
      startDate: pendingLeaveStartDate,
      endDate: pendingLeaveEndDate,
      reason: 'Doctor appointment',
      status: LeaveRequestStatus.PENDING,
    },
  });

  console.log('Leave requests created.');

  // Create shift swap request
  const aliceShift = await prisma.shift.findFirst({
    where: {
      userId: aliceUser.id,
      date: {
        gte: new Date(today),
      },
    },
  });

  const bobShift = await prisma.shift.findFirst({
    where: {
      userId: bobUser.id,
      date: {
        gte: new Date(today),
        lte: new Date(new Date().setDate(today.getDate() + 7)),
      },
    },
  });

  if (aliceShift && bobShift) {
    await prisma.shiftSwap.create({
      data: {
        requesterId: aliceUser.id,
        responderId: bobUser.id,
        requesterShiftId: aliceShift.id,
        responderShiftId: bobShift.id,
        status: 'PENDING',
        reason: 'Personal commitment',
      },
    });
  }

  console.log('Shift swap requests created.');

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      message: 'Welcome to the Workforce Management System! Set up your teams and users.',
      type: NotificationType.INFO,
      link: '/admin',
    },
  });

  await prisma.notification.create({
    data: {
      userId: managerUser.id,
      message: 'New leave request from Charlie Engineer for approval.',
      type: NotificationType.INFO,
      link: '/manager/approve-leave',
    },
  });

  console.log('Notifications created.');

  // Create audit logs
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      actionType: 'USER_CREATED',
      details: 'Admin created user: Alice Engineer (Role: VAR_SHIFT)',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: managerUser.id,
      actionType: 'LEAVE_REQUEST_APPROVED',
      details: `Manager approved leave request for Bob Engineer from ${leaveStartDate.toISOString().split('T')[0]} to ${leaveEndDate.toISOString().split('T')[0]}.`,
    },
  });

  console.log('Audit logs created.');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
