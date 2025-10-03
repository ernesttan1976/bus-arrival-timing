import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchQuery, skip = 0, userLat, userLng, maxDistance = 2 } = await req.json()
    
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

    console.log(`🔍 Request params:`)
    console.log(`  - searchQuery: "${searchQuery}"`)
    console.log(`  - userLocation: ${userLat}, ${userLng}`)
    console.log(`  - maxDistance: ${maxDistance}km`)
    console.log(`  - skip: ${skip}`)

    // We need to fetch ALL bus stops to filter by location
    // LTA API doesn't support location-based filtering
    let allBusStops: any[] = []
    let currentSkip = 0
    const batchSize = 500

    // Fetch all bus stops in batches
    while (true) {
      const ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${currentSkip}`
      
      console.log(`📡 Fetching batch from LTA API: skip=${currentSkip}`)

      const response = await fetch(ltaUrl, {
        headers: {
          'AccountKey': ltaApiKey,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ LTA API error: ${response.status} - ${errorText}`)
        throw new Error(`LTA API error: ${response.status}`)
      }

      const data = await response.json()
      const batchStops = data.value || []
      
      console.log(`📊 Received ${batchStops.length} stops in this batch`)
      
      if (batchStops.length === 0) {
        break // No more data
      }
      
      allBusStops = allBusStops.concat(batchStops)
      currentSkip += batchSize
      
      // Safety limit to prevent infinite loops
      if (currentSkip > 10000) {
        console.log(`⚠️ Safety limit reached, stopping at ${allBusStops.length} stops`)
        break
      }
    }

    console.log(`✅ Total bus stops fetched: ${allBusStops.length}`)

    // Transform to our format and filter
    let filteredStops = allBusStops.map((stop: any) => ({
      stopCode: stop.BusStopCode,
      stopName: stop.Description,
      roadName: stop.RoadName,
      latitude: stop.Latitude,
      longitude: stop.Longitude
    }))

    // Apply text search filter if provided
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filteredStops = filteredStops.filter((stop: any) => 
        stop.stopName?.toLowerCase().includes(query) ||
        stop.stopCode?.toLowerCase().includes(query) ||
        stop.roadName?.toLowerCase().includes(query)
      )
      console.log(`🔍 After text filter: ${filteredStops.length} stops`)
    }

    // Apply location filter if user location is provided
    if (userLat && userLng) {
      const stopsWithDistance = filteredStops.map((stop: any) => {
        const distance = calculateDistance(userLat, userLng, stop.latitude, stop.longitude)
        return {
          ...stop,
          distance
        }
      })

      // Filter by distance and sort by proximity
      filteredStops = stopsWithDistance
        .filter((stop: any) => stop.distance <= maxDistance)
        .sort((a: any, b: any) => a.distance - b.distance)

      console.log(`📍 After location filter (${maxDistance}km): ${filteredStops.length} stops`)
      
      if (filteredStops.length > 0) {
        console.log(`🎯 Closest stop: ${filteredStops[0].stopName} (${filteredStops[0].distance.toFixed(2)}km)`)
      }
    }

    // Limit results to prevent huge responses
    const limitedStops = filteredStops.slice(0, 100)

    console.log(`📤 Returning ${limitedStops.length} stops`)

    return new Response(
      JSON.stringify({ busStops: limitedStops }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error fetching LTA bus stops:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bus stops data', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})