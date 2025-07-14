import { StitchType, PatternCell, ColorPalette } from "@shared/schema";

export interface PatternGrid {
  width: number;
  height: number;
  cells: PatternCell[][];
}

export interface PatternMetrics {
  totalStitches: number;
  estimatedTime: string;
  yarnUsage: { color: string; amount: number }[];
  difficulty: string;
}

export class PatternGenerator {
  private static colorPalettes: Record<string, string[]> = {
    "pastel": ["#FFB3E6", "#FFCCF2", "#E6E6FA", "#B3E5FF", "#FFFFCC"],
    "bold": ["#FF6B9D", "#4ECDC4", "#FFD93D", "#6BCF7F", "#A8E6CF"],
    "earth": ["#8B4513", "#D2691E", "#CD853F", "#DEB887", "#F4A460"],
    "monochrome": ["#FFFFFF", "#F0F0F0", "#D3D3D3", "#A9A9A9", "#696969"],
  };

  static generateFromImage(
    imageData: string,
    width: number,
    height: number,
    enhanceColors: boolean = true,
    simplifyDetails: boolean = true
  ): PatternGrid {
    // Create a simplified grid based on image analysis
    const cells: PatternCell[][] = [];
    
    // For demonstration, create a basic pattern
    // In production, this would use image processing to analyze the actual image
    for (let y = 0; y < height; y++) {
      cells[y] = [];
      for (let x = 0; x < width; x++) {
        // Simple algorithm to create a pattern based on position
        const colorIndex = Math.floor((x + y) / 5) % 3;
        const colors = ["#FFB3E6", "#FFFFFF", "#E6E6FA"];
        const stitches: StitchType[] = ["sc", "dc", "ch"];
        
        cells[y][x] = {
          x,
          y,
          stitch: stitches[colorIndex],
          color: colors[colorIndex],
        };
      }
    }

    return { width, height, cells };
  }

  static generateFromDescription(
    description: string,
    width: number,
    height: number,
    complexity: "simple" | "intermediate" | "advanced",
    colorPalette: string,
    customColors?: string[]
  ): PatternGrid {
    const colors = customColors || this.colorPalettes[colorPalette] || this.colorPalettes["pastel"];
    const cells: PatternCell[][] = [];

    // Define stitch complexity based on level
    const stitchOptions: Record<string, StitchType[]> = {
      simple: ["sc", "ch"],
      intermediate: ["sc", "dc", "ch", "sl"],
      advanced: ["sc", "dc", "hdc", "tc", "ch", "sl", "inc", "dec"],
    };

    const availableStitches = stitchOptions[complexity];

    for (let y = 0; y < height; y++) {
      cells[y] = [];
      for (let x = 0; x < width; x++) {
        // Create patterns based on description keywords
        let colorIndex = 0;
        let stitchIndex = 0;

        // Simple pattern generation based on position and description
        if (description.toLowerCase().includes("stripe")) {
          colorIndex = Math.floor(y / 3) % colors.length;
        } else if (description.toLowerCase().includes("checker")) {
          colorIndex = ((Math.floor(x / 5) + Math.floor(y / 5)) % 2) * (colors.length - 1);
        } else {
          // Default gradient pattern
          colorIndex = Math.floor((x + y) / (width + height) * colors.length);
        }

        // Choose stitch based on pattern requirements
        if (y === 0 || y === height - 1) {
          stitchIndex = availableStitches.indexOf("ch") >= 0 ? availableStitches.indexOf("ch") : 0;
        } else {
          stitchIndex = Math.floor((x + y) / 3) % availableStitches.length;
        }

        cells[y][x] = {
          x,
          y,
          stitch: availableStitches[stitchIndex],
          color: colors[colorIndex % colors.length],
        };
      }
    }

    return { width, height, cells };
  }

  static calculateMetrics(grid: PatternGrid): PatternMetrics {
    let totalStitches = 0;
    const colorUsage: Record<string, number> = {};

    // Count stitches and color usage
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const cell = grid.cells[y][x];
        if (cell.stitch !== "ch") {
          totalStitches++;
        }
        colorUsage[cell.color] = (colorUsage[cell.color] || 0) + 1;
      }
    }

    // Estimate time based on stitch count (rough estimate: 10-15 stitches per minute)
    const estimatedMinutes = totalStitches / 12;
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = Math.round(estimatedMinutes % 60);
    const estimatedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Calculate yarn usage (approximate)
    const yarnUsage = Object.entries(colorUsage).map(([color, count]) => ({
      color,
      amount: Math.round((count / totalStitches) * 100), // percentage
    }));

    // Determine difficulty based on stitch variety
    const uniqueStitches = new Set();
    grid.cells.flat().forEach(cell => uniqueStitches.add(cell.stitch));
    
    let difficulty = "Beginner";
    if (uniqueStitches.size > 4) {
      difficulty = "Advanced";
    } else if (uniqueStitches.size > 2) {
      difficulty = "Intermediate";
    }

    return {
      totalStitches,
      estimatedTime,
      yarnUsage,
      difficulty,
    };
  }

  static validatePattern(grid: PatternGrid): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for minimum size
    if (grid.width < 5 || grid.height < 5) {
      errors.push("Pattern is too small (minimum 5x5)");
    }

    // Check for maximum size
    if (grid.width > 200 || grid.height > 200) {
      errors.push("Pattern is too large (maximum 200x200)");
    }

    // Validate each cell
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const cell = grid.cells[y]?.[x];
        if (!cell) {
          errors.push(`Missing cell at position (${x}, ${y})`);
          continue;
        }

        // Validate color format
        if (!/^#[0-9A-Fa-f]{6}$/.test(cell.color)) {
          errors.push(`Invalid color format at (${x}, ${y}): ${cell.color}`);
        }

        // Validate stitch type
        const validStitches = ["sc", "dc", "hdc", "tc", "sl", "ch", "inc", "dec"];
        if (!validStitches.includes(cell.stitch)) {
          errors.push(`Invalid stitch type at (${x}, ${y}): ${cell.stitch}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
