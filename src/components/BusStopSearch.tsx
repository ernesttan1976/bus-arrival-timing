import { useState } from 'react';
import { Search, MapPin, Star, StarOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLTAData } from '@/hooks/useLTAData';

interface BusStopInfo {
  stopCode: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
}

interface BusStopSearchProps {
  onSelectStop: (stop: BusStopInfo) => void;
}

const BusStopSearch = ({ onSelectStop }: BusStopSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BusStopInfo[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { loading, searchBusStops } = useLTAData();

  // Load favorites from localStorage
  useState(() => {
    const savedFavorites = localStorage.getItem('favoriteBusStops');
    if (savedFavorites) {
      const favStops = JSON.parse(savedFavorites);
      setFavorites(favStops.map((stop: BusStopInfo) => stop.stopCode));
    }
  });

  const handleSearch = async () => {
    setHasSearched(true);
    
    const results = await searchBusStops(searchQuery);
    console.log(`Search results for "${searchQuery}":`, results.length, 'stops');
    
    // Show more results - up to 50 instead of 10
    setSearchResults(results.slice(0, 50));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleFavorite = (stop: BusStopInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const savedFavorites = localStorage.getItem('favoriteBusStops');
    let favStops: BusStopInfo[] = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    const isFavorite = favStops.some(fav => fav.stopCode === stop.stopCode);
    
    if (isFavorite) {
      favStops = favStops.filter(fav => fav.stopCode !== stop.stopCode);
      setFavorites(prev => prev.filter(code => code !== stop.stopCode));
    } else {
      favStops.push(stop);
      setFavorites(prev => [...prev, stop.stopCode]);
    }
    
    localStorage.setItem('favoriteBusStops', JSON.stringify(favStops));
  };

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search bus stop name, road, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} className="px-6">
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {hasSearched && (
        <div className="mb-2">
          <p className="text-sm text-gray-600">
            {loading ? 'Searching...' : `Found ${searchResults.length} bus stops`}
            {searchQuery.trim() && ` for "${searchQuery}"`}
          </p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg">
          {searchResults.map((stop) => (
            <Card 
              key={stop.stopCode} 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-0 shadow-none"
              onClick={() => onSelectStop(stop)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stop.stopName}</p>
                    <p className="text-xs text-gray-500">{stop.roadName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleFavorite(stop, e)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {favorites.includes(stop.stopCode) ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      {stop.stopCode}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasSearched && searchResults.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>No bus stops found</p>
          <p className="text-sm mt-1">Try a different search term or check your spelling</p>
        </div>
      )}
    </div>
  );
};

export default BusStopSearch;