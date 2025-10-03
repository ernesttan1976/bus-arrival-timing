import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLTAData } from '@/hooks/useLTAData';
import { showError, showSuccess } from '@/utils/toast';

interface BusStopInfo {
  stopCode: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface NearbyStopsProps {
  onSelectStop: (stop: BusStopInfo) => void;
}

const NearbyStops = ({ onSelectStop }: NearbyStopsProps) => {
  const [nearbyStops, setNearbyStops] = useState<BusStopInfo[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const { loading, searchBusStops } = useLTAData();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findNearbyStops = async () => {
    setLoadingLocation(true);
    
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by this browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Get all bus stops (we'll filter by distance)
        const allStops = await searchBusStops('');
        
        // Calculate distances and filter nearby stops (within 1km)
        const stopsWithDistance = allStops.map(stop => ({
          ...stop,
          distance: calculateDistance(latitude, longitude, stop.latitude, stop.longitude)
        })).filter(stop => stop.distance! <= 1);

        // Sort by distance and take top 10
        const sortedStops = stopsWithDistance
          .sort((a, b) => a.distance! - b.distance!)
          .slice(0, 10);

        setNearbyStops(sortedStops);
        setLoadingLocation(false);
        
        if (sortedStops.length > 0) {
          showSuccess(`Found ${sortedStops.length} nearby bus stops`);
        } else {
          showError('No bus stops found within 1km');
        }
      },
      (error) => {
        setLoadingLocation(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            showError('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            showError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            showError('Location request timed out.');
            break;
          default:
            showError('An unknown error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            Nearby Stops
          </CardTitle>
          <Button 
            onClick={findNearbyStops} 
            disabled={loadingLocation || loading}
            size="sm"
            variant="outline"
          >
            {loadingLocation ? 'Finding...' : 'Find Nearby'}
          </Button>
        </div>
      </CardHeader>
      {nearbyStops.length > 0 && (
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {nearbyStops.map((stop) => (
              <div 
                key={stop.stopCode}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSelectStop(stop)}
              >
                <div>
                  <p className="font-medium text-sm">{stop.stopName}</p>
                  <p className="text-xs text-gray-500">{stop.stopCode} • {stop.roadName}</p>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="w-3 h-3 mr-1" />
                  {stop.distance?.toFixed(2)}km
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default NearbyStops;