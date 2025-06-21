
import { ShiftTeam, TeamShiftAssignment } from '../types';
import { addDays, formatISODate, getDayOfYear, getDaysInYear } from '../utils/dateUtils';

/**
 * Generates a 4-on/4-off shift rota for a given year.
 * Teams A & C work day shifts, Teams B & D work night shifts in this pattern.
 * The cycle is 8 days long:
 * - Days 1-4: Team A (Day), Team B (Night). Teams C, D are OFF.
 * - Days 5-8: Team C (Day), Team D (Night). Teams A, B are OFF.
 *
 * @param year The year for which to generate the rota.
 * @param firstDayOfCycleForTeamA A Date object representing the first day Team A starts their Day shift in the 8-day cycle.
 *                                This date anchors the entire rota.
 * @returns An array of TeamShiftAssignment objects for the entire year.
 */
export const generateFourOnFourOffRota = (
  year: number,
  firstDayOfCycleForTeamA: Date
): TeamShiftAssignment[] => {
  const rota: TeamShiftAssignment[] = [];
  const totalDaysInYear = getDaysInYear(year);

  // Normalize firstDayOfCycleForTeamA to midnight to avoid time-based issues
  const cycleAnchorDate = new Date(firstDayOfCycleForTeamA.getFullYear(), firstDayOfCycleForTeamA.getMonth(), firstDayOfCycleForTeamA.getDate());

  for (let i = 0; i < totalDaysInYear; i++) {
    const currentDate = addDays(new Date(year, 0, 1), i); // Current date in the year we are generating for

    // Calculate days difference from the cycle anchor date
    // getTime() returns milliseconds, convert to days
    const diffTime = currentDate.getTime() - cycleAnchorDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Determine position in the 8-day cycle.
    // (diffDays % 8) could be negative if currentDate is before cycleAnchorDate.
    // Adding 8 ensures it's positive before the modulo, resulting in 0-7 range.
    const dayInCycle = (diffDays % 8 + 8) % 8; // 0 for first day of cycle, 1 for second, ..., 7 for last

    let dayShiftTeam: ShiftTeam | null = null;
    let nightShiftTeam: ShiftTeam | null = null;

    if (dayInCycle >= 0 && dayInCycle <= 3) { // Days 1-4 of the cycle (0-indexed: 0,1,2,3)
      dayShiftTeam = ShiftTeam.A;
      nightShiftTeam = ShiftTeam.B;
    } else { // Days 5-8 of the cycle (0-indexed: 4,5,6,7)
      dayShiftTeam = ShiftTeam.C;
      nightShiftTeam = ShiftTeam.D;
    }

    rota.push({
      date: formatISODate(currentDate),
      dayShiftTeam,
      nightShiftTeam,
    });
  }

  return rota;
};

/**
 * Assigns generated rota shifts to individual users based on their team.
 * This is a conceptual function; actual shift objects would be created/updated.
 * For this example, it just prints assignments.
 * In a real system, this would update/create Shift records in the database.
 */
export const assignRotaToUsers = (
    rota: TeamShiftAssignment[], 
    users: {id: string, name: string, team: ShiftTeam}[]
) : { date: string, userId: string, userName: string, shiftType: 'DAY' | 'NIGHT' }[] => {
    const userShifts: { date: string, userId: string, userName: string, shiftType: 'DAY' | 'NIGHT' }[] = [];

    rota.forEach(dayAssignment => {
        if (dayAssignment.dayShiftTeam) {
            const dayTeamUsers = users.filter(u => u.team === dayAssignment.dayShiftTeam);
            dayTeamUsers.forEach(user => {
                userShifts.push({date: dayAssignment.date, userId: user.id, userName: user.name, shiftType: 'DAY'});
            });
        }
        if (dayAssignment.nightShiftTeam) {
            const nightTeamUsers = users.filter(u => u.team === dayAssignment.nightShiftTeam);
            nightTeamUsers.forEach(user => {
                userShifts.push({date: dayAssignment.date, userId: user.id, userName: user.name, shiftType: 'NIGHT'});
            });
        }
    });
    return userShifts;
};
