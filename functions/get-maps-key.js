// functions/get-maps-key.js
exports.handler = async function(event, context) {
    // CORS headers to allow your frontend to call this function
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET',
      'Cache-Control': 'no-cache' // Prevent caching for security
    };
    
    // Only respond to GET requests
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
    try {
      // Get the API key from environment variables
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key is not defined in environment variables');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'API key is not configured' })
        };
      }
      
      // Return the API key
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          apiKey: apiKey
        })
      };
    } catch (error) {
      console.error('Error in get-maps-key function:', error);
      // Handle any errors
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch API key' })
      };
    }
  }