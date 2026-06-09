import React from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import { authApi } from '../api/auth'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
    {
        id: 'dashboard', label: 'Dashboard',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    },
    {
        id: 'violations', label: 'Violations',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    },
    {
        id: 'risk_scores', label: 'Risk Scores',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
    },
    {
        id: 'geofencing', label: 'Geofencing',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
    },
    {
        id: 'reports', label: 'Reports',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
    },
]

const BOTTOM_ITEMS = [
    {
        id: 'settings', label: 'Settings',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
    },
    {
        id: 'support', label: 'Support',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    },
]

export default function LeftSidebar() {
    const { activePage, setActivePage, violations, vehiclePositions, selectedVehicleId, setSelectedVehicle } = useDashboardStore()
    const navigate = useNavigate()
    const user = authApi.getCurrentUser()
    const violationCount = violations.length
    
    const vehicles = Object.entries(vehiclePositions || {})
    const counts = vehicles.reduce(
        (acc, [, v]) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc },
        { safe: 0, warning: 0, violation: 0 }
    )
    const sessionPenalty = violations.reduce((s, v) => s + (v.penalty_amount || 0), 0)

    const handleLogout = () => { authApi.logout(); navigate('/login') }

    const initials = (user?.name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

    return (
        <aside style={S.aside}>
            {/* ── Brand Block ── */}
            <div style={S.brandBlock}>
                <div style={S.sailLogoBox}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <rect width="36" height="36" rx="4" fill="white" opacity="0.92" />
                        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
                            style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 800, fill: '#0D1B3E', letterSpacing: '0.5px' }}>
                            SAIL
                        </text>
                        <path d="M18 4 L32 18 L18 32 L4 18 Z" fill="none" stroke="#0D1B3E" strokeWidth="1.2" opacity="0.25" />
                    </svg>
                </div>
                <div style={S.brandText}>
                    <div style={S.brandTitle}>SAIL Plant</div>
                    <div style={S.brandTitle}>Security</div>
                    <div style={S.brandRole}>ADMIN TERMINAL</div>
                </div>
            </div>

            <div style={S.navDivider} />

            {/* ── Main Nav ── */}
            <nav style={S.nav}>
                {NAV_ITEMS.map(item => {
                    const isActive = activePage === item.id
                    const hasBadge = item.id === 'violations' && violationCount > 0
                    return (
                        <button
                            key={item.id}
                            style={{ ...S.navItem, ...(isActive ? S.navItemActive : {}) }}
                            onClick={() => setActivePage(item.id)}
                        >
                            <span style={{ ...S.navIcon, ...(isActive ? S.navIconActive : {}) }}>
                                {item.icon}
                            </span>
                            <span style={S.navLabel}>{item.label}</span>
                            {hasBadge && (
                                <span style={S.navBadge}>{violationCount}</span>
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* ── Emergency Support ── */}
            <div style={S.emergencyBlock}>
                <button style={S.emergencyBtn}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Emergency Support
                </button>
            </div>

            {/* ── Dashboard Extra / Spacer ── */}
            {activePage === 'dashboard' ? (
                <div style={S.dashboardExtra}>
                    <div style={S.navDivider} />
                    
                    {/* KPI Grid */}
                    <div style={S.kpiGrid}>
                        <div style={{ ...S.kpiCard, borderTop: `2px solid #22C55E` }}>
                            <div style={S.kpiCardTop}>
                                <span style={{ color: '#22C55E' }}>✓ SAFE</span>
                            </div>
                            <div style={{ ...S.kpiVal, color: '#22C55E' }}>{counts.safe || 0}</div>
                        </div>
                        <div style={{ ...S.kpiCard, borderTop: `2px solid #F59E0B` }}>
                            <div style={S.kpiCardTop}>
                                <span style={{ color: '#F59E0B' }}>△ CAUTION</span>
                                {counts.warning > 0 && <div className="pulse-amber" style={S.kpiDot} />}
                            </div>
                            <div style={{ ...S.kpiVal, color: '#F59E0B' }}>{counts.warning || 0}</div>
                        </div>
                        <div style={{ ...S.kpiCard, borderTop: `2px solid #CC0000`, gridColumn: 'span 2' }}>
                            <div style={S.kpiCardTop}>
                                <span style={{ color: '#CC0000', fontWeight: 'bold' }}>! OVER SPEED</span>
                                {counts.violation > 0 && <div className="pulse-red" style={S.kpiDot} />}
                            </div>
                            <div style={{ ...S.kpiVal, color: '#CC0000', fontSize: 22 }}>{counts.violation || 0}</div>
                        </div>
                    </div>

                    {/* Penalty card */}
                    <div style={S.penaltyCard}>
                        <div style={S.penaltyLabel}>SESSION PENALTIES</div>
                        <div style={S.penaltyValue}>₹ {sessionPenalty.toLocaleString('en-IN')}</div>
                        <div style={S.penaltyBar}>
                            <div style={{ ...S.penaltyFill, width: `${Math.min((sessionPenalty / 10000) * 100, 100)}%` }} />
                        </div>
                    </div>

                    <div style={S.navDivider} />

                    {/* Vehicle list */}
                    <div style={S.listHeader}>
                        <span>VEHICLES ONLINE</span>
                        <span style={{ color: '#4a72a8', fontWeight: 600 }}>{vehicles.length}</span>
                    </div>

                    <div style={S.vehicleList}>
                        {vehicles.length === 0 ? (
                            <div style={S.emptyState}>
                                <div style={{ fontSize: 20, opacity: 0.25 }}>◎</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>NO VEHICLES ONLINE</div>
                            </div>
                        ) : (
                            vehicles.map(([vid, v]) => {
                                const color = v.status === 'violation' ? '#CC0000'
                                    : v.status === 'warning' ? '#F59E0B' : '#22C55E'
                                const speed = Math.round(v.speed || 0)
                                const isSelected = selectedVehicleId === vid

                                return (
                                    <div
                                        key={vid}
                                        onClick={() => setSelectedVehicle(vid === selectedVehicleId ? null : vid)}
                                        style={{
                                            ...S.vRow,
                                            ...(isSelected ? S.vRowSelected : {}),
                                            borderLeft: `3px solid ${color}`,
                                        }}
                                    >
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={S.vRowId}>{vid}</div>
                                            <div style={S.vRowDriver}>{v.driverName || 'Driver'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' }}>
                                                {speed}<span style={{ fontSize: 9, opacity: 0.6, marginLeft: 1 }}>km/h</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1 }} />
            )}

            {/* ── Bottom Items ── */}
            <div style={S.bottomSection}>
                <div style={S.navDivider} />
                {BOTTOM_ITEMS.map(item => (
                    <button key={item.id} style={S.bottomItem}>
                        <span style={S.navIconSm}>{item.icon}</span>
                        <span style={S.bottomLabel}>{item.label}</span>
                    </button>
                ))}
                <div style={S.navDivider} />

                {/* User chip */}
                <div style={S.userChip}>
                    <div style={S.userAvatar}>{initials}</div>
                    <div style={S.userInfo}>
                        <div style={S.userName}>{user?.name || 'Supervisor'}</div>
                        <div style={S.userRole}>{(user?.role || 'supervisor').toUpperCase()}</div>
                    </div>
                    <button style={S.logoutBtn} onClick={handleLogout} title="Sign Out">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    )
}

const S = {
    aside: {
        width: 'var(--sidebar-w)',
        background: 'var(--navy-800)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
    },
    brandBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '20px 16px 18px',
        flexShrink: 0,
    },
    sailLogoBox: {
        flexShrink: 0,
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    },
    brandText: { display: 'flex', flexDirection: 'column', gap: 1 },
    brandTitle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 1.3,
    },
    brandRole: {
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    navDivider: {
        height: 1,
        background: 'rgba(255,255,255,0.07)',
        margin: '4px 0',
        flexShrink: 0,
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 10px',
        flexShrink: 0,
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 0.15s',
        color: 'rgba(255,255,255,0.58)',
        fontSize: 14,
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        border: 'none',
        background: 'transparent',
        width: '100%',
        textAlign: 'left',
    },
    navItemActive: {
        background: '#FFFFFF',
        color: '#0D1B3E',
        fontWeight: 600,
    },
    navIcon: { flexShrink: 0, opacity: 0.8 },
    navIconActive: { opacity: 1 },
    navIconSm: { flexShrink: 0, opacity: 0.6 },
    navLabel: { flex: 1 },
    navBadge: {
        background: '#CC0000',
        color: 'white',
        fontSize: 10,
        fontWeight: 700,
        padding: '1px 6px',
        borderRadius: 10,
        fontFamily: 'Inter, sans-serif',
        animation: 'blink 1.5s ease-in-out infinite',
    },
    emergencyBlock: {
        padding: '8px 10px 4px',
        flexShrink: 0,
    },
    emergencyBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        background: '#CC0000',
        color: 'white',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s',
    },
    bottomSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '4px 10px 12px',
        flexShrink: 0,
    },
    bottomItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        border: 'none',
        background: 'transparent',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s',
    },
    bottomLabel: {},
    userChip: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.07)',
        marginTop: 4,
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
    },
    userInfo: { flex: 1, overflow: 'hidden' },
    userName: {
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.88)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    userRole: {
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
    },
    logoutBtn: {
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.35)',
        cursor: 'pointer',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        borderRadius: 4,
        transition: 'color 0.15s',
    },
    dashboardExtra: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        padding: '10px 12px',
        flexShrink: 0,
    },
    kpiCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 6,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
    },
    kpiCardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
    },
    kpiDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        marginLeft: 'auto',
    },
    kpiVal: {
        fontFamily: 'monospace',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    kpiLbl: {
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.3)',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    penaltyCard: {
        margin: '4px 12px 10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 6,
        padding: '10px 12px',
        flexShrink: 0,
    },
    penaltyLabel: {
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    penaltyValue: {
        fontFamily: 'monospace',
        fontSize: 18,
        color: '#CC0000',
        fontWeight: 'bold',
        marginBottom: 6,
    },
    penaltyBar: {
        height: 3,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    penaltyFill: {
        height: '100%',
        background: '#CC0000',
        borderRadius: 2,
        transition: 'width 0.5s ease',
    },
    listHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px 6px',
        fontSize: 10,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
        flexShrink: 0,
    },
    vehicleList: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '0 8px 8px',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 12px',
        gap: 6,
        color: 'rgba(255,255,255,0.2)',
    },
    vRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        background: 'transparent',
        transition: 'background 0.15s',
        borderLeft: '3px solid transparent',
        flexShrink: 0,
        color: 'rgba(255,255,255,0.7)',
    },
    vRowSelected: {
        background: 'rgba(255,255,255,0.08)',
        color: 'white',
    },
    vRowId: {
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.5,
    },
    vRowDriver: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginTop: 1,
    },
}