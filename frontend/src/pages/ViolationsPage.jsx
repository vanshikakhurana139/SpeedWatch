import React, { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { format } from 'date-fns'
import { useDashboardStore } from '../store/dashboardStore'

export default function ViolationsPage() {
    const { violations: liveViolations } = useDashboardStore()
    const [allViolations, setAllViolations] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [filterZone, setFilterZone] = useState('')
    const PER_PAGE = 10

    useEffect(() => {
        loadViolations()
    }, [])

    const loadViolations = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get('/violations', { params: { limit: 200 } })
            setAllViolations(res.data || [])
        } catch {
            // fallback to live violations from store
            setAllViolations([])
        }
        setLoading(false)
    }

    const exportCsv = () => {
        const rows = [['Vehicle ID', 'Driver', 'Timestamp', 'Zone', 'Speed (km/h)', 'Limit (km/h)', 'Penalty (₹)']]
        displayed.forEach(v => {
            rows.push([
                v.vehicle_id || '', v.driver_name || '',
                v.timestamp ? format(new Date(v.timestamp), 'yyyy-MM-dd HH:mm:ss') : '',
                v.zone_name || '', Math.round(v.speed_recorded || 0),
                v.zone_limit || '', v.penalty_amount || 0,
            ])
        })
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        a.download = `violations_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click(); URL.revokeObjectURL(url)
    }

    // Merge API violations with live store violations (deduplicate by _id)
    const combined = [...liveViolations, ...allViolations].reduce((acc, v) => {
        const key = v._id || v.id || `${v.vehicle_id}-${v.timestamp}`
        if (!acc.map[key]) { acc.map[key] = true; acc.list.push(v) }
        return acc
    }, { map: {}, list: [] }).list

    const filtered = combined.filter(v =>
        !filterZone || (v.zone_name || '').toLowerCase().includes(filterZone.toLowerCase())
    )

    const totalPenalty = filtered.reduce((s, v) => s + (v.penalty_amount || 0), 0)
    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const displayed = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    // Repeat offenders
    const vehicleCounts = {}
    filtered.forEach(v => { vehicleCounts[v.vehicle_id] = (vehicleCounts[v.vehicle_id] || 0) + 1 })
    const topOffenders = Object.entries(vehicleCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)

    return (
        <div style={S.page}>
            {/* ── Stats Row ── */}
            <div style={S.statsRow}>
                <div style={S.statCard}>
                    <div style={S.statLabel}>TOTAL PENALTIES TODAY</div>
                    <div style={{ ...S.statValue, color: '#CC0000' }}>
                        ₹{totalPenalty.toLocaleString('en-IN')}
                    </div>
                    {filtered.length > 0 && (
                        <div style={S.statSub}>
                            <svg width="12" height="12" fill="none" stroke="#CC0000" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            </svg>
                            Real-time data
                        </div>
                    )}
                </div>

                <div style={S.statCard}>
                    <div style={S.statLabel}>ACTIVE VIOLATIONS</div>
                    <div style={S.statValue}>{filtered.length}</div>
                    <div style={S.statSub}>Real-time industrial feed</div>
                </div>

                <div style={{ ...S.statCard, flex: 2 }}>
                    <div style={S.statLabel}>REPEAT OFFENDERS (TOP 3)</div>
                    <div style={S.offenderList}>
                        {topOffenders.length === 0 ? (
                            <div style={S.offenderEmpty}>
                                <svg width="36" height="36" fill="none" stroke="#E2E8F0" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                        ) : topOffenders.map(([vid, count], i) => (
                            <div key={vid} style={S.offenderRow}>
                                <span style={S.offenderVid}>{vid}</span>
                                <span style={{
                                    ...S.offenderBadge,
                                    background: i === 0 ? '#CC0000' : i === 1 ? '#E53935' : '#EF5350',
                                }}>
                                    {count} Violations
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Audit Log Table ── */}
            <div style={S.tableCard}>
                <div style={S.tableHeader}>
                    <div>
                        <div style={S.tableTitle}>Violation Audit Log</div>
                        <div style={S.tableSub}>Industrial Speed Enforcement · Bhilai Steel Plant Zone</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input
                            style={S.filterInput}
                            placeholder="Filter by zone..."
                            value={filterZone}
                            onChange={e => { setFilterZone(e.target.value); setPage(1) }}
                        />
                        <button style={S.filterBtn}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Filter
                        </button>
                        <button style={S.exportBtn} onClick={exportCsv}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={S.loading}>Loading violations...</div>
                ) : (
                    <>
                        <div style={S.tableWrapper}>
                            <table className="data-table" style={{ minWidth: 800 }}>
                                <thead>
                                    <tr>
                                        <th>VEHICLE ID</th>
                                        <th>DRIVER NAME</th>
                                        <th>TIMESTAMP</th>
                                        <th>ZONE</th>
                                        <th>SPEED / LIMIT</th>
                                        <th>PENALTY</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayed.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#A0AEC0' }}>
                                                No violations found
                                            </td>
                                        </tr>
                                    ) : displayed.map((v, i) => {
                                        const speed = Math.round(v.speed_recorded || 0)
                                        const limit = v.zone_limit || 40
                                        const excess = speed - limit
                                        const ts = v.timestamp || v.receivedAt
                                        return (
                                            <tr key={v._id || i}>
                                                <td>
                                                    <span style={S.vehicleIdCell}>{v.vehicle_id || '—'}</span>
                                                </td>
                                                <td>{v.driver_name || '—'}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                    {ts ? format(new Date(ts), 'yyyy-MM-dd HH:mm:ss') : '—'}
                                                </td>
                                                <td>
                                                    {v.zone_name ? (
                                                        <span style={S.zoneBadge}>{v.zone_name}</span>
                                                    ) : '—'}
                                                </td>
                                                <td>
                                                    <span style={{ color: '#CC0000', fontWeight: 700 }}>{speed} km/h</span>
                                                    <span style={{ color: '#A0AEC0' }}> / {limit} km/h</span>
                                                </td>
                                                <td>
                                                    <span style={{ color: '#CC0000', fontWeight: 700 }}>
                                                        {v.penalty_amount > 0 ? `₹${v.penalty_amount.toLocaleString('en-IN')}` : '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button style={S.eyeBtn} title="View Details">
                                                        <svg width="16" height="16" fill="none" stroke="#4A5568" strokeWidth="1.8" viewBox="0 0 24 24">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div style={S.pagination}>
                            <span style={S.paginationInfo}>
                                Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
                            </span>
                            <div style={S.pageButtons}>
                                <button
                                    style={S.pageBtn}
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        style={{ ...S.pageBtn, ...(page === p ? S.pageBtnActive : {}) }}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    style={S.pageBtn}
                                    disabled={page === totalPages || totalPages === 0}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const S = {
    page: {
        flex: 1,
        overflowY: 'auto',
        background: '#F0F2F5',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    statsRow: {
        display: 'flex',
        gap: 14,
    },
    statCard: {
        flex: 1,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: '16px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 700,
        color: '#A0AEC0',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 6,
        fontFamily: 'Inter, sans-serif',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 800,
        color: '#0D1B3E',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1,
        marginBottom: 4,
    },
    statSub: {
        fontSize: 11,
        color: '#CC0000',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },
    offenderList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 6,
    },
    offenderEmpty: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 0',
    },
    offenderRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'space-between',
    },
    offenderVid: {
        fontSize: 13,
        fontWeight: 700,
        color: '#0D1B3E',
        fontFamily: 'Inter, sans-serif',
    },
    offenderBadge: {
        background: '#CC0000',
        color: 'white',
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 3,
    },
    tableCard: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    tableHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '16px 18px',
        borderBottom: '1px solid #E2E8F0',
    },
    tableTitle: {
        fontSize: 15,
        fontWeight: 700,
        color: '#0D1B3E',
        fontFamily: 'Inter, sans-serif',
        marginBottom: 2,
    },
    tableSub: { fontSize: 12, color: '#A0AEC0' },
    filterInput: {
        padding: '7px 12px',
        fontSize: 13,
        border: '1.5px solid #E2E8F0',
        borderRadius: 6,
        outline: 'none',
        fontFamily: 'Inter, sans-serif',
        color: '#1A202C',
    },
    filterBtn: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px',
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        color: '#4A5568',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
    },
    exportBtn: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px',
        background: '#0D1B3E',
        border: 'none',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        color: 'white',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
    },
    tableWrapper: { overflowX: 'auto' },
    loading: { padding: '32px', textAlign: 'center', color: '#A0AEC0', fontSize: 14 },
    vehicleIdCell: {
        fontWeight: 800,
        color: '#0D1B3E',
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
    },
    zoneBadge: {
        background: '#F0F2F5',
        color: '#4A5568',
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 4,
        fontWeight: 500,
    },
    eyeBtn: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
    },
    pagination: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        borderTop: '1px solid #E2E8F0',
    },
    paginationInfo: { fontSize: 12, color: '#718096' },
    pageButtons: { display: 'flex', gap: 4 },
    pageBtn: {
        padding: '5px 12px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        color: '#4A5568',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
    },
    pageBtnActive: {
        background: '#0D1B3E',
        color: 'white',
        border: '1px solid #0D1B3E',
        fontWeight: 700,
    },
}
