import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Pattern } from "@shared/schema";
import { Upload } from "lucide-react";

interface PatternControlsProps {
  activeTab: "text" | "upload";
  onTabChange: (tab: "text" | "upload") => void;
  onTextGeneration: (data: any) => void;
  onImageGeneration: (formData: FormData) => void;
  recentPatterns: Pattern[];
  onPatternSelect: (pattern: Pattern) => void;
  isGenerating: boolean;
}

export function PatternControls({
  activeTab,
  onTabChange,
  onTextGeneration,
  onImageGeneration,
  recentPatterns,
  onPatternSelect,
  isGenerating,
}: PatternControlsProps) {
  const [textForm, setTextForm] = useState({
    description: "",
    width: 40,
    height: 50,
    complexity: "simple" as "simple" | "intermediate" | "advanced",
    colorPalette: "pastel",
    colors: [] as string[],
    yarnWeight: "medium" as const,
    materialType: "yarn" as const,
    fiberType: "acrylic" as const,
  });

  const [imageForm, setImageForm] = useState({
    width: 40,
    height: 50,
    enhanceColors: true,
    simplifyDetails: true,
    yarnWeight: "medium" as const,
    materialType: "yarn" as const,
    fiberType: "acrylic" as const,
  });

  const [selectedColors, setSelectedColors] = useState<string[]>(["#FFB3E6", "#FFCCF2", "#E6E6FA"]);

  const handleTextSubmit = () => {
    if (!textForm.description.trim()) {
      return;
    }
    onTextGeneration({
      ...textForm,
      colors: selectedColors,
      complexity: textForm.complexity || 'simple',
      colorPalette: textForm.colorPalette || 'custom',
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("width", imageForm.width.toString());
    formData.append("height", imageForm.height.toString());
    formData.append("enhanceColors", imageForm.enhanceColors.toString());
    formData.append("simplifyDetails", imageForm.simplifyDetails.toString());
    formData.append("yarnWeight", imageForm.yarnWeight);
    formData.append("materialType", imageForm.materialType);
    formData.append("fiberType", imageForm.fiberType);

    onImageGeneration(formData);
  };

  const addColor = () => {
    const newColor = "#" + Math.floor(Math.random()*16777215).toString(16);
    setSelectedColors([...selectedColors, newColor]);
  };

  const removeColor = (index: number) => {
    setSelectedColors(selectedColors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...selectedColors];
    newColors[index] = color;
    setSelectedColors(newColors);
  };

  return (
    <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
        {/* Generation Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <Button
              variant={activeTab === "text" ? "default" : "ghost"}
              className={`flex-1 text-xs sm:text-sm ${activeTab === "text" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-400"}`}
              onClick={() => onTabChange("text")}
            >
              Text to Pattern
            </Button>
            <Button
              variant={activeTab === "upload" ? "default" : "ghost"}
              className={`flex-1 text-xs sm:text-sm ${activeTab === "upload" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-400"}`}
              onClick={() => onTabChange("upload")}
            >
              Upload Image
            </Button>
          </div>
        </div>

        {/* Text to Pattern Tab */}
        {activeTab === "text" && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
                </svg>
                Describe your crochet pattern
              </Label>
              <Textarea
                value={textForm.description}
                onChange={(e) => setTextForm({ ...textForm, description: e.target.value })}
                placeholder="A cute amigurumi bunny with floppy ears and a pink bow"
                rows={4}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
                Color Palette
              </Label>
              <div className="flex space-x-2 mb-3">
                {selectedColors.map((color, index) => (
                  <div key={index} className="relative group">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updateColor(index, e.target.value)}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer"
                    />
                    <button
                      onClick={() => removeColor(index)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addColor}
                  className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 hover:border-gray-400"
                >
                  +
                </button>
              </div>
              <Select
                value={textForm.colorPalette}
                onValueChange={(value) => setTextForm({ ...textForm, colorPalette: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pastel">Pastel Colors</SelectItem>
                  <SelectItem value="bold">Bold & Bright</SelectItem>
                  <SelectItem value="earth">Earth Tones</SelectItem>
                  <SelectItem value="monochrome">Monochrome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Pattern Size
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Width (stitches)</Label>
                  <Input
                    type="number"
                    value={textForm.width}
                    onChange={(e) => setTextForm({ ...textForm, width: parseInt(e.target.value) || 40 })}
                    min="10"
                    max="200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Height (rows)</Label>
                  <Input
                    type="number"
                    value={textForm.height}
                    onChange={(e) => setTextForm({ ...textForm, height: parseInt(e.target.value) || 50 })}
                    min="10"
                    max="200"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Pattern Complexity
              </Label>
              <RadioGroup
                value={textForm.complexity}
                onValueChange={(value) => setTextForm({ ...textForm, complexity: value as any })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="simple" />
                  <Label htmlFor="simple" className="text-sm">Simple (Basic stitches)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="text-sm">Intermediate (Color changes)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced" className="text-sm">Advanced (Complex stitches)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5l-1.777.888a3 3 0 01-2.676 0L10 12.5v-1.382a1 1 0 00-.553-.894L6 8.618V5z" clipRule="evenodd" />
                </svg>
                Material Type
              </Label>
              <Select
                value={textForm.materialType}
                onValueChange={(value) => setTextForm({ ...textForm, materialType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yarn">Yarn</SelectItem>
                  <SelectItem value="thread">Crochet Thread</SelectItem>
                  <SelectItem value="string">Craft String</SelectItem>
                  <SelectItem value="rope">Rope/Cord</SelectItem>
                  <SelectItem value="fabric-strips">Fabric Strips</SelectItem>
                  <SelectItem value="wire">Craft Wire</SelectItem>
                  <SelectItem value="plastic">Plastic Yarn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Yarn Weight & Fiber</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Weight</Label>
                  <Select
                    value={textForm.yarnWeight}
                    onValueChange={(value) => setTextForm({ ...textForm, yarnWeight: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lace">Lace (0)</SelectItem>
                      <SelectItem value="super-fine">Super Fine (1)</SelectItem>
                      <SelectItem value="fine">Fine (2)</SelectItem>
                      <SelectItem value="light">Light (3)</SelectItem>
                      <SelectItem value="medium">Medium (4)</SelectItem>
                      <SelectItem value="bulky">Bulky (5)</SelectItem>
                      <SelectItem value="super-bulky">Super Bulky (6)</SelectItem>
                      <SelectItem value="jumbo">Jumbo (7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Fiber</Label>
                  <Select
                    value={textForm.fiberType}
                    onValueChange={(value) => setTextForm({ ...textForm, fiberType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acrylic">Acrylic</SelectItem>
                      <SelectItem value="cotton">Cotton</SelectItem>
                      <SelectItem value="wool">Wool</SelectItem>
                      <SelectItem value="bamboo">Bamboo</SelectItem>
                      <SelectItem value="silk">Silk</SelectItem>
                      <SelectItem value="alpaca">Alpaca</SelectItem>
                      <SelectItem value="mohair">Mohair</SelectItem>
                      <SelectItem value="linen">Linen</SelectItem>
                      <SelectItem value="polyester">Polyester</SelectItem>
                      <SelectItem value="nylon">Nylon</SelectItem>
                      <SelectItem value="blend">Blend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleTextSubmit}
              disabled={isGenerating || !textForm.description.trim()}
              className="w-full bg-primary text-white py-3 hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  Generate Pattern
                </>
              )}
            </Button>
          </div>
        )}

        {/* Upload Image Tab */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isGenerating}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Pattern Size</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Width (stitches)</Label>
                  <Input
                    type="number"
                    value={imageForm.width}
                    onChange={(e) => setImageForm({ ...imageForm, width: parseInt(e.target.value) || 40 })}
                    min="10"
                    max="200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Height (rows)</Label>
                  <Input
                    type="number"
                    value={imageForm.height}
                    onChange={(e) => setImageForm({ ...imageForm, height: parseInt(e.target.value) || 50 })}
                    min="10"
                    max="200"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5l-1.777.888a3 3 0 01-2.676 0L10 12.5v-1.382a1 1 0 00-.553-.894L6 8.618V5z" clipRule="evenodd" />
                </svg>
                Material Type
              </Label>
              <Select
                value={imageForm.materialType}
                onValueChange={(value) => setImageForm({ ...imageForm, materialType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yarn">Yarn</SelectItem>
                  <SelectItem value="thread">Crochet Thread</SelectItem>
                  <SelectItem value="string">Craft String</SelectItem>
                  <SelectItem value="rope">Rope/Cord</SelectItem>
                  <SelectItem value="fabric-strips">Fabric Strips</SelectItem>
                  <SelectItem value="wire">Craft Wire</SelectItem>
                  <SelectItem value="plastic">Plastic Yarn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Yarn Weight & Fiber</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Weight</Label>
                  <Select
                    value={imageForm.yarnWeight}
                    onValueChange={(value) => setImageForm({ ...imageForm, yarnWeight: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lace">Lace (0)</SelectItem>
                      <SelectItem value="super-fine">Super Fine (1)</SelectItem>
                      <SelectItem value="fine">Fine (2)</SelectItem>
                      <SelectItem value="light">Light (3)</SelectItem>
                      <SelectItem value="medium">Medium (4)</SelectItem>
                      <SelectItem value="bulky">Bulky (5)</SelectItem>
                      <SelectItem value="super-bulky">Super Bulky (6)</SelectItem>
                      <SelectItem value="jumbo">Jumbo (7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Fiber</Label>
                  <Select
                    value={imageForm.fiberType}
                    onValueChange={(value) => setImageForm({ ...imageForm, fiberType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acrylic">Acrylic</SelectItem>
                      <SelectItem value="cotton">Cotton</SelectItem>
                      <SelectItem value="wool">Wool</SelectItem>
                      <SelectItem value="bamboo">Bamboo</SelectItem>
                      <SelectItem value="silk">Silk</SelectItem>
                      <SelectItem value="alpaca">Alpaca</SelectItem>
                      <SelectItem value="mohair">Mohair</SelectItem>
                      <SelectItem value="linen">Linen</SelectItem>
                      <SelectItem value="polyester">Polyester</SelectItem>
                      <SelectItem value="nylon">Nylon</SelectItem>
                      <SelectItem value="blend">Blend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Processing Options
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-enhance colors</span>
                  <Switch
                    checked={imageForm.enhanceColors}
                    onCheckedChange={(checked) => setImageForm({ ...imageForm, enhanceColors: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Simplify details</span>
                  <Switch
                    checked={imageForm.simplifyDetails}
                    onCheckedChange={(checked) => setImageForm({ ...imageForm, simplifyDetails: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Generate Button for Text Tab */}
            <div className="pt-4">
              <Button
                onClick={handleTextSubmit}
                disabled={isGenerating || !textForm.description.trim()}
                className="w-full bg-primary text-white py-3 hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Pattern...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 616 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    Generate Pattern from Text
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Upload Image Tab */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isGenerating}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Pattern Size</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Width (stitches)</Label>
                  <Input
                    type="number"
                    value={imageForm.width}
                    onChange={(e) => setImageForm({ ...imageForm, width: parseInt(e.target.value) || 40 })}
                    min="10"
                    max="200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Height (rows)</Label>
                  <Input
                    type="number"
                    value={imageForm.height}
                    onChange={(e) => setImageForm({ ...imageForm, height: parseInt(e.target.value) || 50 })}
                    min="10"
                    max="200"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5l-1.777.888a3 3 0 01-2.676 0L10 12.5v-1.382a1 1 0 00-.553-.894L6 8.618V5z" clipRule="evenodd" />
                </svg>
                Material Type
              </Label>
              <Select
                value={imageForm.materialType}
                onValueChange={(value) => setImageForm({ ...imageForm, materialType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yarn">Yarn</SelectItem>
                  <SelectItem value="thread">Crochet Thread</SelectItem>
                  <SelectItem value="string">Craft String</SelectItem>
                  <SelectItem value="rope">Rope/Cord</SelectItem>
                  <SelectItem value="fabric-strips">Fabric Strips</SelectItem>
                  <SelectItem value="wire">Craft Wire</SelectItem>
                  <SelectItem value="plastic">Plastic Yarn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Yarn Weight & Fiber</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Weight</Label>
                  <Select
                    value={imageForm.yarnWeight}
                    onValueChange={(value) => setImageForm({ ...imageForm, yarnWeight: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lace">Lace (0)</SelectItem>
                      <SelectItem value="super-fine">Super Fine (1)</SelectItem>
                      <SelectItem value="fine">Fine (2)</SelectItem>
                      <SelectItem value="light">Light (3)</SelectItem>
                      <SelectItem value="medium">Medium (4)</SelectItem>
                      <SelectItem value="bulky">Bulky (5)</SelectItem>
                      <SelectItem value="super-bulky">Super Bulky (6)</SelectItem>
                      <SelectItem value="jumbo">Jumbo (7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Fiber</Label>
                  <Select
                    value={imageForm.fiberType}
                    onValueChange={(value) => setImageForm({ ...imageForm, fiberType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acrylic">Acrylic</SelectItem>
                      <SelectItem value="cotton">Cotton</SelectItem>
                      <SelectItem value="wool">Wool</SelectItem>
                      <SelectItem value="bamboo">Bamboo</SelectItem>
                      <SelectItem value="silk">Silk</SelectItem>
                      <SelectItem value="alpaca">Alpaca</SelectItem>
                      <SelectItem value="mohair">Mohair</SelectItem>
                      <SelectItem value="linen">Linen</SelectItem>
                      <SelectItem value="polyester">Polyester</SelectItem>
                      <SelectItem value="nylon">Nylon</SelectItem>
                      <SelectItem value="blend">Blend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Processing Options
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-enhance colors</span>
                  <Switch
                    checked={imageForm.enhanceColors}
                    onCheckedChange={(checked) => setImageForm({ ...imageForm, enhanceColors: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Simplify details</span>
                  <Switch
                    checked={imageForm.simplifyDetails}
                    onCheckedChange={(checked) => setImageForm({ ...imageForm, simplifyDetails: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Generate Button for Upload Tab */}
            <div className="pt-4">
              <p className="text-xs text-gray-500 mb-3">Upload an image first, then click generate</p>
              <Button
                disabled={isGenerating}
                className="w-full bg-primary text-white py-3 hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
                onClick={() => {
                  const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                  if (!fileInput?.files?.[0]) {
                    fileInput?.click();
                  }
                }}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing Image...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Generate Pattern from Image
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Pattern History */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Recent Patterns
          </h3>
          <div className="space-y-2">
            {recentPatterns.length === 0 ? (
              <p className="text-sm text-gray-500">No patterns yet. Create your first pattern!</p>
            ) : (
              recentPatterns.slice(0, 5).map((pattern) => (
                <Card key={pattern.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onPatternSelect(pattern)}>
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-200 to-pink-300 rounded-lg"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{pattern.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(pattern.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
