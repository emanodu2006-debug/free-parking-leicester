import './App.css';
import axios from 'axios';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet"
import { useState, useEffect, useRef } from 'react';
import { Icon } from 'leaflet';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function App() {
  const [data, setData] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [nearest, setNearest] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDist, setSearchDist] = useState(null);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);

  const customIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/149/149059.png",
    iconSize: [38, 38]
  })

  const selectedIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/149/149059.png",
    iconSize: [46, 46],
    className: 'selected-marker-icon'
  })

  useEffect(() => {
    axios.get("http://localhost:5000/markers")
      .then(response => setData(response.data));
  }, []);

  function handleLocate() {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setUserPos([lat, lon]);
      const sorted = [...data].sort((a, b) =>
        getDistance(lat, lon, a.geocode[0], a.geocode[1]) -
        getDistance(lat, lon, b.geocode[0], b.geocode[1])
      );
      const nearestMarker = sorted[0];
      const nearestIndex = data.indexOf(nearestMarker);
      setNearest(nearestMarker);
      setSelectedIndex(nearestIndex);
      if (mapRef.current) {
        mapRef.current.flyTo(nearestMarker.geocode, 16);
      }
      setTimeout(() => {
        if (markerRefs.current[nearestIndex]) {
          markerRefs.current[nearestIndex].openPopup();
        }
      }, 600);
    }, () => {
      alert("Could not get your location. Make sure location access is allowed.");
    });
  }

  function handleSidebarClick(marker, i) {
    setSelectedIndex(i);
    setSidebarOpen(false);
    if (mapRef.current) {
      mapRef.current.flyTo(marker.geocode, 16);
    }
    setTimeout(() => {
      if (markerRefs.current[i]) {
        markerRefs.current[i].openPopup();
      }
    }, 600);
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchDist(null);
    const query = searchQuery.trim();
    const geocodeQuery = /leicester/i.test(query) ? query : query + ', Leicester, UK';
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geocodeQuery)}&format=json&limit=1&countrycodes=gb`)
      .then(res => res.json())
      .then(results => {
        setSearching(false);
        if (!results.length) { alert('Place not found. Try a more specific address.'); return; }
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        const sorted = [...data].sort((a, b) =>
          getDistance(lat, lon, a.geocode[0], a.geocode[1]) -
          getDistance(lat, lon, b.geocode[0], b.geocode[1])
        );
        const nearestMarker = sorted[0];
        const nearestIndex = data.indexOf(nearestMarker);
        const dist = getDistance(lat, lon, nearestMarker.geocode[0], nearestMarker.geocode[1]);
        setSearchDist(dist);
        setSelectedIndex(nearestIndex);
        if (mapRef.current) mapRef.current.flyTo(nearestMarker.geocode, 16);
        setTimeout(() => {
          if (markerRefs.current[nearestIndex]) markerRefs.current[nearestIndex].openPopup();
        }, 600);
      })
      .catch(() => { setSearching(false); alert('Search failed. Check your connection.'); });
  }

  return (
    <div className="app-layout">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
        {sidebarOpen ? '✕' : '☰ Locations'}
      </button>
      <div className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}${sidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
        <h2 className="sidebar-title">
          🅿️ Free Parking
          <button className="sidebar-collapse-btn" onClick={() => setSidebarCollapsed(true)} title="Collapse">‹</button>
        </h2>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            className="search-input"
            type="text"
            placeholder="Search a place in Leicester..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button className="search-btn" type="submit" disabled={searching}>
            {searching ? '...' : '🔍'}
          </button>
        </form>
        {searchDist !== null && (
          <div className="search-result">
            Nearest parking is <strong>{searchDist < 1 ? (searchDist * 1000).toFixed(0) + 'm' : searchDist.toFixed(2) + 'km'}</strong> away
          </div>
        )}
        <ul className="sidebar-list">
          {data.map((marker, i) => {
            const name = marker.popup.split(' - ')[0];
            const dist = userPos
              ? getDistance(userPos[0], userPos[1], marker.geocode[0], marker.geocode[1])
              : null;
            return (
              <li key={i} className={`sidebar-item${selectedIndex === i ? ' sidebar-item--active' : ''}`} onClick={() => handleSidebarClick(marker, i)}>
                <span className="sidebar-name">{name}</span>
                {dist !== null && (
                  <span className="sidebar-dist">{dist < 1 ? (dist * 1000).toFixed(0) + 'm' : dist.toFixed(1) + 'km'}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
      {sidebarCollapsed && (
        <button className="sidebar-expand-tab" onClick={() => setSidebarCollapsed(false)} title="Show list">›</button>
      )}
      <button className="locate-btn" onClick={handleLocate}>
        📍 Find Nearest Parking
      </button>
      {nearest && (
        <div className="nearest-banner">
          <strong>Nearest:</strong> {nearest.popup}
        </div>
      )}
      <MapContainer ref={mapRef} center={[52.6386, -1.1317]} zoom={13} style={{ height: '100vh', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((marker, i) =>(
          <Marker key={i} position={marker.geocode} icon={i === selectedIndex ? selectedIcon : customIcon} ref={el => markerRefs.current[i] = el}>
            <Popup>
              {marker.popup}
              <br />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${marker.geocode[0]},${marker.geocode[1]}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions
              </a>
            </Popup>
          </Marker>
        ))}
        {userPos && (
          <CircleMarker center={userPos} radius={10} pathOptions={{ color: '#1a73e8', fillColor: '#1a73e8', fillOpacity: 0.8 }}>
            <Popup>You are here</Popup>
          </CircleMarker>
        )}
      </MapContainer>
      </div>
    </div>
  );
}

export default App;
