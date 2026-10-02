export default {
  async fetch(request) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/health"
    ) {
      return jsonResponse(
        {
          success: true,
          service: "xai-growth-bot-api",
          status: "online",
          timestamp: new Date().toISOString()
        },
        200,
        corsHeaders
      );
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/conversations"
    ) {
      return jsonResponse(
        {
          success: true,
          source: "mock-backend",
          data: [
            {
              id: "backend-001",
              author: "Backend Test",
              handle: "@xgrowthbot",
              content:
                "Backend connection is working successfully.",
              topic: "crypto"
            }
          ]
        },
        200,
        corsHeaders
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Endpoint not found"
      },
      404,
      corsHeaders
    );
  }
};

function jsonResponse(
  data,
  status,
  headers
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    }
  );
}
