import { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
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

// Expanded list with more Singapore bus stops for testing
const fallbackBusStops: BusStopInfo[] = [
  // Central Singapore - CBD/Marina Bay
  { stopCode: '02049', stopName: 'Raffles Place MRT', roadName: 'Raffles Quay', latitude: 1.283694, longitude: 103.851556 },
  { stopCode: '02059', stopName: 'Marina Bay Sands', roadName: 'Bayfront Avenue', latitude: 1.283417, longitude: 103.860694 },
  { stopCode: '02061', stopName: 'Marina Centre', roadName: 'Raffles Boulevard', latitude: 1.290556, longitude: 103.857778 },
  
  // Orchard Area
  { stopCode: '09037', stopName: 'Orchard Rd', roadName: 'Orchard Road', latitude: 1.304833, longitude: 103.831833 },
  { stopCode: '09047', stopName: 'Orchard Plaza', roadName: 'Orchard Road', latitude: 1.305833, longitude: 103.830833 },
  { stopCode: '09023', stopName: 'Somerset MRT', roadName: 'Orchard Road', latitude: 1.300694, longitude: 103.839028 },
  { stopCode: '08031', stopName: 'Dhoby Ghaut MRT', roadName: 'Orchard Road', latitude: 1.298833, longitude: 103.845611 },
  
  // Bugis/City Hall Area
  { stopCode: '01012', stopName: 'Bugis Junction', roadName: 'Victoria Street', latitude: 1.299306, longitude: 103.854694 },
  { stopCode: '01022', stopName: 'Bugis MRT', roadName: 'North Bridge Road', latitude: 1.299833, longitude: 103.855556 },
  { stopCode: '01112', stopName: 'City Hall MRT', roadName: 'North Bridge Road', latitude: 1.293194, longitude: 103.852222 },
  
  // Clarke Quay/Chinatown
  { stopCode: '03111', stopName: 'Clarke Quay MRT', roadName: 'North Bridge Road', latitude: 1.288611, longitude: 103.846722 },
  { stopCode: '04168', stopName: 'Chinatown MRT', roadName: 'New Bridge Road', latitude: 1.284528, longitude: 103.844139 },
  { stopCode: '04211', stopName: 'Tanjong Pagar MRT', roadName: 'Tanjong Pagar Road', latitude: 1.276528, longitude: 103.845889 },
  
  // Little India/Rochor
  { stopCode: '48009', stopName: 'Little India MRT', roadName: 'Serangoon Road', latitude: 1.306722, longitude: 103.849306 },
  { stopCode: '06049', stopName: 'Rochor MRT', roadName: 'Rochor Road', latitude: 1.303889, longitude: 103.852778 },
  
  // Outer areas for testing
  { stopCode: '28009', stopName: 'Ang Mo Kio Hub', roadName: 'Ang Mo Kio Avenue 3', latitude: 1.369028, longitude: 103.848472 },
  { stopCode: '59009', stopName: 'Jurong East MRT', roadName: 'Jurong East Street 13', latitude: 1.333194, longitude: 103.742472 },
  { stopCode: '65009', stopName: 'Tampines MRT', roadName: 'Tampines Central 1', latitude: 1.354028, longitude: 103.942694 },
  { stopCode: '75009', stopName: 'Woodlands MRT', roadName: 'Woodlands Avenue 3', latitude: 1.437222, longitude: 103.786111 },
];

const NearbyStops = ({ onSelectStop }: NearbyStopsProps) => {
  const [allNearbyStops, setAllNearbyStops] = useState<BusStopInfo[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<number>(0.5);
  const [debugInfo, setDebugInfo] = useState<string>('');
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
    setDebugInfo('Starting location search...');
    
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by this browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setDebugInfo(`📍 Location found: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

        console.log(`🌍 User location: ${latitude}, ${longitude}`);

        try {
          setDebugInfo(prev => prev + '\n🔍 Fetching bus stops from LTA API...');
          
          // Try to get ALL bus stops from LTA API
          const ltaStops = await searchBusStops('');
          console.log(`📊 LTA API returned ${ltaStops.length} stops`);
          
          let stopsToCheck: BusStopInfo[] = [];
          
          if (ltaStops.length > 0) {
            setDebugInfo(prev => prev + `\n✅ LTA API: ${ltaStops.length} stops received`);
            stopsToCheck = ltaStops;
          } else {
            setDebugInfo(prev => prev + '\n⚠️ LTA API returned 0 stops, using fallback data');
            stopsToCheck = fallbackBusStops;
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
            .filter(stop => stop.distance! <= 2)
            .sort((a, b) => a.distance! - b.distance!);

          console.log(`📍 Found ${nearbyStops.length} stops within 2km`);
          
          // Debug: Show closest 5 stops
          const closest5 = nearbyStops.slice(0, 5);
          console.log('🎯 Closest 5 stops:', closest5.map(s => `${s.stopName} (${s.distance?.toFixed(2)}km)`));
          
          setDebugInfo(prev => prev + `\n🎯 Found ${nearbyStops.length} stops within 2km`);
          if (closest5.length > 0) {
            setDebugInfo(prev => prev + `\n📏 Closest: ${closest5[0].stopName} (${closest5[0].distance?.toFixed(2)}km)`);
          }
          
          setAllNearbyStops(nearbyStops);
          setLoadingLocation(false);
          
          if (nearbyStops.length > 0) {
            showSuccess(`Found ${nearbyStops.length} bus stops within 2km`);
          } else {
            showError('No bus stops found within 2km. You might be outside Singapore.');
          }
        } catch (error) {
          console.error('❌ Error fetching nearby stops:', error);
          setDebugInfo(prev => prev + `\n❌ Error: ${error.message}`);
          setLoadingLocation(false);
          showError('Failed to fetch nearby stops');
        }
      },
      (error) => {
        setLoadingLocation(false);
        console.error('🚫 Geolocation error:', error);
        setDebugInfo(`❌ Location error: ${error.message}`);
        
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
      
      {/* Debug Info Panel */}
      {debugInfo && (
        <CardContent className="pt-0">
          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Debug Info:</span>
            </div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        </CardContent>
      )}
      
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