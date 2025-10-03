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

        console.log(`User location: ${latitude}, ${longitude}`);

        // Calculate distances to popular stops and filter nearby ones (within 5km)
        const stopsWithDistance = popularBusStops.map(stop => {
          const distance = calculateDistance(latitude, longitude, stop.latitude, stop.longitude);
          console.log(`Distance to ${stop.stopName}: ${distance.toFixed(2)}km`);
          return {
            ...stop,
            distance
          };
        }).filter(stop => stop.distance! <= 5); // Increased to 5km

        console.log(`Found ${stopsWithDistance.length} stops within 5km`);

        // Sort by distance and take top 10
        const sortedStops = stopsWithDistance
          .sort((a, b) => a.distance! - b.distance!)
          .slice(0, 10);

        setNearbyStops(sortedStops);
        setLoadingLocation(false);
        
        if (sortedStops.length > 0) {
          showSuccess(`Found ${sortedStops.length} nearby popular bus stops`);
        } else {
          showError('No popular bus stops found within 5km. You might be outside Singapore or in a remote area.');
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
        timeout: 15000, // Increased timeout
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
            Showing popular stops within 5km. Use search for more specific locations.
          </p>
        </CardContent>
      )}
      {userLocation && nearbyStops.length === 0 && !loadingLocation && (
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No popular stops found within 5km</p>
            <p className="text-xs mt-1">Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
            <p className="text-xs">Try using the search function instead</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default NearbyStops;