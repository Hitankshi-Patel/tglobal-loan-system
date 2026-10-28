import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Clock, 
  FileText, 
  Eye, 
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminLogin } from './AdminLogin';

interface LeadItem {
  applicationId: string;
  status: string;
  fullName: string;
  mobileNumber: string;
  netWeightGrams: number;
  grossWeightGrams: number;
  karat: number;
  planId: string;
  planName?: string;
  pureGoldGrams: number;
  goldValue: number;
  eligibleLoan: number;
  createdAt: string;
  updatedAt?: string;
}

interface AuditLogItem {
  id: string;
  leadId: string;
  previousStatus: string | null;
  newStatus: string;
  note: string | null;
  changedBy: string;
  createdAt: string;
}

interface AdminViewProps {
  onBackToHome?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBackToHome }) => {
  const navigate = useNavigate();
  const handleBack = onBackToHome || (() => navigate('/'));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tglobal_admin_token'));
  const [adminUsername, setAdminUsername] = useState<string>(() => localStorage.getItem('tglobal_admin_user') || 'admin');

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Audit log modal state
  const [selectedLeadForAudit, setSelectedLeadForAudit] = useState<LeadItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('tglobal_admin_token');
    localStorage.removeItem('tglobal_admin_user');
    setToken(null);
  };

  const handleLoginSuccess = (newToken: string, username: string) => {
    setToken(newToken);
    setAdminUsername(username);
    setPage(1);
  };

  const fetchLeads = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/admin/leads?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalLeads(data.pagination.total);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch admin leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeads();
    }
  }, [token, page]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    if (!token) return;
    setUpdatingId(applicationId);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/admin/leads/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Status updated to ${newStatus} by ${adminUsername}`,
        }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.applicationId === applicationId ? { ...lead, status: newStatus } : lead
          )
        );
      } else {
        const err = await res.json();
        alert(`Failed to update status: ${err.message || 'Error'}`);
      }
    } catch (err) {
      alert('Error connecting to backend server');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenAuditModal = async (lead: LeadItem) => {
    if (!token) return;
    setSelectedLeadForAudit(lead);
    setLoadingAudit(true);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/admin/leads/${lead.applicationId}/audit-logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  // If not logged in, render the secure Admin Login screen
  if (!token) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-12">
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={handleBack}
        />
      </div>
    );
  }

  // Filtered leads
  const filteredLeads = leads.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobileNumber.includes(searchTerm);

    const matchesPlan =
      planFilter === 'ALL' ||
      item.planId === planFilter ||
      (planFilter === 'PLAN_BULLET_01' && item.planId.includes('BULLET')) ||
      (planFilter === 'PLAN_EMI_01' && item.planId.includes('EMI'));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const formatCurrency = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SUBMITTED':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-950/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl text-gray-500 hover:text-[#08432a] hover:bg-[#e4f5ec] transition-colors"
            title="Return to Public Website"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#08432a] text-white">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-[#0f1914] tracking-tight">
                Operations & Field Agent Portal
              </h1>
            </div>
            <p className="text-xs text-[#55695e] mt-0.5">
              Secure internal dashboard • Authenticated session ({adminUsername})
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 text-xs font-semibold text-[#08432a]">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin: {adminUsername}</span>
          </div>

          <button
            type="button"
            onClick={fetchLeads}
            disabled={loading}
            className="bg-white border border-[#a6dac1] text-[#08432a] hover:bg-[#e4f5ec] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Sign out of Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="mt-6 bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, Name or Mobile..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-1 focus:ring-[#08432a] outline-none text-sm text-[#0f1914]"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Plan Filter */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0f1914] focus:outline-none"
            >
              <option value="ALL">All Schemes</option>
              <option value="PLAN_BULLET_01">Bullet Repayment</option>
              <option value="PLAN_EMI_01">Monthly EMI</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0f1914] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="mt-6 bg-white rounded-3xl border border-emerald-100 shadow-[0_8px_30px_rgba(8,67,42,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4faf6] border-b border-emerald-100/80 text-[11px] sm:text-xs font-bold text-[#35483f] uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6">Application ID</th>
                <th className="py-4 px-4">Applicant</th>
                <th className="py-4 px-4">Gold Info</th>
                <th className="py-4 px-4">Loan Scheme</th>
                <th className="py-4 px-4">Eligible Loan</th>
                <th className="py-4 px-4">Status & Action</th>
                <th className="py-4 px-4 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100/60 text-xs sm:text-sm text-[#0f1914]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#08432a] mb-2" />
                    <span>Loading loan applications from database...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <span>No applications found matching your criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.applicationId} className="hover:bg-[#f9fdfa] transition-colors">
                    {/* App ID */}
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-xs text-[#08432a]">
                      {lead.applicationId}
                      <div className="text-[10px] text-gray-500 font-sans font-normal mt-0.5">
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Applicant */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#0f1914]">{lead.fullName}</div>
                      <div className="text-xs text-gray-500 font-mono">{lead.mobileNumber}</div>
                    </td>

                    {/* Gold Info */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#0f1914]">
                        {lead.netWeightGrams}g @ {lead.karat}K
                      </div>
                      <div className="text-[11px] text-[#44564c]">
                        Pure: {lead.pureGoldGrams}g • Val: {formatCurrency(lead.goldValue)}
                      </div>
                    </td>

                    {/* Scheme */}
                    <td className="py-4 px-4">
                      <span className="font-medium text-xs text-[#1e3a2b] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {lead.planName || lead.planId}
                      </span>
                    </td>

                    {/* Eligible Loan */}
                    <td className="py-4 px-4 font-black text-[#07643b]">
                      {formatCurrency(lead.eligibleLoan)}
                    </td>

                    {/* Status & Change Action */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>

                        {/* Status Change Dropdown */}
                        <select
                          disabled={updatingId === lead.applicationId}
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.applicationId, e.target.value)}
                          className="bg-white border border-gray-300 hover:border-[#08432a] rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-700 cursor-pointer outline-none transition-all disabled:opacity-50"
                        >
                          <option value="SUBMITTED">SUBMITTED</option>
                          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </td>

                    {/* Audit Trail Button */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenAuditModal(lead)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-[#d8f2e4] text-[#08432a] transition-all"
                        title="View Audit Trail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-[#f8fcf9] border-t border-emerald-100/70 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing {filteredLeads.length} of {totalLeads} total applications
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-emerald-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#0f1914]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-emerald-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {selectedLeadForAudit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#08432a]" />
                <h3 className="font-bold text-lg text-[#0f1914]">Audit Trail</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadForAudit(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500 font-mono">
              Lead: <span className="font-bold text-[#08432a]">{selectedLeadForAudit.applicationId}</span> (
              {selectedLeadForAudit.fullName})
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto space-y-3 pr-1">
              {loadingAudit ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading audit history...</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No status changes logged yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#f8fcf9] border border-emerald-100/70 text-xs text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0f1914]">
                        {log.previousStatus ? `${log.previousStatus} → ` : 'Initial: '}
                        <span className="text-[#08432a]">{log.newStatus}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {log.note && <p className="text-[#44564c] mt-1 text-[11px]">{log.note}</p>}
                    <div className="text-[10px] text-gray-500 mt-1">By: {log.changedBy}</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeadForAudit(null)}
                className="bg-[#08432a] hover:bg-[#053220] text-white px-5 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
