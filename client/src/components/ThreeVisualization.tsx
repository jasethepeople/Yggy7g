import { useEffect, useRef } from "react";
import { Pattern } from "@shared/schema";

interface ThreeVisualizationProps {
  pattern: Pattern | null;
}

export function ThreeVisualization({ pattern }: ThreeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pattern || !canvasRef.current) return;

    // Initialize Three.js scene
    // Note: In a real implementation, you would install and import Three.js
    // For now, we'll create a placeholder 3D visualization

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Create a pseudo-3D visualization using Canvas 2D
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw a simple 3D-like representation
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const time = Date.now() * 0.001;
      
      // Draw multiple layers to simulate 3D depth
      for (let z = 0; z < 10; z++) {
        const scale = 1 - z * 0.05;
        const alpha = 1 - z * 0.1;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.rotate(time * 0.2 + z * 0.1);
        
        // Draw a simplified pattern representation
        const gridSize = 20;
        const cellSize = 8;
        
        for (let x = -gridSize/2; x < gridSize/2; x++) {
          for (let y = -gridSize/2; y < gridSize/2; y++) {
            const hue = (x + y + z + time * 50) % 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
            ctx.fillRect(
              x * cellSize - cellSize/2, 
              y * cellSize - cellSize/2, 
              cellSize - 1, 
              cellSize - 1
            );
          }
        }
        
        ctx.restore();
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
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
