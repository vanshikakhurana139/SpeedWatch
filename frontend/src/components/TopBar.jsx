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

    const handleLogout = () => {
        authApi.logout()
        navigate('/login')
    }

    // Build ticker from real violation messages — falls back to idle message
    const tickerText = tickerMessages.length > 0
        ? tickerMessages.map((m) => `[${m.time}]  ${m.text}`).join('          ·          ')
        : 'SpeedWatch monitoring system active — all channels nominal — SAIL RDCIS Ranchi'

    const activeCount = Object.keys(vehiclePositions).length
    const violationCount = Object.values(vehiclePositions).filter(v => v.status === 'violation').length

    const navItems = [
        { id: 'dashboard', label: 'LIVE MAP' },
        { id: 'reports', label: 'REPORTS' },
        { id: 'leaderboard', label: 'LEADERBOARD' },
    ]

    return (
        <div style={S.bar}>
            {/* ── Brand ── */}
            <div style={S.brand}>
                <div style={S.brandDot} />
                <div>
                    <div style={S.brandName}>SPEEDWATCH</div>
                    <div style={S.brandSub}>SAIL · RDCIS · CONTROL ROOM</div>
                </div>
            </div>

            {/* ── Nav tabs ── */}
            <nav style={S.nav}>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        style={{
                            ...S.navBtn,
                            ...(activePage === item.id ? S.navBtnActive : {}),
                        }}
                        onClick={() => setActivePage(item.id)}
                    >
                        {item.label}
                        {/* Badge: show violation count on the map tab */}
                        {item.id === 'dashboard' && violationCount > 0 && (
                            <span style={S.violationBadge}>{violationCount}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* ── Live ticker ── */}
            <div style={S.tickerWrap}>
                <span style={S.liveTag}>LIVE</span>
                <div style={S.tickerTrack}>
                    {/* key={tickerText.length} forces the animation to restart on new message */}
                    <span key={tickerText} style={S.tickerText}>{tickerText}</span>
                </div>
            </div>

            {/* ── Right: stats + status + clock + user ── */}
            <div style={S.right}>
                {/* Mini KPIs */}
                <div style={S.miniKpi}>
                    <span style={S.miniKpiNum}>{activeCount}</span>
                    <span style={S.miniKpiLabel}>Active</span>
                </div>
                <div style={S.miniKpiDivider} />
                <div style={S.miniKpi}>
                    <span style={{ ...S.miniKpiNum, color: violationCount > 0 ? 'var(--red)' : 'var(--text-2)' }}>
                        {violationCount}
                    </span>
                    <span style={S.miniKpiLabel}>Violating</span>
                </div>
                <div style={S.miniKpiDivider} />

                {/* WS connection indicator */}
                <div style={S.connWrap}>
                    <span style={{
                        ...S.connDot,
                        background: wsConnected ? 'var(--green)' : 'var(--red)',
                        boxShadow: wsConnected ? '0 0 6px var(--green)' : 'none',
                    }} />
                    <span style={S.connLabel}>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
                </div>

                {/* HH:MM:SS clock */}
                <span style={S.clock}>
                    {time.toLocaleTimeString('en-IN', { hour12: false })}
                </span>

                {/* Logged-in user */}
                {user && (
                    <div style={S.userChip}>
                        <span style={S.userName}>{user.name}</span>
                        <span style={S.userRole}>{user.role?.toUpperCase()}</span>
                    </div>
                )}

                {/* Logout */}
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
        position: 'relative',
        overflow: 'hidden',
    },
    brand: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 18px',
        borderRight: '1px solid var(--border-1)',
        height: '100%',
        minWidth: '190px',
        flexShrink: 0,
    },
    brandDot: {
        width: '8px', height: '8px', borderRadius: '50%',
        background: 'var(--green)',
        boxShadow: '0 0 8px var(--green)',
        flexShrink: 0,
        animation: 'blink-dot 2.5s ease-in-out infinite',
    },
    brandName: {
        fontFamily: 'var(--font-mono)', fontSize: '13px',
        color: 'var(--text-0)', letterSpacing: '2px',
    },
    brandSub: {
        fontSize: '8px', color: 'var(--text-3)', letterSpacing: '1px',
        fontFamily: 'var(--font-hmi)', fontWeight: 700, textTransform: 'uppercase',
    },
    nav: {
        display: 'flex', alignItems: 'center',
        height: '100%',
        borderRight: '1px solid var(--border-1)',
        padding: '0 6px',
        gap: '2px',
        flexShrink: 0,
    },
    navBtn: {
        background: 'transparent', border: 'none',
        color: 'var(--text-2)', fontSize: '11px', fontWeight: 700,
        letterSpacing: '1.2px', padding: '6px 14px',
        borderRadius: '4px', cursor: 'pointer',
        fontFamily: 'var(--font-hmi)',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: '6px',
        height: '32px',
        borderBottom: '2px solid transparent',
    },
    navBtnActive: {
        color: 'var(--blue)',
        borderBottom: '2px solid var(--blue)',
        background: 'rgba(59,130,246,0.08)',
    },
    violationBadge: {
        background: 'var(--red)',
        color: 'white',
        fontSize: '9px', fontWeight: 700,
        padding: '1px 5px', borderRadius: '8px',
        fontFamily: 'var(--font-mono)',
        animation: 'blink-dot 1s infinite',
    },
    tickerWrap: {
        flex: 1,
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 14px',
        overflow: 'hidden', height: '100%',
        minWidth: 0,
    },
    liveTag: {
        background: 'var(--red)', color: 'white',
        fontSize: '9px', fontWeight: 700, padding: '2px 7px',
        borderRadius: '2px', letterSpacing: '1px',
        flexShrink: 0, fontFamily: 'var(--font-hmi)',
    },
    tickerTrack: { overflow: 'hidden', flex: 1 },
    tickerText: {
        display: 'inline-block',
        color: 'var(--text-2)', fontSize: '11px',
        fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
        animation: 'ticker-scroll 60s linear infinite',
    },
    right: {
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '0 16px',
        borderLeft: '1px solid var(--border-1)',
        height: '100%', flexShrink: 0,
    },
    miniKpi: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' },
    miniKpiNum: {
        fontFamily: 'var(--font-mono)', fontSize: '15px',
        color: 'var(--text-0)', lineHeight: 1,
    },
    miniKpiLabel: {
        fontSize: '8px', fontWeight: 700, letterSpacing: '0.8px',
        color: 'var(--text-3)', textTransform: 'uppercase',
    },
    miniKpiDivider: { width: '1px', height: '24px', background: 'var(--border-1)', flexShrink: 0 },
    connWrap: { display: 'flex', alignItems: 'center', gap: '5px' },
    connDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
    connLabel: {
        fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
        color: 'var(--text-3)', fontFamily: 'var(--font-hmi)',
    },
    clock: {
        fontFamily: 'var(--font-mono)', fontSize: '13px',
        color: 'var(--text-1)', letterSpacing: '1px', flexShrink: 0,
    },
    userChip: {
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px',
    },
    userName: { fontSize: '11px', color: 'var(--text-1)', fontFamily: 'var(--font-hmi)', fontWeight: 600 },
    userRole: { fontSize: '8px', color: 'var(--text-3)', letterSpacing: '1px', fontFamily: 'var(--font-hmi)', fontWeight: 700 },
    logoutBtn: {
        background: 'transparent', border: '1px solid var(--border-2)',
        color: 'var(--text-3)', padding: '4px 10px', borderRadius: '4px',
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
        cursor: 'pointer', fontFamily: 'var(--font-hmi)',
        transition: 'all 0.15s', flexShrink: 0,
    },
}