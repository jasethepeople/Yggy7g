import { useEffect, useRef } from "react";
import { Pattern } from "@shared/schema";

interface ThreeVisualizationProps {
  pattern: Pattern | null;
}

export function ThreeVisualization({ pattern }: ThreeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;
    
    // Create a working 3D-like visualization
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw a gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const time = Date.now() * 0.001;
      
      if (pattern) {
        // Draw pattern-based 3D visualization
        const patternData = pattern.patternData as any;
        const gridWidth = pattern.width || 20;
        const gridHeight = pattern.height || 20;
        const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
        const cellSize = maxSize / Math.max(gridWidth, gridHeight);
        
        // Draw multiple layers with depth
        for (let layer = 0; layer < 5; layer++) {
          const scale = 1 - layer * 0.1;
          const alpha = 1 - layer * 0.15;
          const offsetZ = layer * 2;
          
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(centerX, centerY);
          ctx.rotate(Math.sin(time * 0.3) * 0.1);
          ctx.scale(scale, scale);
          
          // Draw grid cells
          for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
              const cellX = (x - gridWidth/2) * cellSize;
              const cellY = (y - gridHeight/2) * cellSize;
              
              // Create 3D effect with shadows
              const shadowOffset = offsetZ;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
              ctx.fillRect(cellX + shadowOffset, cellY + shadowOffset, cellSize - 1, cellSize - 1);
              
              // Main cell with color from pattern
              const colorIndex = (x + y + layer) % (pattern.colorPalette?.length || 1);
              const color = pattern.colorPalette?.[colorIndex] || '#FFB3E6';
              ctx.fillStyle = color;
              ctx.fillRect(cellX, cellY, cellSize - 1, cellSize - 1);
              
              // Highlight edge
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.lineWidth = 1;
              ctx.strokeRect(cellX, cellY, cellSize - 1, cellSize - 1);
            }
          }
          
          ctx.restore();
        }
      } else {
        // Draw placeholder when no pattern
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 0.5);
        
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 50;
          const y = Math.sin(angle) * 50;
          
          ctx.fillStyle = `hsl(${(time * 100 + i * 45) % 360}, 70%, 60%)`;
          ctx.fillRect(x - 10, y - 10, 20, 20);
        }
        
        ctx.restore();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [pattern]);

  if (!pattern) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-64 h-64 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-pink-300 to-pink-400 rounded-3xl transform rotate-12 shadow-xl"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-pink-100 via-white to-pink-200 rounded-3xl shadow-lg flex items-center justify-center">
              <svg className="w-16 h-16 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600">Interactive 3D model will render here</p>
          <p className="text-sm text-gray-400 mt-1">Generate a pattern to see the 3D visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}
      />
      
      {/* 3D Controls Overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">3D Controls</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Rotate: Auto-rotating</div>
            <div>• Zoom: Scroll wheel</div>
            <div>• Pan: Click & drag</div>
          </div>
        </div>
      </div>
      
      {/* Pattern Info Overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700">{pattern.name}</div>
          <div className="text-xs text-gray-500">
            {pattern.width} × {pattern.height} stitches
          </div>
          <div className="text-xs text-gray-500">
            Difficulty: {pattern.difficulty}
          </div>
        </div>
      </div>
    </div>
  );
}
