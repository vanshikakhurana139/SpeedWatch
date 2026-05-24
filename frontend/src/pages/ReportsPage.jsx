import React, { useState } from 'react'
import apiClient from '../api/client'
import { format } from 'date-fns'

export default function ReportsPage() {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [error, setError] = useState('')

    const loadReport = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await apiClient.get('/reports/daily', { params: { date } })
            setReportData(response.data)
        } catch (err) {
            // If the endpoint doesn't exist yet, show a friendly message
            if (err.response?.status === 404) {
                setError('Report endpoint not yet implemented. This will work after backend update.')
            } else {
                setError(err.response?.data?.detail || 'Failed to load report')
            }
        }
        setLoading(false)
    }

    const downloadPdf = async () => {
        setPdfLoading(true)
        try {
            const response = await apiClient.post('/reports/daily/pdf', { date }, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `speedwatch_report_${date}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            alert('PDF generation requires backend implementation. See Phase 3 guide.')
        }
        setPdfLoading(false)
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>DAILY REPORTS</h1>

            <div style={styles.controls}>
                <div style={styles.field}>
                    <label style={styles.label}>REPORT DATE</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={styles.dateInput}
                    />
                </div>
                <button style={styles.loadBtn} onClick={loadReport} disabled={loading}>
                    {loading ? 'LOADING...' : 'LOAD REPORT'}
                </button>
                <button style={styles.pdfBtn} onClick={downloadPdf} disabled={pdfLoading}>
                    {pdfLoading ? 'GENERATING...' : '⬇ DOWNLOAD PDF'}
                </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {reportData && (
                <div style={styles.reportTable}>
                    <h2 style={styles.subtitle}>Violations for {date}</h2>
                    {reportData.violations?.length > 0 ? (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {['DRIVER', 'VEHICLE', 'TIME', 'SPEED', 'LIMIT', 'PENALTY'].map((h) => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.violations.map((v, i) => (
                                    <tr key={i} style={{ background: i % 2 === 0 ? '#F9F9F9' : 'white' }}>
                                        <td style={styles.td}>{v.driver_name}</td>
                                        <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: '700' }}>{v.license_plate}</td>
                                        <td style={{ ...styles.td, fontFamily: 'monospace' }}>
                                            {v.timestamp ? format(new Date(v.timestamp), 'HH:mm:ss') : '--'}
                                        </td>
                                        <td style={{ ...styles.td, color: '#FF3B30', fontWeight: '700', fontFamily: 'monospace' }}>
                                            {v.speed_recorded} km/h
                                        </td>
                                        <td style={{ ...styles.td, fontFamily: 'monospace' }}>{v.zone_limit} km/h</td>
                                        <td style={{ ...styles.td, color: '#FF3B30', fontWeight: '700', fontFamily: 'monospace' }}>
                                            Rs. {v.penalty_amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: '#8E8E93', fontSize: '14px' }}>No violations on this date.</p>
                    )}
                </div>
            )}
        </div>
    )
}

const styles = {
    page: { padding: '24px', overflowY: 'auto', height: '100%', background: '#E6E8E5' },
    title: { fontSize: '22px', fontWeight: '700', letterSpacing: '1px', fontFamily: 'monospace', marginBottom: '24px' },
    controls: { display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' },
    field: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '10px', fontWeight: '700', color: '#8E8E93', letterSpacing: '0.5px', textTransform: 'uppercase' },
    dateInput: { padding: '8px 12px', border: '1px solid #C8CAC6', borderRadius: '4px', fontSize: '13px', background: 'white' },
    loadBtn: { background: '#0A84FF', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.5px' },
    pdfBtn: { background: '#34C759', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.5px' },
    error: { background: '#FFF0EF', border: '1px solid #FF3B30', borderRadius: '4px', padding: '10px', color: '#CC2B24', fontSize: '13px', marginBottom: '16px' },
    reportTable: { background: 'white', borderRadius: '6px', border: '1px solid #C8CAC6', padding: '20px' },
    subtitle: { fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#48484A' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#2C2C2E', color: 'white', padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
    td: { padding: '10px 12px', fontSize: '13px', color: '#1C1C1E', borderBottom: '1px solid #F0F0F0' },
}