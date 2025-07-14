import { useState, useRef, useEffect } from "react";
import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit3, 
  Save, 
  Undo, 
  Redo, 
  Palette, 
  Grid, 
  MousePointer,
  Brush,
  Eraser,
  Copy,
  Scissors,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  History,
  Users,
  Share
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StitchTool {
  type: string;
  name: string;
  icon: string;
  color: string;
}

interface EditorState {
  grid: any[][];
  history: any[];
  historyIndex: number;
  selectedTool: string;
  brushSize: number;
  zoom: number;
  selectedColor: string;
  layers: any[];
  activeLayer: number;
}

interface AdvancedPatternEditorProps {
  pattern: Pattern | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (patternData: any) => void;
}

export function AdvancedPatternEditor({ pattern, isOpen, onClose, onSave }: AdvancedPatternEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    grid: [],
    history: [],
    historyIndex: -1,
    selectedTool: 'brush',
    brushSize: 1,
    zoom: 1,
    selectedColor: '#FF6B6B',
    layers: [{ name: 'Base Layer', visible: true, opacity: 1 }],
    activeLayer: 0
  });
  
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const { toast } = useToast();

  const stitchTools: StitchTool[] = [
    { type: 'sc', name: 'Single Crochet', icon: '●', color: '#FF6B6B' },
    { type: 'dc', name: 'Double Crochet', icon: '║', color: '#4ECDC4' },
    { type: 'hdc', name: 'Half Double', icon: '▌', color: '#45B7D1' },
    { type: 'tc', name: 'Treble Crochet', icon: '╫', color: '#96CEB4' },
    { type: 'ch', name: 'Chain', icon: '○', color: '#FFEAA7' },
    { type: 'sl', name: 'Slip Stitch', icon: '∘', color: '#DDA0DD' },
    { type: 'inc', name: 'Increase', icon: '▲', color: '#98D8C8' },
    { type: 'dec', name: 'Decrease', icon: '▼', color: '#F7DC6F' },
    { type: 'bp', name: 'Back Post', icon: '◐', color: '#BB8FCE' },
    { type: 'fp', name: 'Front Post', icon: '◑', color: '#85C1E9' }
  ];

  const colorPalettes = {
    warm: ['#FF6B6B', '#FFA726', '#FFEE58', '#AB47BC', '#EF5350'],
    cool: ['#42A5F5', '#26C6DA', '#66BB6A', '#5C6BC0', '#29B6F6'],
    pastel: ['#FFCDD2', '#F8BBD9', '#E1BEE7', '#C5CAE9', '#BBDEFB'],
    earth: ['#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#EFEBE9'],
    vibrant: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3']
  };

  // Initialize grid from pattern
  useEffect(() => {
    if (pattern?.patternData && isOpen) {
      const patternData = pattern.patternData as any;
      if (patternData.cells) {
        setEditorState(prev => ({
          ...prev,
          grid: patternData.cells,
          history: [patternData.cells],
          historyIndex: 0
        }));
      } else {
        // Create new grid
        const newGrid = Array(30).fill(null).map(() => 
          Array(30).fill(null).map(() => ({ type: '', color: '#FFFFFF' }))
        );
        setEditorState(prev => ({
          ...prev,
          grid: newGrid,
          history: [newGrid],
          historyIndex: 0
        }));
      }
    }
  }, [pattern, isOpen]);

  // Canvas drawing
  useEffect(() => {
    if (canvasRef.current && editorState.grid.length > 0) {
      drawGrid();
    }
  }, [editorState.grid, editorState.zoom]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 20 * editorState.zoom;
    canvas.width = editorState.grid[0]?.length * cellSize || 600;
    canvas.height = editorState.grid.length * cellSize || 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    editorState.grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colIndex * cellSize;
        const y = rowIndex * cellSize;

        // Draw cell background
        ctx.fillStyle = cell.color || '#FFFFFF';
        ctx.fillRect(x, y, cellSize, cellSize);

        // Draw stitch symbol
        if (cell.type) {
          const stitch = stitchTools.find(s => s.type === cell.type);
          if (stitch) {
            ctx.fillStyle = '#000000';
            ctx.font = `${cellSize * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stitch.icon, x + cellSize/2, y + cellSize/2);
          }
        }

        // Draw grid lines
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
      });
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const cellSize = 20 * editorState.zoom;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < editorState.grid.length && 
        col >= 0 && col < editorState.grid[0].length) {
      
      const newGrid = [...editorState.grid];
      
      if (editorState.selectedTool === 'eraser') {
        newGrid[row][col] = { type: '', color: '#FFFFFF' };
      } else {
        const selectedStitch = stitchTools.find(s => s.type === editorState.selectedTool);
        if (selectedStitch) {
          newGrid[row][col] = { 
            type: selectedStitch.type, 
            color: editorState.selectedColor 
          };
        }
      }

      // Add to history
      const newHistory = editorState.history.slice(0, editorState.historyIndex + 1);
      newHistory.push(newGrid);

      setEditorState(prev => ({
        ...prev,
        grid: newGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1
      }));
    }
  };

  const undo = () => {
    if (editorState.historyIndex > 0) {
      setEditorState(prev => ({
        ...prev,
        grid: prev.history[prev.historyIndex - 1],
        historyIndex: prev.historyIndex - 1
      }));
    }
  };

  const redo = () => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      setEditorState(prev => ({
        ...prev,
        grid: prev.history[prev.historyIndex + 1],
        historyIndex: prev.historyIndex + 1
      }));
    }
  };

  const clearGrid = () => {
    const newGrid = editorState.grid.map(row => 
      row.map(() => ({ type: '', color: '#FFFFFF' }))
    );
    
    const newHistory = [...editorState.history, newGrid];
    setEditorState(prev => ({
      ...prev,
      grid: newGrid,
      history: newHistory,
      historyIndex: newHistory.length - 1
    }));
  };

  const savePattern = () => {
    const patternData = {
      cells: editorState.grid,
      width: editorState.grid[0]?.length || 30,
      height: editorState.grid.length || 30,
      layers: editorState.layers,
      metadata: {
        totalStitches: editorState.grid.flat().filter(cell => cell.type).length,
        techniques: [...new Set(editorState.grid.flat().map(cell => cell.type).filter(Boolean))],
        colorCount: [...new Set(editorState.grid.flat().map(cell => cell.color))].length
      }
    };

    onSave(patternData);
    
    toast({
      title: "Pattern Saved",
      description: "Your pattern edits have been saved successfully",
    });
  };

  const startCollaboration = () => {
    setIsCollaborating(true);
    toast({
      title: "Collaboration Started",
      description: "Share the link with others to collaborate in real-time",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Edit3 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold">Advanced Pattern Editor</h2>
              <p className="text-sm text-gray-600">
                {pattern?.name || 'New Pattern'} - Stitch by Stitch Editing
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isCollaborating && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <Users className="w-3 h-3 mr-1" />
                  {collaborators.length + 1} Collaborating
                </Badge>
              </div>
            )}
            <Button onClick={savePattern} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
            <Tabs defaultValue="tools" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
              </TabsList>

              <TabsContent value="tools" className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">Basic Tools</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={editorState.selectedTool === 'brush' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditorState(prev => ({ ...prev, selectedTool: 'brush' }))}
                    >
                      <Brush className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={editorState.selectedTool === 'eraser' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditorState(prev => ({ ...prev, selectedTool: 'eraser' }))}
                    >
                      <Eraser className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Stitch Types</Label>
                  <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                    {stitchTools.map((stitch) => (
                      <Button
                        key={stitch.type}
                        variant={editorState.selectedTool === stitch.type ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setEditorState(prev => ({ ...prev, selectedTool: stitch.type }))}
                      >
                        <span className="mr-2 font-mono text-lg">{stitch.icon}</span>
                        {stitch.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Brush Size</Label>
                  <Slider
                    value={[editorState.brushSize]}
                    onValueChange={(value) => setEditorState(prev => ({ ...prev, brushSize: value[0] }))}
                    min={1}
                    max={5}
                    step={1}
                    className="mt-2"
                  />
                  <span className="text-xs text-gray-500">{editorState.brushSize}px</span>
                </div>

                <div>
                  <Label className="text-sm font-medium">Zoom</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditorState(prev => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.25) }))}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm min-w-[3rem] text-center">{Math.round(editorState.zoom * 100)}%</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditorState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom + 0.25) }))}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">Current Color</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: editorState.selectedColor }}
                    />
                    <Input
                      type="color"
                      value={editorState.selectedColor}
                      onChange={(e) => setEditorState(prev => ({ ...prev, selectedColor: e.target.value }))}
                      className="w-16 h-8 p-0 border-none"
                    />
                  </div>
                </div>

                {Object.entries(colorPalettes).map(([name, colors]) => (
                  <div key={name}>
                    <Label className="text-sm font-medium capitalize">{name}</Label>
                    <div className="grid grid-cols-5 gap-1 mt-2">
                      {colors.map((color, index) => (
                        <button
                          key={index}
                          className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500"
                          style={{ backgroundColor: color }}
                          onClick={() => setEditorState(prev => ({ ...prev, selectedColor: color }))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="layers" className="space-y-4 mt-4">
                <div className="space-y-2">
                  {editorState.layers.map((layer, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border ${editorState.activeLayer === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{layer.name}</span>
                        <Button size="sm" variant="ghost">
                          <Layers className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-100 overflow-auto">
            <div className="p-4">
              {/* Canvas Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={undo} disabled={editorState.historyIndex <= 0}>
                    <Undo className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={redo} disabled={editorState.historyIndex >= editorState.history.length - 1}>
                    <Redo className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={clearGrid} variant="outline">
                    Clear
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={startCollaboration}
                    disabled={isCollaborating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {isCollaborating ? 'Collaborating' : 'Start Collaboration'}
                  </Button>
                </div>
              </div>

              {/* Canvas */}
              <div className="bg-white rounded-lg shadow-sm border p-4 overflow-auto">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="border border-gray-300 cursor-crosshair"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}