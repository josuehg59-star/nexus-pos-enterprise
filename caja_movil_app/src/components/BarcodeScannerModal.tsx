import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'mobile-qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            if (decodedText) {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(1200, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
              } catch (_) {}

              onScan(decodedText.trim());
              onClose();
            }
          },
          () => {
            // Ignoramos frames sin código
          }
        );

        scannerRef.current = scanner;
      } catch (err: any) {
        setErrorMsg('No se pudo acceder a la cámara. Revisa los permisos en tu navegador o celular.');
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>ESCANEAR CÓDIGO CON CÁMARA</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center justify-center">
          {errorMsg ? (
            <div className="text-rose-400 text-sm text-center p-4 bg-rose-950/30 rounded-xl border border-rose-800/40">
              {errorMsg}
            </div>
          ) : (
            <div className="w-full">
              <div id="mobile-qr-reader" className="w-full rounded-xl overflow-hidden text-slate-200"></div>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Apunta la cámara del celular al código de barras del producto
              </p>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-800 border-t border-slate-700">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};
