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
    const { searchQuery, skip = 0 } = await req.json()
    
    // LTA DataMall API endpoint for bus stops
    const ltaUrl = `http://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${skip}`
    
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

    const response = await fetch(ltaUrl, {
      headers: {
        'AccountKey': ltaApiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`LTA API error: ${response.status}`)
    }

    const data = await response.json()
    
    let busStops = data.value || []
    
    // Filter by search query if provided
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      busStops = busStops.filter((stop: any) => 
        stop.Description?.toLowerCase().includes(query) ||
        stop.BusStopCode?.toLowerCase().includes(query) ||
        stop.RoadName?.toLowerCase().includes(query)
      )
    }

    // Transform to our format
    const transformedStops = busStops.map((stop: any) => ({
      stopCode: stop.BusStopCode,
      stopName: stop.Description,
      roadName: stop.RoadName,
      latitude: stop.Latitude,
      longitude: stop.Longitude
    }))

    return new Response(
      JSON.stringify({ busStops: transformedStops }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching LTA bus stops:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bus stops data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})