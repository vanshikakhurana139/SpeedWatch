import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import { useDashboardStore } from '../store/dashboardStore'
import { geofencesApi } from '../api/geofences'

// Fix Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PLANT_CENTER = [23.343, 85.319]
const PLANT_ZOOM = 15

export default function LiveMap({ onDrawGeofence }) {
    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <MapContainer
                center={PLANT_CENTER}
                zoom={PLANT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={20}
                />
                {/* Custom zoom position */}
                // Removed custom ZoomControl – default zoom control enabled
                <VehicleMarkerLayer />
                <GeofenceLayer />
                <DrawControl onGeofenceDrawn={onDrawGeofence} />
            </MapContainer>
            <MapOverlay />
        </div>
    )
}

// ── Custom positioned zoom control ───────────────────────────────
function ZoomControl() {
    const map = useMap()
    useEffect(() => {
        L.control.zoom({ position: 'topleft' }).addTo(map)
    }, [map])
    return null
}

// ── Compass / attribution overlay ────────────────────────────────
function MapOverlay() {
    return (
        <div style={{
            position: 'absolute', bottom: '16px', left: '16px', zIndex: 800,
            display: 'flex', flexDirection: 'column', gap: '6px',
            pointerEvents: 'none',
        }}>
            <div style={{
                background: 'rgba(16,19,24,0.85)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px', padding: '5px 9px',
                fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)',
                backdropFilter: 'blur(4px)',
            }}>
                SAIL RDCIS · Ranchi · 23.343°N 85.319°E
            </div>
        </div>
    )
}

// ── Vehicle Markers ───────────────────────────────────────────────
function VehicleMarkerLayer() {
    const map = useMap()
    const markersRef = useRef({})
    const { vehiclePositions, setSelectedVehicle, selectedVehicleId } = useDashboardStore()

    useEffect(() => {
        const currentIds = new Set(Object.keys(vehiclePositions))

        // Remove stale markers
        Object.keys(markersRef.current).forEach((id) => {
            if (!currentIds.has(id)) {
                markersRef.current[id].remove()
                delete markersRef.current[id]
            }
        })

        // Add or update markers
        Object.entries(vehiclePositions).forEach(([vehicleId, vehicle]) => {
            const { lat, lng, speed, status } = vehicle
            const color = status === 'violation' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#22C55E'
            const isViolation = status === 'violation'
            const isWarning = status === 'warning'
            const dotSize = isViolation ? 18 : 14
            const label = vehicleId.length > 10 ? vehicleId.slice(0, 10) + '…' : vehicleId

            const pulseStyle = isViolation
                ? `box-shadow: 0 0 0 3px rgba(239,68,68,0.5);`
                : isWarning
                    ? `box-shadow: 0 0 0 2px rgba(245,158,11,0.4);`
                    : ''

            const iconHtml = `
        <div style="pointer-events:none;width:${dotSize}px;height:${dotSize}px;background:${color};border:2.5px solid rgba(255,255,255,0.9);border-radius:50%;${pulseStyle}"></div>
      `

            const icon = L.divIcon({
                html: iconHtml, className: '',
                iconSize: [dotSize + 32, dotSize + 36],
                iconAnchor: [(dotSize + 32) / 2, (dotSize + 36) / 2],
            })

            if (markersRef.current[vehicleId]) {
                markersRef.current[vehicleId].setLatLng([lat, lng]).setIcon(icon)
            } else {
                const marker = L.marker([lat, lng], { icon, zIndexOffset: isViolation ? 1000 : 0 })
                marker.on('click', () => setSelectedVehicle(vehicleId))
                marker.addTo(map)
                markersRef.current[vehicleId] = marker
            }
        })
    }, [vehiclePositions, map, setSelectedVehicle])

    useEffect(() => {
        if (selectedVehicleId && vehiclePositions[selectedVehicleId]) {
            const { lat, lng } = vehiclePositions[selectedVehicleId]
            map.panTo([lat, lng], { animate: true, duration: 0.6 })
        }
    }, [selectedVehicleId, vehiclePositions, map])

    return null
}

// ── Geofence Layer with Delete support ──────────────────────────
function GeofenceLayer() {
    const map = useMap()
    const layersRef = useRef([])      // { layer, id } pairs so we can delete by id
    const featureGroupRef = useRef(null)

    useEffect(() => {
        // Create a FeatureGroup to hold geofences so editing/deleting works
        const fg = new L.FeatureGroup()
        map.addLayer(fg)
        featureGroupRef.current = fg

        geofencesApi.getGeofences()
            .then((zones) => {
                zones.forEach((zone) => {
                    if (!zone.polygon?.coordinates) return
                    const colorMap = {
                        pedestrian: '#b3e5fc',   // pastel blue
                        coal_yard: '#c8e6c9',    // pastel green
                        main_road: '#d0f0c0',    // light pastel green
                        restricted: '#ffccbc',  // pastel orange/red
                        workshop: '#e1f5fe',    // very light blue
                        default: '#f5f5dc',      // beige
                    }
                    const color = colorMap[zone.zone_type] || colorMap.default

                    // Polygons disabled per user request – zones are not rendered on the map.
                })
            })
            .catch((err) => console.warn('Could not load geofences:', err.message))

        // Attach global delete handler
        // Global zone actions
        window._deleteZone = async (zoneId) => {
            if (!window.confirm('Delete this speed zone? This cannot be undone.')) return;
            try {
                await fetch(`/api/geofences/${zoneId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('supervisor_token')}` }
                });
                window.location.reload();
            } catch (err) {
                alert('Failed to delete zone. Check connection.')
            }
        };
        // Placeholder for future edit actions (rename/settings are handled in the popup)
        window._editZone = (zoneId) => {
            console.log('Edit zone requested:', zoneId);
        };

        return () => {
            map.removeLayer(fg)
        }
    }, [map])

    // Listen for delete events from DrawControl
    useEffect(() => {
        const handleDelete = (e) => {
            const layers = e.layers
            layers.eachLayer(async (layer) => {
                if (layer.zoneId) {
                    try {
                        await geofencesApi.deleteGeofence(layer.zoneId)
                        layersRef.current = layersRef.current.filter(item => item.id !== layer.zoneId)
                    } catch (err) {
                        console.error('Failed to delete geofence:', err)
                    }
                }
            })
        }
        // Use string literal 'draw:deleted' to avoid undefined L.Draw runtime crash on startup
        map.on('draw:deleted', handleDelete)
        return () => { map.off('draw:deleted', handleDelete) }
    }, [map])

    return null
}

// ── Draw Control (polygon + delete) ──────────────────────────────
function DrawControl({ onGeofenceDrawn }) {
    const map = useMap()

    useEffect(() => {
        if (!onGeofenceDrawn) return

        import('leaflet-draw').then(() => {
            const drawnItems = new L.FeatureGroup()
            map.addLayer(drawnItems)

            const drawControl = new L.Control.Draw({
                position: 'topleft',
                draw: {
                    polygon: false, // polygon drawing disabled per user request
                    polyline: false,
                    rectangle: false,   // disabled — docx says polygon only
                    circle: false,
                    circlemarker: false,
                    marker: false,
                },
                edit: false, // edit toolbar (buffer buttons) disabled per user request
            })
            map.addControl(drawControl)

            // When polygon finished drawing
            map.on(L.Draw.Event.CREATED, (event) => {
                const layer = event.layer
                drawnItems.addLayer(layer)
                const geojson = layer.toGeoJSON()
                onGeofenceDrawn(geojson.geometry.coordinates)
            })

            // When a drawn zone is deleted via the toolbar
            map.on(L.Draw.Event.DELETED, (event) => {
                const layers = event.layers
                layers.eachLayer((layer) => {
                    // The layer removed from drawnItems is a new drawing
                    // For existing geofences on the map, deletion is handled separately
                    console.log('Drew zone deleted from map')
                })
            })
        })
    }, [map, onGeofenceDrawn])

    return null
}