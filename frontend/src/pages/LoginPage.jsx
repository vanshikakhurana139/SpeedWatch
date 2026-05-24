import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function LoginPage() {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')

        if (!phone || !password) {
            setError('Please enter phone number and password')
            return
        }

        setLoading(true)
        try {
            const data = await authApi.login(phone, password)

            // Only allow supervisors and admins to use the dashboard
            if (data.role === 'driver') {
                authApi.logout()
                setError('Driver accounts cannot access the supervisor dashboard')
                setLoading(false)
                return
            }

            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
            setLoading(false)
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Logo area */}
                <div style={styles.logoArea}>
                    <h1 style={styles.title}>SPEEDWATCH</h1>
                    <div style={styles.titleUnderline} />
                    <p style={styles.subtitle}>Supervisor Control Dashboard</p>
                    <p style={styles.org}>SAIL — RDCIS Ranchi</p>
                </div>

                {/* Login form */}
                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>PHONE NUMBER</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+919000000001"
                            style={styles.input}
                            disabled={loading}
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            style={styles.input}
                            disabled={loading}
                        />
                    </div>

                    {error && <div style={styles.errorBox}>{error}</div>}

                    <button type="submit" style={styles.loginBtn} disabled={loading}>
                        {loading ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>
                </form>

                {/* Dev helper */}
                <div style={styles.devHelper}>
                    <p style={styles.devTitle}>Development Credentials:</p>
                    <p style={styles.devText}>Supervisor: +919000000001 / supervisor123</p>
                    <p style={styles.devText}>Admin: +919000000000 / admin123</p>
                </div>
            </div>
        </div>
    )
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#E6E8E5',
    },
    card: {
        background: 'white',
        border: '1px solid #C8CAC6',
        borderRadius: '8px',
        padding: '40px',
        width: '380px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    logoArea: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    title: {
        fontSize: '36px',
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: '2px',
        fontFamily: 'monospace',
    },
    titleUnderline: {
        width: '80px',
        height: '3px',
        background: '#34C759',
        margin: '8px auto',
    },
    subtitle: {
        color: '#48484A',
        fontSize: '13px',
        marginTop: '8px',
    },
    org: {
        color: '#8E8E93',
        fontSize: '11px',
        fontFamily: 'monospace',
        letterSpacing: '1px',
        marginTop: '4px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    input: {
        padding: '10px 12px',
        border: '1px solid #C8CAC6',
        borderRadius: '6px',
        fontSize: '14px',
        fontFamily: 'monospace',
        background: '#F2F3F1',
        outline: 'none',
        color: '#1C1C1E',
    },
    errorBox: {
        background: '#FFF0EF',
        border: '1px solid #FF3B30',
        borderRadius: '6px',
        padding: '10px',
        color: '#CC2B24',
        fontSize: '13px',
    },
    loginBtn: {
        background: '#34C759',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '12px',
        fontSize: '14px',
        fontWeight: '700',
        letterSpacing: '1px',
        cursor: 'pointer',
        marginTop: '8px',
    },
    devHelper: {
        marginTop: '24px',
        padding: '12px',
        background: '#F2F3F1',
        borderRadius: '6px',
        border: '1px solid #C8CAC6',
    },
    devTitle: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: '4px',
    },
    devText: {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#48484A',
        lineHeight: '1.6',
    },
}