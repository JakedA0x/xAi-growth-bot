import http from "node:http";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  /*
   * CORS
   * Allows the GitHub Pages frontend to communicate
   * with this backend.
   */
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  /*
   * Browser preflight request
   */
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  /*
   * Health check
   *
   * GET /api/health
   */
  if (
    req.method === "GET" &&
    req.url === "/api/health"
  ) {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        success: true,
        service: "x-growth-bot-backend",
        status: "online",
        timestamp: new Date().toISOString()
      })
    );

    return;
  }

  /*
   * Temporary conversation endpoint.
   *
   * This is still mock data.
   * X API will be connected later.
   *
   * GET /api/conversations
   */
  if (
    req.method === "GET" &&
    req.url === "/api/conversations"
  ) {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
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
      })
    );

    return;
  }

  /*
   * 404 response
   */
  res.writeHead(404, {
    "Content-Type": "application/json"
  });

  res.end(
    JSON.stringify({
      success: false,
      error: "Endpoint not found"
    })
  );
});


/*
 * Start server
 */
server.listen(PORT, () => {
  console.log(
    `X Growth Bot backend running on port ${PORT}`
  );
});
