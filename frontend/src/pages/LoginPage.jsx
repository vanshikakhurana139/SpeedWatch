import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function LoginPage() {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
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
            {/* Left — branding panel */}
            <div style={S.left}>
                {/* Decorative grid lines */}
                <div style={S.gridLines}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ ...S.gridLine, top: `${i * 14}%` }} />
                    ))}
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ ...S.gridLineV, left: `${i * 20}%` }} />
                    ))}
                </div>

                <div style={S.leftContent}>
                    {/* SAIL Logo */}
                    <div style={S.sailLogoWrap}>
                        <div style={S.sailLogoCircle}>
                            <span style={S.sailLogoText}>SAIL</span>
                        </div>
                        <div style={S.sailGoldBar} />
                    </div>

                    <div style={S.productName}>SpeedWatch</div>
                    <div style={S.productTagline}>
                        Industrial Vehicle Speed<br />Enforcement System
                    </div>

                    <div style={S.separator} />

                    <div style={S.orgBadge}>
                        <div style={S.orgBadgeInner}>
                            <span style={{ opacity: 0.5, fontSize: 10 }}>▣</span>
                            RDCIS · RANCHI
                        </div>
                    </div>

                    {/* Feature list */}
                    <div style={S.featureList}>
                        {[
                            'Real-time GPS speed monitoring',
                            'Progressive penalty enforcement',
                            'Geofence-aware speed limits',
                            'Supervisor voice commands',
                            'AI-powered driver risk scoring',
                        ].map((f, i) => (
                            <div key={i} style={S.featureItem}>
                                <span style={{ color: 'var(--sail-gold)', fontSize: 10 }}>◈</span>
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — login form */}
            <div style={S.right}>
                <div style={S.formWrap}>
                    <div style={S.formHeader}>
                        <div style={S.formTitle}>Supervisor Login</div>
                        <div style={S.formSubtitle}>Control Center Access</div>
                    </div>

                    {error && (
                        <div style={S.error}>
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={S.form}>
                        <div style={S.fieldGroup}>
                            <label style={S.label}>PHONE NUMBER</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+919000000001"
                                style={S.input}
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>

                        <div style={S.fieldGroup}>
                            <label style={S.label}>PASSWORD</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password"
                                style={S.input}
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ animation: 'blink 0.8s infinite' }}>●</span>
                                    AUTHENTICATING...
                                </span>
                            ) : 'LOGIN TO CONTROL CENTER'}
                        </button>
                    </form>

                    {/* Test creds box */}
                    <div style={S.credsBox}>
                        <div style={S.credsTitle}>TEST CREDENTIALS</div>
                        <div style={S.credRow}>
                            <span style={S.credRole}>SUPERVISOR</span>
                            <span style={S.credVal}>+919000000001 · supervisor123</span>
                        </div>
                        <div style={S.credRow}>
                            <span style={S.credRole}>ADMIN</span>
                            <span style={S.credVal}>+919000000000 · admin123</span>
                        </div>
                        <div style={S.credRow}>
                            <span style={S.credRole}>DRIVER APP</span>
                            <span style={S.credVal}>+919111111001 · driver123</span>
                        </div>
                    </div>

                    <div style={S.footer}>
                        Powered by Steel Authority of India Limited
                    </div>
                </div>
            </div>
        </div>
    )
}

const S = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-0)',
        overflow: 'hidden',
    },
    left: {
        flex: 1,
        background: 'var(--sail-navy)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    gridLines: { position: 'absolute', inset: 0, overflow: 'hidden' },
    gridLine: { position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.04)' },
    gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.04)' },
    leftContent: {
        position: 'relative',
        zIndex: 1,
        padding: 48,
        maxWidth: 480,
    },
    sailLogoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 32 },
    sailLogoCircle: {
        width: 72, height: 72, borderRadius: '50%',
        background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '3px solid #FFB81C',
        marginBottom: 12,
    },
    sailLogoText: {
        fontFamily: 'var(--font-display)',
        fontSize: 22, fontWeight: 700,
        color: '#003A70', letterSpacing: 3,
    },
    sailGoldBar: { width: 48, height: 3, background: '#FFB81C', borderRadius: 2 },
    productName: {
        fontFamily: 'var(--font-display)',
        fontSize: 42, fontWeight: 700,
        color: 'white', letterSpacing: 1,
        marginBottom: 12,
    },
    productTagline: {
        fontFamily: 'var(--font-body)',
        fontSize: 16, color: 'rgba(255,255,255,0.65)',
        lineHeight: 1.5, marginBottom: 24,
    },
    separator: { width: 60, height: 2, background: '#FFB81C', marginBottom: 24 },
    orgBadge: { marginBottom: 32 },
    orgBadgeInner: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 4,
        padding: '5px 12px',
        fontFamily: 'var(--font-display)',
        fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.7)', letterSpacing: 2,
    },
    featureList: { display: 'flex', flexDirection: 'column', gap: 10 },
    featureItem: {
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-body)', fontSize: 14,
        color: 'rgba(255,255,255,0.65)',
    },
    right: {
        flex: 1,
        background: 'var(--bg-1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
    },
    formWrap: { width: '100%', maxWidth: 440 },
    formHeader: { marginBottom: 32 },
    formTitle: {
        fontFamily: 'var(--font-display)',
        fontSize: 28, fontWeight: 700,
        color: 'var(--text-0)', letterSpacing: 0.5, marginBottom: 4,
    },
    formSubtitle: { fontSize: 13, color: 'var(--text-3)', fontFamily: 'var(--font-body)' },
    error: {
        display: 'flex', alignItems: 'flex-start', gap: 8,
        background: 'var(--red-bg)',
        border: '1px solid rgba(240,65,75,0.3)',
        borderLeft: '4px solid var(--red)',
        borderRadius: 'var(--r-md)',
        padding: '10px 14px',
        color: 'var(--red)', fontSize: 13,
        marginBottom: 20,
        lineHeight: 1.5, whiteSpace: 'pre-line',
        fontFamily: 'var(--font-body)',
    },
    form: { display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: {
        fontFamily: 'var(--font-display)',
        fontSize: 10, fontWeight: 700,
        color: 'var(--text-3)', letterSpacing: 1.5,
    },
    input: {
        padding: '12px 14px',
        fontSize: 14,
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--bg-2)',
        outline: 'none',
        color: 'var(--text-0)',
        fontFamily: 'var(--font-mono)',
        transition: 'border-color 0.15s',
        width: '100%',
    },
    submitBtn: {
        padding: '14px',
        fontSize: 13, fontWeight: 700,
        color: 'white',
        background: 'var(--sail-blue)',
        border: 'none',
        borderRadius: 'var(--r-lg)',
        cursor: 'pointer',
        letterSpacing: 1.5,
        fontFamily: 'var(--font-display)',
        transition: 'all 0.2s',
    },
    credsBox: {
        background: 'var(--bg-2)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-lg)',
        padding: '14px 16px',
        marginBottom: 24,
    },
    credsTitle: {
        fontFamily: 'var(--font-display)', fontSize: 9,
        fontWeight: 700, letterSpacing: 1.5, color: 'var(--amber)',
        marginBottom: 10,
    },
    credRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
    credRole: {
        fontFamily: 'var(--font-display)', fontSize: 9,
        fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: 0.5, minWidth: 80,
    },
    credVal: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' },
    footer: {
        textAlign: 'center',
        fontSize: 11, color: 'var(--text-4)',
        fontFamily: 'var(--font-body)',
    },
}