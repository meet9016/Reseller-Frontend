import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import DataTable, { Column } from '@/components/DataTable';
import DatePicker from '@/components/ui/DatePicker';
import { RefreshCw, Download, IndianRupee, Filter } from 'lucide-react';
import FormInput from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { exportToExcel } from '@/utills/exportHelper';

interface ReportSettlement {
  _id: string;
  resellerName: string;
  resellerEmail: string;
  totalLeadsCount: number;
  totalLeadsAmount: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
}

export default function SettlementsReport() {
  const router = useRouter();
  const [data, setData] = useState<ReportSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minCommission, setMinCommission] = useState('');
  const [maxCommission, setMaxCommission] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const params: any = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await axios.get(baseUrl.settlements, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setData(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch settlements report:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    const exportData = data.map(item => ({
      resellerName: item.resellerName || '-',
      email: item.resellerEmail || '-',
      leadsCount: item.totalLeadsCount || 0,
      totalAmount: item.totalLeadsAmount || 0,
      totalCommission: item.totalCommission || 0,
    }));

    const columns = [
      { header: 'Reseller Name', key: 'resellerName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Leads Count', key: 'leadsCount', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 20 },
      { header: 'Total Commission', key: 'totalCommission', width: 20 },
    ];

    const fileName = `Settlements_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    await exportToExcel(fileName, 'Settlements', columns, exportData);
  };

  const maxDataCommission = data.length > 0 ? Math.max(...data.map(d => d.totalCommission || 0)) : 100000;

  const columns: Column<ReportSettlement>[] = [
    {
      key: 'resellerName',
      label: 'RESELLER NAME',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{row.resellerEmail}</div>
        </div>
      ),
    },
    {
      key: 'totalLeadsCount',
      label: 'TOTAL LEADS',
      render: (value) => <span className="font-medium text-gray-700">{value}</span>,
    },
    {
      key: 'totalLeadsAmount',
      label: 'TOTAL AMOUNT',
      render: (value) => (
        <div className="flex items-center gap-1 font-semibold text-emerald-700">
          <IndianRupee className="h-3 w-3" />
          <span>{value.toLocaleString('en-IN')}</span>
        </div>
      ),
    },
    {
      key: 'totalCommission',
      label: 'TOTAL COMMISSION',
      render: (value) => (
        <div className="flex items-center gap-1 font-semibold text-blue-700">
          <IndianRupee className="h-3 w-3" />
          <span>{value.toLocaleString('en-IN')}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (_, row) => {
        const isPaid = row.totalCommission === 0 || row.status === 'paid';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
            {isPaid ? 'Paid' : 'Unpaid'}
          </span>
        );
      },
    }
  ];

  const filteredData = data.filter(item => {
    let match = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      match = !!(item.resellerName?.toLowerCase().includes(query) ||
                 item.resellerEmail?.toLowerCase().includes(query));
    }
    if (match && minCommission) {
      match = item.totalCommission >= Number(minCommission);
    }
    if (match && maxCommission) {
      match = item.totalCommission <= Number(maxCommission);
    }
    return match;
  });

  if (!isMounted) return null;

  return (
    <>
      <Head>
        <title>Settlements Report | Reseller Panel</title>
      </Head>

      <div className="bg-white rounded-lg min-h-screen">
        <div className="w-full mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
          
            </div>
          </div>

          <div className="bg-white p-4 rounded-t-lg border-b border-gray-100 flex flex-wrap items-center justify-end gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors border ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            <button
              onClick={handleExport}
              disabled={isLoading || data.length === 0}
              className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex flex-wrap items-center justify-end gap-4">
              <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <div className="w-[140px]">
                  <DatePicker
                    value={fromDate}
                    onChange={(val) => setFromDate(val)}
                    placeholder="Start Date"
                  />
                </div>
                <span className="text-gray-400 font-medium">-</span>
                <div className="w-[140px]">
                  <DatePicker
                    value={toDate}
                    onChange={(val) => setToDate(val)}
                    placeholder="End Date"
                  />
                </div>
                <div className="flex flex-col gap-1 w-[180px] px-2">
                  <div className="flex justify-between text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                    <span>Min: {minCommission || 0}</span>
                    <span>Max: {maxCommission || 'Any'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxDataCommission || 100000}
                    step={Math.max(1, Math.floor((maxDataCommission || 100000) / 100))}
                    value={maxCommission || maxDataCommission || 100000}
                    onChange={(e) => setMaxCommission(e.target.value)}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <button
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setMinCommission('');
                    setMaxCommission('');
                  }}
                  className="p-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-all rounded-md"
                  title="Reset Filters"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <DataTable
            data={filteredData}
            columns={columns}
            loading={isLoading}
            searchable
            searchQuery={searchQuery}
            onSearch={(val) => setSearchQuery(val)}
          />
        </div>
      </div>
    </>
  );
}
