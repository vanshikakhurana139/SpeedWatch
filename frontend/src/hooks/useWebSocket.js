import { useEffect, useRef, useCallback } from 'react'
import { useDashboardStore } from '../store/dashboardStore'

// How long to wait before reconnecting (doubles each attempt, max 30s)
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

export function useWebSocket() {
    const wsRef = useRef(null)
    const reconnectAttemptRef = useRef(0)
    const reconnectTimerRef = useRef(null)
    const shouldConnectRef = useRef(true)

    const {
        updateVehiclePosition,
        addViolation,
        addSosAlert,
        setWsConnected,
        incrementHourlyCount,
        addTickerMessage,
    } = useDashboardStore()

    // Route incoming WebSocket messages to the correct store action
    const handleMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.data)

            // Each message has a "type" field
            switch (data.type) {
                case 'position':
                    // Vehicle moved — update its marker on the map
                    updateVehiclePosition(data)
                    break

                case 'violation':
                    // Speed violation occurred
                    addViolation(data)
                    incrementHourlyCount()
                    updateVehiclePosition({
                        vehicle_id: data.vehicle_id,
                        lat: data.lat,
                        lng: data.lng,
                        speed: data.speed_recorded,
                        status: 'violation',
                        driver_id: data.driver_id,
                        driver_name: data.driver_name,
                        trip_id: data.trip_id
                    })
                    addTickerMessage(
                        `VIOLATION — ${data.vehicle_id} at ${data.speed_recorded} km/h (limit: ${data.zone_limit}) — Rs. ${data.penalty_amount}`
                    )
                    break

                case 'sos':
                    // Emergency alert from a driver
                    addSosAlert(data)
                    updateVehiclePosition({
                        vehicle_id: data.vehicle_id,
                        lat: data.lat,
                        lng: data.lng,
                        speed: 0,
                        status: 'violation', // Highlight as critical/violation
                        driver_id: data.driver_id,
                        driver_name: data.driver_name,
                        trip_id: data.trip_id
                    })
                    addTickerMessage(`🚨 SOS — ${data.driver_name} in vehicle ${data.vehicle_id}`)
                    break

                default:
                    // Unknown message type — log for debugging
                    console.log('Unknown WS message type:', data.type, data)
            }
        } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
        }
    }, [updateVehiclePosition, addViolation, addSosAlert, incrementHourlyCount, addTickerMessage])

    const connect = useCallback(() => {
        if (!shouldConnectRef.current) return

        const token = localStorage.getItem('supervisor_token')
        if (!token) return // Not logged in

        // Build WebSocket URL
        // In development: ws://localhost:8000/ws/supervisor?token=...
        // In production: wss://your-server/ws/supervisor?token=...
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const host = window.location.hostname
        const port = import.meta.env.DEV ? '8000' : window.location.port
        const portStr = port ? `:${port}` : ''
        const wsUrl = `${protocol}://${host}${portStr}/ws/supervisor?token=${token}`

        console.log('Connecting to WebSocket:', wsUrl)

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
            console.log('WebSocket connected')
            setWsConnected(true)
            reconnectAttemptRef.current = 0 // Reset backoff counter
        }

        ws.onmessage = handleMessage

        ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason)
            setWsConnected(false)

            // Auto-reconnect unless we closed on purpose
            if (shouldConnectRef.current) {
                const delay = RECONNECT_DELAYS[
                    Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)
                ]
                reconnectAttemptRef.current++
                console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`)
                reconnectTimerRef.current = setTimeout(connect, delay)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            // onclose will fire after onerror, which will trigger reconnect
        }
    }, [handleMessage, setWsConnected])

    // Send a message to the server (used for voice commands)
    const sendMessage = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data))
        } else {
            console.warn('WebSocket not connected, cannot send message')
        }
    }, [])

    useEffect(() => {
        shouldConnectRef.current = true
        connect()

        return () => {
            // Cleanup when component unmounts
            shouldConnectRef.current = false
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
            if (wsRef.current) wsRef.current.close()
        }
    }, [connect])

    return { sendMessage }
}