import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import { useDashboardStore } from '../store/dashboardStore'
import { geofencesApi } from '../api/geofences'
import VehiclePopup from './VehiclePopup'

// Fix default Leaflet marker icon (broken in Vite builds)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// SAIL RDCIS Ranchi approximate coordinates
const PLANT_CENTER = [23.343, 85.319]
const PLANT_ZOOM = 15

export default function LiveMap({ onDrawGeofence }) {
    return (
        <div style={styles.container}>
            <MapContainer
                center={PLANT_CENTER}
                zoom={PLANT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                {/* Base map tiles from CartoDB — free, no API key */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                />

                {/* These components go inside MapContainer so they can access the map */}
                <VehicleMarkerLayer />
                <GeofenceLayer />
                <DrawControl onGeofenceDrawn={onDrawGeofence} />
            </MapContainer>
        </div>
    )
}

// ─────────────────────────────────────────────────────
// Vehicle markers — updates on every position change
// ─────────────────────────────────────────────────────
function VehicleMarkerLayer() {
    const map = useMap()
    const markersRef = useRef({}) // vehicleId → Leaflet marker
    const { vehiclePositions, setSelectedVehicle, selectedVehicleId } = useDashboardStore()

    useEffect(() => {
        const existingIds = new Set(Object.keys(markersRef.current))

        Object.entries(vehiclePositions).forEach(([vehicleId, vehicle]) => {
            const { lat, lng, speed, status } = vehicle
            const color = status === 'violation' ? '#FF3B30'
                : status === 'warning' ? '#FF9500'
                    : '#34C759'

            // Build custom SVG icon for the vehicle dot
            const size = status === 'violation' ? 18 : 14
            const pulseClass = status === 'violation' ? 'pulse-red' : ''

            const iconHtml = `
        <div style="position:relative; width:${size + 20}px; height:${size + 20}px; 
                    display:flex; flex-direction:column; align-items:center;">
          <div style="position:absolute; top:0; left:50%; transform:translateX(-50%);
                      background:#1C1C1E; color:white; font-size:9px; font-family:monospace;
                      font-weight:700; padding:1px 4px; border-radius:2px; white-space:nowrap;">
            ${vehicleId}
          </div>
          <div class="${pulseClass}" style="
            position:absolute; top:14px; left:50%; transform:translateX(-50%);
            width:${size}px; height:${size}px; border-radius:50%; 
            background:${color}; border:2px solid white;
            box-shadow:0 0 4px rgba(0,0,0,0.4);">
          </div>
        </div>
      `

            const icon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [size + 20, size + 34],
                iconAnchor: [(size + 20) / 2, size + 14],
            })

            if (markersRef.current[vehicleId]) {
                // Update existing marker
                markersRef.current[vehicleId].setLatLng([lat, lng])
                markersRef.current[vehicleId].setIcon(icon)
                existingIds.delete(vehicleId)
            } else {
                // Create new marker
                const marker = L.marker([lat, lng], { icon })
                marker.on('click', () => setSelectedVehicle(vehicleId))
                marker.addTo(map)
                markersRef.current[vehicleId] = marker
                existingIds.delete(vehicleId)
            }
        })

        // Remove markers for vehicles that are no longer active
        existingIds.forEach((vehicleId) => {
            markersRef.current[vehicleId]?.remove()
            delete markersRef.current[vehicleId]
        })
    }, [vehiclePositions, map, setSelectedVehicle])

    // Pan map to selected vehicle
    useEffect(() => {
        if (selectedVehicleId && vehiclePositions[selectedVehicleId]) {
            const { lat, lng } = vehiclePositions[selectedVehicleId]
            map.panTo([lat, lng])
        }
    }, [selectedVehicleId, vehiclePositions, map])

    return null // This component just controls the map imperatively
}

// ─────────────────────────────────────────────────────
// Geofence zones display
// ─────────────────────────────────────────────────────
function GeofenceLayer() {
    const map = useMap()
    const layersRef = useRef([])

    useEffect(() => {
        geofencesApi.getGeofences().then((zones) => {
            // Clear old layers
            layersRef.current.forEach((l) => l.remove())
            layersRef.current = []

            zones.forEach((zone) => {
                if (!zone.polygon?.coordinates) return

                // Zone type color coding
                const colorMap = {
                    pedestrian: '#AF52DE',   // Purple
                    coal_yard: '#FF9500',    // Amber
                    main_road: '#8E8E93',    // Grey
                    restricted: '#FF3B30',   // Red
                    default: '#0A84FF',      // Blue
                }
                const color = colorMap[zone.zone_type] || colorMap.default

                try {
                    // Convert GeoJSON to Leaflet coordinates (GeoJSON is [lng,lat], Leaflet is [lat,lng])
                    const coords = zone.polygon.coordinates[0].map(([lng, lat]) => [lat, lng])
                    const polygon = L.polygon(coords, {
                        color,
                        fillColor: color,
                        fillOpacity: 0.15,
                        weight: 2,
                    })

                    polygon.bindTooltip(
                        `<strong>${zone.name}</strong><br>Limit: ${zone.speed_limit} km/h`,
                        { permanent: false, sticky: true }
                    )

                    polygon.addTo(map)
                    layersRef.current.push(polygon)
                } catch (err) {
                    console.warn('Failed to render geofence:', zone.name, err)
                }
            })
        }).catch((err) => {
            console.error('Failed to load geofences:', err)
        })
    }, [map])

    return null
}

// ─────────────────────────────────────────────────────
// Polygon draw control
// ─────────────────────────────────────────────────────
function DrawControl({ onGeofenceDrawn }) {
    const map = useMap()

    useEffect(() => {
        // Dynamically import leaflet-draw (it patches L directly)
        import('leaflet-draw').then(() => {
            const drawnItems = new L.FeatureGroup()
            map.addLayer(drawnItems)

            const drawControl = new L.Control.Draw({
                draw: {
                    polygon: { shapeOptions: { color: '#0A84FF', fillOpacity: 0.2 } },
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                },
                edit: { featureGroup: drawnItems },
            })
            map.addControl(drawControl)

            map.on(L.Draw.Event.CREATED, (event) => {
                const layer = event.layer
                drawnItems.addLayer(layer)
                // Get GeoJSON coordinates and pass to parent
                const geojson = layer.toGeoJSON()
                onGeofenceDrawn?.(geojson.geometry.coordinates)
            })
        })
    }, [map, onGeofenceDrawn])

    return null
}

const styles = {
    container: {
        flex: 1,
        position: 'relative',
        height: '100%',
    },
}