import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function LoginPage() {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!phone || !password) { setError('Enter phone and password'); return }
        setLoading(true)
        try {
            const data = await authApi.login(phone, password)
            if (data.role === 'driver') {
                authApi.logout()
                setError('Driver accounts use the mobile app, not this dashboard.')
                setLoading(false); return
            }
            navigate('/dashboard')
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Login failed'
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                setError('Cannot reach server. Run: docker-compose up -d')
            } else {
                setError(msg)
            }
            setLoading(false)
        }
    }

    return (
        <div style={S.page}>
            {/* ── Left Panel — Industrial background ── */}
            <div style={S.left}>
                {/* Dark overlay */}
                <div style={S.overlay} />

                {/* Top-left: SAIL Logo + branding */}
                <div style={S.topBrand}>
                    <SailLogoSvg />
                    <div>
                        <div style={S.brandName}>SpeedWatch</div>
                        <div style={S.brandSub}>ENFORCEMENT DASHBOARD</div>
                    </div>
                </div>

                {/* Center: Headline */}
                <div style={S.heroContent}>
                    <h1 style={S.heroHeadline}>
                        Securing the backbone<br />of industrial excellence.
                    </h1>
                    <p style={S.heroSub}>
                        Advanced real-time monitoring and enforcement systems for SAIL.<br />
                        Access restricted to authorized operational personnel.
                    </p>
                </div>

                {/* Bottom: System status */}
                <div style={S.statusBar}>
                    <div style={S.statusLabel}>SYSTEM STATUS</div>
                    <div style={S.statusRow}>
                        <div style={S.statusDot} />
                        <span style={S.statusText}>Global Operations Online</span>
                    </div>
                </div>
            </div>

            {/* ── Right Panel — Login form ── */}
            <div style={S.right}>
                <div style={S.formWrap}>
                    <div style={S.formTop}>
                        <h2 style={S.formTitle}>Login</h2>
                        <p style={S.formSubtitle}>Authorized entry into SpeedWatch core systems.</p>
                    </div>

                    {error && (
                        <div style={S.errorBox}>
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={S.form}>
                        {/* Phone field */}
                        <div style={S.fieldGroup}>
                            <label style={S.fieldLabel}>ENTER SUPERVISOR PHONE NUMBER</label>
                            <div style={S.inputWrap}>
                                <span style={S.inputIcon}>
                                    <svg width="16" height="16" fill="none" stroke="#A0AEC0" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="SW-XXXXXX or +91900..."
                                    style={S.input}
                                    disabled={loading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div style={S.fieldGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={S.fieldLabel}>ENTER PASSWORD</label>
                                <span style={S.forgotLink}>Forgot Access?</span>
                            </div>
                            <div style={S.inputWrap}>
                                <span style={S.inputIcon}>
                                    <svg width="16" height="16" fill="none" stroke="#A0AEC0" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </span>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={S.input}
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button type="button" style={S.eyeBtn} onClick={() => setShowPass(!showPass)}>
                                    {showPass ? (
                                        <svg width="16" height="16" fill="none" stroke="#A0AEC0" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" fill="none" stroke="#A0AEC0" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{ ...S.submitBtn, opacity: loading ? 0.75 : 1 }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                    <span style={{ animation: 'blink 0.8s infinite' }}>●</span>
                                    AUTHENTICATING...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    Authenticate &amp; Access
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>



                    {/* Footer */}
                    <div style={S.footer}>
                        <span>© 2026 SAIL DIGITAL</span>
                        <span style={S.footerDot}>·</span>
                        <span style={S.footerLink}>SUPPORT</span>
                        <span style={S.footerDot}>·</span>
                        <span style={S.footerLink}>LEGAL</span>
                    </div>
                    <div style={S.footerNote}>
                        This system is the property of SAIL. Unauthorized access or use is strictly prohibited and subject to legal action.
                    </div>
                </div>
            </div>
        </div>
    )
}

function SailLogoSvg() {
    return (
        <div style={{
            background: 'white',
            borderRadius: 10,
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            flexShrink: 0,
        }}>
            <img
                src="/sail-logo.png"
                alt="SAIL Logo"
                style={{ width: 72, height: 72, objectFit: 'contain', display: 'block' }}
            />
        </div>
    )
}

const BG_URL = 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1400&q=80&auto=format'

const S = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
    },
    /* Left */
    left: {
        flex: '0 0 55%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 40px',
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
    },
    overlay: {
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(10,20,60,0.88) 0%, rgba(5,10,30,0.78) 100%)',
    },
    topBrand: {
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: 14,
    },
    sailBox: {
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        flexShrink: 0,
    },
    brandName: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 20, fontWeight: 800,
        color: 'white', letterSpacing: 0.5,
    },
    brandSub: {
        fontSize: 10, fontWeight: 600,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 2, textTransform: 'uppercase',
    },
    heroContent: {
        position: 'relative', zIndex: 1,
        maxWidth: 480,
    },
    heroHeadline: {
        fontSize: 38, fontWeight: 800,
        color: 'white', lineHeight: 1.2,
        marginBottom: 16,
    },
    heroSub: {
        fontSize: 14, color: 'rgba(255,255,255,0.65)',
        lineHeight: 1.7,
    },
    statusBar: {
        position: 'relative', zIndex: 1,
    },
    statusLabel: {
        fontSize: 9, fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2, textTransform: 'uppercase',
        marginBottom: 6,
    },
    statusRow: { display: 'flex', alignItems: 'center', gap: 8 },
    statusDot: {
        width: 8, height: 8, borderRadius: '50%',
        background: '#22C55E',
        boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
        animation: 'glow-pulse 2s infinite',
    },
    statusText: {
        fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500,
    },
    /* Right */
    right: {
        flex: 1,
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 48px',
        overflowY: 'auto',
    },
    formWrap: { width: '100%', maxWidth: 380 },
    formTop: { marginBottom: 28 },
    formTitle: {
        fontSize: 30, fontWeight: 800,
        color: '#0D1B3E', marginBottom: 6,
    },
    formSubtitle: {
        fontSize: 14, color: '#718096', lineHeight: 1.5,
    },
    errorBox: {
        display: 'flex', alignItems: 'flex-start', gap: 8,
        background: 'rgba(204,0,0,0.06)',
        border: '1px solid rgba(204,0,0,0.2)',
        borderLeft: '3px solid #CC0000',
        borderRadius: 6,
        padding: '10px 14px',
        color: '#CC0000', fontSize: 13,
        marginBottom: 20, lineHeight: 1.5,
    },
    form: { display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
    fieldLabel: {
        fontSize: 10, fontWeight: 700,
        color: '#718096', letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    forgotLink: {
        fontSize: 12, color: '#0D1B3E',
        fontWeight: 600, cursor: 'pointer',
    },
    inputWrap: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute', left: 12,
        display: 'flex', alignItems: 'center',
        pointerEvents: 'none',
    },
    input: {
        width: '100%',
        padding: '11px 40px 11px 38px',
        fontSize: 14,
        border: '1.5px solid #E2E8F0',
        borderRadius: 6,
        background: '#FFFFFF',
        outline: 'none',
        color: '#1A202C',
        fontFamily: 'Inter, sans-serif',
        transition: 'border-color 0.15s',
    },
    eyeBtn: {
        position: 'absolute', right: 12,
        background: 'transparent', border: 'none',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        padding: 4,
    },
    submitBtn: {
        width: '100%',
        padding: '13px',
        fontSize: 14, fontWeight: 700,
        color: 'white',
        background: '#0D1B3E',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s',
        letterSpacing: 0.3,
    },
    securityBadge: {
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, color: '#A0AEC0',
        marginBottom: 20,
    },
    credsBox: {
        background: '#F7FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 6,
        padding: '12px 14px',
        marginBottom: 20,
    },
    credsTitle: {
        fontSize: 9, fontWeight: 700,
        color: '#A0AEC0', letterSpacing: 1.5,
        textTransform: 'uppercase', marginBottom: 8,
    },
    credRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
    credRole: {
        fontSize: 10, fontWeight: 700,
        color: '#718096', minWidth: 72,
    },
    credVal: { fontSize: 11, color: '#4A5568', fontFamily: 'monospace' },
    footer: {
        display: 'flex', gap: 6, alignItems: 'center',
        fontSize: 11, color: '#A0AEC0', marginBottom: 6,
    },
    footerDot: { color: '#CBD5E0' },
    footerLink: { cursor: 'pointer', fontWeight: 500 },
    footerNote: {
        fontSize: 10, color: '#CBD5E0', lineHeight: 1.6,
    },
}