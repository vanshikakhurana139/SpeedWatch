import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useDashboardStore } from '../store/dashboardStore'
import { format, isToday } from 'date-fns'

export default function RightPanel() {
    const { violations, hourlyViolationCounts } = useDashboardStore()
    const [tab, setTab] = useState('feed') // 'feed' | 'chart'

    const currentHour = new Date().getHours()
    const chartData = Array.from({ length: 24 }, (_, h) => ({
        h: h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`,
        count: hourlyViolationCounts[h.toString()] || 0,
        current: h === currentHour,
    }))

    return (
        <aside style={RP.aside}>
            {/* Tab switcher */}
            <div style={RP.tabs}>
                <button style={{ ...RP.tab, ...(tab === 'feed' ? RP.tabActive : {}) }} onClick={() => setTab('feed')}>
                    VIOLATIONS
                    {violations.length > 0 && <span style={RP.badge}>{violations.length}</span>}
                </button>
                <button style={{ ...RP.tab, ...(tab === 'chart' ? RP.tabActive : {}) }} onClick={() => setTab('chart')}>
                    CHART
                </button>
            </div>

            {tab === 'chart' && (
                <div style={RP.chartSection}>
                    <div style={RP.chartTitle}>Violations by hour (today)</div>
                    <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
                                <XAxis dataKey="h" tick={{ fontSize: 9, fill: 'var(--text-3)', fontFamily: 'Share Tech Mono' }} interval={3} />
                                <YAxis tick={{ fontSize: 9, fill: 'var(--text-3)', fontFamily: 'Share Tech Mono' }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '4px', fontSize: '11px', fontFamily: 'Share Tech Mono', color: 'var(--text-0)' }}
                                    labelStyle={{ color: 'var(--text-2)' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                />
                                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                                    {chartData.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={entry.current ? '#EF4444' : entry.count > 0 ? '#B91C1C' : '#2E3440'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={RP.chartStats}>
                        <div style={RP.statItem}>
                            <span style={RP.statVal}>{violations.length}</span>
                            <span style={RP.statLabel}>Total today</span>
                        </div>
                        <div style={RP.statItem}>
                            <span style={RP.statVal}>₹{violations.reduce((s, v) => s + (v.penalty_amount || 0), 0).toLocaleString('en-IN')}</span>
                            <span style={RP.statLabel}>Penalties</span>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'feed' && (
                <div style={RP.feed}>
                    {violations.length === 0 && (
                        <div style={RP.emptyFeed}>
                            <div style={{ fontSize: '24px', opacity: 0.2 }}>◎</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>No violations recorded</div>
                        </div>
                    )}
                    {violations.map((v) => (
                        <ViolationItem key={v._id} violation={v} />
                    ))}
                </div>
            )}
        </aside>
    )
}

function ViolationItem({ violation }) {
    const isNew = Date.now() - (violation.receivedAt || 0) < 3000
    const speed = Math.round(violation.speed_recorded || 0)
    const limit = violation.zone_limit || 50

    return (
        <div style={{
            ...RP.vItem,
            borderLeft: `3px solid var(--red)`,
            animation: isNew ? 'highlight-new 2s ease-out forwards' : 'none',
        }}>
            <div style={RP.vRow}>
                <span style={RP.vId}>{violation.vehicle_id || '—'}</span>
                <span style={RP.vSpeed}>{speed} km/h</span>
            </div>
            <div style={RP.vRow2}>
                <span style={RP.vDetail}>Limit: {limit} km/h</span>
                <span style={RP.vPenalty}>₹ {violation.penalty_amount || 0}</span>
            </div>
            {violation.driver_name && (
                <div style={RP.vDriver}>{violation.driver_name}</div>
            )}
            <div style={RP.vTime}>
                {violation.receivedAt ? format(new Date(violation.receivedAt), 'HH:mm:ss') : '--:--:--'}
            </div>
        </div>
    )
}

const RP = {
    aside: {
        width: 'var(--right-w)',
        background: 'var(--bg-1)',
        borderLeft: '1px solid var(--border-1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
    },
    tabs: {
        display: 'flex',
        borderBottom: '1px solid var(--border-1)',
        flexShrink: 0,
    },
    tab: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        color: 'var(--text-3)',
        padding: '10px 8px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '1px',
        cursor: 'pointer',
        fontFamily: 'var(--font-hmi)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        borderBottom: '2px solid transparent',
        transition: 'all 0.15s',
    },
    tabActive: {
        color: 'var(--text-1)',
        borderBottom: '2px solid var(--red)',
    },
    badge: {
        background: 'var(--red)',
        color: 'white',
        fontSize: '9px',
        padding: '1px 5px',
        borderRadius: '10px',
        fontFamily: 'var(--font-mono)',
    },
    chartSection: { padding: '12px' },
    chartTitle: { fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' },
    chartStats: { display: 'flex', gap: '8px', marginTop: '12px' },
    statItem: { flex: 1, background: 'var(--bg-2)', borderRadius: '4px', padding: '8px', border: '1px solid var(--border-1)' },
    statVal: { display: 'block', fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text-0)' },
    statLabel: { display: 'block', fontSize: '9px', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '2px' },
    feed: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px' },
    emptyFeed: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' },
    vItem: {
        background: 'var(--bg-2)',
        borderRadius: '4px',
        padding: '8px 10px',
        border: '1px solid var(--border-1)',
        flexShrink: 0,
    },
    vRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' },
    vId: { fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-0)', fontWeight: 400 },
    vSpeed: { background: 'var(--red-dim)', color: 'var(--red)', fontSize: '11px', padding: '1px 6px', borderRadius: '3px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(239,68,68,0.3)' },
    vRow2: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    vDetail: { fontSize: '10px', color: 'var(--text-3)' },
    vPenalty: { fontSize: '11px', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 400 },
    vDriver: { fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' },
    vTime: { fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-3)', marginTop: '3px' },
}