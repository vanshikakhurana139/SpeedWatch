import React from 'react'
import { useDashboardStore } from '../store/dashboardStore'

export default function SosPanel() {
    const { sosAlerts, clearSosAlert } = useDashboardStore()
    const active = sosAlerts.filter((a) => !a.cleared)
    if (active.length === 0) return null

    return (
        <div style={styles.container} className="anim-slide">
            {active.map((alert) => (
                <div key={alert._id} style={styles.alert} className="anim-sos">
                    <div style={styles.left}>
                        <div style={styles.icon}>🚨</div>
                        <div style={styles.info}>
                            <div style={styles.title}>SOS EMERGENCY ALERT</div>
                            <div style={styles.detail}>
                                <span style={styles.chip}>Driver: {alert.driver_name || 'Unknown'}</span>
                                <span style={styles.chip}>Vehicle: {alert.vehicle_id}</span>
                                {alert.lat && (
                                    <span style={styles.chip}>
                                        Loc: {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                                    </span>
                                )}
                                <span style={{ ...styles.chip, opacity: 0.6 }}>
                                    {new Date(alert.receivedAt).toLocaleTimeString('en-IN', { hour12: false })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={styles.actions}>
                        <button
                            style={styles.clearBtn}
                            onClick={() => {
                                if (window.confirm('Confirm: Is the driver safe? This will clear the SOS alert.')) {
                                    clearSosAlert(alert._id)
                                }
                            }}
                        >
                            MARK SAFE & CLEAR
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

const styles = {
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
    },
    alert: {
        background: '#7F1D1D',
        borderBottom: '2px solid var(--red)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        gap: '16px',
    },
    left: { display: 'flex', alignItems: 'center', gap: '12px' },
    icon: { fontSize: '22px', flexShrink: 0 },
    info: { display: 'flex', flexDirection: 'column', gap: '4px' },
    title: {
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: '#FCA5A5',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
    },
    detail: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    chip: {
        background: 'rgba(239,68,68,0.2)',
        border: '1px solid rgba(239,68,68,0.35)',
        color: '#FCA5A5',
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '3px',
        fontFamily: 'var(--font-mono)',
    },
    actions: {},
    clearBtn: {
        background: 'transparent',
        border: '1px solid rgba(239,68,68,0.5)',
        color: '#FCA5A5',
        padding: '6px 14px',
        borderRadius: '4px',
        fontFamily: 'var(--font-hmi)',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.8px',
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
}