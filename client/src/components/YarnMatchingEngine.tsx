import { useState, useEffect } from "react";
import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  ShoppingCart, 
  Star, 
  DollarSign, 
  Package, 
  Palette,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  Heart,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface YarnInfo {
  id: string;
  brand: string;
  name: string;
  weight: string;
  fiber: string;
  yardage: number;
  price: number;
  colors: { hex: string; name: string; number?: string }[];
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  rating: number;
  substitutes: string[];
  store: string;
  url: string;
}

interface ColorMatch {
  originalColor: string;
  matchedYarn: YarnInfo;
  matchedColor: { hex: string; name: string; number?: string };
  accuracy: number;
  alternatives: Array<{
    yarn: YarnInfo;
    color: { hex: string; name: string; number?: string };
    accuracy: number;
  }>;
}

interface ShoppingListItem {
  yarn: YarnInfo;
  color: { hex: string; name: string; number?: string };
  quantity: number;
  unit: string;
  price: number;
  inCart: boolean;
}

interface YarnMatchingEngineProps {
  pattern: Pattern | null;
  isOpen: boolean;
  onClose: () => void;
}

export function YarnMatchingEngine({ pattern, isOpen, onClose }: YarnMatchingEngineProps) {
  const [colorMatches, setColorMatches] = useState<ColorMatch[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [filters, setFilters] = useState({
    maxPrice: 50,
    preferredBrands: [] as string[],
    yarnWeight: '',
    fiber: '',
    availability: 'all'
  });
  const [isMatching, setIsMatching] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const { toast } = useToast();

  // Mock yarn database - in production this would come from an API
  const yarnDatabase: YarnInfo[] = [
    {
      id: '1',
      brand: 'Red Heart',
      name: 'Super Saver',
      weight: 'Worsted',
      fiber: '100% Acrylic',
      yardage: 364,
      price: 2.97,
      colors: [
        { hex: '#FF6B6B', name: 'Cherry Red', number: '0319' },
        { hex: '#4ECDC4', name: 'Turqua', number: '0512' },
        { hex: '#45B7D1', name: 'Ocean', number: '0387' },
        { hex: '#96CEB4', name: 'Mint', number: '0368' }
      ],
      availability: 'in-stock',
      rating: 4.2,
      substitutes: ['2', '3'],
      store: 'Walmart',
      url: 'https://walmart.com/red-heart-super-saver'
    },
    {
      id: '2',
      brand: 'Lion Brand',
      name: 'Wool-Ease',
      weight: 'Worsted',
      fiber: '80% Acrylic, 20% Wool',
      yardage: 197,
      price: 4.99,
      colors: [
        { hex: '#FF6B6B', name: 'Cranberry', number: '138' },
        { hex: '#4ECDC4', name: 'Teal', number: '148' },
        { hex: '#45B7D1', name: 'Oxford Blue', number: '110' },
        { hex: '#FFEAA7', name: 'Buttercup', number: '158' }
      ],
      availability: 'in-stock',
      rating: 4.6,
      substitutes: ['1', '3'],
      store: 'Michaels',
      url: 'https://michaels.com/lion-brand-wool-ease'
    },
    {
      id: '3',
      brand: 'Bernat',
      name: 'Baby',
      weight: 'DK',
      fiber: '100% Acrylic',
      yardage: 362,
      price: 3.49,
      colors: [
        { hex: '#FFB3E6', name: 'Baby Pink', number: '02003' },
        { hex: '#B3E5FC', name: 'Baby Blue', number: '02002' },
        { hex: '#DCEDC8', name: 'Baby Green', number: '02004' },
        { hex: '#FFF9C4', name: 'Baby Yellow', number: '02005' }
      ],
      availability: 'limited',
      rating: 4.4,
      substitutes: ['1', '2'],
      store: 'Joann',
      url: 'https://joann.com/bernat-baby'
    }
  ];

  const yarnBrands = ['Red Heart', 'Lion Brand', 'Bernat', 'Caron', 'Patons'];
  const yarnWeights = ['Lace', 'DK', 'Worsted', 'Chunky', 'Super Chunky'];
  const fiberTypes = ['Acrylic', 'Cotton', 'Wool', 'Blend'];

  // Extract colors from pattern
  useEffect(() => {
    if (pattern && isOpen) {
      matchColorsToYarns();
    }
  }, [pattern, isOpen, filters]);

  const matchColorsToYarns = async () => {
    if (!pattern?.colorPalette) return;

    setIsMatching(true);
    
    try {
      const colors = Array.isArray(pattern.colorPalette) 
        ? pattern.colorPalette 
        : ['#FF6B6B', '#4ECDC4', '#45B7D1'];

      const matches: ColorMatch[] = [];

      for (const color of colors) {
        const bestMatch = findBestColorMatch(color);
        if (bestMatch) {
          matches.push(bestMatch);
        }
      }

      setColorMatches(matches);
      generateShoppingList(matches);
      
    } catch (error) {
      toast({
        title: "Matching Error",
        description: "Failed to match colors to yarns",
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
  };

  const findBestColorMatch = (targetColor: string): ColorMatch | null => {
    let bestMatch: any = null;
    let bestAccuracy = 0;
    const alternatives: any[] = [];

    // Filter yarns based on user preferences
    const filteredYarns = yarnDatabase.filter(yarn => {
      if (filters.preferredBrands.length > 0 && !filters.preferredBrands.includes(yarn.brand)) return false;
      if (filters.yarnWeight && yarn.weight !== filters.yarnWeight) return false;
      if (filters.availability !== 'all' && yarn.availability !== filters.availability) return false;
      if (yarn.price > filters.maxPrice) return false;
      return true;
    });

    for (const yarn of filteredYarns) {
      for (const yarnColor of yarn.colors) {
        const accuracy = calculateColorSimilarity(targetColor, yarnColor.hex);
        
        if (accuracy > bestAccuracy) {
          if (bestMatch) {
            alternatives.unshift({
              yarn: bestMatch.yarn,
              color: bestMatch.color,
              accuracy: bestAccuracy
            });
          }
          bestMatch = { yarn, color: yarnColor };
          bestAccuracy = accuracy;
        } else if (accuracy > 0.7) {
          alternatives.push({ yarn, color: yarnColor, accuracy });
        }
      }
    }

    if (!bestMatch) return null;

    return {
      originalColor: targetColor,
      matchedYarn: bestMatch.yarn,
      matchedColor: bestMatch.color,
      accuracy: bestAccuracy,
      alternatives: alternatives.slice(0, 3)
    };
  };

  const calculateColorSimilarity = (color1: string, color2: string): number => {
    // Convert hex to RGB
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    // Calculate Euclidean distance
    const distance = Math.sqrt(
      Math.pow(r2 - r1, 2) + 
      Math.pow(g2 - g1, 2) + 
      Math.pow(b2 - b1, 2)
    );
    
    // Convert to similarity score (0-1)
    return Math.max(0, 1 - (distance / (255 * Math.sqrt(3))));
  };

  const generateShoppingList = (matches: ColorMatch[]) => {
    const items: ShoppingListItem[] = matches.map(match => ({
      yarn: match.matchedYarn,
      color: match.matchedColor,
      quantity: 2, // Default quantity
      unit: 'skeins',
      price: match.matchedYarn.price * 2,
      inCart: false
    }));

    setShoppingList(items);
    setTotalCost(items.reduce((sum, item) => sum + item.price, 0));
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newList = [...shoppingList];
    newList[index].quantity = quantity;
    newList[index].price = newList[index].yarn.price * quantity;
    setShoppingList(newList);
    setTotalCost(newList.reduce((sum, item) => sum + item.price, 0));
  };

  const toggleCart = (index: number) => {
    const newList = [...shoppingList];
    newList[index].inCart = !newList[index].inCart;
    setShoppingList(newList);
  };

  const exportShoppingList = () => {
    const exportData = {
      pattern: pattern?.name,
      items: shoppingList.map(item => ({
        brand: item.yarn.brand,
        name: item.yarn.name,
        color: item.color.name,
        colorNumber: item.color.number,
        quantity: item.quantity,
        price: item.price,
        store: item.yarn.store,
        url: item.yarn.url
      })),
      totalCost,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list-${pattern?.name || 'pattern'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Shopping List Exported",
      description: "Your shopping list has been saved",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[95vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-semibold">AI Yarn Matching Engine</h2>
              <p className="text-sm text-gray-600">
                Smart color matching and shopping list generation for {pattern?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button onClick={exportShoppingList} disabled={shoppingList.length === 0}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Export List
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="matching" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="matching">Color Matching</TabsTrigger>
              <TabsTrigger value="shopping">Shopping List</TabsTrigger>
              <TabsTrigger value="substitutes">Substitutes</TabsTrigger>
            </TabsList>

            <TabsContent value="matching" className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Filters */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Max Price per Skein</Label>
                        <Input
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Yarn Weight</Label>
                        <Select value={filters.yarnWeight} onValueChange={(value) => setFilters(prev => ({ ...prev, yarnWeight: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Any weight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any weight</SelectItem>
                            {yarnWeights.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Availability</Label>
                        <Select value={filters.availability} onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="in-stock">In Stock</SelectItem>
                            <SelectItem value="limited">Limited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={matchColorsToYarns} className="w-full" disabled={isMatching}>
                        {isMatching ? 'Matching...' : 'Re-match Colors'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Color Matches */}
                <div className="lg:col-span-2 space-y-4">
                  {isMatching ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Matching colors to yarn database...</p>
                    </div>
                  ) : (
                    colorMatches.map((match, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="flex space-x-2">
                              <div 
                                className="w-12 h-12 rounded border-2 border-gray-300"
                                style={{ backgroundColor: match.originalColor }}
                              />
                              <div 
                                className="w-12 h-12 rounded border-2 border-gray-300"
                                style={{ backgroundColor: match.matchedColor.hex }}
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">
                                  {match.matchedYarn.brand} {match.matchedYarn.name}
                                </h3>
                                <Badge variant={match.accuracy > 0.9 ? 'default' : match.accuracy > 0.7 ? 'secondary' : 'outline'}>
                                  {Math.round(match.accuracy * 100)}% match
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600">
                                {match.matchedColor.name} #{match.matchedColor.number}
                              </p>
                              
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>{match.matchedYarn.weight}</span>
                                <span>{match.matchedYarn.fiber}</span>
                                <span>${match.matchedYarn.price}</span>
                                <div className="flex items-center">
                                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  {match.matchedYarn.rating}
                                </div>
                              </div>

                              {match.alternatives.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-500 mb-2">Alternatives:</p>
                                  <div className="flex space-x-2">
                                    {match.alternatives.slice(0, 2).map((alt, altIndex) => (
                                      <div key={altIndex} className="text-xs bg-gray-50 rounded p-2">
                                        {alt.yarn.brand} ({Math.round(alt.accuracy * 100)}%)
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shopping" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Shopping List</h3>
                  <div className="text-lg font-bold text-green-600">
                    Total: ${totalCost.toFixed(2)}
                  </div>
                </div>

                {shoppingList.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-8 h-8 rounded border-2 border-gray-300"
                            style={{ backgroundColor: item.color.hex }}
                          />
                          <div>
                            <h4 className="font-medium">
                              {item.yarn.brand} {item.yarn.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {item.color.name} #{item.color.number}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm">Qty:</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, Number(e.target.value))}
                              className="w-20"
                              min="1"
                            />
                          </div>
                          
                          <div className="text-sm font-medium">
                            ${item.price.toFixed(2)}
                          </div>

                          <Button
                            size="sm"
                            variant={item.inCart ? 'default' : 'outline'}
                            onClick={() => toggleCart(index)}
                          >
                            {item.inCart ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="substitutes" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Yarn Substitution Recommendations</h3>
                
                {colorMatches.map((match, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {match.matchedYarn.brand} {match.matchedYarn.name} Substitutes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {match.matchedYarn.substitutes.map(subId => {
                          const substitute = yarnDatabase.find(y => y.id === subId);
                          if (!substitute) return null;
                          
                          return (
                            <div key={subId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div>
                                <h4 className="font-medium">{substitute.brand} {substitute.name}</h4>
                                <p className="text-sm text-gray-600">{substitute.weight} • {substitute.fiber}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${substitute.price}</p>
                                <div className="flex items-center text-sm">
                                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  {substitute.rating}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}