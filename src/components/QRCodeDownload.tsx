import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check, Clipboard } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDownloadProps {
  url: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  hostType: string;
  hostName: string;
  imageUrl?: string;
}

export const QRCodeDownload: React.FC<QRCodeDownloadProps> = ({
  url,
  eventName,
  eventDate,
  eventTime,
  location,
  hostType,
  hostName,
  imageUrl
}) => {
  const [copied, setCopied] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${url}/register`);
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(true);
      toast.success('Event code copied to clipboard');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      toast.error('Failed to copy event code');
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('event-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create a temporary image for the QR code
    const qrImg = new Image();
    qrImg.onload = () => {
      if (!ctx) return;

      // Set canvas dimensions
      canvas.width = 800;
      canvas.height = 1200;

      // Fill background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // If event image exists, load and draw it
      if (imageUrl) {
        const eventImg = new Image();
        eventImg.crossOrigin = 'anonymous';
        eventImg.onload = () => {
          // Draw event image at the top
          const aspectRatio = eventImg.width / eventImg.height;
          const targetHeight = 400;
          const targetWidth = targetHeight * aspectRatio;
          const x = (canvas.width - targetWidth) / 2;
          
          // Add image with rounded corners
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, 50, targetWidth, targetHeight, 20);
          ctx.clip();
          ctx.drawImage(eventImg, x, 50, targetWidth, targetHeight);
          ctx.restore();

          finishDrawing();
        };
        eventImg.src = imageUrl;
      } else {
        finishDrawing();
      }

      function finishDrawing() {
        // Add decorative elements
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, imageUrl ? 500 : 50, canvas.width, 4);

        // Draw event title
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(eventName, canvas.width / 2, imageUrl ? 580 : 130);

        // Draw event details
        ctx.font = '24px Arial';
        const yStart = imageUrl ? 650 : 200;
        const details = [
          `Date: ${new Date(eventDate).toLocaleDateString()}`,
          `Time: ${eventTime}`,
          `Location: ${location}`,
          `Host: ${hostName} (${hostType})`
        ];

        details.forEach((detail, index) => {
          ctx.fillText(detail, canvas.width / 2, yStart + (index * 40));
        });

        // Draw QR code
        const qrSize = 300;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = imageUrl ? 800 : 400;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // Add border to QR code
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

        // Create download link
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-invitation.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    qrImg.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Event Code Section */}
      <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Event Code
        </h3>
        <div className="flex items-center justify-center space-x-2">
          <code className="px-4 py-2 bg-white dark:bg-gray-900 rounded-md text-lg font-mono">
            {url}
          </code>
          <button
            onClick={handleCopyCode}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy event code"
          >
            {copiedCode ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Clipboard className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <QRCodeSVG
        id="event-qr-code"
        value={`${window.location.origin}/events/${url}/register`}
        size={200}
        level="H"
        includeMargin
        className="bg-white p-2 rounded-lg"
      />

      <div className="flex flex-col w-full space-y-2">
        <div className="flex items-center space-x-2 w-full">
          <input
            type="text"
            value={`${window.location.origin}/events/${url}/register`}
            readOnly
            className="flex-1 px-3 py-2 border rounded bg-gray-50 dark:bg-gray-800 text-sm"
          />
          <button
            onClick={handleCopyUrl}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors w-full"
        >
          <Download className="h-4 w-4" />
          <span>Download Invitation</span>
        </button>
      </div>
    </div>
  );
};