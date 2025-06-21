import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, UserRole } from '../hooks/useAuth';
import { TeamShiftAssignment, ShiftTeam } from '../types';
import { generateRota, getGeneratedRota } from '../services/api'; // Updated imports
// import { generateFourOnFourOffRota } from '../services/rotaService'; // Keep for future real implementation
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Table, { Column } from '../components/common/Table';
import { SHIFT_TEAMS_CONFIG } from '../constants';
import { formatISODate, parseISODate, todayISO } from '../utils/dateUtils';
import { CalendarDaysIcon, ArrowDownTrayIcon, CogIcon } from '@heroicons/react/24/outline';

const ShiftRotaPage: React.FC = () => {
  const { currentUser, getToken } = useAuth(); // Added getToken
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDateForCycle, setStartDateForCycle] = useState(todayISO());
  const [rota, setRota] = useState<TeamShiftAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRota = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const token = getToken();
    if (!token) {
      setError('Authentication error. Please log in again.');
      setIsLoading(false);
      return;
    }
    try {
      const existingRota = await getGeneratedRota(year, token); // Pass token
      if (existingRota.length > 0 && existingRota[0] && parseISODate(existingRota[0].date).getFullYear() === year) {
        setRota(existingRota);
      } else {
        setRota([]);
      }
    } catch (err) {
      setError('Failed to fetch existing rota. Please try generating a new one.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchRota();
  }, [fetchRota]);

  const handleGenerateRota = async () => {
    if (!startDateForCycle) {
        setError('Please select a valid start date for Team A\'s day shift cycle.');
        return;
    }
    setIsLoading(true);
    setError('');
    const token = getToken();
    if (!token) {
      setError('Authentication error. Please log in again.');
      setIsLoading(false);
      return;
    }
    try {
      const firstDayOfCycle = parseISODate(startDateForCycle);
      const generated = await generateRota(year, firstDayOfCycle, token); // Pass token
      setRota(generated);
    } catch (err) {
      setError('Failed to generate rota. An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const rotaColumns: Column<TeamShiftAssignment>[] = [
    { 
        header: 'Date', 
        accessor: (item) => parseISODate(item.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
        cellClassName: 'font-medium'
    },
    { 
        header: 'Day Shift (AM)', 
        accessor: (item) => item.dayShiftTeam ? SHIFT_TEAMS_CONFIG[item.dayShiftTeam].name : <span className="text-gray-400 italic">OFF</span>,
        cellClassName: (item) => item.dayShiftTeam ? 'text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full inline-block' : ''
    },
    { 
        header: 'Night Shift (PM)', 
        accessor: (item) => item.nightShiftTeam ? SHIFT_TEAMS_CONFIG[item.nightShiftTeam].name : <span className="text-gray-400 italic">OFF</span>,
        cellClassName: (item) => item.nightShiftTeam ? 'text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full inline-block' : ''
    },
  ];

  if (currentUser?.role !== UserRole.MANAGER && currentUser?.role !== UserRole.ADMIN) {
    return <div className="bg-red-50 text-brand-error p-4 rounded-md shadow">Access Denied. This page is for managers/admins only.</div>;
  }

  const exportRotaToCSV = () => {
    if (rota.length === 0) return;
    const headers = "Date,Day Shift Team,Night Shift Team\n";
    const csvContent = rota.map(row => 
        `${row.date},${row.dayShiftTeam ? SHIFT_TEAMS_CONFIG[row.dayShiftTeam].name : 'OFF'},${row.nightShiftTeam ? SHIFT_TEAMS_CONFIG[row.nightShiftTeam].name : 'OFF'}`
    ).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `shift_rota_${year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Shift Rota Management</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">Generate and view the 4-on-4-off shift rota for engineering teams.</p>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-lg shadow-lg border border-brand-border">
        <h2 className="text-lg font-semibold text-brand-text mb-4">Rota Generation Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <Input
            label="Rota Year"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min="2020" // Sensible min
            max={new Date().getFullYear() + 5} // Sensible max
            wrapperClassName="lg:col-span-1"
          />
          <Input
            label="Team A Cycle Start (Day Shift)"
            type="date"
            value={startDateForCycle}
            onChange={(e) => setStartDateForCycle(e.target.value)}
            wrapperClassName="lg:col-span-1"
          />
          <Button 
            onClick={handleGenerateRota} 
            isLoading={isLoading} 
            disabled={isLoading} 
            className="w-full md:w-auto lg:col-span-1"
            leftIcon={<CogIcon className="h-5 w-5"/>}
            size="md"
            >
            {rota.length > 0 && parseISODate(rota[0].date).getFullYear() === year ? 'Refresh Rota' : `Generate for ${year}`}
          </Button>
        </div>
        {error && <p className="text-brand-error text-sm mt-3 bg-red-50 p-2 rounded-md">{error}</p>}
      </div>

      <div className="bg-white shadow-lg rounded-lg border border-brand-border overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-brand-border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-brand-text">Shift Rota for {year}</h2>
            {rota.length > 0 && (
                <Button 
                    onClick={exportRotaToCSV} 
                    variant="secondary" 
                    size="sm"
                    leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                >
                    Export CSV
                </Button>
            )}
        </div>
        {isLoading && !rota.length ? (
             <div className="text-center py-10 text-brand-text-secondary">Loading rota...</div>
        ) : rota.length > 0 ? (
          <Table columns={rotaColumns} data={rota} isLoading={isLoading} rowKeyAccessor="date" />
        ) : (
          <div className="text-center py-10 px-4">
            <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <h3 className="font-medium text-brand-text">No Rota Data</h3>
            <p className="text-sm text-brand-text-secondary">
              {year ? `No rota found for ${year}. Please generate one.` : "Select a year and generate a rota."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftRotaPage;