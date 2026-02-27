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

// API pour l'ESP32
app.post('/api/data', (req, res) => {
    const { api_key, flow_up, flow_down } = req.body;

    // Vérification de sécurité simple
    if (api_key !== 'AquaGuard_Secret_Key_2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (flow_up === undefined || flow_down === undefined) {
        return res.status(400).json({ error: 'Missing flow data' });
    }

    const loss = +(flow_up - flow_down).toFixed(2);
    const status = loss > 0.8 ? 'critical' : (loss > 0.3 ? 'warning' : 'normal');

    const newData = {
        timestamp: new Date().toLocaleTimeString(),
        flow_up,
        flow_down,
        loss,
        status,
    };

    history.push(newData);
    // On garde uniquement les 50 derniers pour ne pas saturer la mémoire
    if (history.length > 50) history.shift();

    console.log(`Données reçues: In:${flow_up} Out:${flow_down} Loss:${loss}`);
    res.status(200).json({ message: 'Success', data: newData });
});

// API pour le Dashboard (Frontend)
app.get('/api/history', (req, res) => {
    res.json(history);
});

// Servir les fichiers statiques du build de Vite
// Assurez-vous que le dossier se nomme bien 'dist' après votre build
app.use(express.static(path.join(__dirname, 'dist')));

// Redirection vers index.html pour le routage SPA (Single Page Application)
// CORRECTION : Utilisation d'un paramètre nommé ':path*' pour compatibilité Express 5+
app.get('/:path*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`AquaGuard Server running on port ${port}`);
});
