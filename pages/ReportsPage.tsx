
import React, { useState } from 'react';
import { useAuth, UserRole, ShiftTeam } from '../hooks/useAuth';
import { getMockLeaveSummaryReport, getMockAvailabilityReport } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table, { Column } from '../components/common/Table';
import { todayISO, formatISODate } from '../utils/dateUtils';
import { SHIFT_TEAMS_CONFIG } from '../constants';
import { DocumentChartBarIcon, ArrowDownTrayIcon, FunnelIcon, TableCellsIcon } from '@heroicons/react/24/outline';


type ReportType = 'leave_summary' | 'availability';

const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('leave_summary');
  const [startDate, setStartDate] = useState(formatISODate(new Date(new Date().getFullYear(), 0, 1)));
  const [endDate, setEndDate] = useState(todayISO());
  const [selectedTeam, setSelectedTeam] = useState<ShiftTeam | 'ALL'>('ALL');
  
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportColumns, setReportColumns] = useState<Column<any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    setHasGenerated(true);
    setError('');
    setReportData([]);
    setReportColumns([]);

    if (new Date(endDate) < new Date(startDate)) {
        setError("End date cannot be before start date.");
        setIsLoading(false);
        return;
    }

    try {
      if (reportType === 'leave_summary') {
        const data = await getMockLeaveSummaryReport(startDate, endDate);
        setReportData(data);
        if (data.length > 0) {
            const dynamicColumns: Column<any>[] = Object.keys(data[0])
                .filter(key => key !== 'userId')
                .map(key => ({
                    header: key.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1").replace(/^./, str => str.toUpperCase()).trim(), // Prettify header
                    accessor: key as keyof any,
                    cellClassName: typeof data[0][key] === 'number' ? 'text-right' : '',
                    headerClassName: typeof data[0][key] === 'number' ? 'text-right' : '',
                }));
            setReportColumns(dynamicColumns);
        }
      } else if (reportType === 'availability') {
        const data = await getMockAvailabilityReport(selectedTeam, startDate, endDate);
        setReportData(data);
         if (data.length > 0) {
            setReportColumns([
                { header: 'Date', accessor: 'date' as keyof any, cellClassName: 'font-medium' },
                { header: 'User Name', accessor: 'userName' as keyof any },
                { header: 'Team', accessor: 'team' as keyof any },
                { header: 'Status', accessor: 'status' as keyof any, cellClassName: 'max-w-xs truncate' },
            ]);
        }
      }
    } catch (err) {
      setError('Failed to generate report. An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const teamOptions = [{value: 'ALL', label: 'All Teams'} , ...Object.values(ShiftTeam).filter(st => st !== ShiftTeam.NONE).map(st => ({value: st, label: SHIFT_TEAMS_CONFIG[st].name}))];

  const exportToCSV = () => {
    if (reportData.length === 0 || reportColumns.length === 0) return;

    const headers = reportColumns.map(col => typeof col.header === 'string' ? col.header : 'Column').join(',') + '\n';
    const csvContent = reportData.map(row => 
        reportColumns.map(col => {
            let value;
            if (typeof col.accessor === 'function') {
                const renderedValue = col.accessor(row, 0); // Assuming rowIndex 0 for simplicity in CSV export
                value = typeof renderedValue === 'object' ? JSON.stringify(renderedValue) : String(renderedValue ?? '');
            } else {
                 value = String(row[col.accessor as string] ?? '');
            }
            return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
    ).join('\n');

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${reportType}_${startDate}_to_${endDate}${reportType === 'availability' ? '_team-' + selectedTeam : ''}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  };

  if (currentUser?.role !== UserRole.MANAGER && currentUser?.role !== UserRole.ADMIN) {
    return <div className="bg-red-50 text-brand-error p-4 rounded-md shadow">Access Denied. This page is for managers/admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Reports</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">Generate and export reports for leave summaries and team availability.</p>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-lg shadow-lg border border-brand-border">
        <h2 className="text-lg font-semibold text-brand-text mb-1 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-brand-primary"/>
            Report Parameters
        </h2>
        <p className="text-xs text-brand-text-secondary mb-4">Select the report type and define the parameters to generate data.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <Select
            label="Report Type"
            options={[
              { value: 'leave_summary', label: 'Leave Summary Report' },
              { value: 'availability', label: 'Team Availability Report' },
            ]}
            value={reportType}
            onChange={(e) => {setReportType(e.target.value as ReportType); setHasGenerated(false); setReportData([]);}}
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {reportType === 'availability' && (
            <Select
              label="Select Team"
              options={teamOptions}
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value as ShiftTeam | 'ALL')}
            />
          )}
          <Button 
            onClick={generateReport} 
            isLoading={isLoading} 
            disabled={isLoading} 
            className="w-full md:w-auto md:col-start-1 lg:col-start-auto" // Adjust button placement
            leftIcon={<DocumentChartBarIcon className="h-5 w-5"/>}
            size="md"
          >
            Generate Report
          </Button>
        </div>
        {error && <p className="text-brand-error text-sm mt-3 bg-red-50 p-2 rounded-md">{error}</p>}
      </div>

      {hasGenerated && (
        <div className="bg-white shadow-lg rounded-lg border border-brand-border overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-brand-border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-brand-text">Report Results</h2>
            {reportData.length > 0 && (
                <Button 
                    onClick={exportToCSV} 
                    variant="secondary" 
                    size="sm" 
                    disabled={isLoading}
                    leftIcon={<ArrowDownTrayIcon className="h-4 w-4"/>}
                >
                Export CSV
                </Button>
            )}
          </div>
          {isLoading ? (
             <div className="text-center py-10 text-brand-text-secondary">Generating report data...</div>
          ) : reportData.length > 0 ? (
            <Table 
                columns={reportColumns} 
                data={reportData} 
                isLoading={isLoading} 
                rowKeyAccessor={(item: any, index: number) => JSON.stringify(item) + index} 
            />
          ) : (
             <div className="text-center py-10 px-4">
                <TableCellsIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <h3 className="font-medium text-brand-text">No Data Found</h3>
                <p className="text-sm text-brand-text-secondary">The report for the selected parameters yielded no results.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
