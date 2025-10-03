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

// Popular bus stops in different areas of Singapore for nearby search
const popularBusStops: BusStopInfo[] = [
  // Orchard Area
  { stopCode: '09037', stopName: 'Orchard Rd', roadName: 'Orchard Road', latitude: 1.3048, longitude: 103.8318 },
  { stopCode: '09047', stopName: 'Orchard Plaza', roadName: 'Orchard Road', latitude: 1.3058, longitude: 103.8308 },
  
  // CBD Area
  { stopCode: '02049', stopName: 'Raffles Place MRT', roadName: 'Raffles Quay', latitude: 1.2837, longitude: 103.8516 },
  { stopCode: '02059', stopName: 'Marina Bay Sands', roadName: 'Bayfront Avenue', latitude: 1.2834, longitude: 103.8607 },
  
  // Bugis Area
  { stopCode: '01012', stopName: 'Bugis Junction', roadName: 'Victoria Street', latitude: 1.2993, longitude: 103.8547 },
  { stopCode: '01022', stopName: 'Bugis MRT', roadName: 'North Bridge Road', latitude: 1.2998, longitude: 103.8556 },
  
  // Clarke Quay Area
  { stopCode: '03111', stopName: 'Clarke Quay MRT', roadName: 'North Bridge Road', latitude: 1.2886, longitude: 103.8467 },
  
  // Chinatown Area
  { stopCode: '04168', stopName: 'Chinatown MRT', roadName: 'New Bridge Road', latitude: 1.2845, longitude: 103.8441 },
  
  // Little India Area
  { stopCode: '48009', stopName: 'Little India MRT', roadName: 'Serangoon Road', latitude: 1.3067, longitude: 103.8493 },
  
  // Tanjong Pagar Area
  { stopCode: '04211', stopName: 'Tanjong Pagar MRT', roadName: 'Tanjong Pagar Road', latitude: 1.2765, longitude: 103.8459 },
  
  // Dhoby Ghaut Area
  { stopCode: '08031', stopName: 'Dhoby Ghaut MRT', roadName: 'Orchard Road', latitude: 1.2988, longitude: 103.8456 },
  
  // Somerset Area
  { stopCode: '09023', stopName: 'Somerset MRT', roadName: 'Orchard Road', latitude: 1.3007, longitude: 103.8390 },
];

const NearbyStops = ({ onSelectStop }: NearbyStopsProps) => {
  const [nearbyStops, setNearbyStops] = useState<BusStopInfo[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const { loading } = useLTAData();

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

        // Calculate distances to popular stops and filter nearby ones (within 3km)
        const stopsWithDistance = popularBusStops.map(stop => ({
          ...stop,
          distance: calculateDistance(latitude, longitude, stop.latitude, stop.longitude)
        })).filter(stop => stop.distance! <= 3);

        // Sort by distance and take top 8
        const sortedStops = stopsWithDistance
          .sort((a, b) => a.distance! - b.distance!)
          .slice(0, 8);

        setNearbyStops(sortedStops);
        setLoadingLocation(false);
        
        if (sortedStops.length > 0) {
          showSuccess(`Found ${sortedStops.length} nearby popular bus stops`);
        } else {
          showError('No popular bus stops found within 3km. Try searching for specific stops.');
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
            Nearby Popular Stops
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
          <p className="text-xs text-gray-500 mt-2 text-center">
            Showing popular stops within 3km. Use search for more specific locations.
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default NearbyStops;