import { useState } from "react";
import { Link } from "wouter";
import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Plus, 
  Grid, 
  List, 
  Heart, 
  Clock,
  ArrowLeft,
  Filter
} from "lucide-react";

export default function PatternLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "favorites" | "recent">("all");

  // Fetch patterns
  const { data: patternsData, isLoading } = useQuery({
    queryKey: ["/api/patterns"],
  });

  const patterns = patternsData?.patterns || [];

  // Filter patterns
  const filteredPatterns = patterns.filter((pattern: Pattern) => {
    const matchesSearch = pattern.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pattern.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterType === "favorites") {
      const favorites = JSON.parse(localStorage.getItem('crochet-favorites') || '[]');
      return favorites.includes(pattern.id);
    }
    
    if (filterType === "recent") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(pattern.createdAt) > oneWeekAgo;
    }

    return true;
  });

  const PatternCard = ({ pattern }: { pattern: Pattern }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <Link href={`/pattern/${pattern.id}`}>
        <CardContent className="p-4">
          <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
            {pattern.imageUrl ? (
              <img
                src={pattern.imageUrl}
                alt={pattern.name || 'Pattern'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Grid className="w-8 h-8" />
              </div>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 truncate mb-1">
            {pattern.name || 'Untitled Pattern'}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {pattern.difficulty} • {pattern.estimatedTime || 'N/A'}
          </p>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{pattern.stitchCount?.toLocaleString()} stitches</span>
            <span>{new Date(pattern.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );

  const PatternListItem = ({ pattern }: { pattern: Pattern }) => (
    <Card className="hover:shadow-md transition-shadow">
      <Link href={`/pattern/${pattern.id}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {pattern.imageUrl ? (
                <img
                  src={pattern.imageUrl}
                  alt={pattern.name || 'Pattern'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Grid className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {pattern.name || 'Untitled Pattern'}
              </h3>
              <p className="text-sm text-gray-600">
                {pattern.difficulty} • {pattern.estimatedTime || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pattern.stitchCount?.toLocaleString()} stitches • Created {new Date(pattern.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Pattern Library</h1>
            <Link href="/">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search patterns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Filter Buttons */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={filterType === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  variant={filterType === "recent" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterType("recent")}
                  className="text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Recent
                </Button>
                <Button
                  variant={filterType === "favorites" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterType("favorites")}
                  className="text-xs"
                >
                  <Heart className="w-3 h-3 mr-1" />
                  Favorites
                </Button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="p-2"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="p-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {filteredPatterns.length === 0 ? (
          <div className="text-center py-12">
            <Grid className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterType !== "all" ? "No patterns found" : "No patterns yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your search or filters"
                : "Create your first crochet pattern to get started"
              }
            </p>
            <Link href="/">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Pattern
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {filteredPatterns.length} pattern{filteredPatterns.length !== 1 ? 's' : ''} found
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredPatterns.map((pattern: Pattern) => (
                  <PatternCard key={pattern.id} pattern={pattern} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatterns.map((pattern: Pattern) => (
                  <PatternListItem key={pattern.id} pattern={pattern} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}