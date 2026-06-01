import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useDashboardStore } from '../store/dashboardStore'
import { format } from 'date-fns'

export default function RightPanel() {
    const { violations, hourlyViolationCounts } = useDashboardStore()
    const [tab, setTab] = useState('feed')
    const currentHour = new Date().getHours()

    const chartData = Array.from({ length: 24 }, (_, h) => ({
        h: h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`,
        count: hourlyViolationCounts[h.toString()] || 0,
        current: h === currentHour,
    }))

    const totalPenalty = violations.reduce((s, v) => s + (v.penalty_amount || 0), 0)

    return (
        <aside style={RP.aside}>
            {/* Header */}
            <div style={RP.header}>
                <span style={RP.headerTitle}>VIOLATION FEED</span>
                {violations.length > 0 && (
                    <span style={RP.badge}>{violations.length}</span>
                )}
            </div>

            {/* Tab switcher */}
            <div style={RP.tabs}>
                <button style={{ ...RP.tab, ...(tab === 'feed' ? RP.tabActive : {}) }} onClick={() => setTab('feed')}>
                    LIVE FEED
                </button>
                <button style={{ ...RP.tab, ...(tab === 'chart' ? RP.tabActive : {}) }} onClick={() => setTab('chart')}>
                    24H CHART
                </button>
            </div>

            {/* Chart tab */}
            {tab === 'chart' && (
                <div style={RP.chartSection}>
                    <div style={RP.chartSummary}>
                        <div style={RP.chartStat}>
                            <span style={RP.chartStatNum}>{violations.length}</span>
                            <span style={RP.chartStatLabel}>VIOLATIONS TODAY</span>
                        </div>
                        <div style={RP.chartStat}>
                            <span style={{ ...RP.chartStatNum, color: 'var(--red)' }}>₹{totalPenalty.toLocaleString('en-IN')}</span>
                            <span style={RP.chartStatLabel}>TOTAL PENALTY</span>
                        </div>
                    </div>
                    <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                                <XAxis dataKey="h" tick={{ fontSize: 9, fill: 'var(--text-3)', fontFamily: 'IBM Plex Mono' }} interval={3} />
                                <YAxis tick={{ fontSize: 9, fill: 'var(--text-3)', fontFamily: 'IBM Plex Mono' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 6, fontSize: 11, fontFamily: 'IBM Plex Mono', color: 'var(--text-0)' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                                    {chartData.map((e, i) => (
                                        <Cell key={i} fill={e.current ? '#F0414B' : e.count > 0 ? '#A02030' : 'var(--bg-4)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Feed tab */}
            {tab === 'feed' && (
                <div style={RP.feed}>
                    {violations.length === 0 ? (
                        <div style={RP.emptyFeed}>
                            <div style={{ fontSize: 20, opacity: 0.15, fontFamily: 'var(--font-mono)' }}>◎</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontFamily: 'var(--font-display)' }}>NO VIOLATIONS RECORDED</div>
                        </div>
                    ) : violations.map(v => <ViolationItem key={v._id} violation={v} />)}
                </div>
            )}
        </aside>
    )
}

function ViolationItem({ violation }) {
    const isNew = Date.now() - (violation.receivedAt || 0) < 3000
    const speed = Math.round(violation.speed_recorded || 0)
    const limit = violation.zone_limit || 50
    const excess = speed - limit

    return (
        <div style={{
            ...RP.vItem,
            animation: isNew ? 'highlight-new 2s ease-out forwards' : 'none',
        }}>
            <div style={RP.vHeader}>
                <span style={RP.vId}>{violation.vehicle_id || '—'}</span>
                <span style={RP.vSpeed}>{speed} km/h</span>
            </div>
            <div style={RP.vDetails}>
                <span style={RP.vDetail}>Limit: {limit} km/h</span>
                <span style={{ ...RP.vDetail, color: 'var(--amber)' }}>+{excess} over</span>
            </div>
            <div style={RP.vFooter}>
                <span style={RP.vDriver}>{violation.driver_name || '—'}</span>
                <div style={RP.vPenaltyRow}>
                    <span style={RP.vPenalty}>₹{violation.penalty_amount || 0}</span>
                    <span style={RP.vTime}>{violation.receivedAt ? format(new Date(violation.receivedAt), 'HH:mm:ss') : '--:--:--'}</span>
                </div>
            </div>
        </div>
    )
}

const RP = {
    aside: {
        width: 'var(--right-w)',
        background: 'var(--bg-1)',
        borderLeft: '1px solid var(--border-1)',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden', flexShrink: 0,
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px 0', flexShrink: 0,
    },
    headerTitle: { fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-3)' },
    badge: {
        background: 'var(--red)', color: 'white',
        fontSize: 9, padding: '2px 6px', borderRadius: 10,
        fontFamily: 'var(--font-mono)',
    },
    tabs: { display: 'flex', padding: '8px 12px 0', gap: 4, flexShrink: 0 },
    tab: {
        flex: 1, background: 'var(--bg-2)',
        border: '1px solid var(--border-1)', borderRadius: 'var(--r-md)',
        color: 'var(--text-3)', padding: '6px 8px',
        fontSize: 10, fontWeight: 700, letterSpacing: 1,
        cursor: 'pointer', fontFamily: 'var(--font-display)',
        borderBottom: '2px solid transparent', transition: 'all 0.15s',
    },
    tabActive: { color: 'var(--red)', borderBottom: '2px solid var(--red)', background: 'var(--red-bg)', borderBottomColor: 'var(--red)' },
    chartSection: { padding: 12 },
    chartSummary: { display: 'flex', gap: 8, marginBottom: 12 },
    chartStat: { flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-md)', padding: '8px 10px' },
    chartStatNum: { display: 'block', fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text-0)' },
    chartStatLabel: { display: 'block', fontSize: 8, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.8, fontFamily: 'var(--font-display)', marginTop: 2 },
    feed: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 8px' },
    emptyFeed: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' },
    vItem: {
        background: 'var(--bg-2)',
        borderRadius: 'var(--r-lg)',
        padding: '10px 12px',
        border: '1px solid var(--border-1)',
        borderLeft: '3px solid var(--red)',
        flexShrink: 0,
    },
    vHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    vId: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-0)' },
    vSpeed: {
        background: 'var(--red-bg)', color: 'var(--red)',
        fontSize: 11, padding: '1px 6px', borderRadius: 3,
        fontFamily: 'var(--font-mono)', border: '1px solid rgba(240,65,75,0.25)',
    },
    vDetails: { display: 'flex', gap: 8, marginBottom: 4 },
    vDetail: { fontSize: 10, color: 'var(--text-3)' },
    vFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    vDriver: { fontSize: 10, color: 'var(--text-2)' },
    vPenaltyRow: { display: 'flex', gap: 8, alignItems: 'center' },
    vPenalty: { fontSize: 11, color: 'var(--red)', fontFamily: 'var(--font-mono)' },
    vTime: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)' },
}