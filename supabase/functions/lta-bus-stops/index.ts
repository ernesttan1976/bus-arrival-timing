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
    
    // Fixed LTA DataMall API endpoint - changed to HTTPS
    const ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${skip}`
    
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

    console.log(`Fetching from LTA API: ${ltaUrl}`)
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
      throw new Error(`LTA API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Received ${data.value?.length || 0} bus stops from LTA API`)
    
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

    console.log(`Returning ${transformedStops.length} filtered bus stops`)

    return new Response(
      JSON.stringify({ busStops: transformedStops }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching LTA bus stops:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bus stops data', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})