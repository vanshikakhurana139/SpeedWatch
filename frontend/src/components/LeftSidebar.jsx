import React from 'react'
import { useDashboardStore } from '../store/dashboardStore'

export default function LeftSidebar() {
    const { vehiclePositions, violations, setSelectedVehicle, selectedVehicleId } = useDashboardStore()
    const vehicles = Object.entries(vehiclePositions)
    const counts = vehicles.reduce(
        (acc, [, v]) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc },
        { safe: 0, warning: 0, violation: 0 }
    )
    const sessionPenalty = violations.reduce((s, v) => s + (v.penalty_amount || 0), 0)

    return (
        <aside style={LS.aside}>
            {/* Header */}
            <div style={LS.header}>
                <span style={LS.headerTitle}>FLEET STATUS</span>
                <span style={LS.headerTime}>{new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
            </div>

            {/* KPI Grid */}
            <div style={LS.kpiGrid}>
                <KpiCard value={vehicles.length} label="ACTIVE" color="var(--blue)" icon="◉" />
                <KpiCard value={counts.safe || 0} label="SAFE" color="var(--green)" icon="✓" />
                <KpiCard value={counts.warning || 0} label="CAUTION" color="var(--amber)" icon="△" />
                <KpiCard value={counts.violation || 0} label="OVER LIMIT" color="var(--red)" icon="!" pulse={counts.violation > 0} />
            </div>

            {/* Penalty total */}
            <div style={LS.penaltyCard}>
                <div style={LS.penaltyLabel}>SESSION PENALTIES</div>
                <div style={LS.penaltyValue}>₹ {sessionPenalty.toLocaleString('en-IN')}</div>
                <div style={LS.penaltyBar}>
                    <div style={{ ...LS.penaltyFill, width: `${Math.min((sessionPenalty / 10000) * 100, 100)}%` }} />
                </div>
            </div>

            <div className="divider" />

            {/* Vehicle list */}
            <div style={LS.listHeader}>
                <span>VEHICLES ONLINE</span>
                <span style={{ color: 'var(--blue)' }}>{vehicles.length}</span>
            </div>

            <div style={LS.vehicleList}>
                {vehicles.length === 0 ? <EmptyState /> : vehicles.map(([vid, v]) => (
                    <VehicleRow
                        key={vid}
                        vehicleId={vid}
                        vehicle={v}
                        selected={selectedVehicleId === vid}
                        onClick={() => setSelectedVehicle(vid === selectedVehicleId ? null : vid)}
                    />
                ))}
            </div>
        </aside>
    )
}

function KpiCard({ value, label, color, icon, pulse }) {
    return (
        <div style={{ ...LS.kpiCard, borderTop: `2px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color, fontFamily: 'var(--font-display)', opacity: 0.8 }}>{icon}</span>
                {pulse && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: 'blink 1s infinite' }} />}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)', marginTop: 4 }}>{label}</div>
        </div>
    )
}

function EmptyState() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: 8 }}>
            <div style={{ fontSize: 28, opacity: 0.15, fontFamily: 'var(--font-mono)' }}>◎</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>NO ACTIVE VEHICLES</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>Start a trip from the mobile app</div>
        </div>
    )
}

function VehicleRow({ vehicleId, vehicle, selected, onClick }) {
    const color = vehicle.status === 'violation' ? 'var(--red)'
        : vehicle.status === 'warning' ? 'var(--amber)' : 'var(--green)'
    const speed = Math.round(vehicle.speed || 0)
    const isViol = vehicle.status === 'violation'
    const isWarn = vehicle.status === 'warning'

    return (
        <div
            onClick={onClick}
            style={{
                ...LS.vRow,
                ...(selected ? LS.vRowSelected : {}),
                borderLeft: `3px solid ${color}`,
            }}
        >
            <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: color,
                animation: isViol ? 'pulse-ring 1.4s infinite' : isWarn ? 'pulse-amber 1.6s infinite' : 'none',
            }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-0)', letterSpacing: 0.5 }}>{vehicleId}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                    {vehicle.driverName || 'Driver'}
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ color, fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1 }}>
                    {speed}<span style={{ fontSize: 8, opacity: 0.6, marginLeft: 1 }}>km/h</span>
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.6, color, fontFamily: 'var(--font-display)', opacity: 0.7, marginTop: 2 }}>
                    {(vehicle.status || 'SAFE').toUpperCase()}
                </div>
            </div>
        </div>
    )
}

const LS = {
    aside: {
        width: 'var(--sidebar-w)',
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border-1)',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden', flexShrink: 0,
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px 8px',
        borderBottom: '1px solid var(--border-0)',
        flexShrink: 0,
    },
    headerTitle: { fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-3)' },
    headerTime: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' },
    kpiGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 6, padding: '10px 12px',
        flexShrink: 0,
    },
    kpiCard: {
        background: 'var(--bg-2)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-lg)',
        padding: '10px 12px',
    },
    penaltyCard: {
        margin: '0 12px 12px',
        background: 'var(--bg-2)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-lg)',
        padding: '10px 12px',
        flexShrink: 0,
    },
    penaltyLabel: { fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-3)', marginBottom: 4 },
    penaltyValue: { fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--red)', marginBottom: 8 },
    penaltyBar: { height: 3, background: 'var(--bg-4)', borderRadius: 2, overflow: 'hidden' },
    penaltyFill: { height: '100%', background: 'var(--red)', borderRadius: 2, transition: 'width 0.5s ease' },
    listHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px 6px',
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-3)',
        flexShrink: 0,
    },
    vehicleList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px 8px' },
    vRow: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderRadius: 'var(--r-md)',
        cursor: 'pointer', background: 'transparent',
        transition: 'background 0.15s',
        borderLeft: '3px solid transparent', flexShrink: 0,
    },
    vRowSelected: { background: 'var(--bg-3)' },
}