import { Pattern, PatternCell } from "@shared/schema";
import { useState } from "react";

interface PatternGridProps {
  pattern: Pattern | null;
}

export function PatternGrid({ pattern }: PatternGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  if (!pattern || !pattern.patternData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No pattern data available</p>
          <p className="text-sm mt-1">Generate a pattern to see the stitch grid</p>
        </div>
      </div>
    );
  }

  const patternData = pattern.patternData as any;
  const cells = patternData.cells || [];
  const width = patternData.width || 0;
  const height = patternData.height || 0;

  const getStitchSymbol = (stitch: string) => {
    const symbols: Record<string, string> = {
      sc: "•", // single crochet
      dc: "T", // double crochet
      hdc: "┬", // half double crochet
      tc: "┴", // treble crochet
      ch: "○", // chain
      sl: "–", // slip stitch
      inc: "+", // increase
      dec: "×", // decrease
    };
    return symbols[stitch] || "•";
  };

  const getStitchName = (stitch: string) => {
    const names: Record<string, string> = {
      sc: "Single Crochet",
      dc: "Double Crochet", 
      hdc: "Half Double Crochet",
      tc: "Treble Crochet",
      ch: "Chain",
      sl: "Slip Stitch",
      inc: "Increase",
      dec: "Decrease",
    };
    return names[stitch] || stitch;
  };

  const handleCellClick = (x: number, y: number) => {
    // In a real implementation, this would allow editing the pattern
    console.log(`Clicked cell at (${x}, ${y})`);
  };

  return (
    <div className="p-4">
      {/* Grid Container */}
      <div className="grid gap-0.5 w-fit mx-auto mb-6" style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}>
        {Array.from({ length: height }, (_, y) => 
          Array.from({ length: width }, (_, x) => {
            const cell = cells[y]?.[x] as PatternCell;
            if (!cell) return null;
            
            return (
              <div
                key={`${x}-${y}`}
                className="w-4 h-4 border border-gray-200 cursor-pointer transition-all duration-150 flex items-center justify-center text-xs font-mono"
                style={{ backgroundColor: cell.color }}
                onClick={() => handleCellClick(x, y)}
                onMouseEnter={() => setHoveredCell({ x, y })}
                onMouseLeave={() => setHoveredCell(null)}
                title={`${getStitchName(cell.stitch)} at (${x}, ${y})`}
              >
                <span className="text-gray-800 font-bold" style={{ 
                  textShadow: '0 0 2px white',
                  fontSize: '10px'
                }}>
                  {getStitchSymbol(cell.stitch)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Hover Info */}
      {hoveredCell && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm z-50">
          Position: ({hoveredCell.x}, {hoveredCell.y}) - {getStitchName(cells[hoveredCell.y]?.[hoveredCell.x]?.stitch)}
        </div>
      )}

      {/* Stitch Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Stitch Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-pink-200 border border-gray-300 flex items-center justify-center text-xs font-mono font-bold">
              •
            </div>
            <span className="text-sm">Single Crochet (sc)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-pink-300 border border-gray-300 flex items-center justify-center text-xs font-mono font-bold">
              T
            </div>
            <span className="text-sm">Double Crochet (dc)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-white border border-gray-300 flex items-center justify-center text-xs font-mono font-bold">
              ○
            </div>
            <span className="text-sm">Chain (ch)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-200 border border-gray-300 flex items-center justify-center text-xs font-mono font-bold">
              –
            </div>
            <span className="text-sm">Slip Stitch (sl st)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 border border-gray-300 flex items-center justify-center text-xs font-mono font-bold">
              ┬
            </div>
            <span className="text-sm">Half Double Crochet (hdc)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-200 border border-gray-300 flex items-center justify-center text-xs font-mono font-bold">
              ┴
            </div>
            <span className="text-sm">Treble Crochet (tc)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-200 border border-gray-300 flex items-center justify-center text-xs font-mono font-bold">
              +
            </div>
            <span className="text-sm">Increase (inc)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-200 border border-gray-300 flex items-center justify-center text-xs font-mono font-bold">
              ×
            </div>
            <span className="text-sm">Decrease (dec)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
