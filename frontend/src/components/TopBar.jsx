import React, { useState, useEffect } from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import { authApi } from '../api/auth'
import { useNavigate } from 'react-router-dom'

export default function TopBar() {
    const [time, setTime] = useState(new Date())
    const { wsConnected, tickerMessages, activePage, setActivePage, vehiclePositions, violations } = useDashboardStore()
    const navigate = useNavigate()
    const user = authApi.getCurrentUser()

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    const handleLogout = () => { authApi.logout(); navigate('/login') }

    const tickerText = tickerMessages.length > 0
        ? tickerMessages.map(m => `[${m.time}]  ${m.text}`).join('     ·     ')
        : 'SPEEDWATCH MONITORING ACTIVE  ·  ALL SYSTEMS NOMINAL  ·  SAIL RDCIS RANCHI  ·  INDUSTRIAL VEHICLE ENFORCEMENT'

    const activeCount = Object.keys(vehiclePositions).length
    const violationCount = Object.values(vehiclePositions).filter(v => v.status === 'violation').length

    const navItems = [
        { id: 'dashboard', label: 'LIVE MAP', icon: '◉' },
        { id: 'reports', label: 'REPORTS', icon: '≡' },
        { id: 'leaderboard', label: 'RANKINGS', icon: '↑' },
    ]

    return (
        <div style={S.bar}>
            {/* Brand */}
            <div style={S.brand}>
                <div style={S.sailLogo}>
                    <span style={S.sailText}>SAIL</span>
                </div>
                <div>
                    <div style={S.brandName}>SPEEDWATCH</div>
                    <div style={S.brandSub}>RDCIS · RANCHI</div>
                </div>
                <div style={{
                    ...S.statusPill,
                    background: wsConnected ? 'rgba(22,201,116,0.12)' : 'rgba(240,65,75,0.12)',
                    border: `1px solid ${wsConnected ? 'rgba(22,201,116,0.3)' : 'rgba(240,65,75,0.3)'}`,
                }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: wsConnected ? 'var(--green)' : 'var(--red)',
                        animation: wsConnected ? 'glow-pulse 2s infinite' : 'none',
                    }} />
                    <span style={{ color: wsConnected ? 'var(--green)' : 'var(--red)', fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 1 }}>
                        {wsConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav style={S.nav}>
                {navItems.map(item => (
                    <button
                        key={item.id}
                        style={{ ...S.navBtn, ...(activePage === item.id ? S.navBtnActive : {}) }}
                        onClick={() => setActivePage(item.id)}
                    >
                        <span style={{ fontSize: 11 }}>{item.icon}</span>
                        {item.label}
                        {item.id === 'dashboard' && violationCount > 0 && (
                            <span style={S.violationBadge}>{violationCount}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Ticker */}
            <div style={S.tickerWrap}>
                <div style={S.tickerTrack}>
                    <span key={tickerText.length} style={S.tickerText}>{tickerText}</span>
                </div>
            </div>

            {/* Right */}
            <div style={S.right}>
                <div style={S.kpiRow}>
                    <div style={S.miniKpi}>
                        <span style={S.miniNum}>{activeCount}</span>
                        <span style={S.miniLabel}>ACTIVE</span>
                    </div>
                    <div style={S.miniDivider} />
                    <div style={S.miniKpi}>
                        <span style={{ ...S.miniNum, color: violationCount > 0 ? 'var(--red)' : 'var(--text-2)' }}>
                            {violationCount}
                        </span>
                        <span style={S.miniLabel}>OVER</span>
                    </div>
                    <div style={S.miniDivider} />
                    <div style={S.miniKpi}>
                        <span style={{ ...S.miniNum, color: violations.length > 0 ? 'var(--amber)' : 'var(--text-2)' }}>
                            {violations.length}
                        </span>
                        <span style={S.miniLabel}>VIO</span>
                    </div>
                </div>

                <div style={S.clockBlock}>
                    <span style={S.clock}>{time.toLocaleTimeString('en-IN', { hour12: false })}</span>
                    <span style={S.clockDate}>{time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>

                {user && (
                    <div style={S.userChip}>
                        <div style={S.userAvatar}>{(user.name || 'S').charAt(0).toUpperCase()}</div>
                        <div>
                            <div style={S.userName}>{user.name}</div>
                            <div style={S.userRole}>{(user.role || 'SUPERVISOR').toUpperCase()}</div>
                        </div>
                    </div>
                )}

                <button onClick={handleLogout} style={S.logoutBtn}>SIGN OUT</button>
            </div>
        </div>
    )
}

const S = {
    bar: {
        height: 'var(--topbar-h)',
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border-1)',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 200,
        overflow: 'hidden',
    },
    brand: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 20px',
        borderRight: '1px solid var(--border-1)',
        height: '100%',
        minWidth: 220,
        flexShrink: 0,
    },
    sailLogo: {
        width: 38, height: 38, borderRadius: '50%',
        background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid var(--sail-gold)',
        flexShrink: 0,
    },
    sailText: {
        fontFamily: 'var(--font-display)',
        fontSize: 13, fontWeight: 700,
        color: 'var(--sail-navy)',
        letterSpacing: 1.5,
    },
    brandName: {
        fontFamily: 'var(--font-display)',
        fontSize: 14, fontWeight: 700,
        color: 'var(--text-0)',
        letterSpacing: 2,
    },
    brandSub: {
        fontSize: 9, color: 'var(--text-3)',
        letterSpacing: 1.5,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        textTransform: 'uppercase',
    },
    statusPill: {
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '3px 8px', borderRadius: 20,
        marginLeft: 4,
    },
    nav: {
        display: 'flex', alignItems: 'center',
        height: '100%',
        borderRight: '1px solid var(--border-1)',
        padding: '0 8px', gap: 2,
        flexShrink: 0,
    },
    navBtn: {
        background: 'transparent', border: 'none',
        color: 'var(--text-2)',
        fontSize: 11, fontWeight: 700,
        letterSpacing: 1.2,
        padding: '6px 16px',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-display)',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 6,
        height: 36,
        borderBottom: '2px solid transparent',
    },
    navBtnActive: {
        color: 'var(--blue)',
        borderBottom: '2px solid var(--blue)',
        background: 'var(--blue-bg)',
    },
    violationBadge: {
        background: 'var(--red)',
        color: 'white',
        fontSize: 9, fontWeight: 700,
        padding: '1px 5px', borderRadius: 10,
        fontFamily: 'var(--font-mono)',
        animation: 'blink 1s infinite',
    },
    tickerWrap: {
        flex: 1,
        overflow: 'hidden',
        height: '100%',
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        borderRight: '1px solid var(--border-1)',
        minWidth: 0,
    },
    tickerTrack: { overflow: 'hidden', width: '100%' },
    tickerText: {
        display: 'inline-block',
        color: 'var(--text-3)',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
        letterSpacing: 0.5,
        animation: 'ticker-scroll 80s linear infinite',
    },
    right: {
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px',
        height: '100%',
        flexShrink: 0,
    },
    kpiRow: { display: 'flex', alignItems: 'center', gap: 12 },
    miniKpi: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
    miniNum: { fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-0)', lineHeight: 1 },
    miniLabel: { fontSize: 8, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-3)', fontFamily: 'var(--font-display)' },
    miniDivider: { width: 1, height: 24, background: 'var(--border-1)', flexShrink: 0 },
    clockBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    clock: { fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-0)', letterSpacing: 1 },
    clockDate: { fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 1 },
    userChip: {
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-3)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-lg)',
        padding: '5px 12px 5px 6px',
    },
    userAvatar: {
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--blue-bg)',
        border: '1px solid rgba(59,139,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 12, fontWeight: 700,
        color: 'var(--blue)',
    },
    userName: { fontSize: 12, color: 'var(--text-0)', fontFamily: 'var(--font-body)', fontWeight: 600 },
    userRole: { fontSize: 9, color: 'var(--text-3)', letterSpacing: 1, fontFamily: 'var(--font-display)', fontWeight: 700 },
    logoutBtn: {
        background: 'transparent',
        border: '1px solid var(--border-2)',
        color: 'var(--text-3)',
        padding: '5px 12px',
        borderRadius: 'var(--r-md)',
        fontSize: 10, fontWeight: 700,
        letterSpacing: 0.5,
        cursor: 'pointer',
        fontFamily: 'var(--font-display)',
        transition: 'all 0.15s',
        flexShrink: 0,
    },
}