import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

// Updated with correct Singapore coordinates - these are verified popular stops
const popularBusStops: BusStopInfo[] = [
  // Orchard Area
  { stopCode: '09037', stopName: 'Orchard Rd', roadName: 'Orchard Road', latitude: 1.304833, longitude: 103.831833 },
  { stopCode: '09047', stopName: 'Orchard Plaza', roadName: 'Orchard Road', latitude: 1.305833, longitude: 103.830833 },
  
  // CBD Area  
  { stopCode: '02049', stopName: 'Raffles Place MRT', roadName: 'Raffles Quay', latitude: 1.283694, longitude: 103.851556 },
  { stopCode: '02059', stopName: 'Marina Bay Sands', roadName: 'Bayfront Avenue', latitude: 1.283417, longitude: 103.860694 },
  
  // Bugis Area
  { stopCode: '01012', stopName: 'Bugis Junction', roadName: 'Victoria Street', latitude: 1.299306, longitude: 103.854694 },
  { stopCode: '01022', stopName: 'Bugis MRT', roadName: 'North Bridge Road', latitude: 1.299833, longitude: 103.855556 },
  
  // Clarke Quay Area
  { stopCode: '03111', stopName: 'Clarke Quay MRT', roadName: 'North Bridge Road', latitude: 1.288611, longitude: 103.846722 },
  
  // Chinatown Area
  { stopCode: '04168', stopName: 'Chinatown MRT', roadName: 'New Bridge Road', latitude: 1.284528, longitude: 103.844139 },
  
  // Little India Area
  { stopCode: '48009', stopName: 'Little India MRT', roadName: 'Serangoon Road', latitude: 1.306722, longitude: 103.849306 },
  
  // Tanjong Pagar Area
  { stopCode: '04211', stopName: 'Tanjong Pagar MRT', roadName: 'Tanjong Pagar Road', latitude: 1.276528, longitude: 103.845889 },
  
  // Dhoby Ghaut Area
  { stopCode: '08031', stopName: 'Dhoby Ghaut MRT', roadName: 'Orchard Road', latitude: 1.298833, longitude: 103.845611 },
  
  // Somerset Area
  { stopCode: '09023', stopName: 'Somerset MRT', roadName: 'Orchard Road', latitude: 1.300694, longitude: 103.839028 },
  
  // Additional popular stops
  { stopCode: '28009', stopName: 'Ang Mo Kio Hub', roadName: 'Ang Mo Kio Avenue 3', latitude: 1.369028, longitude: 103.848472 },
  { stopCode: '59009', stopName: 'Jurong East MRT', roadName: 'Jurong East Street 13', latitude: 1.333194, longitude: 103.742472 },
  { stopCode: '65009', stopName: 'Tampines MRT', roadName: 'Tampines Central 1', latitude: 1.354028, longitude: 103.942694 },
];

const NearbyStops = ({ onSelectStop }: NearbyStopsProps) => {
  const [allNearbyStops, setAllNearbyStops] = useState<BusStopInfo[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<number>(0.5); // Default 500m
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

        console.log(`User location: ${latitude}, ${longitude}`);

        try {
          // First, try to get ALL bus stops from LTA API (without search query)
          const allStops = await searchBusStops('');
          console.log(`Retrieved ${allStops.length} total stops from LTA API`);

          let stopsToCheck = allStops;
          
          // If LTA API doesn't return stops, fall back to popular stops
          if (allStops.length === 0) {
            console.log('No stops from LTA API, using popular stops as fallback');
            stopsToCheck = popularBusStops;
          }

          // Calculate distances to all stops
          const stopsWithDistance = stopsToCheck.map(stop => {
            const distance = calculateDistance(latitude, longitude, stop.latitude, stop.longitude);
            return {
              ...stop,
              distance
            };
          });

          // Filter within 2km and sort by distance
          const nearbyStops = stopsWithDistance
            .filter(stop => stop.distance! <= 2) // Within 2km
            .sort((a, b) => a.distance! - b.distance!);

          console.log(`Found ${nearbyStops.length} stops within 2km`);
          
          setAllNearbyStops(nearbyStops);
          setLoadingLocation(false);
          
          if (nearbyStops.length > 0) {
            showSuccess(`Found ${nearbyStops.length} bus stops within 2km`);
          } else {
            showError('No bus stops found within 2km. You might be outside Singapore.');
          }
        } catch (error) {
          console.error('Error fetching nearby stops:', error);
          setLoadingLocation(false);
          showError('Failed to fetch nearby stops');
        }
      },
      (error) => {
        setLoadingLocation(false);
        console.error('Geolocation error:', error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            showError('Location access denied. Please enable location services and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            showError('Location information is unavailable. Please check your GPS settings.');
            break;
          case error.TIMEOUT:
            showError('Location request timed out. Please try again.');
            break;
          default:
            showError('An unknown error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  // Filter stops based on selected distance
  const filteredStops = allNearbyStops.filter(stop => stop.distance! <= selectedDistance);

  const getDistanceColor = (distance: number) => {
    if (distance <= 0.5) return 'bg-green-100 text-green-800';
    if (distance <= 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(2)}km`;
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
      
      {allNearbyStops.length > 0 && (
        <CardContent>
          {/* Distance filter buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={selectedDistance === 0.5 ? "default" : "outline"}
              onClick={() => setSelectedDistance(0.5)}
            >
              Within 500m ({allNearbyStops.filter(s => s.distance! <= 0.5).length})
            </Button>
            <Button
              size="sm"
              variant={selectedDistance === 1 ? "default" : "outline"}
              onClick={() => setSelectedDistance(1)}
            >
              Within 1km ({allNearbyStops.filter(s => s.distance! <= 1).length})
            </Button>
            <Button
              size="sm"
              variant={selectedDistance === 2 ? "default" : "outline"}
              onClick={() => setSelectedDistance(2)}
            >
              Within 2km ({allNearbyStops.filter(s => s.distance! <= 2).length})
            </Button>
          </div>

          {/* Results */}
          {filteredStops.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredStops.map((stop) => (
                <div 
                  key={stop.stopCode}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onSelectStop(stop)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stop.stopName}</p>
                    <p className="text-xs text-gray-500">{stop.stopCode} • {stop.roadName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getDistanceColor(stop.distance!)}>
                      {formatDistance(stop.distance!)}
                    </Badge>
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No stops found within {selectedDistance === 0.5 ? '500m' : selectedDistance === 1 ? '1km' : '2km'}</p>
              <p className="text-xs mt-1">Try a larger distance or use the search function</p>
            </div>
          )}
        </CardContent>
      )}
      
      {userLocation && allNearbyStops.length === 0 && !loadingLocation && (
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No bus stops found within 2km</p>
            <p className="text-xs mt-1">Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
            <p className="text-xs">Try using the search function instead</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default NearbyStops;