import { useState } from 'react';
import axios from 'axios';
import './Admin.css';

function Admin() {
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [popup, setPopup] = useState("");
    const [message, setMessage] = useState("");

    function handleSubmit() {
        axios.post("/admin", {
            latitude,
            longitude,
            popup
        }).then(() => {
            setMessage("Street added successfully!");
            setLatitude("");
            setLongitude("");
            setPopup("");
        }).catch(() => {
            setMessage("Failed to add street.");
        });
    }

    return (
        <div className="admin-container">
            <h1 className="admin-title">🅿️ Add Parking Street</h1>
            <div className="admin-form">
                <div className="admin-field">
                    <label>Latitude</label>
                    <input
                        type="text"
                        placeholder="e.g. 52.6386"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                    />
                </div>
                <div className="admin-field">
                    <label>Longitude</label>
                    <input
                        type="text"
                        placeholder="e.g. -1.1317"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                    />
                </div>
                <div className="admin-field">
                    <label>Popup text</label>
                    <input
                        type="text"
                        placeholder="e.g. London Road - Free parking for one hour"
                        value={popup}
                        onChange={(e) => setPopup(e.target.value)}
                    />
                </div>
                <button className="admin-btn" onClick={handleSubmit}>Add Street</button>
                {message && <p className="admin-message">{message}</p>}
            </div>
        </div>
    );
}

export default Admin;
