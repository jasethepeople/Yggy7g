import { useState, useRef, useEffect } from "react";
import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Camera, 
  X, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D,
  Download,
  Share,
  Settings,
  Smartphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ARPreviewProps {
  pattern: Pattern | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ARPreview({ pattern, isOpen, onClose }: ARPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isARActive, setIsARActive] = useState(false);
  const [arSettings, setArSettings] = useState({
    scale: 1.0,
    rotation: 0,
    position: { x: 0.5, y: 0.5 },
    opacity: 0.8
  });
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check AR support on mount
  useEffect(() => {
    const checkARSupport = () => {
      const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
      const hasCanvas = !!document.createElement('canvas').getContext;
      const hasWebGL = !!document.createElement('canvas').getContext('webgl');
      
      if (!hasMediaDevices || !hasCanvas || !hasWebGL) {
        setIsSupported(false);
        setError("AR features require camera access, Canvas, and WebGL support");
      }
    };

    checkARSupport();
  }, []);

  // Start AR camera when component opens
  useEffect(() => {
    if (isOpen && isSupported) {
      startARCamera();
    }
    
    return () => {
      stopARCamera();
    };
  }, [isOpen, isSupported]);

  const startARCamera = async () => {
    try {
      setError(null);
      
      // Request camera access with AR-optimized settings
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera for AR
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsARActive(true);
        
        toast({
          title: "AR Camera Active",
          description: "Point your camera where you want to place the pattern",
        });
      }
    } catch (error: any) {
      setError(`Camera access failed: ${error.message}`);
      toast({
        title: "Camera Error",
        description: "Please allow camera access for AR preview",
        variant: "destructive",
      });
    }
  };

  const stopARCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsARActive(false);
  };

  const renderAROverlay = () => {
    if (!isARActive || !pattern || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate pattern dimensions based on scale
    const baseSize = Math.min(canvas.width, canvas.height) * 0.3;
    const patternWidth = baseSize * arSettings.scale;
    const patternHeight = baseSize * arSettings.scale;

    // Position on screen
    const x = (canvas.width * arSettings.position.x) - (patternWidth / 2);
    const y = (canvas.height * arSettings.position.y) - (patternHeight / 2);

    // Set up rendering context
    ctx.save();
    ctx.globalAlpha = arSettings.opacity;
    ctx.translate(x + patternWidth / 2, y + patternHeight / 2);
    ctx.rotate((arSettings.rotation * Math.PI) / 180);
    ctx.translate(-patternWidth / 2, -patternHeight / 2);

    // Render pattern representation
    if (pattern.imageUrl) {
      // If pattern has an image, try to render it
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, patternWidth, patternHeight);
      };
      img.src = pattern.imageUrl;
    } else {
      // Fallback: render a pattern grid representation
      renderPatternGrid(ctx, patternWidth, patternHeight);
    }

    // Add pattern info overlay
    ctx.restore();
    renderPatternInfo(ctx, x, y, patternWidth);
  };

  const renderPatternGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    // Get colors from pattern
    const colors = pattern?.colorPalette || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Create a simple pattern using colors
        const colorIndex = (row + col) % colors.length;
        ctx.fillStyle = colors[colorIndex];
        
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
      }
    }

    // Add texture effect
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };

  const renderPatternInfo = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number) => {
    // Info box
    const infoHeight = 80;
    const infoY = y - infoHeight - 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect(x, infoY, width, infoHeight, 8);
    ctx.fill();

    // Text
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    
    const centerX = x + width / 2;
    ctx.fillText(pattern?.name || 'Crochet Pattern', centerX, infoY + 25);
    
    ctx.font = '12px sans-serif';
    ctx.fillText(`${pattern?.width || 40} × ${pattern?.height || 50} stitches`, centerX, infoY + 45);
    ctx.fillText(`Difficulty: ${pattern?.difficulty || 'Intermediate'}`, centerX, infoY + 65);
  };

  // Animation loop for AR rendering
  useEffect(() => {
    if (isARActive) {
      const animate = () => {
        renderAROverlay();
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [isARActive, arSettings, pattern]);

  const handleScaleChange = (value: number[]) => {
    setArSettings(prev => ({ ...prev, scale: value[0] }));
  };

  const handleRotationChange = (value: number[]) => {
    setArSettings(prev => ({ ...prev, rotation: value[0] }));
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number[]) => {
    setArSettings(prev => ({
      ...prev,
      position: { ...prev.position, [axis]: value[0] }
    }));
  };

  const resetPosition = () => {
    setArSettings({
      scale: 1.0,
      rotation: 0,
      position: { x: 0.5, y: 0.5 },
      opacity: 0.8
    });
  };

  const captureARPhoto = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    try {
      // Create capture canvas
      const captureCanvas = document.createElement('canvas');
      const captureCtx = captureCanvas.getContext('2d');
      if (!captureCtx) return;

      // Set capture size
      captureCanvas.width = videoRef.current.videoWidth;
      captureCanvas.height = videoRef.current.videoHeight;

      // Draw video frame
      captureCtx.drawImage(videoRef.current, 0, 0);

      // Draw AR overlay
      captureCtx.drawImage(canvasRef.current, 0, 0);

      // Convert to blob and download
      captureCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ar-preview-${pattern?.name || 'pattern'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: "AR Photo Captured",
            description: "Your AR preview photo has been saved",
          });
        }
      }, 'image/png');
    } catch (error) {
      toast({
        title: "Capture Failed",
        description: "Could not capture AR photo",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-6xl mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">AR Preview</h2>
              <p className="text-sm text-gray-300">
                {pattern?.name || 'Crochet Pattern'} in Augmented Reality
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={captureARPhoto}
              disabled={!isARActive}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main AR View */}
        <div className="flex-1 relative">
          {!isSupported ? (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">AR Not Supported</h3>
                  <p className="text-gray-600">{error}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try using a modern browser on a mobile device with camera access.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={startARCamera} className="w-full">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Video Stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* AR Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
              />

              {/* AR Status */}
              {isARActive && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    AR LIVE
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls Panel */}
        {isARActive && (
          <div className="bg-black bg-opacity-70 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Scale Control */}
              <div className="space-y-2">
                <label className="text-sm text-white font-medium">Size</label>
                <Slider
                  value={[arSettings.scale]}
                  onValueChange={handleScaleChange}
                  min={0.3}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <span className="text-xs text-gray-300">{arSettings.scale.toFixed(1)}x</span>
              </div>

              {/* Rotation Control */}
              <div className="space-y-2">
                <label className="text-sm text-white font-medium">Rotation</label>
                <Slider
                  value={[arSettings.rotation]}
                  onValueChange={handleRotationChange}
                  min={-180}
                  max={180}
                  step={15}
                  className="w-full"
                />
                <span className="text-xs text-gray-300">{arSettings.rotation}°</span>
              </div>

              {/* Position X */}
              <div className="space-y-2">
                <label className="text-sm text-white font-medium">Position X</label>
                <Slider
                  value={[arSettings.position.x]}
                  onValueChange={(value) => handlePositionChange('x', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>

              {/* Position Y */}
              <div className="space-y-2">
                <label className="text-sm text-white font-medium">Position Y</label>
                <Slider
                  value={[arSettings.position.y]}
                  onValueChange={(value) => handlePositionChange('y', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-2">
              <Button
                onClick={resetPosition}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-black"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={captureARPhoto}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Save Photo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}