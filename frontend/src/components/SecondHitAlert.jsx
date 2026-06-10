import React, { useEffect } from 'react'
import { useDashboardStore } from '../store/dashboardStore'

/**
 * SecondHitAlert — Shows when a driver has 3+ violations in 10 minutes
 * WHY: This is a predictive safety alert. The driver is in a dangerous
 * pattern RIGHT NOW. Supervisor needs to intervene immediately.
 * 
 * Improvements:
 * - Shows max 3 visible alerts to avoid screen clutter
 * - Auto-dismisses alerts after 60 seconds
 * - Shows count of additional pending alerts
 */
export default function SecondHitAlert() {
    const { secondHitWarnings, clearSecondHitWarning } = useDashboardStore()
    const active = secondHitWarnings.filter(w => Date.now() - w.receivedAt < 60000) // Show for 60 seconds

    // Auto-dismiss old alerts
    useEffect(() => {
        if (active.length === 0) return
        const timer = setInterval(() => {
            active.forEach(warning => {
                if (Date.now() - warning.receivedAt > 60000) {
                    clearSecondHitWarning(warning._id)
                }
            })
        }, 5000)
        return () => clearInterval(timer)
    }, [active, clearSecondHitWarning])

    if (!active.length) return null

    const maxVisible = 3
    const visibleAlerts = active.slice(0, maxVisible)
    const hiddenCount = Math.max(0, active.length - maxVisible)

    return (
        <div style={styles.container}>
            {visibleAlerts.map((warning) => (
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

            {hiddenCount > 0 && (
                <div style={styles.alertCounter}>
                    <div style={styles.counterIcon}>+</div>
                    <div style={styles.counterText}>
                        {hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''} queued — See violations panel
                    </div>
                </div>
            )}
        </div>
    )
}

const styles = {
    container: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 999,
        display: 'flex', flexDirection: 'column',
        maxHeight: '70vh',
        overflow: 'hidden',
    },
    alert: {
        background: '#7C3A00',
        borderBottom: '2px solid #F59E0B',
        display: 'flex', alignItems: 'center',
        padding: '10px 16px', gap: '12px',
        animation: 'slide-down 0.3s ease-out',
        flexShrink: 0,
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
        flexShrink: 0,
    },
    alertCounter: {
        background: 'rgba(252, 211, 77, 0.1)',
        borderBottom: '2px solid #FCD34D',
        display: 'flex', alignItems: 'center',
        padding: '10px 16px', gap: '12px',
        flexShrink: 0,
        borderLeft: '3px solid #FCD34D',
    },
    counterIcon: {
        fontSize: '18px', color: '#FCD34D', fontWeight: 'bold',
        width: 24, height: 24, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
    },
    counterText: {
        fontFamily: 'var(--font-hmi)',
        fontSize: '12px', color: '#FCD34D',
        fontWeight: 500,
    },
}