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
        if (!phone || !password) {
            setError('Please enter phone number and password')
            return
        }
        setLoading(true)
        try {
            const data = await authApi.login(phone, password)
            if (data.role === 'driver') {
                authApi.logout()
                setError('Driver accounts cannot access the supervisor dashboard. Use the mobile app.')
                setLoading(false)
                return
            }
            navigate('/dashboard')
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Login failed'
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                setError('Cannot reach backend server. Make sure Docker is running:\n"docker-compose up -d" in your SpeedWatch folder.')
            } else {
                setError(msg)
            }
            setLoading(false)
        }
    }

    return (
        <div style={S.page}>
            {/* ── Left panel — branding ── */}
            <div style={S.left}>
                <div style={S.logo}>
                    <span style={S.logoText}>SAIL</span>
                </div>
                <h1 style={S.title}>SpeedWatch</h1>
                <p style={S.subtitle}>
                    Industrial Vehicle Speed Enforcement System for SAIL RDCIS
                </p>
                <div style={S.divider} />
                <p style={S.org}>RDCIS RANCHI</p>

                {/* Dev credentials reminder */}
                <div style={S.credsBox}>
                    <div style={S.credsTitle}>Test Credentials</div>
                    <div style={S.credsRow}>
                        <span style={S.credsLabel}>Supervisor</span>
                        <span style={S.credsVal}>+919000000001 / supervisor123</span>
                    </div>
                    <div style={S.credsRow}>
                        <span style={S.credsLabel}>Admin</span>
                        <span style={S.credsVal}>+919000000000 / admin123</span>
                    </div>
                </div>
            </div>

            {/* ── Right panel — form ── */}
            <div style={S.right}>
                <div style={S.card}>
                    <h2 style={S.cardTitle}>Supervisor Login</h2>

                    {error && (
                        <div style={S.errorBox}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={S.form}>
                        <div style={S.fieldGroup}>
                            <label style={S.label}>Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+919000000001"
                                style={S.input}
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>

                        <div style={S.fieldGroup}>
                            <label style={S.label}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                style={S.input}
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
                            disabled={loading}
                        >
                            {loading ? 'SIGNING IN…' : 'LOGIN'}
                        </button>
                    </form>

                    <div style={S.footer}>
                        <p style={S.footerText}>Powered by SAIL • Steel Authority of India Limited</p>
                        <p style={S.footerText}>Version 3.0.0 • Supervisor Dashboard</p>
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
        background: 'linear-gradient(135deg, #0A2342 0%, #001f3f 100%)',
    },
    left: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        color: 'white',
    },
    logo: {
        width: '120px', height: '120px',
        background: 'white', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '24px',
        border: '4px solid #F5A623',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    },
    logoText: {
        fontSize: '28px', fontWeight: '900',
        color: '#0A2342', letterSpacing: '3px',
        fontFamily: 'sans-serif',
    },
    title: {
        fontSize: '40px', fontWeight: '800',
        margin: '0 0 12px', textAlign: 'center',
        fontFamily: 'sans-serif',
    },
    subtitle: {
        fontSize: '16px', opacity: 0.9,
        textAlign: 'center', maxWidth: '400px',
        lineHeight: 1.6, margin: 0,
        fontFamily: 'sans-serif',
    },
    divider: {
        width: '80px', height: '4px',
        background: '#F5A623',
        margin: '24px 0',
    },
    org: {
        fontSize: '14px', fontWeight: '700',
        letterSpacing: '3px', opacity: 0.85,
        fontFamily: 'sans-serif',
    },
    credsBox: {
        marginTop: '40px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '16px 20px',
        width: '100%',
        maxWidth: '360px',
    },
    credsTitle: {
        fontSize: '10px', fontWeight: '700',
        letterSpacing: '1.5px', color: '#F5A623',
        textTransform: 'uppercase', marginBottom: '10px',
        fontFamily: 'monospace',
    },
    credsRow: {
        display: 'flex', flexDirection: 'column',
        marginBottom: '8px', gap: '2px',
    },
    credsLabel: {
        fontSize: '9px', fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '1px',
        fontFamily: 'sans-serif',
    },
    credsVal: {
        fontSize: '12px', fontFamily: 'monospace',
        color: 'rgba(255,255,255,0.85)',
    },
    right: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        padding: '48px',
    },
    card: {
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #E5E7EB',
    },
    cardTitle: {
        fontSize: '24px', fontWeight: '700',
        color: '#0A2342', marginBottom: '24px',
        fontFamily: 'sans-serif',
    },
    errorBox: {
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderLeft: '4px solid #EF4444',
        borderRadius: '6px',
        padding: '12px 14px',
        color: '#DC2626',
        fontSize: '13px',
        marginBottom: '20px',
        lineHeight: 1.5,
        whiteSpace: 'pre-line',
        fontFamily: 'sans-serif',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '13px', fontWeight: '600',
        color: '#374151', fontFamily: 'sans-serif',
    },
    input: {
        padding: '13px 14px',
        fontSize: '14px',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        background: '#F9FAFB',
        outline: 'none',
        color: '#111827',
        fontFamily: 'monospace',
        transition: 'border-color 0.15s',
        width: '100%',
        boxSizing: 'border-box',
    },
    btn: {
        padding: '15px',
        fontSize: '14px', fontWeight: '700',
        color: 'white',
        background: '#0A2342',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        letterSpacing: '1.5px',
        marginTop: '6px',
        transition: 'all 0.2s',
        fontFamily: 'sans-serif',
    },
    footer: {
        marginTop: '28px',
        paddingTop: '20px',
        borderTop: '1px solid #E5E7EB',
        textAlign: 'center',
    },
    footerText: {
        fontSize: '12px',
        color: '#9CA3AF',
        margin: '4px 0',
        fontFamily: 'sans-serif',
    },
}