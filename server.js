import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory storage (Remplace la base de données pour éviter les erreurs de connexion)
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

    const esp_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const COMPENSATION_FACTOR = 1.045;
    let adjusted_flow_down = flow_down * COMPENSATION_FACTOR;
    let loss_ml_min = (flow_up - adjusted_flow_down) * 1000;

    ongoingLeakVolume += (loss_ml_min * durationSeconds) / 60;
    if (ongoingLeakVolume < 0) ongoingLeakVolume = 0;

    if (flow_up === 0 && flow_down === 0 && ongoingLeakVolume > 0 && ongoingLeakVolume < 1000) {
        ongoingLeakVolume -= 50;
        if (ongoingLeakVolume < 0) ongoingLeakVolume = 0;
    }

    // 5. Logique de Filtrage des Statuts (Plus réactive)
    let status = 'normal';
    // Seuil de reset automatique (15 relevés successifs à ~2s = 30s)
    const RESET_THRESHOLD = 15;
    if (!global.balancedCount) global.balancedCount = 0;

    // Déterminer le statut basé principalement sur le flux INSTANTANÉ
    if (loss_ml_min > 2000) {
        status = 'critical'; // Fuite massive immédiate
        global.balancedCount = 0;
    } else if (loss_ml_min > 800) {
        status = 'warning';  // Fuite modérée
        global.balancedCount = 0;
    } else if (ongoingLeakVolume > 1500) {
        // Si le flux est équilibré mais qu'on a déjà perdu beaucoup, 
        // on reste en warning au lieu de critique
        status = 'warning';
        global.balancedCount = 0;
    } else if (ongoingLeakVolume > 500) {
        status = 'warning';
        global.balancedCount = 0;
    } else {
        status = 'normal';
        global.balancedCount++;
    }

    // Auto-Reset si stable pendant 30s
    if (global.balancedCount >= RESET_THRESHOLD && ongoingLeakVolume > 0) {
        console.log('Réinitialisation automatique du volume (stabilité détectée).');
        ongoingLeakVolume = 0;
        global.balancedCount = 0;
    }

    const newData = {
        id: history.length + 1,
        timestamp: new Date().toISOString(),
        flow_up: +(flow_up * 1000).toFixed(0),
        flow_down: +(flow_down * 1000).toFixed(0),
        loss: +ongoingLeakVolume.toFixed(1),
        status,
        esp_ip: esp_ip
    };

    // Ajouter à l'historique en mémoire (limité aux 1000 derniers)
    history.unshift(newData);
    if (history.length > 1000) history.pop();

    console.log(`Données reçues: In:${newData.flow_up} Out:${newData.flow_down} ml/min | Écart:${loss_ml_min.toFixed(0)} ml/min | Vol Cumulé:${newData.loss} ml | Statut:${status} | IP:${esp_ip}`);

    const uiData = { ...newData, timestamp: new Date().toLocaleTimeString() };
    res.status(200).json({ message: 'Success', data: uiData });
});

// 2. API pour le Dashboard (Aperçu)
app.get('/api/history', (req, res) => {
    // 50 dernières entrées pour le dashboard, triées du plus ancien au plus récent pour les graphiques
    const data = history.slice(0, 50).reverse().map(row => ({
        ...row,
        timestamp: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
    res.json(data);
});

// 4. API pour réinitialiser le volume cumulé
app.post('/api/reset', (req, res) => {
    ongoingLeakVolume = 0;
    console.log('Volume cumulé réinitialisé par l\'utilisateur.');
    res.json({ message: 'Volume réinitialisé' });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`AquaGuard Server running (in-memory mode) on port ${port}`);
});
