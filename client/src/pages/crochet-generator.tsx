import { useState, useRef } from "react";
import { Link } from "wouter";
import { PatternCanvas } from "@/components/PatternCanvas";
import { PatternControls } from "@/components/PatternControls";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { PatternBreakdown } from "@/components/PatternBreakdown";
import { ColorViewer } from "@/components/ColorViewer";
import { TestingDashboard } from "@/components/TestingDashboard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Library, Heart, Eye, TestTube } from "lucide-react";

export default function CrochetGenerator() {
  const [activeTab, setActiveTab] = useState<"text" | "upload">("text");
  const [currentView, setCurrentView] = useState<"2d" | "3d" | "pattern" | "instructions">("2d");
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTestDashboard, setShowTestDashboard] = useState(false);
  const { toast } = useToast();

  // Fetch recent patterns
  const { data: recentPatterns } = useQuery({
    queryKey: ["/api/patterns"],
    enabled: true,
  });

  // Generate pattern from text mutation
  const generateFromTextMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/patterns/generate-from-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
            <Link href="/library">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <Library className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Library</span>
              </Button>
            </Link>
            {currentPattern && (
              <Link href={`/pattern/${currentPattern.id}`}>
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              </Link>
            )}
            <Button 
              onClick={() => {
                const favorites = JSON.parse(localStorage.getItem('crochet-favorites') || '[]');
                const totalFavorites = favorites.length;
                toast({
                  title: "Your Favorites",
                  description: `You have ${totalFavorites} favorite pattern${totalFavorites !== 1 ? 's' : ''}`,
                });
              }}
              variant="ghost" 
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Heart className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Favorites</span>
            </Button>
            <Button 
              onClick={() => setShowTestDashboard(!showTestDashboard)}
              variant="ghost" 
              size="sm"
              className="text-purple-600 hover:text-purple-900"
            >
              <TestTube className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Test</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Testing Dashboard */}
      {showTestDashboard && (
        <div className="mx-4 sm:mx-6 mb-4 sm:mb-6">
          <TestingDashboard />
        </div>
      )}

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
