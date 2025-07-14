import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PatternGrid } from "@/components/PatternGrid";
import { ThreeVisualization } from "@/components/ThreeVisualization";
import { InstructionsView } from "@/components/InstructionsView";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Grid, FileText, Box } from "lucide-react";

export default function PatternViewer() {
  const [match, params] = useRoute("/pattern/:id");
  const [currentView, setCurrentView] = useState<"2d" | "3d" | "pattern" | "instructions">("2d");
  const [pattern, setPattern] = useState<Pattern | null>(null);

  // Fetch pattern data
  const { data: patternsData, isLoading } = useQuery({
    queryKey: ["/api/patterns"],
  });

  useEffect(() => {
    if (patternsData?.patterns && params?.id) {
      const foundPattern = patternsData.patterns.find(
        (p: Pattern) => p.id === parseInt(params.id)
      );
      setPattern(foundPattern || null);
    }
  }, [patternsData, params?.id]);

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pattern...</p>
        </div>
      </div>
    );
  }

  if (!pattern) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pattern Not Found</h2>
          <p className="text-gray-600 mb-6">The pattern you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Generator
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const render2DView = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Image</h3>
      <div className="bg-gray-50 rounded-lg h-[calc(100%-60px)] flex items-center justify-center">
        {pattern?.imageUrl ? (
          <img
            src={pattern.imageUrl}
            alt="Generated pattern image"
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        ) : (
          <div className="text-center text-gray-500">
            <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No image available</p>
          </div>
        )}
      </div>
    </div>
  );

  const render3DView = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">3D Preview</h3>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg h-[calc(100%-60px)]">
        <ThreeVisualization pattern={pattern} />
      </div>
    </div>
  );

  const renderPatternView = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Grid</h3>
      <div className="bg-white border rounded-lg h-[calc(100%-60px)] overflow-auto">
        <PatternGrid pattern={pattern} />
      </div>
    </div>
  );

  const renderInstructionsView = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <InstructionsView pattern={pattern} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {pattern.name || 'Untitled Pattern'}
            </h1>
            <div className="w-16"></div> {/* Spacer for balance */}
          </div>
        </div>

        {/* View Tabs - Mobile Optimized */}
        <div className="px-1 pb-3">
          <div className="flex gap-0.5 bg-gray-100 p-1 rounded-lg w-full max-w-full overflow-hidden">
            <Button
              variant={currentView === "2d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("2d")}
              className={`flex flex-col items-center justify-center flex-1 text-xs min-h-[44px] w-1/4 px-0.5 ${
                currentView === "2d" ? "bg-primary text-white" : "text-gray-600"
              }`}
            >
              <Eye className="w-4 h-4 mb-1" />
              2D
            </Button>
            <Button
              variant={currentView === "3d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("3d")}
              className={`flex flex-col items-center justify-center flex-1 text-xs min-h-[44px] w-1/4 px-0.5 ${
                currentView === "3d" ? "bg-primary text-white" : "text-gray-600"
              }`}
            >
              <Box className="w-4 h-4 mb-1" />
              3D
            </Button>
            <Button
              variant={currentView === "pattern" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("pattern")}
              className={`flex flex-col items-center justify-center flex-1 text-xs min-h-[44px] w-1/4 px-0.5 ${
                currentView === "pattern" ? "bg-primary text-white" : "text-gray-600"
              }`}
            >
              <Grid className="w-4 h-4 mb-1" />
              Grid
            </Button>
            <Button
              variant={currentView === "instructions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("instructions")}
              className={`flex flex-col items-center justify-center flex-1 text-xs min-h-[44px] w-1/4 px-0.5 ${
                currentView === "instructions" ? "bg-primary text-white" : "text-gray-600"
              }`}
            >
              <FileText className="w-4 h-4 mb-1" />
              Text
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="h-full">
            {currentView === "2d" && render2DView()}
            {currentView === "3d" && render3DView()}
            {currentView === "pattern" && renderPatternView()}
            {currentView === "instructions" && renderInstructionsView()}
          </div>
        </div>
        
        {/* Properties Panel */}
        <PropertiesPanel 
          pattern={pattern} 
          onPatternUpdate={setPattern}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Main Content */}
        <div className="p-4 h-[calc(100vh-140px)]">
          {currentView === "2d" && render2DView()}
          {currentView === "3d" && render3DView()}
          {currentView === "pattern" && renderPatternView()}
          {currentView === "instructions" && renderInstructionsView()}
        </div>

        {/* Mobile Properties Panel - Collapsible */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-h-[300px] overflow-y-auto">
            <PropertiesPanel 
              pattern={pattern} 
              onPatternUpdate={setPattern}
            />
          </div>
        </div>
      </div>
    </div>
  );
}