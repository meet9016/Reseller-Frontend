import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Head from 'next/head';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import DataTable, { Column } from '@/components/DataTable';
import * as XLSX from 'xlsx';
import FormSelect from '@/components/ui/FormSelect';
import DatePicker from '@/components/ui/DatePicker';

// Define the transaction interface based on the SettlementTransaction model
interface SettlementTransaction {
  _id: string;
  reseller: { _id: string; fullName: string; email: string };
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceId: string;
  status: string;
  note: string;
  leads: any[];
  createdAt: string;
}

export default function LedgerPage() {
  const { role, user } = useSelector((state: any) => state.auth);
  const [transactions, setTransactions] = useState<SettlementTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedReseller, setSelectedReseller] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Debounce search query to avoid too many requests
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchTransactions = async (page = currentPage) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const roleName = role?.toLowerCase() || '';
      const userId = user?._id;

      const reqId = roleName === 'admin' ? 'all' : userId;
      
      const params: any = { page, limit: pageSize };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;
      if (selectedReseller) params.reseller = selectedReseller;
      if (selectedMethod) params.method = selectedMethod;
      if (selectedDate) params.date = selectedDate;

      const res = await axios.get(`${baseUrl.getBaseUrl}settlement/history/${reqId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      const p = res.data.pagination || {};
      setTransactions(res.data.data || []);
      setCurrentPage(p.currentPage || 1);
      setTotalPages(p.totalPages || 1);
      setTotalRecords(p.totalRecords || res.data.data?.length || 0);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      toast.error("Failed to load ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [selectedMonth, selectedYear, selectedReseller, selectedMethod, selectedDate, debouncedSearch, pageSize]);

  const handleExport = () => {
    const exportData = transactions.map(tx => ({
      'Date': new Date(tx.createdAt).toLocaleDateString(),
      'Reseller': tx.reseller?.fullName || '-',
      'Amount': tx.amount,
      'Method': tx.paymentMethod,
      'Reference ID': tx.referenceId || '-',
      'Status': tx.status,
      'Note': tx.note || '-',
      'Leads Settled': tx.leads?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: Column<SettlementTransaction>[] = [
    {
      key: 'createdAt',
      label: 'Date',
      render: (v) => new Date(v).toLocaleDateString()
    },
    {
      key: 'reseller',
      label: 'Reseller Name',
      render: (v) => v?.fullName || '-'
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (v) => <span className="font-bold text-emerald-600">₹{v?.toLocaleString('en-IN') || 0}</span>
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
    },
    {
      key: 'referenceId',
      label: 'Ref ID',
      render: (v) => v || '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold
          ${v === 'Completed' ? 'bg-green-100 text-green-800' :
            v === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
        >
          {v}
        </span>
      )
    },
    {
      key: 'note',
      label: 'Note',
      render: (v) => v || '-'
    }
  ];

  const uniqueResellers = Array.from(
    new Map(transactions.filter(t => t.reseller).map(t => [t.reseller._id, t.reseller])).values()
  );

  return (
    <div className="space-y-6">
      <Head>
        <title>Ledger | Reseller Panel</title>
      </Head>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ledger</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[140px]">
            <FormSelect
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={[
                { value: "", label: "All Months" },
                { value: "1", label: "January" },
                { value: "2", label: "February" },
                { value: "3", label: "March" },
                { value: "4", label: "April" },
                { value: "5", label: "May" },
                { value: "6", label: "June" },
                { value: "7", label: "July" },
                { value: "8", label: "August" },
                { value: "9", label: "September" },
                { value: "10", label: "October" },
                { value: "11", label: "November" },
                { value: "12", label: "December" },
              ]}
              placeholder="All Months"
            />
          </div>

          <div className="w-[100px]">
            <FormSelect
              value={selectedYear}
              onChange={setSelectedYear}
              options={[
                { value: "2024", label: "2024" },
                { value: "2025", label: "2025" },
                { value: "2026", label: "2026" },
              ]}
              placeholder="Year"
            />
          </div>

          {role?.toLowerCase() === 'admin' && (
            <div className="w-[160px]">
              <FormSelect
                value={selectedReseller}
                onChange={setSelectedReseller}
                options={[
                  { value: "", label: "All Resellers" },
                  ...uniqueResellers.map((r: any) => ({ value: r._id, label: r.fullName }))
                ]}
                placeholder="All Resellers"
              />
            </div>
          )}

          <div className="w-[140px]">
            <FormSelect
              value={selectedMethod}
              onChange={setSelectedMethod}
              options={[
                { value: "", label: "All Methods" },
                { value: "Bank Transfer", label: "Bank Transfer" },
                { value: "UPI", label: "UPI" },
                { value: "Cash", label: "Cash" },
              ]}
              placeholder="All Methods"
            />
          </div>

          <div className="w-[150px]">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Select date"
            />
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto overflow-x-hidden border border-gray-200 rounded-lg shadow-sm">
        <DataTable
          data={transactions}
          columns={columns}
          loading={loading}
          onRefresh={() => fetchTransactions(currentPage)}
          onExport={handleExport}
          searchable={true}
          searchQuery={searchQuery}
          onSearch={(val) => setSearchQuery(val)}
          title="Transactions"
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          onPageChange={(page) => fetchTransactions(page)}
        />
      </div>
    </div>
  );
}
