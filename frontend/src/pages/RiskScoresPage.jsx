import React, { useState, useEffect } from 'react'
import apiClient from '../api/client'

const RISK_COLORS = {
    LOW: '#22C55E',     // green
    MEDIUM: '#F59E0B',  // amber
    HIGH: '#CC0000',    // red
}

export default function RiskScoresPage() {
    const [riskScores, setRiskScores] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        setError('')
        try {
            const riskRes = await apiClient.get('/risk/drivers')
            setRiskScores(riskRes.data)
        } catch (err) {
            setError('Could not load risk scores. Ensure the backend service is running.')
        } finally {
            setLoading(false)
        }
    }

    const handleRecalculate = async () => {
        setLoading(true)
        try {
            await apiClient.post('/risk/calculate')
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
                    <h1 style={S.pageTitle}>AI DRIVER RISK SCORES</h1>
                    <div style={S.pageSubtitle}>Weekly AI driver risk scoring index</div>
                </div>
                <button style={S.recalcBtn} onClick={handleRecalculate}>
                    ↻ RECALCULATE SCORES
                </button>
            </div>

            {error && <div style={S.error}>{error}</div>}

            {loading ? (
                <div style={S.loading}>Loading data...</div>
            ) : (
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
                            Score based on: 7‑day violations (40pts) + harsh driving (20pts) + max speed (30pts) + 30‑day pattern (10pts)
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
