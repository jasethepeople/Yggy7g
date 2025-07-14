import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Pattern } from '@shared/schema';

export class PatternExporter {
  static async exportToPDF(pattern: Pattern, includeChart: boolean = true): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(pattern.name || 'Crochet Pattern', 20, yPosition);
    yPosition += 15;

    // Add pattern info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const info = [
      `Difficulty: ${pattern.difficulty}`,
      `Size: ${pattern.width} × ${pattern.height} stitches`,
      `Estimated Time: ${pattern.estimatedTime || 'N/A'}`,
      `Total Stitches: ${pattern.stitchCount || 0}`,
    ];

    info.forEach(line => {
      pdf.text(line, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Add materials section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Materials Needed:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const materials = [
      'Worsted weight yarn in specified colors',
      'Crochet hook size G (4.0mm)',
      'Tapestry needle',
      'Scissors',
      'Stitch markers'
    ];

    materials.forEach(material => {
      pdf.text(`• ${material}`, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Add abbreviations
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Abbreviations:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const abbreviations = [
      'ch = chain',
      'sc = single crochet',
      'dc = double crochet',
      'hdc = half double crochet',
      'tc = treble crochet',
      'sl st = slip stitch',
      'inc = increase',
      'dec = decrease'
    ];

    abbreviations.forEach((abbr, index) => {
      const x = index % 2 === 0 ? 25 : 100;
      if (index % 2 === 0 && index > 0) yPosition += 6;
      pdf.text(abbr, x, yPosition);
      if (index === abbreviations.length - 1 && index % 2 === 0) yPosition += 6;
    });

    yPosition += 15;

    // Add instructions
    if (pattern.instructions) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Instructions:', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const lines = pattern.instructions.split('\n');
      lines.forEach(line => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const splitText = pdf.splitTextToSize(line, pageWidth - 40);
        pdf.text(splitText, 20, yPosition);
        yPosition += splitText.length * 6;
      });
    }

    // Add pattern chart if requested
    if (includeChart && yPosition < pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pattern Chart:', 20, yPosition);
      yPosition += 15;

      // Create a simple text-based chart
      const patternData = pattern.patternData as any;
      if (patternData?.cells) {
        pdf.setFontSize(8);
        pdf.setFont('courier', 'normal');
        
        const maxCellsPerRow = Math.floor((pageWidth - 40) / 3);
        const cellsToShow = Math.min(pattern.width, maxCellsPerRow);
        
        for (let y = 0; y < Math.min(pattern.height, 30); y++) {
          let rowText = '';
          for (let x = 0; x < cellsToShow; x++) {
            const cell = patternData.cells[y]?.[x];
            const symbol = this.getStitchSymbol(cell?.stitch || 'sc');
            rowText += symbol + ' ';
          }
          
          if (yPosition > pageHeight - 10) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(rowText, 20, yPosition);
          yPosition += 4;
        }
      }
    }

    // Save the PDF
    pdf.save(`${pattern.name || 'crochet-pattern'}.pdf`);
  }

  static async exportPatternChart(pattern: Pattern): Promise<void> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const patternData = pattern.patternData as any;
    if (!patternData?.cells) return;

    const cellSize = 20;
    canvas.width = pattern.width * cellSize;
    canvas.height = pattern.height * cellSize;

    // Draw pattern grid
    for (let y = 0; y < pattern.height; y++) {
      for (let x = 0; x < pattern.width; x++) {
        const cell = patternData.cells[y]?.[x];
        if (!cell) continue;

        // Fill cell with color
        ctx.fillStyle = cell.color || '#ffffff';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Draw border
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Draw stitch symbol
        ctx.fillStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbol = this.getStitchSymbol(cell.stitch);
        ctx.fillText(
          symbol,
          x * cellSize + cellSize / 2,
          y * cellSize + cellSize / 2
        );
      }
    }

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${pattern.name || 'pattern'}-chart.png`);
      }
    });
  }

  static async printPattern(pattern: Pattern): Promise<void> {
    // Create a print-friendly HTML version
    const printContent = this.generatePrintHTML(pattern);
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }

  static exportInstructions(pattern: Pattern): void {
    const instructions = this.generateTextInstructions(pattern);
    const blob = new Blob([instructions], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${pattern.name || 'pattern'}-instructions.txt`);
  }

  private static getStitchSymbol(stitch: string): string {
    const symbols: Record<string, string> = {
      sc: '•',
      dc: 'T',
      hdc: '┬',
      tc: '┴',
      ch: '○',
      sl: '–',
      inc: '+',
      dec: '×',
    };
    return symbols[stitch] || '•';
  }

  private static generatePrintHTML(pattern: Pattern): string {
    const yarnUsage = Array.isArray(pattern.yarnUsage) ? pattern.yarnUsage : [];
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${pattern.name || 'Crochet Pattern'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #333; }
          h2 { color: #666; margin-top: 30px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
          .materials li { margin: 5px 0; }
          .abbreviations { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
          .instructions { white-space: pre-wrap; }
          @media print {
            body { margin: 0; }
            h1 { page-break-after: avoid; }
            h2 { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${pattern.name || 'Crochet Pattern'}</h1>
        
        <div class="info-grid">
          <div><strong>Difficulty:</strong> ${pattern.difficulty}</div>
          <div><strong>Size:</strong> ${pattern.width} × ${pattern.height} stitches</div>
          <div><strong>Estimated Time:</strong> ${pattern.estimatedTime || 'N/A'}</div>
          <div><strong>Total Stitches:</strong> ${pattern.stitchCount || 0}</div>
        </div>

        <h2>Materials Needed</h2>
        <ul class="materials">
          <li>Worsted weight yarn in the following colors:</li>
          ${yarnUsage.map((yarn: any, index: number) => 
            `<li style="margin-left: 20px;">Color ${index + 1}: ${yarn.amount}% (${yarn.color})</li>`
          ).join('')}
          <li>Crochet hook size G (4.0mm)</li>
          <li>Tapestry needle</li>
          <li>Scissors</li>
          <li>Stitch markers</li>
        </ul>

        <h2>Abbreviations</h2>
        <div class="abbreviations">
          <div>ch = chain</div>
          <div>sc = single crochet</div>
          <div>dc = double crochet</div>
          <div>hdc = half double crochet</div>
          <div>tc = treble crochet</div>
          <div>sl st = slip stitch</div>
          <div>inc = increase</div>
          <div>dec = decrease</div>
        </div>

        <h2>Instructions</h2>
        <div class="instructions">${pattern.instructions || 'Follow the pattern chart for stitch placement and color changes.'}</div>
      </body>
      </html>
    `;
  }

  private static generateTextInstructions(pattern: Pattern): string {
    const yarnUsage = Array.isArray(pattern.yarnUsage) ? pattern.yarnUsage : [];
    
    return `${pattern.name || 'Crochet Pattern'}
${'='.repeat((pattern.name || 'Crochet Pattern').length)}

PATTERN INFORMATION
Difficulty: ${pattern.difficulty}
Size: ${pattern.width} × ${pattern.height} stitches
Estimated Time: ${pattern.estimatedTime || 'N/A'}
Total Stitches: ${pattern.stitchCount || 0}

MATERIALS NEEDED
• Worsted weight yarn in the following colors:
${yarnUsage.map((yarn: any, index: number) => 
  `  - Color ${index + 1}: ${yarn.amount}% (${yarn.color})`
).join('\n')}
• Crochet hook size G (4.0mm)
• Tapestry needle
• Scissors
• Stitch markers

ABBREVIATIONS
ch = chain          sc = single crochet
dc = double crochet hdc = half double crochet
tc = treble crochet sl st = slip stitch
inc = increase      dec = decrease

INSTRUCTIONS
${pattern.instructions || 'Follow the pattern chart for stitch placement and color changes.'}

Generated by CrochetAI Pattern Generator
`;
  }
}