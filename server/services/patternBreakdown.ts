import { Pattern } from "@shared/schema";
import { PatternGenerator, PatternGrid } from "./patternGenerator";

export interface PatternComponent {
  id: string;
  name: string;
  description: string;
  grid: PatternGrid;
  position: { x: number; y: number };
  size: { width: number; height: number };
  instructions: string[];
  assemblyOrder: number;
  connections: ComponentConnection[];
}

export interface ComponentConnection {
  targetComponentId: string;
  connectionType: "seam" | "join" | "attach" | "overlay";
  connectionPoints: Array<{ x: number; y: number }>;
  instructions: string;
}

export interface PatternBreakdown {
  components: PatternComponent[];
  assemblyInstructions: string[];
  totalEstimatedTime: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  notes: string[];
}

export class PatternBreakdownService {
  
  static analyzeComplexity(pattern: Pattern): boolean {
    const minComplexSize = 80; // patterns larger than 80x80 are considered complex
    const maxSimpleStitches = 1000; // patterns with more than 1000 stitches are complex
    
    return (
      pattern.width > minComplexSize || 
      pattern.height > minComplexSize ||
      (pattern.stitchCount && pattern.stitchCount > maxSimpleStitches) ||
      pattern.complexity === "advanced"
    );
  }

  static breakdownPattern(pattern: Pattern): PatternBreakdown {
    const patternData = pattern.patternData as any;
    if (!patternData?.cells) {
      throw new Error("Invalid pattern data for breakdown");
    }

    // Determine breakdown strategy based on pattern characteristics
    const components = this.identifyComponents(pattern);
    const assemblyInstructions = this.generateAssemblyInstructions(components);
    const totalTime = this.calculateTotalTime(components);
    const skillLevel = this.determineSkillLevel(components);

    return {
      components,
      assemblyInstructions,
      totalEstimatedTime: totalTime,
      skillLevel,
      notes: this.generateGeneralNotes(pattern, components),
    };
  }

  private static identifyComponents(pattern: Pattern): PatternComponent[] {
    const patternData = pattern.patternData as any;
    const { width, height } = pattern;
    
    // Strategy 1: Grid-based breakdown for large patterns
    if (width > 100 || height > 100) {
      return this.createGridComponents(pattern);
    }
    
    // Strategy 2: Feature-based breakdown for medium patterns
    if (width > 50 || height > 50) {
      return this.createFeatureComponents(pattern);
    }
    
    // Strategy 3: Section-based breakdown for smaller complex patterns
    return this.createSectionComponents(pattern);
  }

  private static createGridComponents(pattern: Pattern): PatternComponent[] {
    const components: PatternComponent[] = [];
    const { width, height } = pattern;
    const patternData = pattern.patternData as any;
    
    // Divide into 4x4 or 3x3 grid based on size
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
        
        // Extract cells for this component
        const componentCells = [];
        for (let y = startY; y < endY; y++) {
          const rowCells = [];
          for (let x = startX; x < endX; x++) {
            rowCells.push(patternData.cells[y]?.[x] || null);
          }
          componentCells.push(rowCells);
        }
        
        const grid: PatternGrid = {
          width: endX - startX,
          height: endY - startY,
          cells: componentCells,
        };
        
        const component: PatternComponent = {
          id: `section-${componentId}`,
          name: `Section ${componentId} (${this.getGridLabel(row, col)})`,
          description: `Grid section covering area ${startX}-${endX} × ${startY}-${endY}`,
          grid,
          position: { x: startX, y: startY },
          size: { width: endX - startX, height: endY - startY },
          instructions: this.generateComponentInstructions(grid, `section-${componentId}`),
          assemblyOrder: componentId,
          connections: this.determineConnections(componentId, row, col, gridSize),
        };
        
        components.push(component);
        componentId++;
      }
    }
    
    return components;
  }

  private static createFeatureComponents(pattern: Pattern): PatternComponent[] {
    const components: PatternComponent[] = [];
    const { width, height } = pattern;
    
    // Break into logical sections: borders, center, corners
    
    // Border components
    const borderWidth = Math.min(10, Math.floor(width * 0.1));
    const borderHeight = Math.min(10, Math.floor(height * 0.1));
    
    // Top border
    components.push(this.createBorderComponent(
      pattern, "top-border", "Top Border",
      { x: 0, y: 0, width, height: borderHeight }, 1
    ));
    
    // Bottom border
    components.push(this.createBorderComponent(
      pattern, "bottom-border", "Bottom Border",
      { x: 0, y: height - borderHeight, width, height: borderHeight }, 2
    ));
    
    // Left border (excluding corners)
    components.push(this.createBorderComponent(
      pattern, "left-border", "Left Border",
      { x: 0, y: borderHeight, width: borderWidth, height: height - 2 * borderHeight }, 3
    ));
    
    // Right border (excluding corners)
    components.push(this.createBorderComponent(
      pattern, "right-border", "Right Border",
      { x: width - borderWidth, y: borderHeight, width: borderWidth, height: height - 2 * borderHeight }, 4
    ));
    
    // Center section
    components.push(this.createBorderComponent(
      pattern, "center", "Center Section",
      { 
        x: borderWidth, 
        y: borderHeight, 
        width: width - 2 * borderWidth, 
        height: height - 2 * borderHeight 
      }, 5
    ));
    
    return components;
  }

  private static createSectionComponents(pattern: Pattern): PatternComponent[] {
    const components: PatternComponent[] = [];
    const { width, height } = pattern;
    
    // Simple 2x2 breakdown for smaller patterns
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    
    const sections = [
      { name: "Top Left", x: 0, y: 0, width: midX, height: midY },
      { name: "Top Right", x: midX, y: 0, width: width - midX, height: midY },
      { name: "Bottom Left", x: 0, y: midY, width: midX, height: height - midY },
      { name: "Bottom Right", x: midX, y: midY, width: width - midX, height: height - midY },
    ];
    
    sections.forEach((section, index) => {
      components.push(this.createBorderComponent(
        pattern, `section-${index + 1}`, section.name,
        section, index + 1
      ));
    });
    
    return components;
  }

  private static createBorderComponent(
    pattern: Pattern, 
    id: string, 
    name: string, 
    area: { x: number; y: number; width: number; height: number },
    order: number
  ): PatternComponent {
    const patternData = pattern.patternData as any;
    const componentCells = [];
    
    for (let y = area.y; y < area.y + area.height; y++) {
      const rowCells = [];
      for (let x = area.x; x < area.x + area.width; x++) {
        rowCells.push(patternData.cells[y]?.[x] || null);
      }
      componentCells.push(rowCells);
    }
    
    const grid: PatternGrid = {
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
      instructions: this.generateComponentInstructions(grid, id),
      assemblyOrder: order,
      connections: [],
    };
  }

  private static getGridLabel(row: number, col: number): string {
    const rowLabels = ["Top", "Middle", "Bottom"];
    const colLabels = ["Left", "Center", "Right"];
    return `${rowLabels[row] || `Row ${row + 1}`} ${colLabels[col] || `Col ${col + 1}`}`;
  }

  private static determineConnections(
    componentId: number, 
    row: number, 
    col: number, 
    gridSize: number
  ): ComponentConnection[] {
    const connections: ComponentConnection[] = [];
    
    // Right connection
    if (col < gridSize - 1) {
      connections.push({
        targetComponentId: `section-${componentId + 1}`,
        connectionType: "seam",
        connectionPoints: [{ x: -1, y: 0 }], // Right edge
        instructions: "Join to right section using slip stitch seam",
      });
    }
    
    // Bottom connection
    if (row < gridSize - 1) {
      connections.push({
        targetComponentId: `section-${componentId + gridSize}`,
        connectionType: "seam",
        connectionPoints: [{ x: 0, y: -1 }], // Bottom edge
        instructions: "Join to bottom section using slip stitch seam",
      });
    }
    
    return connections;
  }

  private static generateComponentInstructions(grid: PatternGrid, componentId: string): string[] {
    const instructions = [];
    const stitchCount = grid.cells.flat().filter(cell => cell !== null).length;
    
    instructions.push(`Component: ${componentId}`);
    instructions.push(`Size: ${grid.width} × ${grid.height} stitches`);
    instructions.push(`Total stitches: ${stitchCount}`);
    instructions.push("");
    instructions.push("Row-by-row instructions:");
    
    grid.cells.forEach((row, rowIndex) => {
      const rowInstructions = [];
      let currentStitch = null;
      let stitchCount = 0;
      
      row.forEach(cell => {
        if (cell?.stitch) {
          if (cell.stitch === currentStitch) {
            stitchCount++;
          } else {
            if (currentStitch && stitchCount > 0) {
              rowInstructions.push(`${stitchCount} ${currentStitch}`);
            }
            currentStitch = cell.stitch;
            stitchCount = 1;
          }
        }
      });
      
      if (currentStitch && stitchCount > 0) {
        rowInstructions.push(`${stitchCount} ${currentStitch}`);
      }
      
      if (rowInstructions.length > 0) {
        instructions.push(`Row ${rowIndex + 1}: ${rowInstructions.join(", ")}`);
      }
    });
    
    return instructions;
  }

  private static generateAssemblyInstructions(components: PatternComponent[]): string[] {
    const instructions = [];
    
    instructions.push("ASSEMBLY INSTRUCTIONS");
    instructions.push("===================");
    instructions.push("");
    instructions.push("Complete all individual components before assembly.");
    instructions.push("");
    
    // Sort components by assembly order
    const sortedComponents = [...components].sort((a, b) => a.assemblyOrder - b.assemblyOrder);
    
    instructions.push("Assembly Order:");
    sortedComponents.forEach((component, index) => {
      instructions.push(`${index + 1}. ${component.name}`);
    });
    instructions.push("");
    
    instructions.push("Joining Instructions:");
    sortedComponents.forEach(component => {
      if (component.connections.length > 0) {
        instructions.push(`${component.name}:`);
        component.connections.forEach(connection => {
          instructions.push(`  - ${connection.instructions}`);
        });
        instructions.push("");
      }
    });
    
    instructions.push("Finishing:");
    instructions.push("- Weave in all loose ends");
    instructions.push("- Block the finished piece according to yarn requirements");
    instructions.push("- Check all seams for security");
    
    return instructions;
  }

  private static calculateTotalTime(components: PatternComponent[]): string {
    // Estimate 1 minute per 10 stitches + assembly time
    const totalStitches = components.reduce((sum, component) => {
      const stitchCount = component.grid.cells.flat().filter(cell => cell !== null).length;
      return sum + stitchCount;
    }, 0);
    
    const workingTime = Math.ceil(totalStitches / 10); // minutes
    const assemblyTime = components.length * 15; // 15 minutes per component for assembly
    const totalMinutes = workingTime + assemblyTime;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  private static determineSkillLevel(components: PatternComponent[]): "beginner" | "intermediate" | "advanced" {
    if (components.length > 6) return "advanced";
    if (components.length > 3) return "intermediate";
    return "beginner";
  }

  private static generateGeneralNotes(pattern: Pattern, components: PatternComponent[]): string[] {
    const notes = [];
    
    if (components.length > 4) {
      notes.push("This is a complex pattern. Consider working on one component at a time.");
    }
    
    if (pattern.yarnWeight && pattern.yarnWeight !== "medium") {
      notes.push(`This pattern is designed for ${pattern.yarnWeight} weight ${pattern.materialType || 'yarn'}.`);
    }
    
    notes.push("Mark completed components to track progress.");
    notes.push("Keep component pieces in separate bags to avoid confusion.");
    
    if (pattern.complexity === "advanced") {
      notes.push("This pattern includes advanced techniques. Review all instructions before starting.");
    }
    
    return notes;
  }
}