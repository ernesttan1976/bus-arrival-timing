import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { busStopCode } = await req.json()
    
    if (!busStopCode) {
      return new Response(
        JSON.stringify({ error: 'Bus stop code is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const ltaApiKey = Deno.env.get('LTA_API_KEY')
    
    if (!ltaApiKey) {
      return new Response(
        JSON.stringify({ error: 'LTA API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // USING THE CORRECT v3/BusArrival ENDPOINT
    const ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${busStopCode}`
    
    console.log(`🚌 CALLING v3 ENDPOINT: ${ltaUrl}`)
    console.log(`Using API key: ${ltaApiKey.substring(0, 8)}...`)

    const response = await fetch(ltaUrl, {
      headers: {
        'AccountKey': ltaApiKey,
        'Accept': 'application/json'
      }
    })

    console.log(`LTA v3 API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`LTA v3 API error: ${response.status} - ${errorText}`)
      return new Response(
        JSON.stringify({ 
          error: `LTA v3 API returned ${response.status}`, 
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log(`✅ v3 API Raw LTA response for stop ${busStopCode}:`, JSON.stringify(data, null, 2))
    
    // Helper function to calculate arrival time in minutes
    const calculateArrivalTime = (estimatedArrival: string | null): number | null => {
      if (!estimatedArrival || estimatedArrival === '') return null;
      
      try {
        const arrivalTime = new Date(estimatedArrival);
        const now = new Date();
        const diffMs = arrivalTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        return Math.max(0, diffMinutes); // Don't return negative times
      } catch (error) {
        console.error('Error parsing arrival time:', estimatedArrival, error);
        return null;
      }
    };

    // Helper function to decode bus type
    const decodeBusType = (type: string): { description: string, isDecker: 'single' | 'double' | 'unknown' } => {
      switch (type) {
        case 'SD': return { description: 'Single Decker', isDecker: 'single' };
        case 'DD': return { description: 'Double Decker', isDecker: 'double' };
        case 'BD': return { description: 'Bendy Bus', isDecker: 'single' };
        default: return { description: type || 'Unknown', isDecker: 'unknown' };
      }
    };

    // Helper function to decode wheelchair accessibility
    const decodeFeature = (feature: string): string => {
      switch (feature) {
        case 'WAB': return 'Wheelchair Accessible';
        case '': return 'Standard';
        default: return feature || 'Standard';
      }
    };

    // Transform LTA data to our format
    const transformedData = {
      stopCode: busStopCode,
      services: (data.Services || []).map((service: any) => {
        const nextBusType = decodeBusType(service.NextBus?.Type);
        const nextBus2Type = decodeBusType(service.NextBus2?.Type);
        const nextBus3Type = decodeBusType(service.NextBus3?.Type);

        return {
          busNumber: service.ServiceNo || 'Unknown',
          operator: service.Operator || 'Unknown',
          nextBus: {
            arrivalTime: calculateArrivalTime(service.NextBus?.EstimatedArrival),
            load: service.NextBus?.Load || 'SEA',
            feature: service.NextBus?.Feature || 'WAB',
            featureDescription: decodeFeature(service.NextBus?.Feature),
            type: service.NextBus?.Type || 'SD',
            typeDescription: nextBusType.description,
            isDecker: nextBusType.isDecker,
            // Note: LTA API doesn't provide license plate or specific model info
            licensePlate: null, // Not available in LTA API
            model: null // Not available in LTA API
          },
          nextBus2: {
            arrivalTime: calculateArrivalTime(service.NextBus2?.EstimatedArrival),
            load: service.NextBus2?.Load || 'SEA',
            feature: service.NextBus2?.Feature || 'WAB',
            featureDescription: decodeFeature(service.NextBus2?.Feature),
            type: service.NextBus2?.Type || 'SD',
            typeDescription: nextBus2Type.description,
            isDecker: nextBus2Type.isDecker,
            licensePlate: null,
            model: null
          },
          nextBus3: {
            arrivalTime: calculateArrivalTime(service.NextBus3?.EstimatedArrival),
            load: service.NextBus3?.Load || 'SEA',
            feature: service.NextBus3?.Feature || 'WAB',
            featureDescription: decodeFeature(service.NextBus3?.Feature),
            type: service.NextBus3?.Type || 'SD',
            typeDescription: nextBus3Type.description,
            isDecker: nextBus3Type.isDecker,
            licensePlate: null,
            model: null
          }
        }
      })
    }

    console.log(`✅ v3 SUCCESS: Returning ${transformedData.services.length} bus services for stop ${busStopCode}`)

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ v3 ERROR in bus arrival function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch bus arrival data from v3 endpoint', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})