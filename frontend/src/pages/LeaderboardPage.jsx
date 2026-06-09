import React, { useState, useEffect } from 'react'
import apiClient from '../api/client'

const BADGE_COLORS = {
    GOLD: '#FFB81C',
    SILVER: '#718096',
    BRONZE: '#CD7F32',
}

const BADGE_EMOJIS = {
    GOLD: '🥇',
    SILVER: '🥈',
    BRONZE: '🥉',
}

const RISK_COLORS = {
    LOW: '#22C55E',     // green
    MEDIUM: '#F59E0B',  // amber
    HIGH: '#CC0000',    // red
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
            setError('Could not load data. Make sure the backend service is running.')
        } finally {
            setLoading(false)
        }
    }

    const handleRecalculate = async () => {
        setLoading(true)
        try {
            await Promise.all([
                apiClient.post('/leaderboard/calculate'),
                apiClient.post('/risk/calculate'),
            ])
            await loadData()
        } catch (err) {
            setError('Recalculation failed.')
            setLoading(false)
        }
    }

    return (
        <div style={S.page}>
            {/* Header */}
            <div style={S.header}>
                <div>
                    <h1 style={S.pageTitle}>DRIVER SAFETY PERFORMANCE</h1>
                    <div style={S.pageSubtitle}>
                        Weekly safety leaderboard & AI driver risk scoring index
                    </div>
                </div>
                <button style={S.recalcBtn} onClick={handleRecalculate}>
                    ↻ RECALCULATE SCORES
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
                                                borderColor: BADGE_COLORS[driver.badge_type] || '#E2E8F0',
                                                transform: isFirst ? 'scale(1.06)' : 'scale(1)',
                                                boxShadow: isFirst ? '0 10px 25px rgba(13,27,62,0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
                                                zIndex: isFirst ? 2 : 1,
                                            }}>
                                                <div style={S.badgeEmoji}>
                                                    {BADGE_EMOJIS[driver.badge_type] || '👤'}
                                                </div>
                                                <div style={S.podiumRank}>#{driver.rank} PLACE</div>
                                                <div style={S.podiumName}>{driver.driver_name}</div>
                                                <div style={S.podiumStat}>
                                                    <strong>{driver.violation_count}</strong> violations
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
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>RANK</th>
                                            <th>DRIVER NAME</th>
                                            <th>VIOLATIONS</th>
                                            <th>HARSH DRIVING</th>
                                            <th>TOTAL PENALTY</th>
                                            <th>BADGE STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((driver, i) => (
                                            <tr key={i}>
                                                <td style={{ ...S.tdMono, fontWeight: 700 }}>#{driver.rank}</td>
                                                <td style={S.td}>{driver.driver_name}</td>
                                                <td style={{
                                                    ...S.tdMono,
                                                    fontWeight: 700,
                                                    color: driver.violation_count === 0 ? 'var(--green-500)' :
                                                        driver.violation_count < 3 ? 'var(--amber-500)' : '#CC0000'
                                                }}>
                                                    {driver.violation_count}
                                                </td>
                                                <td style={{ ...S.tdMono, color: driver.harsh_driving_count > 0 ? 'var(--amber-500)' : '#718096' }}>
                                                    {driver.harsh_driving_count || 0}
                                                </td>
                                                <td style={{ ...S.tdMono, color: '#CC0000', fontWeight: 600 }}>
                                                    ₹{(driver.total_penalty || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td style={S.td}>
                                                    {driver.badge_type ? (
                                                        <span style={{
                                                            color: BADGE_COLORS[driver.badge_type],
                                                            fontWeight: 700,
                                                            fontSize: '12px',
                                                            background: `${BADGE_COLORS[driver.badge_type]}1A`,
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            border: `1.5px solid ${BADGE_COLORS[driver.badge_type]}33`
                                                        }}>
                                                            {BADGE_EMOJIS[driver.badge_type]} {driver.badge_type}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#A0AEC0' }}>—</span>
                                                    )}
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
                                    <span style={{ ...S.legendBadge, background: 'var(--green-bg)', color: 'var(--green-500)', borderColor: 'var(--green-bg)' }}>
                                        0–30 LOW RISK
                                    </span>
                                    <span style={{ ...S.legendBadge, background: 'var(--amber-bg)', color: 'var(--amber-500)', borderColor: 'var(--amber-bg)' }}>
                                        31–70 MEDIUM RISK
                                    </span>
                                    <span style={{ ...S.legendBadge, background: 'var(--red-bg)', color: '#CC0000', borderColor: 'var(--red-border)' }}>
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
                                                ...S.riskScoreVal,
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
        flex: 1,
        overflowY: 'auto',
        background: '#F0F2F5',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    header: {
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
    recalcBtn: {
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
    error: {
        background: 'rgba(204,0,0,0.1)',
        border: '1px solid rgba(204,0,0,0.2)',
        borderRadius: '6px',
        padding: '12px 16px',
        color: '#CC0000',
        fontSize: '13px',
    },
    tabs: {
        display: 'flex',
        gap: '8px',
        borderBottom: '1.5px solid #E2E8F0',
        paddingBottom: '8px',
    },
    tab: {
        background: 'transparent',
        border: '1.5px solid #E2E8F0',
        borderRadius: '6px',
        color: '#718096',
        padding: '8px 18px',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 700,
        transition: 'all 0.15s',
    },
    tabActive: {
        background: '#0D1B3E',
        color: '#FFFFFF',
        borderColor: '#0D1B3E',
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#718096',
        fontFamily: 'monospace',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    podium: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        alignItems: 'flex-end',
        padding: '24px 0',
    },
    podiumCard: {
        background: '#FFFFFF',
        border: '2px solid',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        minWidth: '170px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
    },
    badgeEmoji: {
        fontSize: '32px',
    },
    podiumRank: {
        fontSize: '10px',
        fontWeight: 700,
        color: '#718096',
        letterSpacing: '0.5px',
    },
    podiumName: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        fontWeight: 800,
        color: '#0D1B3E',
    },
    podiumStat: {
        fontSize: '12px',
        color: '#4A5568',
    },
    podiumPenalty: {
        fontSize: '14px',
        color: '#CC0000',
        fontWeight: 700,
        fontFamily: 'monospace',
    },
    tableCard: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    td: {
        padding: '12px 16px',
        fontSize: '13px',
        color: '#1A202C',
    },
    tdMono: {
        padding: '12px 16px',
        fontSize: '13px',
        color: '#1A202C',
        fontFamily: 'monospace',
    },
    legend: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    legendTitle: {
        fontSize: '10px',
        fontWeight: 700,
        color: '#718096',
        letterSpacing: '0.5px',
        marginBottom: '12px',
    },
    legendItems: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '8px',
    },
    legendBadge: {
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '0.5px',
        border: '1.5px solid transparent',
    },
    legendNote: {
        fontSize: '11px',
        color: '#718096',
        marginTop: '8px',
    },
    riskGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '14px',
    },
    riskCard: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    riskHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
    },
    riskName: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 800,
        color: '#0D1B3E',
    },
    riskScoreVal: {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontWeight: 800,
    },
    riskLevel: {
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        marginBottom: '10px',
    },
    riskStats: {
        display: 'flex',
        gap: '16px',
        fontSize: '11px',
        color: '#718096',
        marginBottom: '10px',
    },
    riskBarBg: {
        height: '4px',
        background: '#F0F2F5',
        borderRadius: '2px',
        overflow: 'hidden',
    },
    riskBarFill: {
        height: '100%',
        borderRadius: '2px',
        transition: 'width 0.5s ease',
    },
}