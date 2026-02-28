#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include <ArduinoJson.h>

// ========== CONFIGURATION ==========
// WiFi
const char* ssid = "sudo";
const char* password = "12345678";

// Serveur Render
// Note: Ajout de "/api/data" à la fin de l'URL pour correspondre à la route Express
const char* serverUrl = "https://dashboard-ui-oe5z.onrender.com/api/data"; 
const char* apiKey = "AquaGuard_Secret_Key_2026";

// NTP pour timestamp
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600;  // GMT+1
const int daylightOffset_sec = 0;

// ========== PINS ==========
#define FLOW_UP_PIN 18       // Débitmètre amont
#define FLOW_DOWN_PIN 19     // Débitmètre aval
#define LED_PIN 2            // LED intégrée
#define BUZZER_PIN 4         // Buzzer optionnel

// ========== VARIABLES ==========
volatile long pulsesUp = 0;
volatile long pulsesDown = 0;
const float calibrationFactor = 450.0;  // Facteur de calibration YF-S201
const float LEAK_THRESHOLD = 0.5;       // Seuil de détection sensible (L/min)

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000;  // Envoi toutes les 1 seconde pour "temps réel"
bool lastLeakState = false;               // Pour détecter un nouveau changement d'état

// Compteurs pour statistiques
unsigned long totalPulsesUp = 0;
unsigned long totalPulsesDown = 0;
int leakCount = 0;

// ========== INTERRUPTIONS ==========
void IRAM_ATTR countPulseUp() {
    pulsesUp++;
    totalPulsesUp++;
}

void IRAM_ATTR countPulseDown() {
    pulsesDown++;
    totalPulsesDown++;
}

// ========== FONCTIONS ==========
String getDateTime() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        return "1970-01-01 00:00:00";
    }
    char buffer[25];
    strftime(buffer, 25, "%Y-%m-%d %H:%M:%S", &timeinfo);
    return String(buffer);
}

void connectToWiFi() {
    Serial.print("Connexion WiFi");
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✅ WiFi connecté!");
        Serial.print("IP : ");
        Serial.println(WiFi.localIP());
        digitalWrite(LED_PIN, HIGH);
    } else {
        Serial.println("\n❌ Échec connexion WiFi");
    }
}

void sendToServer(float flowUp, float flowDown, bool leak) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("❌ WiFi déconnecté");
        return;
    }

    WiFiClientSecure client;
    client.setInsecure();  // Pour Render (HTTPS)
    
    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Création du JSON
    StaticJsonDocument<200> doc;
    doc["api_key"] = apiKey;
    doc["flow_up"] = flowUp;
    doc["flow_down"] = flowDown;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.print("📤 Envoi : ");
    Serial.println(jsonString);
    
    int httpCode = http.POST(jsonString);
    
    if (httpCode > 0) {
        Serial.printf("✅ Réponse serveur: %d\n", httpCode);
        String payload = http.getString();
        Serial.println("Réponse : " + payload);
        
        // Clignotement LED pour confirmation
        digitalWrite(LED_PIN, LOW);
        delay(100);
        digitalWrite(LED_PIN, HIGH);
    } else {
        Serial.printf("❌ Erreur envoi: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();
}

void printStats() {
    Serial.println("\n=== STATISTIQUES ===");
    Serial.print("Total impulsions entrée : ");
    Serial.println(totalPulsesUp);
    Serial.print("Total impulsions sortie : ");
    Serial.println(totalPulsesDown);
    Serial.print("Fuites détectées : ");
    Serial.println(leakCount);
    Serial.print("Uptime : ");
    Serial.print(millis() / 1000);
    Serial.println(" secondes");
    Serial.println("====================\n");
}

// ========== SETUP ==========
void setup() {
    Serial.begin(115200);
    Serial.println("\n\n=== AQUAGUARD DÉMARRAGE ===");
    
    // Configuration des pins
    pinMode(FLOW_UP_PIN, INPUT_PULLUP);
    pinMode(FLOW_DOWN_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    
    // Attachement des interruptions
    attachInterrupt(digitalPinToInterrupt(FLOW_UP_PIN), countPulseUp, RISING);
    attachInterrupt(digitalPinToInterrupt(FLOW_DOWN_PIN), countPulseDown, RISING);
    
    // Connexion WiFi
    connectToWiFi();
    
    // Synchronisation NTP
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    
    // Test initial
    Serial.println("✅ Système prêt!");
    digitalWrite(LED_PIN, HIGH);
    
    delay(2000);
}

// ========== LOOP ==========
void loop() {
    static unsigned long lastStatsTime = 0;
    
    // Réinitialisation des compteurs toutes les secondes
    noInterrupts();
    long pUp = pulsesUp;
    long pDown = pulsesDown;
    pulsesUp = 0;
    pulsesDown = 0;
    interrupts();
    
    // Calcul des débits
    float flowUp = (pUp / calibrationFactor) * 60.0;
    float flowDown = (pDown / calibrationFactor) * 60.0;
    float loss = flowUp - flowDown;
    bool leak = loss >= LEAK_THRESHOLD;
    
    if (leak) {
        leakCount++;
        digitalWrite(BUZZER_PIN, HIGH);
    } else {
        digitalWrite(BUZZER_PIN, LOW);
    }
    
    // Affichage console
    Serial.println("---------------------");
    Serial.print("📊 ");
    Serial.print(getDateTime());
    Serial.print(" | Entrée: ");
    Serial.print(flowUp, 1);
    Serial.print(" L/min | Sortie: ");
    Serial.print(flowDown, 1);
    Serial.print(" L/min | Perte: ");
    Serial.print(loss, 1);
    Serial.print(" L/min | ");
    
    if (leak) {
        Serial.print("🔴 FUITE");
    } else if (loss > 1.0) {
        Serial.print("🟠 Instable");
    } else {
        Serial.print("🟢 Normal");
    }
    Serial.println();
    
    // Envoi au serveur (Toutes les secondes OU immédiatement si nouvelle fuite détectée)
    if ((millis() - lastSendTime >= sendInterval) || (leak && !lastLeakState)) {
        sendToServer(flowUp, flowDown, leak);
        lastSendTime = millis();
        lastLeakState = leak; // Mémoriser l'état pour éviter les envois en boucle immédiats
    } else if (!leak && lastLeakState) {
        // Envoi immédiat aussi quand la fuite s'arrête pour mettre à jour le dashboard
        sendToServer(flowUp, flowDown, leak);
        lastSendTime = millis();
        lastLeakState = leak;
    }
    
    // Stats toutes les minutes
    if (millis() - lastStatsTime >= 60000) {
        printStats();
        lastStatsTime = millis();
    }
    
    delay(1000);
}
