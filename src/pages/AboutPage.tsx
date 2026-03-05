export const AboutPage = () => {
    return (
        <div className="max-w-3xl mx-auto py-12">
            <div className="glass-card p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">À Propos du Projet AquaGuard</h2>
                    <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-6 text-slate-600 dark:text-slate-300">
                    <p className="text-lg leading-relaxed">
                        Ce tableau de bord de surveillance et de détection de fuites d'eau a été réalisé à des fins académiques dans le cadre du cours <strong>des Objets Connectés (IoT)</strong>.
                    </p>

                    <div className="bg-blue-50 dark:bg-slate-800/50 p-6 rounded-xl border border-blue-100 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-400 mb-4">Équipe de Réalisation</h3>
                        <p className="text-lg font-medium">Ce projet a été conçu et développé par le <strong className="text-blue-600 dark:text-blue-300">Groupe 9</strong>.</p>

                        <ul className="mt-4 space-y-2 list-disc list-inside px-4">
                            <li>Analyse des capteurs à effet Hall (YF-S201)</li>
                            <li>Développement embarqué sur ESP32 (C++)</li>
                            <li>Architecture Backend Node.js et persistance SQLite</li>
                            <li>Interface utilisateur React moderne et réactive</li>
                        </ul>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-sm text-center">
                        <p>Système de Monitoring IoT • Année académique 2025-2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
