import React, { useState, useEffect } from 'react'
import apiClient from '../api/client'

// ─── WHY THESE STYLES ───────────────────────────────────────────────────────
// SAIL theme colors: navy #003A70, blue #0066CC, gold #FFB81C
// Professional leaderboard that looks like an industrial safety board
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_COLORS = {
    GOLD: '#FFB81C',
    SILVER: '#C0C0C0',
    BRONZE: '#CD7F32',
}

const BADGE_EMOJIS = {
    GOLD: '🥇',
    SILVER: '🥈',
    BRONZE: '🥉',
}

const RISK_COLORS = {
    LOW: '#10B981',     // green
    MEDIUM: '#F59E0B',  // amber
    HIGH: '#EF4444',    // red
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([])
    const [riskScores, setRiskScores] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('leaderboard') // 'leaderboard' | 'risk'
    const [error, setError] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        setError('')
        try {
            const [lbRes, riskRes] = await Promise.all([
                apiClient.get('/leaderboard/weekly'),
                apiClient.get('/risk/drivers'),
            ])
            setLeaderboard(lbRes.data)
            setRiskScores(riskRes.data)
        } catch (err) {
            setError('Could not load data. Make sure Docker is running and backend restarted.')
        }
        setLoading(false)
    }

    const handleRecalculate = async () => {
        try {
            await Promise.all([
                apiClient.post('/leaderboard/calculate'),
                apiClient.post('/risk/calculate'),
            ])
            await loadData()
        } catch (err) {
            setError('Recalculation failed.')
        }
    }

    return (
        <div style={S.page}>
            {/* Header */}
            <div style={S.header}>
                <div>
                    <div style={S.pageTitle}>🏆 DRIVER SAFETY PERFORMANCE</div>
                    <div style={S.pageSubtitle}>
                        Weekly Leaderboard & AI Risk Scoring — SAIL RDCIS Ranchi
                    </div>
                </div>
                <button style={S.recalcBtn} onClick={handleRecalculate}>
                    ↻ RECALCULATE
                </button>
            </div>

            {error && <div style={S.error}>{error}</div>}

            {/* Tab switcher */}
            <div style={S.tabs}>
                <button
                    style={{ ...S.tab, ...(activeTab === 'leaderboard' ? S.tabActive : {}) }}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    🏆 SAFETY LEADERBOARD
                </button>
                <button
                    style={{ ...S.tab, ...(activeTab === 'risk' ? S.tabActive : {}) }}
                    onClick={() => setActiveTab('risk')}
                >
                    🎯 AI RISK SCORES
                </button>
            </div>

            {loading ? (
                <div style={S.loading}>Loading data...</div>
            ) : (
                <>
                    {/* LEADERBOARD TAB */}
                    {activeTab === 'leaderboard' && (
                        <div style={S.content}>
                            {/* Top 3 Podium */}
                            {leaderboard.length >= 3 && (
                                <div style={S.podium}>
                                    {[1, 0, 2].map((i) => {
                                        const driver = leaderboard[i]
                                        if (!driver) return null
                                        const isFirst = i === 0
                                        return (
                                            <div key={i} style={{
                                                ...S.podiumCard,
                                                borderColor: BADGE_COLORS[driver.badge_type] || '#555',
                                                transform: isFirst ? 'scale(1.08)' : 'scale(1)',
                                                zIndex: isFirst ? 2 : 1,
                                            }}>
                                                <div style={S.badgeEmoji}>
                                                    {BADGE_EMOJIS[driver.badge_type] || ''}
                                                </div>
                                                <div style={S.podiumRank}>#{driver.rank}</div>
                                                <div style={S.podiumName}>{driver.driver_name}</div>
                                                <div style={S.podiumStat}>
                                                    {driver.violation_count} violations
                                                </div>
                                                <div style={S.podiumPenalty}>
                                                    ₹{(driver.total_penalty || 0).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Full Table */}
                            <div style={S.tableCard}>
                                <table style={S.table}>
                                    <thead>
                                        <tr>
                                            {['RANK', 'DRIVER', 'VIOLATIONS', 'HARSH DRIVING', 'PENALTY', 'BADGE'].map(h => (
                                                <th key={h} style={S.th}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((driver, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? '#1E2128' : '#262B34' }}>
                                                <td style={S.tdMono}>#{driver.rank}</td>
                                                <td style={S.td}>{driver.driver_name}</td>
                                                <td style={{
                                                    ...S.tdMono,
                                                    color: driver.violation_count === 0 ? '#10B981' :
                                                        driver.violation_count < 3 ? '#F59E0B' : '#EF4444'
                                                }}>
                                                    {driver.violation_count}
                                                </td>
                                                <td style={{ ...S.tdMono, color: driver.harsh_driving_count > 0 ? '#F59E0B' : '#8A9099' }}>
                                                    {driver.harsh_driving_count || 0}
                                                </td>
                                                <td style={{ ...S.tdMono, color: '#EF4444' }}>
                                                    ₹{(driver.total_penalty || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td style={S.td}>
                                                    {driver.badge_type ? (
                                                        <span style={{
                                                            color: BADGE_COLORS[driver.badge_type],
                                                            fontWeight: 700,
                                                            fontSize: '16px',
                                                        }}>
                                                            {BADGE_EMOJIS[driver.badge_type]} {driver.badge_type}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* RISK SCORES TAB */}
                    {activeTab === 'risk' && (
                        <div style={S.content}>
                            {/* Risk Legend */}
                            <div style={S.legend}>
                                <div style={S.legendTitle}>AI RISK SCORE METHODOLOGY</div>
                                <div style={S.legendItems}>
                                    <span style={{ ...S.legendBadge, background: '#10B98120', color: '#10B981', border: '1px solid #10B981' }}>
                                        0–30 LOW RISK
                                    </span>
                                    <span style={{ ...S.legendBadge, background: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B' }}>
                                        31–70 MEDIUM RISK
                                    </span>
                                    <span style={{ ...S.legendBadge, background: '#EF444420', color: '#EF4444', border: '1px solid #EF4444' }}>
                                        71–100 HIGH RISK
                                    </span>
                                </div>
                                <div style={S.legendNote}>
                                    Score based on: 7-day violations (40pts) + harsh driving (20pts) + max speed (30pts) + 30-day pattern (10pts)
                                </div>
                            </div>

                            {/* Risk Score Cards */}
                            <div style={S.riskGrid}>
                                {riskScores.map((driver, i) => (
                                    <div key={i} style={{
                                        ...S.riskCard,
                                        borderLeft: `4px solid ${RISK_COLORS[driver.risk_level] || '#8A9099'}`,
                                    }}>
                                        <div style={S.riskHeader}>
                                            <div style={S.riskName}>{driver.driver_name}</div>
                                            <div style={{
                                                ...S.riskScore,
                                                color: RISK_COLORS[driver.risk_level] || '#8A9099',
                                            }}>
                                                {driver.risk_score}
                                            </div>
                                        </div>
                                        <div style={{
                                            ...S.riskLevel,
                                            color: RISK_COLORS[driver.risk_level] || '#8A9099',
                                        }}>
                                            {driver.risk_level} RISK
                                        </div>
                                        <div style={S.riskStats}>
                                            <span>7d violations: {driver.violation_7d}</span>
                                            <span>Max speed: {Math.round(driver.max_speed_7d)} km/h</span>
                                        </div>
                                        {/* Risk progress bar */}
                                        <div style={S.riskBarBg}>
                                            <div style={{
                                                ...S.riskBarFill,
                                                width: `${driver.risk_score}%`,
                                                background: RISK_COLORS[driver.risk_level] || '#8A9099',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
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
    header: {
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
    recalcBtn: {
        background: 'var(--blue-dim)', color: 'var(--blue)',
        border: '1px solid rgba(59,130,246,0.35)',
        borderRadius: '4px', padding: '8px 18px',
        fontWeight: 700, cursor: 'pointer',
        fontSize: '12px', letterSpacing: '1px',
        fontFamily: 'var(--font-hmi)',
    },
    error: {
        background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.35)',
        borderRadius: '4px', padding: '12px 16px',
        color: 'var(--red)', fontSize: '13px',
    },
    tabs: {
        display: 'flex', gap: '8px',
        borderBottom: '1px solid var(--border-1)', paddingBottom: '8px',
    },
    tab: {
        background: 'transparent',
        border: '1px solid var(--border-2)',
        borderRadius: '4px', color: 'var(--text-3)',
        padding: '8px 18px', cursor: 'pointer',
        fontFamily: 'var(--font-hmi)', fontSize: '12px', fontWeight: 700,
        letterSpacing: '1px',
    },
    tabActive: {
        background: 'var(--blue-dim)', color: 'var(--blue)',
        border: '1px solid rgba(59,130,246,0.35)',
    },
    loading: {
        textAlign: 'center', padding: '40px',
        color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
    },
    content: { display: 'flex', flexDirection: 'column', gap: '20px' },
    podium: {
        display: 'flex', justifyContent: 'center',
        gap: '16px', alignItems: 'flex-end', padding: '20px 0',
    },
    podiumCard: {
        background: 'var(--bg-2)', border: '2px solid',
        borderRadius: '8px', padding: '20px',
        textAlign: 'center', minWidth: '160px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    },
    badgeEmoji: { fontSize: '32px' },
    podiumRank: {
        fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)',
    },
    podiumName: {
        fontFamily: 'var(--font-hmi)', fontSize: '16px',
        fontWeight: 700, color: 'var(--text-0)',
    },
    podiumStat: { fontSize: '12px', color: 'var(--text-2)' },
    podiumPenalty: {
        fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--red)',
    },
    tableCard: {
        background: 'var(--bg-2)', border: '1px solid var(--border-1)',
        borderRadius: '6px', overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        background: 'var(--bg-4)', color: 'var(--text-3)',
        padding: '10px 16px', textAlign: 'left',
        fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
        fontFamily: 'var(--font-hmi)', textTransform: 'uppercase',
        borderBottom: '1px solid var(--border-2)',
    },
    td: {
        padding: '12px 16px', fontSize: '13px',
        color: 'var(--text-1)', borderBottom: '1px solid var(--border-0)',
        fontFamily: 'var(--font-hmi)',
    },
    tdMono: {
        padding: '12px 16px', fontSize: '13px',
        color: 'var(--text-1)', borderBottom: '1px solid var(--border-0)',
        fontFamily: 'var(--font-mono)',
    },
    legend: {
        background: 'var(--bg-2)', border: '1px solid var(--border-1)',
        borderRadius: '6px', padding: '16px 20px',
    },
    legendTitle: {
        fontSize: '10px', fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: '1.5px', marginBottom: '12px',
    },
    legendItems: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' },
    legendBadge: {
        padding: '4px 12px', borderRadius: '4px',
        fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-hmi)',
        letterSpacing: '0.5px',
    },
    legendNote: { fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' },
    riskGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px',
    },
    riskCard: {
        background: 'var(--bg-2)', border: '1px solid var(--border-1)',
        borderRadius: '6px', padding: '16px',
    },
    riskHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '6px',
    },
    riskName: {
        fontFamily: 'var(--font-hmi)', fontSize: '14px',
        fontWeight: 700, color: 'var(--text-0)',
    },
    riskScore: {
        fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700,
    },
    riskLevel: {
        fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
        marginBottom: '8px',
    },
    riskStats: {
        display: 'flex', gap: '16px',
        fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px',
    },
    riskBarBg: {
        height: '4px', background: 'var(--bg-4)', borderRadius: '2px', overflow: 'hidden',
    },
    riskBarFill: {
        height: '100%', borderRadius: '2px', transition: 'width 0.5s ease',
    },
}