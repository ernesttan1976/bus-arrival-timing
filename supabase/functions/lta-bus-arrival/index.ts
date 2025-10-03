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

    // Correct LTA DataMall Bus Arrival API endpoint - using v3/BusArrival
    const ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${busStopCode}`
    
    console.log(`Fetching bus arrival for stop ${busStopCode} from: ${ltaUrl}`)
    console.log(`Using API key: ${ltaApiKey.substring(0, 8)}...`)

    const response = await fetch(ltaUrl, {
      headers: {
        'AccountKey': ltaApiKey,
        'Accept': 'application/json'
      }
    })

    console.log(`LTA API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`LTA API error: ${response.status} - ${errorText}`)
      return new Response(
        JSON.stringify({ 
          error: `LTA API returned ${response.status}`, 
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log(`Raw LTA response for stop ${busStopCode}:`, JSON.stringify(data, null, 2))
    
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

    // Transform LTA data to our format
    const transformedData = {
      stopCode: busStopCode,
      services: (data.Services || []).map((service: any) => ({
        busNumber: service.ServiceNo || 'Unknown',
        operator: service.Operator || 'Unknown',
        nextBus: {
          arrivalTime: calculateArrivalTime(service.NextBus?.EstimatedArrival),
          load: service.NextBus?.Load || 'SEA',
          feature: service.NextBus?.Feature || 'WAB',
          type: service.NextBus?.Type || 'SD'
        },
        nextBus2: {
          arrivalTime: calculateArrivalTime(service.NextBus2?.EstimatedArrival),
          load: service.NextBus2?.Load || 'SEA',
          feature: service.NextBus2?.Feature || 'WAB',
          type: service.NextBus2?.Type || 'SD'
        },
        nextBus3: {
          arrivalTime: calculateArrivalTime(service.NextBus3?.EstimatedArrival),
          load: service.NextBus3?.Load || 'SEA',
          feature: service.NextBus3?.Feature || 'WAB',
          type: service.NextBus3?.Type || 'SD'
        }
      }))
    }

    console.log(`Transformed data for stop ${busStopCode}:`, JSON.stringify(transformedData, null, 2))
    console.log(`Returning ${transformedData.services.length} bus services for stop ${busStopCode}`)

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in bus arrival function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch bus arrival data', 
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