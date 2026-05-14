import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  leagueCode: string;
  sweepstakeName: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ leagueCode, sweepstakeName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate the full join URL
  const joinUrl = `${window.location.origin}/join/code?code=${leagueCode}`;

  useEffect(() => {
    const generateQR = async () => {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, joinUrl, {
          errorCorrectionLevel: 'H',
          width: 256,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setQrDataUrl(dataUrl);
      }
    };
    generateQR();
  }, [joinUrl]);

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `${sweepstakeName}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    alert('Join link copied to clipboard!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${sweepstakeName}`,
          text: `Scan this QR code or use code: ${leagueCode}`,
          url: joinUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="glass-card p-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
      <h3 className="text-2xl section-title mb-4">Share This Sweepstake</h3>
      
      {/* QR Code Container */}
      <div 
        className="flex justify-center mb-6 p-6 rounded-lg bg-white"
        style={{ width: 'fit-content', margin: '0 auto' }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '256px', height: '256px' }}
        />
      </div>

      {/* League Code Display */}
      <div className="text-center mb-6">
        <p className="section-subtitle text-sm mb-2">Or use league code:</p>
        <p className="text-2xl font-mono font-bold text-cyan-300 tracking-widest">{leagueCode}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleDownloadQR}
          className="btn-secondary py-2 px-4 text-sm flex items-center justify-center gap-2 hover:bg-slate-600 transition"
        >
          📥 Download QR Code
        </button>
        <button
          onClick={handleCopyLink}
          className="btn-secondary py-2 px-4 text-sm flex items-center justify-center gap-2 hover:bg-slate-600 transition"
        >
          🔗 Copy Join Link
        </button>
        <button
          onClick={handleShare}
          className="btn-secondary py-2 px-4 text-sm flex items-center justify-center gap-2 hover:bg-slate-600 transition"
        >
          📤 Share
        </button>
      </div>

      <p className="text-xs section-subtitle text-center mt-4">
        Players can scan this QR code or enter the league code to join
      </p>
    </div>
  );
};
