import React, { useState, useEffect, useRef } from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import { authApi } from '../api/auth'
import { useNavigate } from 'react-router-dom'

export default function TopBar() {
    const [time, setTime] = useState(new Date())
    const { wsConnected, tickerMessages, activePage, setActivePage } = useDashboardStore()
    const navigate = useNavigate()
    const user = authApi.getCurrentUser()
    const tickerRef = useRef(null)

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    const handleLogout = () => { authApi.logout(); navigate('/login') }

    const tickerText = tickerMessages.length > 0
        ? tickerMessages.map((m) => `[${m.time}] ${m.text}`).join('     ●     ')
        : 'SpeedWatch monitoring system active — all channels nominal'

    const navItems = [
        { id: 'dashboard', label: 'LIVE MAP' },
        { id: 'reports', label: 'REPORTS' },
        { id: 'leaderboard', label: 'LEADERBOARD' },
    ]

    return (
        <div style={S.bar}>
            {/* Brand */}
            <div style={S.brand}>
                <div style={S.brandDot} />
                <div>
                    <div style={S.brandName}>SPEEDWATCH</div>
                    <div style={S.brandSub}>SAIL · RDCIS · CONTROL ROOM</div>
                </div>
            </div>

            {/* Nav */}
            <div style={S.nav}>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        style={{ ...S.navBtn, ...(activePage === item.id ? S.navBtnActive : {}) }}
                        onClick={() => setActivePage(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Ticker */}
            <div style={S.tickerWrap}>
                <span style={S.liveTag}>LIVE</span>
                <div style={S.tickerTrack}>
                    <span key={tickerText.length} style={S.tickerText}>{tickerText}</span>
                </div>
            </div>

            {/* Right side */}
            <div style={S.right}>
                <div style={S.connWrap}>
                    <span style={{ ...S.connDot, background: wsConnected ? 'var(--green)' : 'var(--red)', ...(wsConnected ? {} : { animation: 'blink-dot 1s infinite' }) }} />
                    <span style={S.connLabel}>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
                </div>
                <span style={S.clock}>{time.toLocaleTimeString('en-IN', { hour12: false })}</span>
                {user && <span style={S.userName}>{user.name}</span>}
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
        gap: '0',
        flexShrink: 0,
        zIndex: 200,
        position: 'relative',
    },
    brand: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 16px',
        borderRight: '1px solid var(--border-1)',
        height: '100%',
        minWidth: '200px',
    },
    brandDot: {
        width: '8px', height: '8px', borderRadius: '50%',
        background: 'var(--green)',
        boxShadow: '0 0 8px var(--green)',
        flexShrink: 0,
        animation: 'blink-dot 2.5s ease-in-out infinite',
    },
    brandName: {
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: 'var(--text-0)',
        letterSpacing: '2px',
    },
    brandSub: {
        fontSize: '8px',
        color: 'var(--text-3)',
        letterSpacing: '1px',
        fontFamily: 'var(--font-hmi)',
        fontWeight: 700,
        textTransform: 'uppercase',
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        borderRight: '1px solid var(--border-1)',
        padding: '0 8px',
        gap: '2px',
    },
    navBtn: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-2)',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '1.2px',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'var(--font-hmi)',
        transition: 'all 0.15s',
    },
    navBtnActive: {
        background: 'rgba(59,130,246,0.12)',
        color: 'var(--blue)',
        borderRadius: '4px',
    },
    tickerWrap: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 12px',
        overflow: 'hidden',
        height: '100%',
    },
    liveTag: {
        background: 'var(--red)',
        color: 'white',
        fontSize: '9px',
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: '2px',
        letterSpacing: '1px',
        flexShrink: 0,
        fontFamily: 'var(--font-hmi)',
    },
    tickerTrack: {
        overflow: 'hidden',
        flex: 1,
        position: 'relative',
    },
    tickerText: {
        display: 'inline-block',
        color: 'var(--text-2)',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
        animation: 'ticker-scroll 60s linear infinite',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '0 14px',
        borderLeft: '1px solid var(--border-1)',
        height: '100%',
        flexShrink: 0,
    },
    connWrap: { display: 'flex', alignItems: 'center', gap: '6px' },
    connDot: { width: '7px', height: '7px', borderRadius: '50%' },
    connLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-3)' },
    clock: { fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-1)', letterSpacing: '1px' },
    userName: { fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-hmi)', fontWeight: 600 },
    logoutBtn: {
        background: 'transparent',
        border: '1px solid var(--border-2)',
        color: 'var(--text-3)',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        cursor: 'pointer',
        fontFamily: 'var(--font-hmi)',
    },
}