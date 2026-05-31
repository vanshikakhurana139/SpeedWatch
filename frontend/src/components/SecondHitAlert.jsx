import React from 'react'
import { useDashboardStore } from '../store/dashboardStore'

/**
 * SecondHitAlert — Shows when a driver has 3+ violations in 10 minutes
 * WHY: This is a predictive safety alert. The driver is in a dangerous
 * pattern RIGHT NOW. Supervisor needs to intervene immediately.
 */
export default function SecondHitAlert() {
    const { secondHitWarnings, clearSecondHitWarning } = useDashboardStore()
    const active = secondHitWarnings.filter(w => Date.now() - w.receivedAt < 60000) // Show for 60 seconds

    if (!active.length) return null

    return (
        <div style={styles.container}>
            {active.map((warning) => (
                <div key={warning._id} style={styles.alert}>
                    <div style={styles.icon}>⚠</div>
                    <div style={styles.content}>
                        <div style={styles.title}>PREDICTIVE ALERT — SECOND-HIT WARNING</div>
                        <div style={styles.detail}>
                            <strong>{warning.driver_name}</strong> has{' '}
                            <strong style={{ color: '#F59E0B' }}>
                                {warning.violation_count_10min} violations
                            </strong>{' '}
                            in the last 10 minutes. Intervention recommended.
                        </div>
                    </div>
                    <button
                        style={styles.closeBtn}
                        onClick={() => clearSecondHitWarning(warning._id)}
                    >
                        DISMISS
                    </button>
                </div>
            ))}
        </div>
    )
}

const styles = {
    container: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 999,
        display: 'flex', flexDirection: 'column',
    },
    alert: {
        background: '#7C3A00',
        borderBottom: '2px solid #F59E0B',
        display: 'flex', alignItems: 'center',
        padding: '10px 16px', gap: '12px',
        animation: 'slide-down 0.3s ease-out',
    },
    icon: { fontSize: '22px', color: '#F59E0B', flexShrink: 0 },
    content: { flex: 1 },
    title: {
        fontFamily: 'var(--font-mono)',
        fontSize: '11px', color: '#FCD34D',
        letterSpacing: '1px', marginBottom: '4px',
    },
    detail: {
        fontFamily: 'var(--font-hmi)',
        fontSize: '13px', color: '#FDE68A',
    },
    closeBtn: {
        background: 'transparent',
        border: '1px solid rgba(245,158,11,0.4)',
        color: '#FDE68A', padding: '4px 12px',
        borderRadius: '4px', fontSize: '10px',
        fontWeight: 700, cursor: 'pointer',
        fontFamily: 'var(--font-hmi)', letterSpacing: '0.5px',
    },
}