import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  RiDownloadCloud2Line,
  RiRefreshLine,
  RiLogoutBoxLine,
  RiGroupLine,
  RiUserLine,
  RiBuildingLine,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiArrowUpDownLine,
} from 'react-icons/ri';
import { toast } from 'sonner';
import './AdminDashboard.css';

const API_URL = 'https://tf-backend-t5k7.onrender.com/api/waitlist/admin';

const TF_LOGO = (
  <svg viewBox="0 0 172 172" width="26" height="26" aria-hidden="true">
    <path fill="currentColor" d="M86,0C38.5,0,0,38.5,0,86s38.5,86,86,86,86-38.5,86-86S133.5,0,86,0ZM127.56,122.24l-1.5,1.44c-2.73,2.62-5.72,4.98-8.9,7.01-8,5.12-17.24,8.21-26.72,8.93-1.51.11-3,.17-4.45.17s-2.94-.06-4.44-.17c-9.49-.72-18.73-3.81-26.73-8.93-3.18-2.04-6.18-4.4-8.9-7.02l-1.5-1.44V52.59h17.89v61.55c5.87,4.32,12.76,6.94,20.03,7.59,2.41.22,4.86.22,7.28,0,7.27-.65,14.17-3.27,20.03-7.59v-51.81h-14.72v44.85h-17.89V32.82l4.43-.4c3-.27,6.04-.27,9.04,0l4.43.4v11.62h32.62v77.8Z"/>
  </svg>
);

const columnHelper = createColumnHelper();

export function AdminDashboard() {
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [entries, setEntries]                 = useState([]);
  const [globalFilter, setGlobalFilter]       = useState('');
  const [sorting, setSorting]                 = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('tf_admin_auth');
    if (saved) {
      try {
        const { savedEmail, savedPassword } = JSON.parse(saved);
        setEmail(savedEmail);
        setPassword(savedPassword);
        fetchEntries(savedEmail, savedPassword);
      } catch {
        sessionStorage.removeItem('tf_admin_auth');
      }
    }
  }, []);

  const fetchEntries = async (authEmail, authPassword) => {
    setLoading(true);
    try {
      const res  = await fetch(API_URL, {
        headers: { 'x-admin-email': authEmail, 'x-admin-password': authPassword },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('tf_admin_auth');
          setIsAuthenticated(false);
          toast.error('Invalid credentials');
        } else {
          toast.error(data.message || 'Failed to fetch entries');
        }
        setLoading(false);
        return;
      }
      setEntries(data.data);
      setIsAuthenticated(true);
      sessionStorage.setItem('tf_admin_auth', JSON.stringify({ savedEmail: authEmail, savedPassword: authPassword }));
    } catch {
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    fetchEntries(email, password);
  };

  const handleExportCSV = () => {
    if (!entries.length) return;
    let csv = 'Position,Name,Email,Role,Organisation,Date,Time\n';
    entries.forEach(e => {
      const date = new Date(e.createdAt).toLocaleDateString('en-GB');
      const time = new Date(e.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      csv += [
        e.position,
        `"${(e.fullName || '').replace(/"/g, '""')}"`,
        `"${(e.email    || '').replace(/"/g, '""')}"`,
        `"${(e.interest || '').replace(/"/g, '""')}"`,
        `"${(e.company  || '').replace(/"/g, '""')}"`,
        `"${date}"`,
        `"${time}"`
      ].join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `tf_waitlist_${new Date().toISOString().split('T')[0]}.csv` });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tf_admin_auth');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  // ── TanStack columns ──────────────────────────────────────────────────────
  const columns = useMemo(() => [
    columnHelper.accessor('position', {
      header: '#',
      cell: info => <span className="td-pos">{info.getValue()}</span>,
      size: 56,
    }),
    columnHelper.accessor('fullName', {
      header: 'Name',
      cell: info => <span className="td-name">{info.getValue()}</span>,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => <span className="td-email">{info.getValue()}</span>,
    }),
    columnHelper.accessor('interest', {
      header: 'Role',
      cell: info => (
        <span className="dash-badge">{info.getValue() || '—'}</span>
      ),
    }),
    columnHelper.accessor('company', {
      header: 'Organisation',
      cell: info => info.getValue()
        ? <span>{info.getValue()}</span>
        : <span className="td-nil">—</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date & Time',
      cell: info => {
        const d = new Date(info.getValue());
        return (
          <div className="td-datetime">
            <span className="td-date">{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="td-time">{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        );
      },
    }),
  ], []);

  const table = useReactTable({
    data: entries,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Stats
  const roleCount   = entries.reduce((acc, e) => { const r = e.interest || 'other'; acc[r] = (acc[r] || 0) + 1; return acc; }, {});
  const topRole     = Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const withCompany = entries.filter(e => e.company?.trim()).length;

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-left">
          <a href="/" className="admin-login-left__logo">
            <span style={{ color: '#fff' }}>{TF_LOGO}</span>
            <span className="admin-login-left__brand">Talent Factory</span>
          </a>
          <div className="admin-login-left__body">
            <p className="admin-login-left__eyebrow">Admin Portal</p>
            <h2 className="admin-login-left__heading">Waitlist<br />Dashboard</h2>
            <p className="admin-login-left__sub">Manage and export waitlist registrations for Talent Factory Professional Learning.</p>
          </div>
          <p className="admin-login-left__footer">© 2026 Talent Factory</p>
        </div>

        <div className="admin-login-right">
          <motion.div
            className="admin-login-form-wrap"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="admin-login-form-wrap__head">
              <h3 className="admin-login-form-wrap__title">Sign in</h3>
              <p className="admin-login-form-wrap__sub">Enter your admin credentials to continue.</p>
            </div>
            <form onSubmit={handleLogin} className="admin-form">
              <div className="admin-field">
                <label htmlFor="admin-email">Email address</label>
                <input id="admin-email" type="email" placeholder="admin@talentfactory.africa"
                  value={email} onChange={e => setEmail(e.target.value)} disabled={loading} autoFocus required />
              </div>
              <div className="admin-field">
                <label htmlFor="admin-password">Password</label>
                <input id="admin-password" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required />
              </div>
              <button type="submit" className="admin-submit-btn" disabled={loading || !password || !email}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard-wrapper">

      {/* Top bar */}
      <div className="dash-topbar">
        <div className="dash-topbar__left">
          <a href="/" className="dash-brand">
            <span style={{ color: '#11112b' }}>{TF_LOGO}</span>
            <span className="dash-brand__name">Talent Factory</span>
          </a>
          <span className="dash-brand__sep" />
          <span className="dash-brand__page">Admin</span>
        </div>
        <div className="dash-topbar__right">
          <button className="dash-btn dash-btn--ghost" onClick={() => fetchEntries(email, password)} disabled={loading}>
            <RiRefreshLine className={loading ? 'spin' : ''} size={15} />
            <span className="btn-label">Refresh</span>
          </button>
          <button className="dash-btn dash-btn--primary" onClick={handleExportCSV} disabled={!entries.length}>
            <RiDownloadCloud2Line size={15} />
            <span className="btn-label">Export CSV</span>
          </button>
          <button className="dash-btn dash-btn--danger" onClick={handleLogout}>
            <RiLogoutBoxLine size={15} />
            <span className="btn-label">Sign out</span>
          </button>
        </div>
      </div>

      <div className="dash-inner">

        {/* Heading */}
        <div className="dash-heading">
          <div>
            <h1 className="dash-heading__title">Waitlist Registrations</h1>
            <p className="dash-heading__sub">All signups for Talent Factory Professional Learning</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--blue"><RiGroupLine size={18} /></div>
            <div><p className="dash-stat__n">{entries.length}</p><p className="dash-stat__l">Total signups</p></div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--gold"><RiUserLine size={18} /></div>
            <div><p className="dash-stat__n" style={{ textTransform: 'capitalize' }}>{topRole}</p><p className="dash-stat__l">Most common role</p></div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--green"><RiBuildingLine size={18} /></div>
            <div><p className="dash-stat__n">{withCompany}</p><p className="dash-stat__l">With organisation</p></div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--navy"><RiDownloadCloud2Line size={18} /></div>
            <div>
              <p className="dash-stat__n">
                {entries.length > 0
                  ? new Date(entries[entries.length - 1].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : '—'}
              </p>
              <p className="dash-stat__l">Latest signup</p>
            </div>
          </div>
        </div>

        {/* Search + TanStack Table */}
        <div className="dash-table-section">
          <div className="dash-table-toolbar">
            <div className="dash-search-wrap">
              <svg className="dash-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="dash-search"
                type="text"
                placeholder="Search by name, email or company…"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>
            <span className="dash-count">{table.getRowModel().rows.length} of {entries.length}</span>
          </div>

          <div className="dash-table-wrap">
            {loading && entries.length === 0 ? (
              <div className="dash-empty">
                <RiRefreshLine className="spin" size={24} />
                <p>Loading registrations…</p>
              </div>
            ) : (
              <table className="dash-table">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', userSelect: 'none' }}
                        >
                          <div className="th-inner">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="sort-icon">
                                {header.column.getIsSorted() === 'asc'  ? <RiArrowUpSLine   size={14} /> :
                                 header.column.getIsSorted() === 'desc' ? <RiArrowDownSLine size={14} /> :
                                 <RiArrowUpDownLine size={14} style={{ opacity: 0.35 }} />}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="dash-empty">
                        {globalFilter ? 'No results match your search.' : 'No registrations yet.'}
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row, i) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.25 }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} data-label={cell.column.columnDef.header}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
