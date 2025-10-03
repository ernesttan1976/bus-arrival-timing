import { useState, useEffect } from "react";
import BusStop from "@/components/BusStop";
import SearchBar from "@/components/SearchBar";
import RefreshButton from "@/components/RefreshButton";
import { showSuccess, showError } from "@/utils/toast";

interface BusArrival {
  busNumber: string;
  destination: string;
  arrivalTime: number;
  crowdLevel: 'low' | 'medium' | 'high';
}

interface BusStopData {
  stopName: string;
  stopCode: string;
  arrivals: BusArrival[];
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [busStops, setBusStops] = useState<BusStopData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for demonstration
  const mockBusStops: BusStopData[] = [
    {
      stopName: "Orchard Road",
      stopCode: "01012",
      arrivals: [
        { busNumber: "14", destination: "Bedok", arrivalTime: 2, crowdLevel: 'medium' },
        { busNumber: "111", destination: "Ghim Moh", arrivalTime: 5, crowdLevel: 'low' },
        { busNumber: "123", destination: "Ang Mo Kio", arrivalTime: 8, crowdLevel: 'high' },
      ]
    },
    {
      stopName: "Marina Bay Sands",
      stopCode: "02013",
      arrivals: [
        { busNumber: "97", destination: "Jurong East", arrivalTime: 0, crowdLevel: 'high' },
        { busNumber: "133", destination: "Toa Payoh", arrivalTime: 12, crowdLevel: 'low' },
      ]
    },
    {
      stopName: "Raffles Place",
      stopCode: "03014",
      arrivals: [
        { busNumber: "75", destination: "Yishun", arrivalTime: 3, crowdLevel: 'medium' },
        { busNumber: "196", destination: "Clementi", arrivalTime: 7, crowdLevel: 'low' },
        { busNumber: "61", destination: "Eunos", arrivalTime: 15, crowdLevel: 'medium' },
      ]
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setBusStops(mockBusStops);
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setBusStops(mockBusStops);
      return;
    }

    const filtered = mockBusStops.filter(stop => 
      stop.stopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stop.stopCode.includes(searchQuery)
    );

    if (filtered.length === 0) {
      showError("No bus stops found matching your search");
    } else {
      showSuccess(`Found ${filtered.length} bus stop(s)`);
    }

    setBusStops(filtered);
  };

  const handleRefresh = async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update arrival times (simulate real-time updates)
    const updatedStops = busStops.map(stop => ({
      ...stop,
      arrivals: stop.arrivals.map(arrival => ({
        ...arrival,
        arrivalTime: Math.max(0, arrival.arrivalTime - Math.floor(Math.random() * 2))
      }))
    }));

    setBusStops(updatedStops);
    setLastUpdated(new Date());
    showSuccess("Bus timings updated");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bus Arrival Timing</h1>
          <p className="text-gray-600">Real-time bus arrival information</p>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search bus stop name or code..."
        />

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <RefreshButton onRefresh={handleRefresh} />
        </div>

        <div className="space-y-4">
          {busStops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No bus stops to display</p>
              <p className="text-gray-400 text-sm mt-2">Try searching for a bus stop</p>
            </div>
          ) : (
            busStops.map((stop, index) => (
              <BusStop
                key={index}
                stopName={stop.stopName}
                stopCode={stop.stopCode}
                arrivals={stop.arrivals}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;