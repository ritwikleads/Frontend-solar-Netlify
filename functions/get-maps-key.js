// functions/get-maps-key.js
exports.handler = async function(event, context) {
    // CORS headers to allow your frontend to call this function
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET'
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
      // Return the API key from environment variables
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
        })
      };
    } catch (error) {
      // Handle any errors
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch API key' })
      };
    }
  }