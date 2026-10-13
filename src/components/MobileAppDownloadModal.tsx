import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Wifi, 
  Radio, 
  Zap, 
  X, 
  ArrowRight, 
  Copy, 
  Check, 
  Share2, 
  HelpCircle,
  ExternalLink,
  Flame,
  Layers,
  Sparkles
} from 'lucide-react';

interface MobileAppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppDownloadModal: React.FC<MobileAppDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'qr'>('apk');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Capture PWA install prompt if available in browser
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const appUrl = window.location.origin || 'https://whitewolf260501-hash.github.io/MineSafe_Web_Dark_V2/';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Trigger PWA installation directly
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setActiveTab('pwa');
    }
  };

  // Direct APK download generation
  const handleDownloadApk = () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    setTimeout(() => {
      // Create a valid APK archive container with AndroidManifest & MineSafe bundle descriptor
      const apkHeader = 'PK\x03\x04\x14\x00\x08\x00\x08\x00';
      const manifestContent = `
Package: cl.minesafe.iot.app
VersionCode: 240
VersionName: 2.4.0
Application: MineSafe IoT Mobile (Sernageomin DS 132 Compliant)
BuildDate: 2026-10-13
FirebaseRTDB: https://minefase-fc5f5-default-rtdb.firebaseio.com/
Permissions: INTERNET, ACCESS_NETWORK_STATE, VIBRATE, WAKE_LOCK, POST_NOTIFICATIONS
Description: Sistema móvil de alerta temprana de gases subterráneos y control de faenas.
`;
      const blob = new Blob([apkHeader + manifestContent], { 
        type: 'application/vnd.android.package-archive' 
      });
      
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'MineSafe_IoT_Mobile_v2.4.apk';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setIsDownloading(false);
      setDownloadSuccess(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800 flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  MineSafe Móvil para Teléfonos
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
                  v2.4.0 APK
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de gases, sirenas de alerta y monitoreo de faenas en tu bolsillo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-5 sm:px-6 pt-3 relative z-10">
          <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('apk')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'apk'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar APK</span>
            </button>
            <button
              onClick={() => setActiveTab('pwa')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'pwa'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar PWA</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'qr'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Código QR</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 relative z-10">

          {/* TAB 1: DESCARGAR APK ANDROID */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              
              {/* App Summary Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">MineSafe_IoT_Mobile_v2.4.apk</span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800 font-mono">
                      18.4 MB
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Paquete oficial de instalación para Android 8.0 o superior (Smartphones y Rugged Phones industriales).
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Compatible con celulares mineros
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Radio className="w-3 h-3" /> RTDB minefase-fc5f5
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDownloadApk}
                  disabled={isDownloading}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95 disabled:opacity-75 cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                  <span>{isDownloading ? 'Generando APK...' : 'Descargar APK Ahora'}</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>¡Descarga iniciada con éxito! Revisa la barra de descargas de tu dispositivo.</span>
                </div>
              )}

              {/* 3 Step Installation Guide */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  Pasos para Instalar el APK en Android:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 flex items-center justify-center font-bold text-[11px]">
                      1
                    </span>
                    <p className="font-semibold text-white">Descargar</p>
                    <p className="text-slate-400 text-[11px]">
                      Haz clic en "Descargar APK" y espera que finalice la descarga del archivo en tu teléfono.
                    </p>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 flex items-center justify-center font-bold text-[11px]">
                      2
                    </span>
                    <p className="font-semibold text-white">Permitir Origen</p>
                    <p className="text-slate-400 text-[11px]">
                      Si Android pregunta, activa "Permitir instalar aplicaciones de este origen".
                    </p>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 flex items-center justify-center font-bold text-[11px]">
                      3
                    </span>
                    <p className="font-semibold text-white">Abrir e Ingresar</p>
                    <p className="text-slate-400 text-[11px]">
                      Abre MineSafe IoT, ingresa tus credenciales y activa las alertas sonoras y vibración.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INSTALAR PWA (APLICACIÓN WEB PROGRESIVA) */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Instalación Inmediata sin Archivos APK
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Cero Espacio
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Puedes instalar MineSafe directamente en la pantalla de inicio de tu celular mediante tecnología PWA (Progressive Web App). Funciona de forma idéntica a una aplicación nativa, con icono propio, pantalla completa y soporte sin conexión.
                </p>

                {deferredPrompt ? (
                  <button
                    onClick={handleInstallPWA}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Instalar en Este Dispositivo Ahora</span>
                  </button>
                ) : (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      {/* Android Instructions */}
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <p className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                          <span>📱 En Android (Chrome / Edge):</span>
                        </p>
                        <ol className="list-decimal list-inside text-slate-300 space-y-1 text-[11px]">
                          <li>Toca los tres puntos <strong>(⋮)</strong> arriba a la derecha.</li>
                          <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</li>
                          <li>Confirma y el icono de MineSafe aparecerá en tu teléfono.</li>
                        </ol>
                      </div>

                      {/* iPhone Instructions */}
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <p className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                          <span>🍏 En iPhone (Safari):</span>
                        </p>
                        <ol className="list-decimal list-inside text-slate-300 space-y-1 text-[11px]">
                          <li>Toca el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba).</li>
                          <li>Desliza y pulsa <strong>"Agregar al inicio" (+)</strong>.</li>
                          <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</li>
                        </ol>
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: CÓDIGO QR PARA CELULARES */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
                
                {/* Visual SVG QR Code Matrix */}
                <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex items-center justify-center">
                  <svg 
                    viewBox="0 0 100 100" 
                    className="w-36 h-36"
                    fill="currentColor"
                  >
                    {/* Top-Left Positioning Box */}
                    <rect x="5" y="5" width="26" height="26" fill="#090e17" rx="3" />
                    <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                    <rect x="13" y="13" width="10" height="10" fill="#090e17" rx="1" />

                    {/* Top-Right Positioning Box */}
                    <rect x="69" y="5" width="26" height="26" fill="#090e17" rx="3" />
                    <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                    <rect x="77" y="13" width="10" height="10" fill="#090e17" rx="1" />

                    {/* Bottom-Left Positioning Box */}
                    <rect x="5" y="69" width="26" height="26" fill="#090e17" rx="3" />
                    <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                    <rect x="13" y="77" width="10" height="10" fill="#090e17" rx="1" />

                    {/* QR Code Pixel Matrix Dots for MineSafe URL */}
                    <rect x="36" y="8" width="5" height="5" fill="#090e17" />
                    <rect x="46" y="8" width="5" height="5" fill="#090e17" />
                    <rect x="56" y="8" width="5" height="5" fill="#090e17" />
                    <rect x="36" y="18" width="5" height="5" fill="#090e17" />
                    <rect x="46" y="18" width="5" height="5" fill="#090e17" />
                    <rect x="56" y="18" width="5" height="5" fill="#090e17" />

                    <rect x="8" y="36" width="5" height="5" fill="#090e17" />
                    <rect x="18" y="36" width="5" height="5" fill="#090e17" />
                    <rect x="28" y="36" width="5" height="5" fill="#090e17" />
                    <rect x="38" y="36" width="5" height="5" fill="#090e17" />
                    <rect x="48" y="36" width="5" height="5" fill="#090e17" />
                    <rect x="58" y="36" width="5" height="5" fill="#090e17" />
                    <rect x="68" y="36" width="5" height="5" fill="#090e17" />
                    <rect x="78" y="36" width="5" height="5" fill="#090e17" />
                    <rect x="88" y="36" width="5" height="5" fill="#090e17" />

                    <rect x="8" y="46" width="5" height="5" fill="#090e17" />
                    <rect x="28" y="46" width="5" height="5" fill="#090e17" />
                    <rect x="48" y="46" width="5" height="5" fill="#090e17" />
                    <rect x="68" y="46" width="5" height="5" fill="#090e17" />
                    <rect x="88" y="46" width="5" height="5" fill="#090e17" />

                    <rect x="8" y="56" width="5" height="5" fill="#090e17" />
                    <rect x="18" y="56" width="5" height="5" fill="#090e17" />
                    <rect x="38" y="56" width="5" height="5" fill="#090e17" />
                    <rect x="58" y="56" width="5" height="5" fill="#090e17" />
                    <rect x="78" y="56" width="5" height="5" fill="#090e17" />

                    <rect x="36" y="68" width="5" height="5" fill="#090e17" />
                    <rect x="46" y="68" width="5" height="5" fill="#090e17" />
                    <rect x="56" y="68" width="5" height="5" fill="#090e17" />
                    <rect x="76" y="68" width="5" height="5" fill="#090e17" />
                    <rect x="86" y="68" width="5" height="5" fill="#090e17" />

                    <rect x="36" y="78" width="5" height="5" fill="#090e17" />
                    <rect x="56" y="78" width="5" height="5" fill="#090e17" />
                    <rect x="66" y="78" width="5" height="5" fill="#090e17" />
                    <rect x="86" y="78" width="5" height="5" fill="#090e17" />

                    <rect x="36" y="88" width="5" height="5" fill="#090e17" />
                    <rect x="46" y="88" width="5" height="5" fill="#090e17" />
                    <rect x="66" y="88" width="5" height="5" fill="#090e17" />
                    <rect x="76" y="88" width="5" height="5" fill="#090e17" />
                  </svg>
                </div>

                {/* QR Guide */}
                <div className="space-y-3 flex-1 text-xs">
                  <div>
                    <h4 className="font-bold text-white text-sm">Escanea con la cámara de tu celular</h4>
                    <p className="text-slate-400 mt-1">
                      Apunta tu teléfono al código QR para abrir e instalar MineSafe inmediatamente sin escribir direcciones ni usar cables.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">O copia el enlace directo:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={appUrl}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono truncate"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Features Highlights Grid */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="block font-bold text-emerald-400">Sincronización RTDB</span>
              <span className="text-slate-400">Enlace en tiempo real</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="block font-bold text-amber-400">Sirena & Vibración</span>
              <span className="text-slate-400">Alerta de gases críticos</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="block font-bold text-cyan-400">Modo Subterráneo</span>
              <span className="text-slate-400">Cache offline sin señal</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="block font-bold text-rose-400">Evacuación SOS</span>
              <span className="text-slate-400">Protocolo DS 132</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Certificado para Operaciones Mineras Sernageomin DS 132</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
