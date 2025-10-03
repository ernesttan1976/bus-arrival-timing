import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface BusService {
  busNumber: string;
  operator: string;
  nextBus: {
    arrivalTime: number | null;
    load: string;
    feature: string;
    featureDescription: string;
    type: string;
    typeDescription: string;
    isDecker: 'single' | 'double' | 'unknown';
    licensePlate: string | null;
    model: string | null;
  };
  nextBus2: {
    arrivalTime: number | null;
    load: string;
    feature: string;
    featureDescription: string;
    type: string;
    typeDescription: string;
    isDecker: 'single' | 'double' | 'unknown';
    licensePlate: string | null;
    model: string | null;
  };
  nextBus3: {
    arrivalTime: number | null;
    load: string;
    feature: string;
    featureDescription: string;
    type: string;
    typeDescription: string;
    isDecker: 'single' | 'double' | 'unknown';
    licensePlate: string | null;
    model: string | null;
  };
}

interface BusArrivalData {
  stopCode: string;
  services: BusService[];
}

interface BusStopInfo {
  stopCode: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

// Enhanced mock data for testing
const mockBusStops: BusStopInfo[] = [
  // Orchard Road stops
  { stopCode: '09037', stopName: 'Orchard Rd', roadName: 'Orchard Road', latitude: 1.304833, longitude: 103.831833 },
  { stopCode: '09047', stopName: 'Orchard Plaza', roadName: 'Orchard Road', latitude: 1.305833, longitude: 103.830833 },
  { stopCode: '09023', stopName: 'Somerset MRT', roadName: 'Orchard Road', latitude: 1.300694, longitude: 103.839028 },
  
  // Marina Bay stops
  { stopCode: '02059', stopName: 'Marina Bay Sands', roadName: 'Bayfront Avenue', latitude: 1.283417, longitude: 103.860694 },
  { stopCode: '02049', stopName: 'Raffles Place MRT', roadName: 'Raffles Quay', latitude: 1.283694, longitude: 103.851556 },
  
  // Bugis stops
  { stopCode: '01012', stopName: 'Bugis Junction', roadName: 'Victoria Street', latitude: 1.299306, longitude: 103.854694 },
  { stopCode: '01022', stopName: 'Bugis MRT', roadName: 'North Bridge Road', latitude: 1.299833, longitude: 103.855556 },
  
  // Clarke Quay stops
  { stopCode: '03111', stopName: 'Clarke Quay MRT', roadName: 'North Bridge Road', latitude: 1.288611, longitude: 103.846722 },
  
  // Chinatown stops
  { stopCode: '04168', stopName: 'Chinatown MRT', roadName: 'New Bridge Road', latitude: 1.284528, longitude: 103.844139 },
  
  // Little India stops
  { stopCode: '48009', stopName: 'Little India MRT', roadName: 'Serangoon Road', latitude: 1.306722, longitude: 103.849306 },
  
  // Additional stops for better search results
  { stopCode: '28009', stopName: 'Ang Mo Kio Hub', roadName: 'Ang Mo Kio Avenue 3', latitude: 1.369028, longitude: 103.848472 },
  { stopCode: '59009', stopName: 'Jurong East MRT', roadName: 'Jurong East Street 13', latitude: 1.333194, longitude: 103.742472 },
  { stopCode: '65009', stopName: 'Tampines MRT', roadName: 'Tampines Central 1', latitude: 1.354028, longitude: 103.942694 },
];

const mockBusServices: { [key: string]: BusService[] } = {
  '01012': [
    {
      busNumber: '14',
      operator: 'SBST',
      nextBus: { 
        arrivalTime: 2, 
        load: 'SEA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'DD', 
        typeDescription: 'Double Decker',
        isDecker: 'double',
        licensePlate: null,
        model: null
      },
      nextBus2: { 
        arrivalTime: 12, 
        load: 'SDA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'SD', 
        typeDescription: 'Single Decker',
        isDecker: 'single',
        licensePlate: null,
        model: null
      },
      nextBus3: { 
        arrivalTime: 22, 
        load: 'SEA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'DD', 
        typeDescription: 'Double Decker',
        isDecker: 'double',
        licensePlate: null,
        model: null
      }
    },
    {
      busNumber: '111',
      operator: 'SBST',
      nextBus: { 
        arrivalTime: 5, 
        load: 'SEA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'BD', 
        typeDescription: 'Bendy Bus',
        isDecker: 'single',
        licensePlate: null,
        model: null
      },
      nextBus2: { 
        arrivalTime: 15, 
        load: 'LSD', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'SD', 
        typeDescription: 'Single Decker',
        isDecker: 'single',
        licensePlate: null,
        model: null
      },
      nextBus3: { 
        arrivalTime: 25, 
        load: 'SDA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'DD', 
        typeDescription: 'Double Decker',
        isDecker: 'double',
        licensePlate: null,
        model: null
      }
    }
  ],
  '02059': [
    {
      busNumber: '97',
      operator: 'SBST',
      nextBus: { 
        arrivalTime: 0, 
        load: 'LSD', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'SD', 
        typeDescription: 'Single Decker',
        isDecker: 'single',
        licensePlate: null,
        model: null
      },
      nextBus2: { 
        arrivalTime: 10, 
        load: 'SEA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'DD', 
        typeDescription: 'Double Decker',
        isDecker: 'double',
        licensePlate: null,
        model: null
      },
      nextBus3: { 
        arrivalTime: 20, 
        load: 'SDA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'SD', 
        typeDescription: 'Single Decker',
        isDecker: 'single',
        licensePlate: null,
        model: null
      }
    }
  ],
  '03111': [
    {
      busNumber: '2',
      operator: 'SBST',
      nextBus: { 
        arrivalTime: 3, 
        load: 'SEA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'DD', 
        typeDescription: 'Double Decker',
        isDecker: 'double',
        licensePlate: null,
        model: null
      },
      nextBus2: { 
        arrivalTime: 13, 
        load: 'SDA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'SD', 
        typeDescription: 'Single Decker',
        isDecker: 'single',
        licensePlate: null,
        model: null
      },
      nextBus3: { 
        arrivalTime: 23, 
        load: 'SEA', 
        feature: 'WAB', 
        featureDescription: 'Wheelchair Accessible',
        type: 'BD', 
        typeDescription: 'Bendy Bus',
        isDecker: 'single',
        licensePlate: null,
        model: null
      }
    }
  ]
};

// Helper function to calculate distance
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

export const useLTAData = (useMockData: boolean = false) => {
  const [loading, setLoading] = useState(false);

  const getBusArrival = async (busStopCode: string): Promise<BusArrivalData | null> => {
    setLoading(true);
    
    try {
      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const services = mockBusServices[busStopCode] || [];
        return {
          stopCode: busStopCode,
          services
        };
      }

      const { data, error } = await supabase.functions.invoke('lta-bus-arrival', {
        body: { busStopCode }
      });

      if (error) {
        console.error('Bus arrival error:', error);
        showError('Failed to fetch bus arrival data');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Bus arrival network error:', error);
      showError('Network error while fetching bus data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchBusStops = async (
    searchQuery: string, 
    userLocation?: { lat: number, lng: number }, 
    maxDistance?: number
  ): Promise<BusStopInfo[]> => {
    setLoading(true);
    
    try {
      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        let filtered = mockBusStops;
        
        // Apply text search
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = mockBusStops.filter(stop => 
            stop.stopName.toLowerCase().includes(query) ||
            stop.stopCode.toLowerCase().includes(query) ||
            stop.roadName.toLowerCase().includes(query)
          );
        }
        
        // Apply location filter
        if (userLocation && maxDistance) {
          const stopsWithDistance = filtered.map(stop => ({
            ...stop,
            distance: calculateDistance(userLocation.lat, userLocation.lng, stop.latitude, stop.longitude)
          }));
          
          filtered = stopsWithDistance
            .filter(stop => stop.distance! <= maxDistance)
            .sort((a, b) => a.distance! - b.distance!);
        }
        
        console.log(`Mock data: Found ${filtered.length} stops`);
        return filtered;
      }

      console.log(`🔍 Searching LTA API:`, {
        searchQuery,
        userLocation,
        maxDistance
      });
      
      const requestBody: any = { 
        searchQuery, 
        skip: 0 
      };
      
      // Add location parameters if provided
      if (userLocation) {
        requestBody.userLat = userLocation.lat;
        requestBody.userLng = userLocation.lng;
        requestBody.maxDistance = maxDistance || 2;
      }
      
      const { data, error } = await supabase.functions.invoke('lta-bus-stops', {
        body: requestBody
      });

      if (error) {
        console.error('Bus stops search error:', error);
        showError('Failed to search bus stops');
        return [];
      }

      if (data?.error) {
        console.error('LTA API error:', data.error);
        showError(`LTA API error: ${data.error}`);
        return [];
      }

      const busStops = data.busStops || [];
      console.log(`✅ LTA API returned ${busStops.length} bus stops`);
      
      return busStops;
    } catch (error) {
      console.error('Bus stops search network error:', error);
      showError('Network error while searching bus stops');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getCrowdLevel = (load: string): 'low' | 'medium' | 'high' => {
    switch (load) {
      case 'SEA': return 'low';
      case 'SDA': return 'medium';
      case 'LSD': return 'high';
      default: return 'low';
    }
  };

  return {
    loading,
    getBusArrival,
    searchBusStops,
    getCrowdLevel
  };
};