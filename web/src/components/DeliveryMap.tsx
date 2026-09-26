/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

// SVG Icons
const createIcon = (svgPath: string, color: string, size = 32) => {
  const html = `
    <div style="
      background-color: white; 
      border: 2px solid ${color}; 
      border-radius: 50%; 
      width: ${size}px; 
      height: ${size}px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      color: ${color};
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="${size - 12}" height="${size - 12}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${svgPath}
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const restaurantSvg = '<path d="M3 21V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><path d="M3 7l9-4 9 4"/>';
const homeSvg = '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
const bikeSvg = '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>';

const restaurantIcon = createIcon(restaurantSvg, '#dc2626', 36); 
const customerIcon = createIcon(homeSvg, '#16a34a', 36); 
const driverIcon = createIcon(bikeSvg, '#2563eb', 40); 

interface DeliveryData {
  id: string;
  customer: [number, number];
  driver: [number, number];
  route: [number, number][];
}

interface FleetTrackingData {
  restaurant: [number, number];
  deliveries: DeliveryData[];
}

export default function DeliveryMap() {
  const [data, setData] = useState<FleetTrackingData | null>(null);

  useEffect(() => {
    const fetchData = () => {
      fetch("http://127.0.0.1:8000/api/delivery/tracking")
        .then(res => res.json())
        .then(json => setData(json))
        .catch(err => console.error("Failed to fetch map tracking data", err));
    };
    
    fetchData();
    const intervalId = setInterval(fetchData, 1500);
    return () => clearInterval(intervalId);
  }, []);

  if (!data) {
    return <div className="h-full w-full flex items-center justify-center bg-muted/20 animate-pulse">Loading Live Fleet Map...</div>;
  }

  // Define some distinct colors for the different driver routes
  const routeColors = ['#2563eb', '#9333ea', '#ea580c', '#0d9488', '#d97706'];

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border">
      <MapContainer center={data.restaurant} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Origin Restaurant (Always one) */}
        <Marker position={data.restaurant} icon={restaurantIcon}>
          <Popup className="font-bold">Restaurant (Origin)</Popup>
        </Marker>

        {/* Map through all active deliveries */}
        {data.deliveries.map((delivery, idx) => {
          const color = routeColors[idx % routeColors.length];
          return (
            <div key={delivery.id}>
              {/* Individual Route Polyline */}
              <Polyline 
                positions={delivery.route} 
                color={color} 
                weight={5} 
                opacity={0.6} 
                dashArray="8, 8" 
              />

              {/* Destination */}
              <Marker position={delivery.customer} icon={customerIcon}>
                <Popup className="font-bold">Customer {idx + 1}</Popup>
              </Marker>

              {/* Live Driver */}
              <Marker position={delivery.driver} icon={createIcon(bikeSvg, color, 40)}>
                <Popup className="font-bold">
                  Delivery Partner {idx + 1}<br/>
                  <span style={{ color }} className="font-normal">On the way</span>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
