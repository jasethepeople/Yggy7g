import { useState, useRef } from "react";
import { PatternCanvas } from "@/components/PatternCanvas";
import { PatternControls } from "@/components/PatternControls";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { PatternBreakdown } from "@/components/PatternBreakdown";
import { ColorViewer } from "@/components/ColorViewer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pattern } from "@shared/schema";

export default function CrochetGenerator() {
  const [activeTab, setActiveTab] = useState<"text" | "upload">("text");
  const [currentView, setCurrentView] = useState<"2d" | "3d" | "pattern" | "instructions">("2d");
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Fetch recent patterns
  const { data: recentPatterns } = useQuery({
    queryKey: ["/api/patterns"],
    enabled: true,
  });

  // Generate pattern from text mutation
  const generateFromTextMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/patterns/generate-from-text", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentPattern(data.pattern);
      setIsGenerating(false);
      toast({
        title: "Pattern Generated!",
        description: "Your crochet pattern has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate pattern. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate pattern from image mutation
  const generateFromImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/patterns/generate-from-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate pattern");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentPattern(data.pattern);
      setIsGenerating(false);
      toast({
        title: "Pattern Generated!",
        description: "Your crochet pattern has been successfully created from the image.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate pattern from image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTextGeneration = (data: any) => {
    setIsGenerating(true);
    generateFromTextMutation.mutate(data);
  };

  const handleImageGeneration = (formData: FormData) => {
    setIsGenerating(true);
    generateFromImageMutation.mutate(formData);
  };

  const handlePatternSelect = (pattern: Pattern) => {
    setCurrentPattern(pattern);
  };

  const handleColorsChange = (colors: string[]) => {
    if (currentPattern) {
      const updatedPattern = { ...currentPattern, colorPalette: colors };
      setCurrentPattern(updatedPattern);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">CrochetAI</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">AI-Powered Pattern Generator</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => window.open('https://github.com/your-username/crochet-ai', '_blank')}
              className="hidden sm:flex px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Help
            </button>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <svg className="w-4 h-4 mr-1 sm:mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Account</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6 min-h-[calc(100vh-80px)]">
        {/* Mobile/Tablet: Stack vertically, Desktop: 3-column grid */}
        
        {/* Left Sidebar - Controls & Color Viewer */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-none">
          <PatternControls
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onTextGeneration={handleTextGeneration}
            onImageGeneration={handleImageGeneration}
            recentPatterns={recentPatterns?.patterns || []}
            onPatternSelect={handlePatternSelect}
            isGenerating={isGenerating}
          />
          
          <div className="hidden lg:block">
            <ColorViewer
              pattern={currentPattern}
              onColorsChange={handleColorsChange}
            />
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="lg:col-span-6 order-2 lg:order-none min-h-[400px] lg:min-h-0">
          <PatternCanvas
            currentView={currentView}
            onViewChange={setCurrentView}
            pattern={currentPattern}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right Sidebar - Properties & Breakdown */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-3 lg:order-none">
          <PropertiesPanel
            pattern={currentPattern}
            onPatternUpdate={setCurrentPattern}
          />
          
          <div className="hidden lg:block">
            <PatternBreakdown
              pattern={currentPattern}
              onComponentSelect={(component) => {
                console.log("Selected component:", component);
              }}
            />
          </div>
        </div>
        
        {/* Mobile Color Viewer */}
        <div className="lg:hidden order-4 lg:order-none">
          <ColorViewer
            pattern={currentPattern}
            onColorsChange={handleColorsChange}
          />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Made with <span className="text-red-500">♥</span> by{' '}
          <a 
            href="https://jason-clark.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline"
          >
            Jason Clark
          </a>
        </div>
      </footer>
    </div>
  );
}
