import { Clock, MapPin, Accessibility } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BusArrival {
  busNumber: string;
  destination: string;
  arrivalTime: number; // minutes
  crowdLevel: 'low' | 'medium' | 'high';
  busType: string;
  isDecker: 'single' | 'double' | 'unknown';
  isWheelchairAccessible: boolean;
}

interface BusStopProps {
  stopName: string;
  stopCode: string;
  arrivals: BusArrival[];
}

const BusStop = ({ stopName, stopCode, arrivals }: BusStopProps) => {
  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBusTypeColor = (isDecker: string) => {
    switch (isDecker) {
      case 'double': return 'bg-purple-100 text-purple-800';
      case 'single': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBusTypeIcon = (isDecker: string) => {
    switch (isDecker) {
      case 'double': return '🚌🚌'; // Double decker representation
      case 'single': return '🚌';
      default: return '🚐';
    }
  };

  const formatArrivalTime = (minutes: number) => {
    if (minutes === 0) return 'Arriving';
    if (minutes === 1) return '1 min';
    return `${minutes} mins`;
  };

  // Group arrivals by bus number to show them together
  const groupedArrivals = arrivals.reduce((groups, arrival) => {
    if (!groups[arrival.busNumber]) {
      groups[arrival.busNumber] = [];
    }
    groups[arrival.busNumber].push(arrival);
    return groups;
  }, {} as Record<string, BusArrival[]>);

  // Sort bus numbers numerically/alphabetically
  const sortedBusNumbers = Object.keys(groupedArrivals).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    return a.localeCompare(b);
  });

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{stopName}</CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            {stopCode}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {arrivals.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No buses arriving soon</p>
        ) : (
          <div className="space-y-4">
            {sortedBusNumbers.map((busNumber) => {
              const busArrivals = groupedArrivals[busNumber];
              return (
                <div key={busNumber} className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded font-semibold text-lg">
                      {busNumber}
                    </div>
                    <span className="text-sm text-gray-600">Next {busArrivals.length} buses</span>
                  </div>
                  
                  <div className="space-y-2">
                    {busArrivals.map((arrival, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-xs ${getCrowdColor(arrival.crowdLevel)}`}>
                            {arrival.crowdLevel} crowd
                          </Badge>
                          <Badge className={`text-xs ${getBusTypeColor(arrival.isDecker)}`}>
                            {getBusTypeIcon(arrival.isDecker)} {arrival.busType}
                          </Badge>
                          {arrival.isWheelchairAccessible && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              <Accessibility className="w-3 h-3 mr-1" />
                              Accessible
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-right">
                          <Clock className="w-4 h-4 mr-1 text-gray-500" />
                          <span className="font-semibold text-lg">
                            {formatArrivalTime(arrival.arrivalTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusStop;