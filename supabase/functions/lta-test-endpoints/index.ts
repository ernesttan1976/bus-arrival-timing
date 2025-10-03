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

    const testResults = []

    // Test different possible endpoints for bus arrival
    const possibleEndpoints = [
      'https://datamall2.mytransport.sg/ltaodataservice/BusArrivalV2?BusStopCode=03111',
      'https://datamall2.mytransport.sg/ltaodataservice/BusArrival?BusStopCode=03111',
      'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=03111',
      'https://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=03111'
    ]

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`)
        
        const response = await fetch(endpoint, {
          headers: {
            'AccountKey': ltaApiKey,
            'Accept': 'application/json'
          }
        })

        const result = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok
        }

        if (response.ok) {
          const data = await response.json()
          result.dataPreview = {
            hasServices: !!data.Services,
            serviceCount: data.Services?.length || 0,
            sampleService: data.Services?.[0] || null
          }
        } else {
          const errorText = await response.text()
          result.error = errorText
        }

        testResults.push(result)
        console.log(`Result for ${endpoint}:`, JSON.stringify(result, null, 2))

      } catch (error) {
        testResults.push({
          endpoint,
          status: 'ERROR',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'LTA API endpoint test results',
        results: testResults,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in test function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to test endpoints', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})