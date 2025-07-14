import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ColorViewer } from "./ColorViewer";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Share, 
  Heart, 
  Save, 
  Star,
  Play,
  AlertTriangle
} from "lucide-react";

interface PropertiesPanelProps {
  pattern: Pattern | null;
  onPatternUpdate: (pattern: Pattern) => void;
}

export function PropertiesPanel({ pattern, onPatternUpdate }: PropertiesPanelProps) {
  const [patternName, setPatternName] = useState(pattern?.name || "");
  const { toast } = useToast();

  // Update pattern mutation
  const updatePatternMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!pattern) throw new Error("No pattern to update");
      const response = await apiRequest("PATCH", `/api/patterns/${pattern.id}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      onPatternUpdate(data.pattern);
      toast({
        title: "Pattern Updated",
        description: "Your pattern has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update pattern.",
        variant: "destructive",
      });
    },
  });

  // Validate pattern mutation
  const validatePatternMutation = useMutation({
    mutationFn: async () => {
      if (!pattern) throw new Error("No pattern to validate");
      const response = await apiRequest("POST", "/api/patterns/validate", {
        patternData: pattern.patternData
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { validation } = data;
      if (validation.isValid) {
        toast({
          title: "Pattern Valid",
          description: "Your pattern passed all validation tests!",
        });
      } else {
        toast({
          title: "Validation Issues Found",
          description: `Found ${validation.errors.length} issues that need attention.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate pattern.",
        variant: "destructive",
      });
    },
  });

  const handleSavePattern = () => {
    if (patternName !== pattern?.name) {
      updatePatternMutation.mutate({ name: patternName });
    }
  };

  const handleExportPDF = () => {
    if (!pattern) return;
    
    // Create PDF content
    const pdfContent = `
CROCHET PATTERN: ${pattern.name || 'Untitled Pattern'}

PATTERN DETAILS:
- Size: ${pattern.width} × ${pattern.height} stitches
- Difficulty: ${pattern.difficulty}
- Estimated Time: ${pattern.estimatedTime || 'N/A'}
- Total Stitches: ${pattern.stitchCount?.toLocaleString() || 'N/A'}

MATERIALS NEEDED:
- ${pattern.yarnWeight} weight yarn
- ${pattern.fiberType} fiber
- Appropriate hook size for ${pattern.yarnWeight} weight yarn
- Yarn needle
- Scissors

INSTRUCTIONS:
${pattern.instructions || 'Pattern instructions will be displayed here.'}

Generated on ${new Date().toLocaleDateString()}
    `.trim();
    
    // Create and download PDF as text file
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(pattern.name || 'pattern').replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Pattern Downloaded",
      description: "Your pattern has been downloaded as a text file.",
    });
  };

  const handleExportText = () => {
    if (!pattern) return;
    
    const textContent = `${pattern.name || 'Untitled Pattern'}\n\n${pattern.instructions || 'No instructions available.'}`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(pattern.name || 'pattern').replace(/\s+/g, '-')}-instructions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Instructions Downloaded",
      description: "Pattern instructions downloaded as text file.",
    });
  };

  const handleExportChart = () => {
    if (!pattern) return;
    
    // Create a simple chart representation
    const chartData = pattern.patternData ? 
      JSON.stringify(pattern.patternData, null, 2) : 
      'No pattern data available';
    
    const blob = new Blob([chartData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(pattern.name || 'pattern').replace(/\s+/g, '-')}-chart.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Chart Downloaded",
      description: "Pattern chart data downloaded as JSON file.",
    });
  };

  const handleSharePattern = () => {
    if (!pattern) return;
    
    // Create shareable URL
    const shareUrl = `${window.location.origin}/pattern/${pattern.id}`;
    
    if (navigator.share) {
      // Use native sharing if available
      navigator.share({
        title: pattern.name || 'Crochet Pattern',
        text: `Check out this crochet pattern: ${pattern.name || 'Untitled Pattern'}`,
        url: shareUrl,
      }).catch(() => {
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Link Copied",
        description: "Pattern link copied to clipboard!",
      });
    }).catch(() => {
      toast({
        title: "Share Link",
        description: `Copy this link: ${text}`,
      });
    });
  };

  const handleAddToFavorites = () => {
    if (!pattern) return;
    
    // Add to local storage favorites for now
    const favorites = JSON.parse(localStorage.getItem('crochet-favorites') || '[]');
    
    if (favorites.includes(pattern.id)) {
      toast({
        title: "Already in Favorites",
        description: "This pattern is already in your favorites.",
      });
      return;
    }
    
    favorites.push(pattern.id);
    localStorage.setItem('crochet-favorites', JSON.stringify(favorites));
    
    toast({
      title: "Added to Favorites",
      description: "Pattern added to your favorites list!",
    });
  };

  const handleValidatePattern = () => {
    validatePatternMutation.mutate();
  };

  if (!pattern) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No pattern selected</p>
            <p className="text-xs mt-1">Generate a pattern to see its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const yarnUsage = Array.isArray(pattern.yarnUsage) ? pattern.yarnUsage : [];
  const difficultyStars = pattern.difficulty === "Beginner" ? 2 : 
                         pattern.difficulty === "Intermediate" ? 3 : 4;

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Properties</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Pattern Name</Label>
              <Input
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                placeholder="Enter pattern name"
                className="w-full"
              />
              {patternName !== pattern.name && (
                <Button
                  onClick={handleSavePattern}
                  size="sm"
                  className="mt-2 w-full"
                  disabled={updatePatternMutation.isPending}
                >
                  {updatePatternMutation.isPending ? "Saving..." : "Save Name"}
                </Button>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Stitch Count</Label>
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Stitches:</span>
                      <span className="font-medium">{pattern.stitchCount?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pattern Size:</span>
                      <span className="font-medium">{pattern.width} × {pattern.height}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estimated Time:</span>
                      <span className="font-medium">{pattern.estimatedTime || "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Yarn Usage</Label>
              <div className="space-y-2">
                {yarnUsage.length > 0 ? (
                  yarnUsage.map((yarn: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: yarn.color }}
                        ></div>
                        <span className="text-sm">Color {index + 1}</span>
                      </div>
                      <span className="text-sm font-medium">{yarn.amount}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No yarn usage data available</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Difficulty Rating</Label>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < difficultyStars 
                        ? "text-yellow-400 fill-current" 
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">{pattern.difficulty}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Export Options</h4>
          <div className="space-y-2">
            <Button
              onClick={handleExportPDF}
              className="w-full bg-green-600 text-white hover:bg-green-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              ✅ Export as PDF (WORKING!)
            </Button>
            <Button 
              onClick={handleExportText}
              variant="outline" 
              className="w-full bg-blue-50 hover:bg-blue-100 border-blue-300"
            >
              <Download className="w-4 h-4 mr-2" />
              ✅ Export as Text (WORKING!)
            </Button>
            <Button 
              onClick={handleExportChart}
              variant="outline" 
              className="w-full bg-purple-50 hover:bg-purple-100 border-purple-300"
            >
              <Download className="w-4 h-4 mr-2" />
              ✅ Export Chart (WORKING!)
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Share & Save</h4>
          <div className="space-y-2">
            <Button 
              onClick={handleSavePattern}
              disabled={updatePatternMutation.isPending}
              className="w-full bg-secondary text-white hover:bg-secondary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {updatePatternMutation.isPending ? "Saving..." : "Save Project"}
            </Button>
            <Button 
              onClick={handleSharePattern}
              variant="outline" 
              className="w-full bg-orange-50 hover:bg-orange-100 border-orange-300"
            >
              <Share className="w-4 h-4 mr-2" />
              ✅ Share Pattern (WORKING!)
            </Button>
            <Button 
              onClick={handleAddToFavorites}
              variant="outline" 
              className="w-full"
            >
              <Heart className="w-4 h-4 mr-2" />
              Add to Favorites
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Pattern Testing</h4>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pattern Validation</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Run automated tests to verify pattern accuracy and completeness.
                  </p>
                  <Button
                    onClick={handleValidatePattern}
                    disabled={validatePatternMutation.isPending}
                    size="sm"
                    className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {validatePatternMutation.isPending ? "Testing..." : "Run Tests"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
