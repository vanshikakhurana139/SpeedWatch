import React, { useEffect, useState } from 'react'
import LiveMap from '../components/LiveMap'
import { geofencesApi } from '../api/geofences'
import { useDashboardStore } from '../store/dashboardStore'

export default function GeofencingPage({ onDrawGeofence }) {
    const [zones, setZones] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { violations } = useDashboardStore()

    const fetchZones = async () => {
        try {
            setLoading(true)
            const data = await geofencesApi.getGeofences()
            setZones(data)
            setError('')
        } catch (err) {
            console.error('Failed to load zones:', err)
            setError('Failed to fetch speed zones')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchZones()
    }, [])

    const handleDelete = async (zoneId) => {
        if (!window.confirm('Are you sure you want to delete this speed zone? This cannot be undone.')) return
        try {
            await geofencesApi.deleteGeofence(zoneId)
            fetchZones()
        } catch (err) {
            alert('Failed to delete zone. Please try again.')
        }
    }

    const ZONE_TYPES = {
        pedestrian: { label: 'Pedestrian', color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
        coal_yard: { label: 'Coal Yard', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        main_road: { label: 'Main Road', color: '#8A9099', bg: 'rgba(138,144,153,0.1)' },
        restricted: { label: 'Restricted', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        workshop: { label: 'Workshop', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
        ash_pond: { label: 'Ash Pond', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
        gate: { label: 'Gate', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    }

    // Get active alerts (violations status)
    const activeViolationsCount = violations.length
    // Get last 3 violations for recent enforcement
    const recentEnforcement = violations.slice(0, 3)

    return (
        <div style={S.root}>
            {/* Main Area: Zone Manager on Left, Map on Right */}
            <div style={S.main}>
                {/* Zone Manager Side Panel */}
                <div style={S.panel}>
                    <div style={S.panelHeader}>
                        <h2 style={S.panelTitle}>ZONE MANAGER</h2>
                        <span style={S.zoneCount}>{zones.length} active zones</span>
                    </div>

                    <div style={S.instructions}>
                        <div style={S.instructionsTitle}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            How to add a speed zone:
                        </div>
                        <div style={S.instructionsText}>
                            Use the drawing toolbar (⬡ polygon tool) on the top-left of the map to trace the boundary. A popup will ask for the zone details upon completion.
                        </div>
                    </div>

                    {/* Zone List Container */}
                    <div style={S.listContainer}>
                        {loading ? (
                            <div style={S.infoText}>Loading speed zones...</div>
                        ) : error ? (
                            <div style={{ ...S.infoText, color: '#CC0000' }}>{error}</div>
                        ) : zones.length === 0 ? (
                            <div style={S.infoText}>No speed zones defined. Draw one on the map to begin.</div>
                        ) : (
                            <div style={S.zoneList}>
                                {zones.map((zone) => {
                                    const typeInfo = ZONE_TYPES[zone.zone_type] || { label: zone.zone_type, color: '#A0AEC0', bg: 'rgba(160,174,192,0.1)' }
                                    return (
                                        <div key={zone.id} style={S.zoneItem}>
                                            <div style={S.zoneRow}>
                                                <div style={S.zoneName}>{zone.name}</div>
                                                <div style={{
                                                    ...S.limitBadge,
                                                    color: typeInfo.color,
                                                    background: typeInfo.bg,
                                                    borderColor: `${typeInfo.color}33`,
                                                }}>
                                                    {zone.speed_limit} km/h
                                                </div>
                                            </div>
                                            <div style={S.zoneRow}>
                                                <div style={{
                                                    ...S.typeBadge,
                                                    color: typeInfo.color,
                                                    background: typeInfo.bg,
                                                }}>
                                                    {typeInfo.label}
                                                </div>
                                                <button style={S.deleteBtn} onClick={() => handleDelete(zone.id)}>
                                                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                        <line x1="10" y1="11" x2="10" y2="17" />
                                                        <line x1="14" y1="11" x2="14" y2="17" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div style={S.mapWrapper}>
                    <LiveMap onDrawGeofence={onDrawGeofence} />
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div style={S.statusBar}>
                <div style={S.statusGroup}>
                    <span style={S.statusLabel}>TELEMETRY STATUS:</span>
                    <span style={S.statusValueOk}>SYS_OK</span>
                </div>
                <div style={S.statusBarDivider} />
                <div style={S.statusGroup}>
                    <span style={S.statusLabel}>ACTIVE ALERTS:</span>
                    <span style={activeViolationsCount > 0 ? S.statusAlertActive : S.statusValueOk}>
                        {activeViolationsCount}
                    </span>
                </div>
                <div style={S.statusBarDivider} />
                <div style={S.enforcementGroup}>
                    <span style={S.statusLabel}>RECENT ENFORCEMENT:</span>
                    <div style={S.enforcementFeed}>
                        {recentEnforcement.length === 0 ? (
                            <span style={S.enforcementItemEmpty}>No recent speed violations detected</span>
                        ) : (
                            recentEnforcement.map((v) => (
                                <span key={v._id || v.id} style={S.enforcementItem}>
                                    Vehicle <strong style={{ color: '#CC0000' }}>{v.vehicle_id || v.vehicleId}</strong> speeded in {v.zone_name || 'Zone'} ({v.speed || 0} km/h)
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const S = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#F0F2F5',
        overflow: 'hidden',
    },
    main: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    panel: {
        width: '320px',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
    },
    panelHeader: {
        padding: '16px 20px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        flexShrink: 0,
    },
    panelTitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 800,
        color: '#0D1B3E',
        letterSpacing: '0.5px',
    },
    zoneCount: {
        fontSize: '11px',
        fontWeight: 600,
        color: '#718096',
        background: '#F0F2F5',
        padding: '2px 8px',
        borderRadius: '10px',
    },
    instructions: {
        margin: '16px 20px',
        padding: '12px 14px',
        background: '#F8FAFC',
        border: '1px dashed #CBD5E1',
        borderRadius: '6px',
        flexShrink: 0,
    },
    instructionsTitle: {
        fontSize: '12px',
        fontWeight: 700,
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '6px',
    },
    instructionsText: {
        fontSize: '11px',
        color: '#64748B',
        lineHeight: 1.5,
    },
    listContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '0 20px 20px',
    },
    infoText: {
        fontSize: '12px',
        color: '#A0AEC0',
        textAlign: 'center',
        padding: '30px 10px',
    },
    zoneList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    zoneItem: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        transition: 'transform 0.15s, border-color 0.15s',
    },
    zoneRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
    },
    zoneName: {
        fontWeight: 600,
        fontSize: '13px',
        color: '#1A202C',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '160px',
    },
    limitBadge: {
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1.5px solid transparent',
    },
    typeBadge: {
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: '3px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
    },
    deleteBtn: {
        background: 'transparent',
        border: 'none',
        color: '#A0AEC0',
        fontSize: '11px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px',
        borderRadius: '4px',
        transition: 'all 0.15s',
    },
    mapWrapper: {
        flex: 1,
        position: 'relative',
        height: '100%',
        minWidth: 0,
    },
    statusBar: {
        height: '40px',
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        fontSize: '11px',
        color: '#718096',
        fontWeight: 600,
        flexShrink: 0,
    },
    statusGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    statusLabel: {
        letterSpacing: '0.5px',
        fontWeight: 700,
    },
    statusValueOk: {
        color: '#22C55E',
        fontWeight: 700,
    },
    statusAlertActive: {
        color: '#CC0000',
        fontWeight: 700,
        animation: 'blink 1.5s infinite',
    },
    statusBarDivider: {
        width: '1px',
        height: '16px',
        background: '#E2E8F0',
        margin: '0 16px',
    },
    enforcementGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        overflow: 'hidden',
    },
    enforcementFeed: {
        display: 'flex',
        gap: '24px',
        flex: 1,
        overflow: 'hidden',
    },
    enforcementItem: {
        color: '#4A5568',
        whiteSpace: 'nowrap',
    },
    enforcementItemEmpty: {
        color: '#A0AEC0',
        fontStyle: 'italic',
        fontWeight: 400,
    },
}
