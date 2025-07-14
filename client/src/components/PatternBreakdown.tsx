import { useState, useEffect } from "react";
import { Pattern } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Puzzle, 
  Download, 
  Play, 
  CheckCircle, 
  Clock, 
  Grid, 
  ArrowRight,
  FileText,
  Layers
} from "lucide-react";

interface PatternComponent {
  id: string;
  name: string;
  description: string;
  grid: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  instructions: string[];
  assemblyOrder: number;
  connections: any[];
}

interface PatternBreakdown {
  components: PatternComponent[];
  assemblyInstructions: string[];
  totalEstimatedTime: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  notes: string[];
}

interface PatternBreakdownProps {
  pattern: Pattern | null;
  onComponentSelect?: (component: PatternComponent) => void;
}

export function PatternBreakdown({ pattern, onComponentSelect }: PatternBreakdownProps) {
  const [breakdown, setBreakdown] = useState<PatternBreakdown | null>(null);
  const [completedComponents, setCompletedComponents] = useState<Set<string>>(new Set());
  const [selectedComponent, setSelectedComponent] = useState<PatternComponent | null>(null);
  const [isComplex, setIsComplex] = useState(false);

  useEffect(() => {
    if (pattern) {
      // Check if pattern is complex enough to warrant breakdown
      const complex = analyzeComplexity(pattern);
      setIsComplex(complex);
      
      if (complex) {
        const patternBreakdown = generateBreakdown(pattern);
        setBreakdown(patternBreakdown);
      }
    }
  }, [pattern]);

  const analyzeComplexity = (pattern: Pattern): boolean => {
    const minComplexSize = 80;
    const maxSimpleStitches = 1000;
    
    return (
      pattern.width > minComplexSize || 
      pattern.height > minComplexSize ||
      (pattern.stitchCount && pattern.stitchCount > maxSimpleStitches) ||
      pattern.complexity === "advanced"
    );
  };

  const generateBreakdown = (pattern: Pattern): PatternBreakdown => {
    const components = identifyComponents(pattern);
    const assemblyInstructions = generateAssemblyInstructions(components);
    const totalTime = calculateTotalTime(components);
    const skillLevel = determineSkillLevel(components);

    return {
      components,
      assemblyInstructions,
      totalEstimatedTime: totalTime,
      skillLevel,
      notes: generateGeneralNotes(pattern, components),
    };
  };

  const identifyComponents = (pattern: Pattern): PatternComponent[] => {
    const patternData = pattern.patternData as any;
    const { width, height } = pattern;
    
    if (width > 100 || height > 100) {
      return createGridComponents(pattern);
    }
    
    if (width > 50 || height > 50) {
      return createFeatureComponents(pattern);
    }
    
    return createSectionComponents(pattern);
  };

  const createGridComponents = (pattern: Pattern): PatternComponent[] => {
    const components: PatternComponent[] = [];
    const { width, height } = pattern;
    const patternData = pattern.patternData as any;
    
    const gridSize = width > 150 ? 4 : 3;
    const componentWidth = Math.ceil(width / gridSize);
    const componentHeight = Math.ceil(height / gridSize);
    
    let componentId = 1;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const startX = col * componentWidth;
        const startY = row * componentHeight;
        const endX = Math.min(startX + componentWidth, width);
        const endY = Math.min(startY + componentHeight, height);
        
        const componentCells = [];
        for (let y = startY; y < endY; y++) {
          const rowCells = [];
          for (let x = startX; x < endX; x++) {
            rowCells.push(patternData.cells?.[y]?.[x] || null);
          }
          componentCells.push(rowCells);
        }
        
        const grid = {
          width: endX - startX,
          height: endY - startY,
          cells: componentCells,
        };
        
        const component: PatternComponent = {
          id: `section-${componentId}`,
          name: `Section ${componentId} (${getGridLabel(row, col)})`,
          description: `Grid section covering area ${startX}-${endX} × ${startY}-${endY}`,
          grid,
          position: { x: startX, y: startY },
          size: { width: endX - startX, height: endY - startY },
          instructions: generateComponentInstructions(grid, `section-${componentId}`),
          assemblyOrder: componentId,
          connections: [],
        };
        
        components.push(component);
        componentId++;
      }
    }
    
    return components;
  };

  const createFeatureComponents = (pattern: Pattern): PatternComponent[] => {
    const components: PatternComponent[] = [];
    const { width, height } = pattern;
    
    const borderWidth = Math.min(10, Math.floor(width * 0.1));
    const borderHeight = Math.min(10, Math.floor(height * 0.1));
    
    components.push(createBorderComponent(
      pattern, "center", "Center Section",
      { 
        x: borderWidth, 
        y: borderHeight, 
        width: width - 2 * borderWidth, 
        height: height - 2 * borderHeight 
      }, 1
    ));
    
    components.push(createBorderComponent(
      pattern, "border", "Border",
      { x: 0, y: 0, width, height: borderHeight }, 2
    ));
    
    return components;
  };

  const createSectionComponents = (pattern: Pattern): PatternComponent[] => {
    const components: PatternComponent[] = [];
    const { width, height } = pattern;
    
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    
    const sections = [
      { name: "Top Half", x: 0, y: 0, width: width, height: midY },
      { name: "Bottom Half", x: 0, y: midY, width: width, height: height - midY },
    ];
    
    sections.forEach((section, index) => {
      components.push(createBorderComponent(
        pattern, `section-${index + 1}`, section.name,
        section, index + 1
      ));
    });
    
    return components;
  };

  const createBorderComponent = (
    pattern: Pattern, 
    id: string, 
    name: string, 
    area: { x: number; y: number; width: number; height: number },
    order: number
  ): PatternComponent => {
    const patternData = pattern.patternData as any;
    const componentCells = [];
    
    for (let y = area.y; y < area.y + area.height; y++) {
      const rowCells = [];
      for (let x = area.x; x < area.x + area.width; x++) {
        rowCells.push(patternData.cells?.[y]?.[x] || null);
      }
      componentCells.push(rowCells);
    }
    
    const grid = {
      width: area.width,
      height: area.height,
      cells: componentCells,
    };
    
    return {
      id,
      name,
      description: `Component covering area ${area.x}-${area.x + area.width} × ${area.y}-${area.y + area.height}`,
      grid,
      position: { x: area.x, y: area.y },
      size: { width: area.width, height: area.height },
      instructions: generateComponentInstructions(grid, id),
      assemblyOrder: order,
      connections: [],
    };
  };

  const generateComponentInstructions = (grid: any, componentId: string): string[] => {
    const instructions = [];
    const stitchCount = grid.cells.flat().filter((cell: any) => cell !== null).length;
    
    instructions.push(`Component: ${componentId}`);
    instructions.push(`Size: ${grid.width} × ${grid.height} stitches`);
    instructions.push(`Total stitches: ${stitchCount}`);
    instructions.push("");
    instructions.push("Work this section following the pattern chart.");
    instructions.push("Start from the bottom-left corner and work upward.");
    
    return instructions;
  };

  const generateAssemblyInstructions = (components: PatternComponent[]): string[] => {
    const instructions = [];
    
    instructions.push("ASSEMBLY INSTRUCTIONS");
    instructions.push("===================");
    instructions.push("");
    instructions.push("Complete all individual components before assembly.");
    instructions.push("");
    
    const sortedComponents = [...components].sort((a, b) => a.assemblyOrder - b.assemblyOrder);
    
    instructions.push("Assembly Order:");
    sortedComponents.forEach((component, index) => {
      instructions.push(`${index + 1}. ${component.name}`);
    });
    instructions.push("");
    
    instructions.push("Joining Instructions:");
    instructions.push("- Join components using slip stitch seams");
    instructions.push("- Align edges carefully before joining");
    instructions.push("- Work joins on the wrong side when possible");
    instructions.push("");
    
    instructions.push("Finishing:");
    instructions.push("- Weave in all loose ends");
    instructions.push("- Block the finished piece");
    instructions.push("- Check all seams for security");
    
    return instructions;
  };

  const calculateTotalTime = (components: PatternComponent[]): string => {
    const totalStitches = components.reduce((sum, component) => {
      const stitchCount = component.grid.cells.flat().filter((cell: any) => cell !== null).length;
      return sum + stitchCount;
    }, 0);
    
    const workingTime = Math.ceil(totalStitches / 10);
    const assemblyTime = components.length * 15;
    const totalMinutes = workingTime + assemblyTime;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const determineSkillLevel = (components: PatternComponent[]): "beginner" | "intermediate" | "advanced" => {
    if (components.length > 6) return "advanced";
    if (components.length > 3) return "intermediate";
    return "beginner";
  };

  const generateGeneralNotes = (pattern: Pattern, components: PatternComponent[]): string[] => {
    const notes = [];
    
    if (components.length > 4) {
      notes.push("This is a complex pattern. Consider working on one component at a time.");
    }
    
    notes.push("Mark completed components to track progress.");
    notes.push("Keep component pieces in separate bags to avoid confusion.");
    
    if (pattern.complexity === "advanced") {
      notes.push("This pattern includes advanced techniques. Review all instructions before starting.");
    }
    
    return notes;
  };

  const getGridLabel = (row: number, col: number): string => {
    const rowLabels = ["Top", "Middle", "Bottom"];
    const colLabels = ["Left", "Center", "Right"];
    return `${rowLabels[row] || `Row ${row + 1}`} ${colLabels[col] || `Col ${col + 1}`}`;
  };

  const toggleComponentCompletion = (componentId: string) => {
    const newCompleted = new Set(completedComponents);
    if (newCompleted.has(componentId)) {
      newCompleted.delete(componentId);
    } else {
      newCompleted.add(componentId);
    }
    setCompletedComponents(newCompleted);
  };

  const getCompletionPercentage = () => {
    if (!breakdown) return 0;
    return Math.round((completedComponents.size / breakdown.components.length) * 100);
  };

  const downloadComponentInstructions = (component: PatternComponent) => {
    const instructions = component.instructions.join('\n');
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${component.name.replace(/\s+/g, '-')}-instructions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!pattern) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Puzzle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Generate a pattern to see breakdown options</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isComplex) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Grid className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">This pattern is simple enough to work as a single piece</p>
            <p className="text-xs text-gray-400 mt-2">Complex patterns (80+ stitches) will show breakdown options</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!breakdown) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Pattern Breakdown
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={breakdown.skillLevel === 'advanced' ? 'destructive' : breakdown.skillLevel === 'intermediate' ? 'default' : 'secondary'}>
              {breakdown.skillLevel}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {breakdown.totalEstimatedTime}
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress: {completedComponents.size}/{breakdown.components.length} components</span>
            <span>{getCompletionPercentage()}%</span>
          </div>
          <Progress value={getCompletionPercentage()} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="components" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="assembly">Assembly</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="components" className="space-y-4">
            <div className="grid gap-4">
              {breakdown.components.map((component) => (
                <Card 
                  key={component.id} 
                  className={`cursor-pointer transition-all ${
                    selectedComponent?.id === component.id ? 'ring-2 ring-blue-500' : ''
                  } ${completedComponents.has(component.id) ? 'bg-green-50 border-green-200' : ''}`}
                  onClick={() => {
                    setSelectedComponent(component);
                    onComponentSelect?.(component);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{component.assemblyOrder}
                        </Badge>
                        <h3 className="font-medium">{component.name}</h3>
                        {completedComponents.has(component.id) && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadComponentInstructions(component);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={completedComponents.has(component.id) ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComponentCompletion(component.id);
                          }}
                        >
                          {completedComponents.has(component.id) ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{component.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{component.size.width} × {component.size.height} stitches</span>
                      <span>Est. {Math.ceil(component.grid.cells.flat().filter((c: any) => c).length / 10)}min</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="assembly" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {breakdown.assemblyInstructions.map((instruction, index) => (
                  <div key={index} className={`${
                    instruction.startsWith('=') || instruction === '' ? 'font-bold' : 'text-sm'
                  } ${instruction.startsWith('  ') ? 'ml-4 text-gray-600' : ''}`}>
                    {instruction || <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-3">
              {breakdown.notes.map((note, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{note}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}