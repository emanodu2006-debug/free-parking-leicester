const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());

const markersFile = path.join(__dirname, 'markers.json');
let markers = JSON.parse(fs.readFileSync(markersFile, 'utf8'));


app.get("/markers", (req, res) => {

  res.json(markers);
})

app.post("/admin", (req, res) =>{
    const {latitude, longitude, popup} = req.body;
    const newMarker = { geocode: [parseFloat(latitude), parseFloat(longitude)], popup };
    markers.push(newMarker);
    fs.writeFileSync(markersFile, JSON.stringify(markers, null, 2));
    res.json({ success: true });
})


app.listen(5000, () => {
    console.log("listening on port 5000")
})