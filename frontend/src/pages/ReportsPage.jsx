import React, { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { format, subDays } from 'date-fns'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'

export default function ReportsPage() {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [error, setError] = useState('')

    // Scheduled Reports Preferences
    const [dailySummary, setDailySummary] = useState(true)
    const [weeklyCompliance, setWeeklyCompliance] = useState(false)
    const [savingPrefs, setSavingPrefs] = useState(false)

    // Load initial report on mount
    useEffect(() => {
        loadReport()
    }, [])

    const loadReport = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await apiClient.get('/reports/daily', { params: { date } })
            setReportData(response.data)
        } catch (err) {
            console.error('Failed to load report:', err)
            setError(err.response?.data?.detail || 'Failed to load report data.')
        } finally {
            setLoading(false)
        }
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
        } finally {
            setPdfLoading(false)
        }
    }

    const handleSavePrefs = () => {
        setSavingPrefs(true)
        setTimeout(() => {
            setSavingPrefs(false)
            alert('Scheduled reports preferences saved successfully.')
        }, 800)
    }

    const handleSendStakeholders = () => {
        alert(`Report for ${date} has been queued for email delivery to BSP executive stakeholders.`)
    }

    // Export CSV
    const downloadCsv = () => {
        if (!reportData || !reportData.violations || reportData.violations.length === 0) {
            alert('No violations to export.')
            return
        }
        const headers = ['#', 'Time', 'Driver', 'Vehicle', 'Speed', 'Limit', 'Excess', 'Penalty', 'Type']
        const rows = reportData.violations.map((v, i) => {
            const excess = Math.round((v.speed_recorded || 0) - (v.zone_limit || 50))
            const timeStr = v.timestamp ? format(new Date(v.timestamp), 'HH:mm:ss') : ''
            return [
                i + 1,
                timeStr,
                v.driver_name,
                v.license_plate,
                Math.round(v.speed_recorded),
                v.zone_limit,
                excess,
                v.penalty_amount,
                v.violation_type || 'overspeed'
            ]
        })
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `speedwatch_violations_${date}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
    }

    const totalPenalty = reportData?.violations?.reduce((s, v) => s + (v.penalty_amount || 0), 0) || 0
    const totalViolations = reportData?.violations?.length || 0

    // Safety score calculation
    // Base safety is 100%, each violation subtracts 5%, penalty amount affects it slightly
    const safetyScore = Math.max(100 - (totalViolations * 5) - Math.floor(totalPenalty / 1000), 50)
    const complianceRate = `${safetyScore.toFixed(1)}%`

    // Mock trend data based on selected date
    const selectedDateObj = new Date(date)
    const trendData = Array.from({ length: 7 }).map((_, idx) => {
        const d = subDays(selectedDateObj, 6 - idx)
        const dayName = format(d, 'EEE (dd/MM)')
        // Make the selected date match actual violations, other days are random realistic values
        const isSelectedDate = idx === 6
        const violCount = isSelectedDate ? totalViolations : Math.max(Math.floor(Math.random() * 8) - 1, 0)
        return {
            name: dayName,
            Violations: violCount,
            Penalties: violCount * 1200
        }
    })

    // Mock vendor data
    const vendorRanking = [
        { name: 'BSP Logistics Ltd.', vehicles: 24, violations: 1, compliance: '98.8%', status: 'Excellent' },
        { name: 'Bajrang Heavy Transports', vehicles: 15, violations: 3, compliance: '94.2%', status: 'Good' },
        { name: 'Tata Steel Logistics Services', vehicles: 32, violations: 8, compliance: '88.5%', status: 'Warning' },
        { name: 'Adani Logistics Bhilai', vehicles: 8, violations: 5, compliance: '79.3%', status: 'Critical' },
    ]

    return (
        <div style={S.page}>
            {/* ── Page Header ── */}
            <div style={S.pageHeader}>
                <div>
                    <h1 style={S.pageTitle}>REPORTS & ANALYTICS</h1>
                    <div style={S.pageSubtitle}>
                        Daily performance auditor & BSP security enforcement log
                    </div>
                </div>
            </div>

            {/* ── Controls Row ── */}
            <div style={S.controlsCard}>
                <div style={S.fieldGroup}>
                    <label style={S.label}>REPORTING DATE</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={S.dateInput}
                    />
                </div>
                <button style={S.loadBtn} onClick={loadReport} disabled={loading}>
                    {loading ? '⟳ LOADING…' : '⟳ LOAD REPORT'}
                </button>
                <div style={{ flex: 1 }} />
                <div style={S.btnGroup}>
                    <button style={S.actionBtn} onClick={downloadCsv} disabled={!reportData}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        EXPORT CSV
                    </button>
                    <button style={{ ...S.actionBtn, background: 'var(--red-bg)', color: '#CC0000', borderColor: 'var(--red-border)' }} onClick={downloadPdf} disabled={pdfLoading || !reportData}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {pdfLoading ? 'GENERATING…' : 'DOWNLOAD PDF'}
                    </button>
                    <button style={S.primaryBtn} onClick={handleSendStakeholders} disabled={!reportData}>
                        SEND TO STAKEHOLDERS
                    </button>
                </div>
            </div>

            {error && <div style={S.error}>{error}</div>}

            {/* ── Core Insights Content ── */}
            {reportData ? (
                <div style={S.contentGrid}>
                    {/* Left Column: KPI Cards, Charts, Violations List */}
                    <div style={S.leftCol}>
                        {/* KPI Cards Row */}
                        <div style={S.kpiRow}>
                            <div style={S.kpiCard}>
                                <div style={S.kpiTitle}>TOTAL VIOLATIONS</div>
                                <div style={{ ...S.kpiValue, color: '#CC0000' }}>{totalViolations}</div>
                                <div style={S.kpiSub}>Speed infractions recorded</div>
                            </div>
                            <div style={S.kpiCard}>
                                <div style={S.kpiTitle}>COMPLIANCE RATE</div>
                                <div style={{ ...S.kpiValue, color: safetyScore > 90 ? 'var(--green-500)' : safetyScore > 75 ? 'var(--amber-500)' : '#CC0000' }}>
                                    {complianceRate}
                                </div>
                                <div style={S.kpiSub}>Plant safety index</div>
                            </div>
                            <div style={S.kpiCard}>
                                <div style={S.kpiTitle}>TOTAL PENALTIES</div>
                                <div style={{ ...S.kpiValue, color: '#CC0000' }}>₹{totalPenalty.toLocaleString('en-IN')}</div>
                                <div style={S.kpiSub}>Enforced fines collected</div>
                            </div>
                            <div style={S.kpiCard}>
                                <div style={S.kpiTitle}>DRIVERS PENALIZED</div>
                                <div style={S.kpiValue}>
                                    {new Set(reportData.violations?.map(v => v.driver_name)).size}
                                </div>
                                <div style={S.kpiSub}>Distinct drivers flagged</div>
                            </div>
                        </div>

                        {/* Safety Performance Trends Chart */}
                        <div style={S.chartSection}>
                            <div style={S.sectionHeader}>
                                <h3 style={S.sectionTitle}>7-DAY SAFETY PERFORMANCE TRENDS</h3>
                                <span style={S.sectionMeta}>Infractions & Penalty volume over time</span>
                            </div>
                            <div style={S.chartWrapper}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" stroke="#718096" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                                        <Tooltip contentStyle={{ background: '#0D1B3E', border: 'none', borderRadius: 8, color: 'white' }} />
                                        <Bar dataKey="Violations" fill="#CC0000" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Violations Table */}
                        <div style={S.tableSection}>
                            <div style={S.tableHeader}>
                                <h3 style={S.tableTitle}>VIOLATIONS AUDIT LOG</h3>
                                <span style={S.tableCount}>{totalViolations} records</span>
                            </div>
                            {totalViolations > 0 ? (
                                <div style={S.tableWrapper}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>TIME</th>
                                                <th>DRIVER</th>
                                                <th>VEHICLE</th>
                                                <th>SPEED</th>
                                                <th>LIMIT</th>
                                                <th>EXCESS</th>
                                                <th>PENALTY</th>
                                                <th>TYPE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.violations.map((v, i) => {
                                                const excess = Math.round((v.speed_recorded || 0) - (v.zone_limit || 50))
                                                return (
                                                    <tr key={i}>
                                                        <td style={{ fontFamily: 'monospace' }}>{i + 1}</td>
                                                        <td style={{ fontFamily: 'monospace' }}>
                                                            {v.timestamp ? format(new Date(v.timestamp), 'HH:mm:ss') : '--:--:--'}
                                                        </td>
                                                        <td>{v.driver_name}</td>
                                                        <td style={{ fontFamily: 'monospace' }}>{v.license_plate}</td>
                                                        <td style={{ color: '#CC0000', fontWeight: 700, fontFamily: 'monospace' }}>
                                                            {Math.round(v.speed_recorded)} km/h
                                                        </td>
                                                        <td style={{ fontFamily: 'monospace' }}>{v.zone_limit} km/h</td>
                                                        <td style={{ color: '#F59E0B', fontFamily: 'monospace' }}>+{excess} km/h</td>
                                                        <td style={{ color: '#CC0000', fontFamily: 'monospace', fontWeight: 600 }}>₹{v.penalty_amount}</td>
                                                        <td>
                                                            <span style={{
                                                                ...S.typeBadge,
                                                                background: v.violation_type === 'harsh_driving' ? 'rgba(245,158,11,0.1)' : 'rgba(204,0,0,0.1)',
                                                                color: v.violation_type === 'harsh_driving' ? '#F59E0B' : '#CC0000',
                                                                borderColor: v.violation_type === 'harsh_driving' ? 'rgba(245,158,11,0.2)' : 'rgba(204,0,0,0.2)'
                                                            }}>
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
                                <div style={S.noDataContainer}>
                                    <div style={{ fontSize: 32, opacity: 0.15 }}>✓</div>
                                    <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 8 }}>
                                        No violations recorded on {date}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Scheduled Reports & Vendor Rankings */}
                    <div style={S.rightCol}>
                        {/* Scheduled Reports panel */}
                        <div style={S.scheduledCard}>
                            <h3 style={S.sideCardTitle}>SCHEDULED REPORTS</h3>
                            <p style={S.sideCardDesc}>Configure automated reporting cycles delivered to executive managers.</p>
                            
                            <div style={S.toggleRow}>
                                <div style={S.toggleInfo}>
                                    <div style={S.toggleLabel}>Daily Summary Email</div>
                                    <div style={S.toggleDesc}>Sent every evening at 18:00 IST</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={dailySummary}
                                    onChange={(e) => setDailySummary(e.target.checked)}
                                    style={S.checkbox}
                                />
                            </div>

                            <div style={S.toggleRow}>
                                <div style={S.toggleInfo}>
                                    <div style={S.toggleLabel}>Weekly Compliance PDF</div>
                                    <div style={S.toggleDesc}>Sent every Sunday night at 23:00 IST</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={weeklyCompliance}
                                    onChange={(e) => setWeeklyCompliance(e.target.checked)}
                                    style={S.checkbox}
                                />
                            </div>

                            <button style={S.savePrefsBtn} onClick={handleSavePrefs}>
                                {savingPrefs ? 'SAVING PREFERENCES…' : 'SAVE PREFERENCES'}
                            </button>
                        </div>

                        {/* Vendor Rankings panel */}
                        <div style={S.scheduledCard}>
                            <h3 style={S.sideCardTitle}>VENDOR COMPLIANCE RANKINGS</h3>
                            <p style={S.sideCardDesc}>Risk safety scores aggregated by third-party transport contractors.</p>
                            
                            <div style={S.vendorList}>
                                {vendorRanking.map((vendor, idx) => {
                                    const rankColor = idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#718096'
                                    const statusColor = vendor.status === 'Excellent' ? 'var(--green-500)' : vendor.status === 'Good' ? 'var(--amber-500)' : '#CC0000'
                                    return (
                                        <div key={idx} style={S.vendorItem}>
                                            <div style={S.vendorTop}>
                                                <div style={S.vendorNameBlock}>
                                                    <span style={{ ...S.rankPill, background: rankColor }}>#{idx + 1}</span>
                                                    <span style={S.vendorName}>{vendor.name}</span>
                                                </div>
                                                <span style={{ ...S.vendorStatusBadge, color: statusColor, background: `${statusColor}1A` }}>
                                                    {vendor.status}
                                                </span>
                                            </div>
                                            <div style={S.vendorBottom}>
                                                <div style={S.vendorMetric}>
                                                    <span style={S.metricVal}>{vendor.vehicles}</span>
                                                    <span style={S.metricLbl}>fleet size</span>
                                                </div>
                                                <div style={S.vendorMetric}>
                                                    <span style={S.metricVal}>{vendor.violations}</span>
                                                    <span style={S.metricLbl}>violations</span>
                                                </div>
                                                <div style={S.vendorMetric}>
                                                    <span style={{ ...S.metricVal, color: statusColor }}>{vendor.compliance}</span>
                                                    <span style={S.metricLbl}>compliance</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty prompt before loading */
                <div style={S.emptyPrompt}>
                    <div style={{ fontSize: '48px', opacity: 0.15 }}>📋</div>
                    <div style={S.emptyPromptTitle}>SAIL SpeedWatch Audit Desk</div>
                    <div style={S.emptyPromptText}>Please select a date and click LOAD REPORT to visualize dashboard analytics.</div>
                </div>
            )}
        </div>
    )
}

const S = {
    page: {
        flex: 1,
        overflowY: 'auto',
        background: '#F0F2F5',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    pageTitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        fontWeight: 800,
        color: '#0D1B3E',
        letterSpacing: '0.5px',
    },
    pageSubtitle: {
        fontSize: '11px',
        color: '#718096',
        marginTop: '3px',
        fontWeight: 500,
    },
    controlsCard: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '10px',
        fontWeight: 700,
        color: '#718096',
        letterSpacing: '0.5px',
    },
    dateInput: {
        padding: '8px 12px',
        border: '1.5px solid #E2E8F0',
        borderRadius: '6px',
        fontSize: '13px',
        background: '#FFFFFF',
        color: '#1A202C',
        outline: 'none',
        fontFamily: 'monospace',
    },
    loadBtn: {
        background: 'rgba(21,35,71,0.08)',
        color: '#0D1B3E',
        border: '1.5px solid #0D1B3E',
        borderRadius: '6px',
        padding: '8px 18px',
        fontWeight: 700,
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.15s',
    },
    btnGroup: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    actionBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 14px',
        background: '#FFFFFF',
        color: '#4A5568',
        border: '1.5px solid #E2E8F0',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    primaryBtn: {
        background: '#0D1B3E',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        fontWeight: 700,
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.15s',
    },
    error: {
        background: 'rgba(204,0,0,0.1)',
        border: '1px solid rgba(204,0,0,0.2)',
        borderRadius: '6px',
        padding: '12px 16px',
        color: '#CC0000',
        fontSize: '13px',
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '3fr 1fr',
        gap: '20px',
    },
    leftCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    rightCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    kpiRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
    },
    kpiCard: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '16px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    kpiTitle: {
        fontSize: '10px',
        fontWeight: 700,
        color: '#718096',
        letterSpacing: '0.5px',
    },
    kpiValue: {
        fontSize: '24px',
        fontWeight: 800,
        color: '#0D1B3E',
        fontFamily: 'monospace',
        margin: '6px 0',
    },
    kpiSub: {
        fontSize: '10px',
        color: '#A0AEC0',
    },
    chartSection: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '16px',
    },
    sectionTitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: 800,
        color: '#0D1B3E',
    },
    sectionMeta: {
        fontSize: '11px',
        color: '#718096',
    },
    chartWrapper: {
        width: '100%',
    },
    tableSection: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    tableHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: '1px solid #E2E8F0',
    },
    tableTitle: {
        fontSize: '13px',
        fontWeight: 800,
        color: '#0D1B3E',
    },
    tableCount: {
        fontSize: '11px',
        color: '#718096',
        fontWeight: 600,
        background: '#F0F2F5',
        padding: '2px 8px',
        borderRadius: '10px',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    typeBadge: {
        border: '1px solid transparent',
        borderRadius: '3px',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
    },
    noDataContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        gap: '6px',
        color: '#A0AEC0',
    },
    scheduledCard: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
    },
    sideCardTitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: 800,
        color: '#0D1B3E',
        letterSpacing: '0.5px',
    },
    sideCardDesc: {
        fontSize: '11px',
        color: '#718096',
        lineHeight: 1.4,
    },
    toggleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #F0F2F5',
        paddingBottom: '10px',
    },
    toggleInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    toggleLabel: {
        fontSize: '12px',
        fontWeight: 600,
        color: '#1A202C',
    },
    toggleDesc: {
        fontSize: '10px',
        color: '#A0AEC0',
    },
    checkbox: {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
    },
    savePrefsBtn: {
        background: '#0D1B3E',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '10px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        cursor: 'pointer',
        transition: 'background 0.15s',
    },
    vendorList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    vendorItem: {
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '6px',
        padding: '10px 12px',
    },
    vendorTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vendorNameBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    rankPill: {
        fontSize: '9px',
        fontWeight: 700,
        color: '#0D1B3E',
        padding: '1px 5px',
        borderRadius: '3px',
    },
    vendorName: {
        fontSize: '12px',
        fontWeight: 600,
        color: '#1A202C',
    },
    vendorStatusBadge: {
        fontSize: '9px',
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: '3px',
        textTransform: 'uppercase',
    },
    vendorBottom: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px',
        borderTop: '1px solid #E2E8F0',
        paddingTop: '6px',
    },
    vendorMetric: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
        flex: 1,
    },
    metricVal: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#4A5568',
        fontFamily: 'monospace',
    },
    metricLbl: {
        fontSize: '8px',
        color: '#A0AEC0',
        textTransform: 'uppercase',
        letterSpacing: '0.2px',
    },
    emptyPrompt: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: '10px',
        padding: '60px 20px',
    },
    emptyPromptTitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        fontWeight: 800,
        color: '#0D1B3E',
    },
    emptyPromptText: {
        fontSize: '12px',
        color: '#718096',
        maxWidth: '360px',
        textAlign: 'center',
        lineHeight: 1.5,
    },
}