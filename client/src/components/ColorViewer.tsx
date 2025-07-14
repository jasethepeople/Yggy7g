import { useState, useEffect } from "react";
import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette, RefreshCw, Download, Eye } from "lucide-react";

interface ColorViewerProps {
  pattern: Pattern | null;
  onColorsChange: (colors: string[]) => void;
}

export function ColorViewer({ pattern, onColorsChange }: ColorViewerProps) {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<"realistic" | "flat">("realistic");
  
  // Extract unique colors from pattern
  useEffect(() => {
    if (pattern?.patternData) {
      const patternData = pattern.patternData as any;
      if (patternData.cells) {
        const uniqueColors = new Set<string>();
        patternData.cells.forEach((row: any[]) => {
          row.forEach((cell: any) => {
            if (cell?.color) {
              uniqueColors.add(cell.color);
            }
          });
        });
        const colors = Array.from(uniqueColors).slice(0, 10); // Limit to 10 colors
        setSelectedColors(colors.length > 0 ? colors : ["#ff6b6b", "#4ecdc4", "#45b7d1"]);
      }
    }
  }, [pattern]);

  const colorPalettes = {
    warm: ["#ff6b6b", "#ffa726", "#ffee58", "#ab47bc", "#ef5350"],
    cool: ["#42a5f5", "#26c6da", "#66bb6a", "#5c6bc0", "#29b6f6"],
    pastel: ["#ffcdd2", "#f8bbd9", "#e1bee7", "#c5cae9", "#bbdefb"],
    earth: ["#8d6e63", "#a1887f", "#bcaaa4", "#d7ccc8", "#efebe9"],
    vibrant: ["#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3"],
    monochrome: ["#212121", "#424242", "#616161", "#757575", "#9e9e9e"],
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...selectedColors];
    newColors[index] = color;
    setSelectedColors(newColors);
    onColorsChange(newColors);
  };

  const addColor = () => {
    if (selectedColors.length < 10) {
      const newColors = [...selectedColors, "#000000"];
      setSelectedColors(newColors);
      onColorsChange(newColors);
    }
  };

  const removeColor = (index: number) => {
    if (selectedColors.length > 1) {
      const newColors = selectedColors.filter((_, i) => i !== index);
      setSelectedColors(newColors);
      onColorsChange(newColors);
    }
  };

  const applyPalette = (paletteName: keyof typeof colorPalettes) => {
    const palette = colorPalettes[paletteName];
    const newColors = palette.slice(0, Math.max(selectedColors.length, 3));
    setSelectedColors(newColors);
    onColorsChange(newColors);
  };

  const generateRandomColors = () => {
    const count = selectedColors.length || 5;
    const newColors = Array.from({ length: count }, () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30);
      const lightness = 50 + Math.floor(Math.random() * 30);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
    setSelectedColors(newColors);
    onColorsChange(newColors);
  };

  const renderPreview = () => {
    if (!pattern?.patternData) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Palette className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Generate a pattern to see color preview</p>
          </div>
        </div>
      );
    }

    const patternData = pattern.patternData as any;
    const cellSize = previewMode === "realistic" ? 8 : 12;
    const maxWidth = 400;
    const actualCellSize = Math.min(cellSize, maxWidth / pattern.width);

    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-sm font-medium">Preview Mode</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={previewMode === "flat" ? "default" : "outline"}
              onClick={() => setPreviewMode("flat")}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={previewMode === "realistic" ? "default" : "outline"}
              onClick={() => setPreviewMode("realistic")}
            >
              Realistic
            </Button>
          </div>
        </div>
        
        <div 
          className="border rounded-lg overflow-hidden shadow-sm bg-white"
          style={{
            width: pattern.width * actualCellSize,
            height: pattern.height * actualCellSize,
            maxWidth: maxWidth,
            aspectRatio: `${pattern.width} / ${pattern.height}`,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${pattern.width * actualCellSize} ${pattern.height * actualCellSize}`}
            className="block"
          >
            {patternData.cells?.map((row: any[], y: number) =>
              row.map((cell: any, x: number) => {
                if (!cell) return null;
                
                const colorIndex = selectedColors.findIndex(color => 
                  color.toLowerCase() === cell.color?.toLowerCase()
                );
                const color = colorIndex >= 0 ? selectedColors[colorIndex] : cell.color || "#cccccc";
                
                if (previewMode === "realistic") {
                  // Realistic texture with slight variations
                  const variation = (x + y) % 3;
                  const adjustedColor = adjustColorBrightness(color, variation * 5 - 5);
                  
                  return (
                    <g key={`${x}-${y}`}>
                      <rect
                        x={x * actualCellSize}
                        y={y * actualCellSize}
                        width={actualCellSize}
                        height={actualCellSize}
                        fill={adjustedColor}
                        stroke={adjustedColor}
                        strokeWidth={0.5}
                      />
                      <circle
                        cx={x * actualCellSize + actualCellSize / 2}
                        cy={y * actualCellSize + actualCellSize / 2}
                        r={actualCellSize / 4}
                        fill="rgba(255,255,255,0.1)"
                      />
                    </g>
                  );
                } else {
                  // Flat grid view
                  return (
                    <rect
                      key={`${x}-${y}`}
                      x={x * actualCellSize}
                      y={y * actualCellSize}
                      width={actualCellSize}
                      height={actualCellSize}
                      fill={color}
                      stroke="#e0e0e0"
                      strokeWidth={0.5}
                    />
                  );
                }
              })
            )}
          </svg>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          {pattern.width} × {pattern.height} stitches • {selectedColors.length} colors
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Interactive Color Viewer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="palettes">Palettes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            {renderPreview()}
          </TabsContent>
          
          <TabsContent value="colors" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Custom Colors</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={generateRandomColors}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Random
                </Button>
                <Button size="sm" variant="outline" onClick={addColor} disabled={selectedColors.length >= 10}>
                  Add Color
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {selectedColors.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="w-12 h-10 rounded border-2"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="flex-1 text-xs font-mono"
                    placeholder="#000000"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeColor(index)}
                    disabled={selectedColors.length <= 1}
                    className="px-2"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="palettes" className="space-y-4">
            <Label className="text-sm font-medium">Pre-made Palettes</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(colorPalettes).map(([name, colors]) => (
                <div key={name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm capitalize font-medium">{name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyPalette(name as keyof typeof colorPalettes)}
                    >
                      Apply
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    {colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
  if (color.startsWith('#')) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  return color;
}