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

const NearbyStops = ({ onSelectStop }: NearbyStopsProps) => {
  const [nearbyStops, setNearbyStops] = useState<BusStopInfo[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<number>(1);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { loading, searchBusStops } = useLTAData();

  const findNearbyStops = async () => {
    setLoadingLocation(true);
    setDebugInfo('🔍 Starting location search...');
    
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
          setDebugInfo(prev => prev + `\n🚀 Calling LTA API with location filter (${selectedDistance}km)...`);
          
          // Call the edge function with location parameters
          const stops = await searchBusStops('', { lat: latitude, lng: longitude }, selectedDistance);
          
          console.log(`📊 Server returned ${stops.length} nearby stops`);
          setDebugInfo(prev => prev + `\n✅ Server returned ${stops.length} stops within ${selectedDistance}km`);
          
          if (stops.length > 0) {
            const closest = stops[0];
            setDebugInfo(prev => prev + `\n🎯 Closest: ${closest.stopName} (${closest.distance?.toFixed(2)}km)`);
          }
          
          setNearbyStops(stops);
          setLoadingLocation(false);
          
          if (stops.length > 0) {
            showSuccess(`Found ${stops.length} bus stops within ${selectedDistance}km`);
          } else {
            showError(`No bus stops found within ${selectedDistance}km. Try increasing the distance.`);
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

  // Re-fetch when distance changes
  const handleDistanceChange = async (newDistance: number) => {
    setSelectedDistance(newDistance);
    
    if (userLocation) {
      setDebugInfo(prev => prev + `\n🔄 Updating search radius to ${newDistance}km...`);
      
      try {
        const stops = await searchBusStops('', userLocation, newDistance);
        setNearbyStops(stops);
        setDebugInfo(prev => prev + `\n✅ Found ${stops.length} stops within ${newDistance}km`);
      } catch (error) {
        console.error('Error updating distance:', error);
        setDebugInfo(prev => prev + `\n❌ Error updating distance: ${error.message}`);
      }
    }
  };

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
      
      {userLocation && (
        <CardContent>
          {/* Distance filter buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={selectedDistance === 0.5 ? "default" : "outline"}
              onClick={() => handleDistanceChange(0.5)}
              disabled={loading}
            >
              500m
            </Button>
            <Button
              size="sm"
              variant={selectedDistance === 1 ? "default" : "outline"}
              onClick={() => handleDistanceChange(1)}
              disabled={loading}
            >
              1km
            </Button>
            <Button
              size="sm"
              variant={selectedDistance === 2 ? "default" : "outline"}
              onClick={() => handleDistanceChange(2)}
              disabled={loading}
            >
              2km
            </Button>
            <Button
              size="sm"
              variant={selectedDistance === 5 ? "default" : "outline"}
              onClick={() => handleDistanceChange(5)}
              disabled={loading}
            >
              5km
            </Button>
          </div>

          {/* Results */}
          {nearbyStops.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nearbyStops.map((stop) => (
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
                    {stop.distance && (
                      <Badge className={getDistanceColor(stop.distance)}>
                        {formatDistance(stop.distance)}
                      </Badge>
                    )}
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No stops found within {selectedDistance}km</p>
              <p className="text-xs mt-1">Try increasing the search distance</p>
            </div>
          )}
        </CardContent>
      )}
      
      {!userLocation && !loadingLocation && (
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Navigation className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Click "Find Nearby" to discover bus stops around you</p>
            <p className="text-xs mt-1">We'll use your location to find the closest stops</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default NearbyStops;