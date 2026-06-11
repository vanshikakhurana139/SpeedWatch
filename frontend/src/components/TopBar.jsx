import React, { useState } from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import { authApi } from '../api/auth'
import { useNavigate } from 'react-router-dom'

const PAGE_TITLES = {
    dashboard: 'Live Monitoring',
    violations: 'Violations',
    leaderboard: 'Driver Safety',
    geofencing: 'Geofencing',
    reports: 'Reports & Analytics',
}

export default function TopBar() {
    const { wsConnected, activePage, vehiclePositions, violations, sosAlerts } = useDashboardStore()
    const navigate = useNavigate()
    const user = authApi.getCurrentUser()
    const [searchVal, setSearchVal] = useState('')

    const handleLogout = () => { authApi.logout(); navigate('/login') }

    const activeCount = Object.keys(vehiclePositions).length
    const violationCount = Object.values(vehiclePositions).filter(v => v.status === 'violation').length
    const activeSos = sosAlerts.filter(a => !a.cleared).length

    return (
        <header style={S.bar}>
            {/* Left: SpeedWatch title + page label */}
            <div style={S.left}>
                <div style={S.appName}>SpeedWatch Industrial</div>
                <div style={S.dividerV} />
                <div style={S.pageLabel}>{PAGE_TITLES[activePage] || 'Dashboard'}</div>
            </div>


            <div style={S.center}>
                <div style={S.searchWrap}>
                    <svg style={S.searchIcon} width="15" height="15" fill="none" stroke="#A0AEC0" strokeWidth="1.8" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        style={S.searchInput}
                        placeholder="Search data points..."
                        value={searchVal}
                        onChange={e => setSearchVal(e.target.value)}
                    />
                </div>
            </div>

            {/* Right: SOS + bell + user */}
            <div style={S.right}>
                {/* WS status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: wsConnected ? '#22C55E' : '#EF4444',
                        animation: wsConnected ? 'glow-pulse 2s infinite' : 'none',
                    }} />
                    <span style={{ fontSize: 11, color: wsConnected ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                        {wsConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>

                {/* Active vehicles mini count */}
                {activeCount > 0 && (
                    <div style={S.miniCount}>
                        <span style={S.miniNum}>{activeCount}</span>
                        <span style={S.miniLabel}>active</span>
                    </div>
                )}

                {/* SOS Alert button */}
                <button style={{
                    ...S.sosBtn,
                    animation: activeSos > 0 ? 'sos-flash 0.9s infinite' : 'none',
                    opacity: activeSos > 0 ? 1 : 0.85,
                }}>
                    {activeSos > 0 && <span style={S.sosDot}>{activeSos}</span>}
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    SOS ALERT
                </button>

                {/* Bell */}
                <button style={S.iconBtn}>
                    <svg width="18" height="18" fill="none" stroke="#4A5568" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    {violationCount > 0 && <span style={S.bellBadge}>{violationCount}</span>}
                </button>

                {/* User chip */}
                {user && (
                    <div style={S.userChip}>
                        <div style={S.userAvatar}>
                            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div>
                            <div style={S.userName}>{user.name || 'Admin Controller'}</div>

                        </div>
                    </div>
                )}

                <button style={S.signOutBtn} onClick={handleLogout}>Sign Out</button>
            </div>
        </header>
    )
}

const S = {
    bar: {
        height: 'var(--topbar-h)',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 200,
        padding: '0 20px',
        gap: 16,
    },
    left: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexShrink: 0,
    },
    appName: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 15,
        fontWeight: 800,
        color: '#0D1B3E',
        letterSpacing: -0.3,
    },
    dividerV: {
        width: 1,
        height: 18,
        background: '#E2E8F0',
    },
    pageLabel: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        color: '#718096',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    center: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
    },
    searchWrap: {
        position: 'relative',
        width: '100%',
        maxWidth: 320,
        display: 'flex',
        alignItems: 'center',
    },
    searchIcon: {
        position: 'absolute',
        left: 10,
        pointerEvents: 'none',
    },
    searchInput: {
        width: '100%',
        padding: '8px 12px 8px 34px',
        fontSize: 13,
        fontFamily: 'Inter, sans-serif',
        border: '1.5px solid #E2E8F0',
        borderRadius: 8,
        background: '#F7FAFC',
        color: '#1A202C',
        outline: 'none',
        transition: 'border-color 0.15s',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
    },
    miniCount: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
    },
    miniNum: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: 700,
        color: '#0D1B3E',
        lineHeight: 1,
    },
    miniLabel: {
        fontSize: 9,
        fontWeight: 600,
        color: '#A0AEC0',
        letterSpacing: 0.5,
    },
    sosBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        background: '#CC0000',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        letterSpacing: 0.5,
        position: 'relative',
    },
    sosDot: {
        position: 'absolute',
        top: -4,
        right: -4,
        background: '#FFB81C',
        color: '#0D1B3E',
        fontSize: 9,
        fontWeight: 800,
        width: 16,
        height: 16,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtn: {
        background: 'transparent',
        border: '1.5px solid #E2E8F0',
        borderRadius: 8,
        padding: 7,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.15s',
    },
    bellBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        background: '#CC0000',
        color: 'white',
        fontSize: 9,
        fontWeight: 700,
        width: 15,
        height: 15,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userChip: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    userAvatar: {
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: '#0D1B3E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
    },
    userName: {
        fontSize: 13,
        fontWeight: 600,
        color: '#1A202C',
        fontFamily: 'Inter, sans-serif',
    },
    userSub: {
        fontSize: 11,
        color: '#A0AEC0',
        fontFamily: 'Inter, sans-serif',
    },
    signOutBtn: {
        background: 'transparent',
        border: '1.5px solid #E2E8F0',
        color: '#718096',
        padding: '6px 12px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
    },
}