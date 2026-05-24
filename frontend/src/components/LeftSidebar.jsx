import { useDashboardStore as useStore } from '../store/dashboardStore'

export default function LeftSidebar() {
    const { vehiclePositions, violations, setSelectedVehicle, selectedVehicleId } = useStore()

    const vehicles = Object.entries(vehiclePositions)
    const counts = vehicles.reduce(
        (acc, [, v]) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc },
        { safe: 0, warning: 0, violation: 0 }
    )
    const todayPenalty = violations.reduce((s, v) => s + (v.penalty_amount || 0), 0)

    return (
        <aside style={LS.aside}>
            {/* KPIs */}
            <div style={LS.kpiSection}>
                <div className="section-label">Fleet Overview</div>
                <div style={LS.kpiGrid}>
                    <KpiTile value={vehicles.length} label="Active" color="var(--blue)" />
                    <KpiTile value={counts.safe || 0} label="Safe" color="var(--green)" />
                    <KpiTile value={counts.warning || 0} label="Warning" color="var(--amber)" />
                    <KpiTile value={counts.violation || 0} label="Violation" color="var(--red)" />
                </div>
                <div style={LS.penaltyBox}>
                    <div style={LS.penaltyLabel}>Today's total penalty</div>
                    <div style={LS.penaltyValue}>₹ {todayPenalty.toLocaleString('en-IN')}</div>
                </div>
            </div>

            <div className="divider" />

            {/* Vehicle list */}
            <div className="section-label">Active Vehicles</div>
            <div style={LS.vehicleList}>
                {vehicles.length === 0 && (
                    <div style={LS.emptyState}>
                        <div style={LS.emptyIcon}>◉</div>
                        <div style={LS.emptyText}>No active vehicles</div>
                        <div style={LS.emptyHint}>Waiting for drivers to start trips</div>
                    </div>
                )}
                {vehicles.map(([vid, v]) => (
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

function KpiTile({ value, label, color }) {
    return (
        <div className="kpi-tile" style={{ borderTop: `2px solid ${color}` }}>
            <span className="kpi-value" style={{ color }}>{value}</span>
            <span className="kpi-label">{label}</span>
        </div>
    )
}

function VehicleRow({ vehicleId, vehicle, selected, onClick }) {
    const color = vehicle.status === 'violation' ? 'var(--red)'
        : vehicle.status === 'warning' ? 'var(--amber)' : 'var(--green)'
    const speed = Math.round(vehicle.speed || 0)

    return (
        <div
            style={{ ...LS.vRow, ...(selected ? LS.vRowSelected : {}), borderLeft: `3px solid ${color}` }}
            onClick={onClick}
        >
            <div style={{ ...LS.vDot, background: color, ...(vehicle.status === 'violation' ? { animation: 'pulse-ring 1.4s infinite' } : vehicle.status === 'warning' ? { animation: 'pulse-amber 1.6s infinite' } : {}) }} />
            <div style={LS.vInfo}>
                <div style={LS.vId}>{vehicleId}</div>
                <div style={LS.vDriver}>{vehicle.driverName}</div>
            </div>
            <div style={{ color, fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 400, flexShrink: 0 }}>
                {speed}<span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '1px' }}>km/h</span>
            </div>
        </div>
    )
}

const LS = {
    aside: {
        width: 'var(--sidebar-w)',
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border-1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
    },
    kpiSection: { padding: '0 0 8px' },
    kpiGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '0 12px 10px' },
    penaltyBox: {
        margin: '0 12px',
        background: 'var(--bg-2)',
        border: '1px solid var(--border-1)',
        borderRadius: '6px',
        padding: '10px 12px',
    },
    penaltyLabel: { fontSize: '9px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '1px', textTransform: 'uppercase' },
    penaltyValue: { fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--red)', marginTop: '3px' },
    vehicleList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px 8px' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: '6px' },
    emptyIcon: { fontSize: '24px', color: 'var(--text-3)', opacity: 0.4 },
    emptyText: { fontSize: '12px', color: 'var(--text-2)', fontWeight: 600 },
    emptyHint: { fontSize: '10px', color: 'var(--text-3)', textAlign: 'center' },
    vRow: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        background: 'transparent',
        transition: 'background 0.15s',
        borderLeft: '3px solid transparent',
    },
    vRowSelected: { background: 'var(--bg-2)' },
    vDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
    vInfo: { flex: 1, overflow: 'hidden' },
    vId: { fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-0)', letterSpacing: '0.5px' },
    vDriver: { fontSize: '10px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' },
}