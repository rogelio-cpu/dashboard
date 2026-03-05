import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialiser la base de données SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur ouverture BDD SQLite:', err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            flow_up REAL NOT NULL,
            flow_down REAL NOT NULL,
            loss REAL NOT NULL,
            status TEXT NOT NULL,
            esp_ip TEXT
        )`);
    }
});

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

    // Extraire l'IP de la requête (gère les proxies comme Render)
    const esp_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 1. Compensation du biais matériel (Le capteur amont donne ~4.5% de plus que la sortie d'après les relevés)
    const COMPENSATION_FACTOR = 1.045;
    let adjusted_flow_down = flow_down * COMPENSATION_FACTOR;

    // 2. Calcul de l'écart (Différence) en ml/min
    // On OMET l'interdiction d'être négatif, car un écart négatif (à l'arrêt) 
    // permet d'annuler la "fausse" perte accumulée lors de l'allumage avec le décalage de 50cm !
    let loss_ml_min = (flow_up - adjusted_flow_down) * 1000;

    // 3. Calcul du Volume Cumulé (Intégration temporelle)
    // On ajoute cette perte (ou on la soustrait si négative) au volume continu
    ongoingLeakVolume += (loss_ml_min * durationSeconds) / 60;

    // On ne permet pas au volume de fuite de devenir négatif (pas de "création" magique d'eau)
    if (ongoingLeakVolume < 0) {
        ongoingLeakVolume = 0;
    }

    // 4. Auto-nettoyage (Purger les micro-erreurs d'arrondi quand il n'y a plus de flux)
    if (flow_up === 0 && flow_down === 0 && ongoingLeakVolume > 0 && ongoingLeakVolume < 1000) {
        ongoingLeakVolume -= 50;
        if (ongoingLeakVolume < 0) ongoingLeakVolume = 0;
    }

    // 5. Logique de Filtrage des Statuts
    let status = 'normal';

    // Le statut dépend maintenant d'une approche hybride : le débit ET le volume
    if (ongoingLeakVolume < 500 && Math.abs(loss_ml_min) <= 1000) {
        // En dessous de 500ml et avec peu d'écart instantané, c'est du bruit système
        status = 'normal';
    } else if (loss_ml_min > 2000 || ongoingLeakVolume > 1500) {
        // Fuite forte (débit élevé persistant) OU accumulation importante 
        status = 'critical';
    } else if (loss_ml_min > 800 || ongoingLeakVolume > 500) {
        // Zone intermédiaire (Avertissement)
        status = 'warning';
    }

    const newData = {
        timestamp: new Date().toISOString(), // Use ISO string for DB sorting/filtering 
        flow_up: +(flow_up * 1000).toFixed(0),     // ml/min
        flow_down: +(flow_down * 1000).toFixed(0), // ml/min
        loss: +ongoingLeakVolume.toFixed(1),       // ml (perte cumulée)
        status,
        esp_ip: esp_ip
    };

    // Insérer dans la base de données
    const query = `INSERT INTO history (timestamp, flow_up, flow_down, loss, status, esp_ip) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [newData.timestamp, newData.flow_up, newData.flow_down, newData.loss, newData.status, newData.esp_ip], function (err) {
        if (err) {
            console.error('Erreur insertion BDD:', err.message);
        }
    });

    console.log(`Données reçues: In:${newData.flow_up} Out:${newData.flow_down} ml/min | Écart:${loss_ml_min.toFixed(0)} ml/min | Vol Cumulé:${newData.loss} ml | Statut:${status} | IP:${esp_ip}`);

    // Return friendly timestamp to the UI for real-time update
    const uiData = { ...newData, timestamp: new Date().toLocaleTimeString() };
    res.status(200).json({ message: 'Success', data: uiData });
});

// 2. API pour le Dashboard (Aperçu temps réel)
app.get('/api/history', (req, res) => {
    // Rend simplement les 50 dernières entrées pour le dashboard direct
    const query = `SELECT * FROM history ORDER BY timestamp DESC LIMIT 50`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erreur lecture BDD:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const formattedRows = rows.reverse().map(row => ({
            ...row,
            timestamp: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));

        res.json(formattedRows);
    });
});

// 3. API pour la page Historique complet
app.get('/api/history/all', (req, res) => {
    // Rend jusqu'à 1000 entrées pour la page d'historique tableur
    const query = `SELECT * FROM history ORDER BY timestamp DESC LIMIT 1000`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erreur lecture BDD Historique complet:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // La page historique voudra voir des dates complètes
        const formattedRows = rows.map(row => {
            const dateObj = new Date(row.timestamp);
            return {
                ...row,
                timestamp: dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString()
            };
        });

        res.json(formattedRows);
    });
});

res.json(formattedRows);
    });
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
