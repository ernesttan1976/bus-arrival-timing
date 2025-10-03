import { useState, useEffect } from 'react';
import { Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess } from '@/utils/toast';

interface BusStopInfo {
  stopCode: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
}

interface FavoriteStopsProps {
  onSelectStop: (stop: BusStopInfo) => void;
}

const FavoriteStops = ({ onSelectStop }: FavoriteStopsProps) => {
  const [favorites, setFavorites] = useState<BusStopInfo[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteBusStops');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const saveFavorites = (newFavorites: BusStopInfo[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('favoriteBusStops', JSON.stringify(newFavorites));
  };

  const addToFavorites = (stop: BusStopInfo) => {
    if (!favorites.find(fav => fav.stopCode === stop.stopCode)) {
      const newFavorites = [...favorites, stop];
      saveFavorites(newFavorites);
      showSuccess(`Added ${stop.stopName} to favorites`);
    }
  };

  const removeFromFavorites = (stopCode: string) => {
    const newFavorites = favorites.filter(fav => fav.stopCode !== stopCode);
    saveFavorites(newFavorites);
    showSuccess('Removed from favorites');
  };

  const isFavorite = (stopCode: string) => {
    return favorites.some(fav => fav.stopCode === stopCode);
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Favorite Stops
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {favorites.map((stop) => (
            <div key={stop.stopCode} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onSelectStop(stop)}
              >
                <p className="font-medium text-sm">{stop.stopName}</p>
                <p className="text-xs text-gray-500">{stop.stopCode} • {stop.roadName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromFavorites(stop.stopCode)}
                className="text-yellow-500 hover:text-yellow-600"
              >
                <StarOff className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { FavoriteStops };
export type { BusStopInfo };