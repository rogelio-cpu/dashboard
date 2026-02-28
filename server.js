import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Stockage temporaire (In-memory)
let history = [];
let ongoingLeakVolume = 0;
let lastDataTime = null;

// 1. API pour l'ESP32
app.post('/api/data', (req, res) => {
    const { api_key, flow_up, flow_down } = req.body;

    if (api_key !== 'AquaGuard_Secret_Key_2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (flow_up === undefined || flow_down === undefined) {
        return res.status(400).json({ error: 'Missing flow data' });
    }

    const now = Date.now();
    let durationSeconds = 1;
    if (lastDataTime) {
        durationSeconds = (now - lastDataTime) / 1000;
    }
    lastDataTime = now;

    // 1. Calcul de l'écart en ml/min
    let loss_ml_min = (flow_up - flow_down) * 1000;
    if (loss_ml_min < 0) loss_ml_min = 0;

    // 2. Logique de Filtrage (Gestion du biais de précision)
    let status = 'normal';
    if (loss_ml_min <= 300) {
        loss_ml_min = 0;
        status = 'normal';
        ongoingLeakVolume = 0;
    } else if (loss_ml_min <= 800) {
        status = 'warning';
    } else {
        status = 'critical';
    }

    // 3. Calcul du Volume Cumulé (Intégration temporelle)
    if (status !== 'normal') {
        ongoingLeakVolume += (loss_ml_min * durationSeconds) / 60;
    }

    const newData = {
        timestamp: new Date().toLocaleTimeString(),
        flow_up: +(flow_up * 1000).toFixed(0),     // ml/min
        flow_down: +(flow_down * 1000).toFixed(0), // ml/min
        loss: +ongoingLeakVolume.toFixed(1),       // ml (perte cumulée)
        status,
    };

    history.push(newData);
    if (history.length > 50) history.shift();

    console.log(`Données reçues: In:${newData.flow_up} Out:${newData.flow_down} ml/min | Écart:${loss_ml_min.toFixed(0)} ml/min | Vol Cumulé:${newData.loss} ml | Statut:${status}`);
    res.status(200).json({ message: 'Success', data: newData });
});

// 2. API pour le Dashboard
app.get('/api/history', (req, res) => {
    res.json(history);
});

// 3. Servir les fichiers statiques du build de Vite
app.use(express.static(path.join(__dirname, 'dist')));

// 4. Redirection vers index.html pour le routage SPA
// UTILISATION D'UNE REGEX PURE (SANS GUILLEMETS) POUR ÉVITER LES ERREURS DE SYNTAXE
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`AquaGuard Server running on port ${port}`);
});
