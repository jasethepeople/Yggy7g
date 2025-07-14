import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PatternGrid } from "./PatternGrid";
import { ThreeVisualization } from "./ThreeVisualization";
import { InstructionsView } from "./InstructionsView";
import { Download, Share, RotateCcw, ZoomIn, Edit } from "lucide-react";

interface PatternCanvasProps {
  currentView: "2d" | "3d" | "pattern" | "instructions";
  onViewChange: (view: "2d" | "3d" | "pattern" | "instructions") => void;
  pattern: Pattern | null;
  isGenerating: boolean;
}

export function PatternCanvas({
  currentView,
  onViewChange,
  pattern,
  isGenerating,
}: PatternCanvasProps) {
  const renderLoadingState = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Your Pattern</h3>
        <p className="text-gray-600">This may take a few moments...</p>
        <div className="mt-4 w-64 bg-gray-200 rounded-full mx-auto">
          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "45%" }}></div>
        </div>
      </div>
    </div>
  );

  const render2DView = () => (
    <div className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Generated Image</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg h-[calc(100%-80px)] flex items-center justify-center">
        {pattern?.imageUrl ? (
          <img
            src={pattern.imageUrl}
            alt="Generated pattern image"
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        ) : (
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No image generated yet</p>
            <p className="text-sm mt-1">Create a pattern to see the generated image</p>
          </div>
        )}
      </div>
    </div>
  );

  const render3DView = () => (
    <div className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">3D Pattern Preview</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Rotate
          </Button>
          <Button variant="outline" size="sm">
            <ZoomIn className="w-4 h-4 mr-1" />
            Zoom
          </Button>
        </div>
      </div>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg h-[calc(100%-80px)]">
        <ThreeVisualization pattern={pattern} />
      </div>
    </div>
  );

  const renderPatternView = () => (
    <div className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Stitch Pattern Grid</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Grid Size:</label>
            <select className="px-2 py-1 text-sm border border-gray-300 rounded">
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
          </div>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
      <div className="bg-white border rounded-lg h-[calc(100%-80px)] overflow-auto">
        <PatternGrid pattern={pattern} />
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full p-6">
        {/* View Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <Button
              variant={currentView === "2d" ? "default" : "ghost"}
              size="sm"
              className={currentView === "2d" ? "bg-primary text-white" : "text-gray-600"}
              onClick={() => onViewChange("2d")}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              2D View
            </Button>
            <Button
              variant={currentView === "3d" ? "default" : "ghost"}
              size="sm"
              className={currentView === "3d" ? "bg-primary text-white" : "text-gray-600"}
              onClick={() => onViewChange("3d")}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              3D View
            </Button>
            <Button
              variant={currentView === "pattern" ? "default" : "ghost"}
              size="sm"
              className={currentView === "pattern" ? "bg-primary text-white" : "text-gray-600"}
              onClick={() => onViewChange("pattern")}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Pattern Grid
            </Button>
            <Button
              variant={currentView === "instructions" ? "default" : "ghost"}
              size="sm"
              className={currentView === "instructions" ? "bg-primary text-white" : "text-gray-600"}
              onClick={() => onViewChange("instructions")}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Instructions
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-200px)] overflow-hidden">
          {isGenerating ? (
            renderLoadingState()
          ) : (
            <>
              {currentView === "2d" && render2DView()}
              {currentView === "3d" && render3DView()}
              {currentView === "pattern" && renderPatternView()}
              {currentView === "instructions" && <InstructionsView pattern={pattern} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
