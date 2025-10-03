import { useState } from 'react';
import { Bug, ChevronDown, ChevronUp, ExternalLink, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [endpointResults, setEndpointResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testingEndpoints, setTestingEndpoints] = useState(false);

  const testConnections = async () => {
    setTesting(true);
    const results: any = {
      supabaseConnection: 'Unknown',
      ltaBusStops: 'Unknown',
      ltaBusArrival: 'Unknown',
      timestamp: new Date().toISOString(),
      details: {}
    };

    try {
      // Test Supabase connection with bus stops
      console.log('Testing LTA bus stops API...');
      const { data: busStopsData, error: busStopsError } = await supabase.functions.invoke('lta-bus-stops', {
        body: { searchQuery: '', skip: 0 }
      });
      
      results.supabaseConnection = 'Connected';
      
      if (busStopsError) {
        results.ltaBusStops = `Error: ${busStopsError.message}`;
        results.details.busStopsError = busStopsError;
      } else if (busStopsData?.error) {
        results.ltaBusStops = `API Error: ${busStopsData.error}`;
        if (busStopsData.details) {
          results.details.busStopsDetails = busStopsData.details;
        }
      } else if (busStopsData?.busStops) {
        results.ltaBusStops = `Success: ${busStopsData.busStops.length} stops returned`;
      } else {
        results.ltaBusStops = 'No data returned';
      }

      // Test LTA bus arrival API
      console.log('Testing LTA bus arrival API...');
      const { data: arrivalData, error: arrivalError } = await supabase.functions.invoke('lta-bus-arrival', {
        body: { busStopCode: '03111' }
      });
      
      if (arrivalError) {
        results.ltaBusArrival = `Error: ${arrivalError.message}`;
        results.details.arrivalError = arrivalError;
      } else if (arrivalData?.error) {
        results.ltaBusArrival = `API Error: ${arrivalData.error}`;
        if (arrivalData.details) {
          results.details.arrivalDetails = arrivalData.details;
        }
      } else if (arrivalData?.services) {
        results.ltaBusArrival = `Success: ${arrivalData.services.length} services returned`;
      } else {
        results.ltaBusArrival = 'No data returned';
      }

    } catch (error: any) {
      console.error('Connection test error:', error);
      results.supabaseConnection = `Error: ${error.message}`;
      results.details.connectionError = error;
    }

    setTestResults(results);
    setTesting(false);
  };

  const testEndpoints = async () => {
    setTestingEndpoints(true);
    try {
      const { data, error } = await supabase.functions.invoke('lta-test-endpoints');
      
      if (error) {
        setEndpointResults({ error: error.message });
      } else {
        setEndpointResults(data);
      }
    } catch (error: any) {
      setEndpointResults({ error: error.message });
    }
    setTestingEndpoints(false);
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Success') || status === 'Connected') return 'bg-green-100 text-green-800';
    if (status.includes('Error') || status.includes('API Error')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <Card className="mb-6 border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
            <Bug className="w-5 h-5" />
            Debug Panel
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={testConnections} 
                disabled={testing}
                className="flex-1"
              >
                {testing ? 'Testing...' : 'Test API Connections'}
              </Button>
              <Button 
                onClick={testEndpoints} 
                disabled={testingEndpoints}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                {testingEndpoints ? 'Testing...' : 'Test Endpoints'}
              </Button>
            </div>

            {testResults && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Connection Test Results:</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Supabase Connection:</span>
                    <Badge className={getStatusColor(testResults.supabaseConnection)}>
                      {testResults.supabaseConnection}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">LTA Bus Stops API:</span>
                    <Badge className={getStatusColor(testResults.ltaBusStops)}>
                      {testResults.ltaBusStops}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">LTA Bus Arrival API:</span>
                    <Badge className={getStatusColor(testResults.ltaBusArrival)}>
                      {testResults.ltaBusArrival}
                    </Badge>
                  </div>
                </div>
                
                {testResults.details && Object.keys(testResults.details).length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-2">Error Details:</p>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                      {JSON.stringify(testResults.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {endpointResults && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Endpoint Test Results:</p>
                {endpointResults.error ? (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-800">Error: {endpointResults.error}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {endpointResults.results?.map((result: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-mono break-all">{result.endpoint}</span>
                          <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {result.status}
                          </Badge>
                        </div>
                        {result.success && result.dataPreview && (
                          <p className="text-xs text-green-700">
                            ✅ Services: {result.dataPreview.serviceCount}
                          </p>
                        )}
                        {result.error && (
                          <p className="text-xs text-red-700">❌ {result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">Setup Instructions:</p>
              <ol className="text-xs text-blue-700 space-y-1">
                <li>1. Go to your Supabase project dashboard</li>
                <li>2. Navigate to Edge Functions → Manage Secrets</li>
                <li>3. Add secret: Key = "LTA_API_KEY", Value = your LTA DataMall API key</li>
                <li className="flex items-center gap-1">
                  4. Get your API key from: 
                  <a 
                    href="https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline flex items-center gap-1"
                  >
                    LTA DataMall <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>5. Make sure to accept the terms and conditions on LTA DataMall</li>
                <li>6. Wait a few minutes after adding the API key before testing</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-1">Troubleshooting:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Use "Test Endpoints" to find the correct API URL</li>
                <li>• Check if your LTA API key is valid and active</li>
                <li>• Ensure you've accepted LTA DataMall terms</li>
                <li>• Try different endpoint variations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default DebugPanel;