import React, { useState } from 'react'
import TopBar from '../components/Topbar'
import LeftSidebar from '../components/LeftSidebar'
import LiveMap from '../components/LiveMap'
import RightPanel from '../components/RightPanel'
import VehiclePopup from '../components/VehiclePopup'
import SosPanel from '../components/SosPanel'
import GeofenceForm from '../components/GeofenceForm'
import { useWebSocket } from '../hooks/useWebSocket'
import { useDashboardStore } from '../store/dashboardStore'

export default function DashboardPage() {
    const { sendMessage } = useWebSocket()
    const { selectedVehicleId, setSelectedVehicle } = useDashboardStore()
    const [pendingGeofenceCoords, setPendingGeofenceCoords] = useState(null)

    const handleGeofenceDrawn = (coords) => setPendingGeofenceCoords(coords)
    const handleGeofenceSaved = () => {
        setPendingGeofenceCoords(null)
        window.location.reload()
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <TopBar />
            <SosPanel />
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <LeftSidebar />
                <div style={{ flex: 1, position: 'relative' }}>
                    <LiveMap onDrawGeofence={handleGeofenceDrawn} />
                </div>
                <RightPanel />
            </div>
            {selectedVehicleId && <VehiclePopup sendWsMessage={sendMessage} />}
            {pendingGeofenceCoords && (
                <GeofenceForm
                    coordinates={pendingGeofenceCoords}
                    onSaved={handleGeofenceSaved}
                    onCancel={() => setPendingGeofenceCoords(null)}
                />
            )}
        </div>
    )
}