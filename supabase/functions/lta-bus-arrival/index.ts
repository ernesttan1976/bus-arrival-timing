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

    // Fixed LTA DataMall API endpoint - changed to HTTPS
    const ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStopCode}`
    
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

    console.log(`Fetching bus arrival for stop ${busStopCode}`)
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
    console.log(`Received data for ${data.Services?.length || 0} bus services`)
    
    // Transform LTA data to our format
    const transformedData = {
      stopCode: busStopCode,
      services: data.Services?.map((service: any) => ({
        busNumber: service.ServiceNo,
        operator: service.Operator,
        nextBus: {
          arrivalTime: service.NextBus?.EstimatedArrival ? 
            Math.max(0, Math.floor((new Date(service.NextBus.EstimatedArrival).getTime() - new Date().getTime()) / 60000)) : 
            null,
          load: service.NextBus?.Load || 'SEA',
          feature: service.NextBus?.Feature || 'WAB',
          type: service.NextBus?.Type || 'SD'
        },
        nextBus2: {
          arrivalTime: service.NextBus2?.EstimatedArrival ? 
            Math.max(0, Math.floor((new Date(service.NextBus2.EstimatedArrival).getTime() - new Date().getTime()) / 60000)) : 
            null,
          load: service.NextBus2?.Load || 'SEA',
          feature: service.NextBus2?.Feature || 'WAB',
          type: service.NextBus2?.Type || 'SD'
        },
        nextBus3: {
          arrivalTime: service.NextBus3?.EstimatedArrival ? 
            Math.max(0, Math.floor((new Date(service.NextBus3.EstimatedArrival).getTime() - new Date().getTime()) / 60000)) : 
            null,
          load: service.NextBus3?.Load || 'SEA',
          feature: service.NextBus3?.Feature || 'WAB',
          type: service.NextBus3?.Type || 'SD'
        }
      })) || []
    }

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching LTA bus arrival data:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bus arrival data', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})