import React, { useState } from 'react'
import apiClient from '../api/client'
import { format } from 'date-fns'

// ReportsPage is now rendered inside DashboardPage when activePage === 'reports'
// It is NOT a separate route anymore — that's why navigation works

export default function ReportsPage() {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [error, setError] = useState('')

    const loadReport = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await apiClient.get('/reports/daily', { params: { date } })
            setReportData(response.data)
        } catch (err) {
            if (err.response?.status === 404) {
                setError('Report endpoint not yet configured on backend. The table data will show once backend reports router is added.')
            } else {
                setError(err.response?.data?.detail || 'Failed to load report data.')
            }
        }
        setLoading(false)
    }

    const downloadPdf = async () => {
        setPdfLoading(true)
        try {
            const response = await apiClient.post(
                '/reports/daily/pdf',
                { date },
                { responseType: 'blob' }
            )
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `speedwatch_report_${date}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            alert('PDF download failed. Make sure "pip install reportlab" is run in the backend environment.')
        }
        setPdfLoading(false)
    }

    const totalPenalty = reportData?.violations?.reduce((s, v) => s + (v.penalty_amount || 0), 0) || 0
    const totalViolations = reportData?.violations?.length || 0

    return (
        <div style={S.page}>
            {/* ── Page header ── */}
            <div style={S.pageHeader}>
                <div>
                    <div style={S.pageTitle}>DAILY VIOLATION REPORTS</div>
                    <div style={S.pageSubtitle}>
                        End-of-day report — SAIL RDCIS Ranchi
                    </div>
                </div>
            </div>

            {/* ── Controls bar ── */}
            <div style={S.controls}>
                <div style={S.fieldGroup}>
                    <label style={S.label}>SELECT DATE</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={S.dateInput}
                    />
                </div>
                <button style={S.loadBtn} onClick={loadReport} disabled={loading}>
                    {loading ? '⟳  LOADING…' : '⟳  LOAD REPORT'}
                </button>
                <button style={S.pdfBtn} onClick={downloadPdf} disabled={pdfLoading}>
                    {pdfLoading ? '⟳  GENERATING…' : '⬇  DOWNLOAD PDF'}
                </button>
            </div>

            {error && <div style={S.error}>{error}</div>}

            {/* ── Summary KPIs (shown after load) ── */}
            {reportData && (
                <div style={S.summaryRow}>
                    <SumCard label="Violations" value={totalViolations} color="var(--red)" />
                    <SumCard label="Total Penalty" value={`₹ ${totalPenalty.toLocaleString('en-IN')}`} color="var(--red)" />
                    <SumCard label="Date" value={date} color="var(--blue)" />
                    <SumCard
                        label="Drivers Involved"
                        value={new Set(reportData.violations?.map(v => v.driver_name)).size}
                        color="var(--amber)"
                    />
                </div>
            )}

            {/* ── Report table ── */}
            {reportData && (
                <div style={S.tableSection}>
                    <div style={S.tableHeader}>
                        <div style={S.tableTitle}>Violations for {date}</div>
                        <div style={S.tableCount}>{totalViolations} records</div>
                    </div>

                    {totalViolations > 0 ? (
                        <div style={S.tableWrapper}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        {['#', 'TIME', 'DRIVER', 'VEHICLE', 'SPEED', 'LIMIT', 'EXCESS', 'PENALTY', 'TYPE'].map((h) => (
                                            <th key={h} style={S.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.violations.map((v, i) => {
                                        const excess = Math.round((v.speed_recorded || 0) - (v.zone_limit || 50))
                                        return (
                                            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-2)' : 'var(--bg-3)' }}>
                                                <td style={S.tdMono}>{i + 1}</td>
                                                <td style={S.tdMono}>
                                                    {v.timestamp ? format(new Date(v.timestamp), 'HH:mm:ss') : '--:--:--'}
                                                </td>
                                                <td style={S.td}>{v.driver_name}</td>
                                                <td style={S.tdMono}>{v.license_plate}</td>
                                                <td style={{ ...S.tdMono, color: 'var(--red)', fontWeight: 700 }}>
                                                    {Math.round(v.speed_recorded)} km/h
                                                </td>
                                                <td style={S.tdMono}>{v.zone_limit} km/h</td>
                                                <td style={{ ...S.tdMono, color: 'var(--amber)' }}>
                                                    +{excess} km/h
                                                </td>
                                                <td style={{ ...S.tdMono, color: 'var(--red)' }}>
                                                    ₹ {v.penalty_amount}
                                                </td>
                                                <td style={S.td}>
                                                    <span style={S.typeBadge}>
                                                        {(v.violation_type || 'overspeed').replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={S.noData}>
                            <div style={{ fontSize: '30px', opacity: 0.15 }}>✓</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '8px' }}>
                                No violations recorded on {date}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state before loading */}
            {!reportData && !error && (
                <div style={S.emptyPrompt}>
                    <div style={{ fontSize: '40px', opacity: 0.1 }}>📋</div>
                    <div style={S.emptyPromptText}>Select a date and click LOAD REPORT</div>
                </div>
            )}
        </div>
    )
}

function SumCard({ label, value, color }) {
    return (
        <div style={{ ...S.sumCard, borderTop: `2px solid ${color}` }}>
            <div style={{ ...S.sumValue, color }}>{value}</div>
            <div style={S.sumLabel}>{label}</div>
        </div>
    )
}

const S = {
    page: {
        flex: 1, overflowY: 'auto',
        background: 'var(--bg-0)',
        padding: '24px 28px',
        display: 'flex', flexDirection: 'column', gap: '20px',
    },
    pageHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    },
    pageTitle: {
        fontFamily: 'var(--font-mono)', fontSize: '16px',
        color: 'var(--text-0)', letterSpacing: '2px',
    },
    pageSubtitle: {
        fontSize: '11px', color: 'var(--text-3)', marginTop: '4px',
        fontFamily: 'var(--font-hmi)', letterSpacing: '1px',
    },
    controls: {
        display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap',
    },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: {
        fontSize: '10px', fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'var(--font-hmi)',
    },
    dateInput: {
        padding: '8px 12px',
        border: '1px solid var(--border-2)', borderRadius: '4px',
        fontSize: '13px', background: 'var(--bg-2)',
        color: 'var(--text-0)', outline: 'none',
        fontFamily: 'var(--font-mono)',
    },
    loadBtn: {
        background: 'var(--blue-dim)', color: 'var(--blue)',
        border: '1px solid rgba(59,130,246,0.35)',
        borderRadius: '4px', padding: '8px 18px',
        fontWeight: 700, cursor: 'pointer',
        fontSize: '12px', letterSpacing: '1px',
        fontFamily: 'var(--font-hmi)',
    },
    pdfBtn: {
        background: 'var(--green-dim)', color: 'var(--green)',
        border: '1px solid rgba(34,197,94,0.35)',
        borderRadius: '4px', padding: '8px 18px',
        fontWeight: 700, cursor: 'pointer',
        fontSize: '12px', letterSpacing: '1px',
        fontFamily: 'var(--font-hmi)',
    },
    error: {
        background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.35)',
        borderRadius: '4px', padding: '10px 14px',
        color: 'var(--red)', fontSize: '13px',
        fontFamily: 'var(--font-hmi)',
    },
    summaryRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    sumCard: {
        flex: 1, minWidth: '140px',
        background: 'var(--bg-2)', border: '1px solid var(--border-1)',
        borderRadius: '6px', padding: '14px 16px',
    },
    sumValue: {
        fontFamily: 'var(--font-mono)', fontSize: '22px', lineHeight: 1,
    },
    sumLabel: {
        fontSize: '9px', fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: '1.2px', textTransform: 'uppercase',
        marginTop: '6px', fontFamily: 'var(--font-hmi)',
    },
    tableSection: {
        background: 'var(--bg-2)', border: '1px solid var(--border-1)',
        borderRadius: '6px', overflow: 'hidden',
    },
    tableHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid var(--border-1)',
        background: 'var(--bg-3)',
    },
    tableTitle: {
        fontFamily: 'var(--font-hmi)', fontSize: '12px',
        fontWeight: 700, color: 'var(--text-1)', letterSpacing: '1px',
    },
    tableCount: {
        fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)',
    },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
    th: {
        background: 'var(--bg-4)', color: 'var(--text-3)',
        padding: '8px 12px', textAlign: 'left',
        fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
        fontFamily: 'var(--font-hmi)', textTransform: 'uppercase',
        borderBottom: '1px solid var(--border-2)',
    },
    td: {
        padding: '9px 12px', fontSize: '12px',
        color: 'var(--text-1)', borderBottom: '1px solid var(--border-0)',
        fontFamily: 'var(--font-hmi)',
    },
    tdMono: {
        padding: '9px 12px', fontSize: '12px',
        color: 'var(--text-1)', borderBottom: '1px solid var(--border-0)',
        fontFamily: 'var(--font-mono)',
    },
    typeBadge: {
        background: 'var(--red-dim)', color: 'var(--red)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '3px', padding: '2px 6px',
        fontSize: '10px', fontFamily: 'var(--font-hmi)',
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
    },
    noData: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px', gap: '4px',
    },
    emptyPrompt: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: '10px',
    },
    emptyPromptText: {
        fontFamily: 'var(--font-mono)', fontSize: '12px',
        color: 'var(--text-3)', letterSpacing: '1px',
    },
}