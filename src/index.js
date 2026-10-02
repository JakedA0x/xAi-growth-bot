export default {
  async fetch(request, env) {
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
      return searchXPosts(url, env, corsHeaders);
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


async function searchXPosts(
  url,
  env,
  corsHeaders
) {
  if (!env.X_BEARER_TOKEN) {
    return jsonResponse(
      {
        success: false,
        error: "X_BEARER_TOKEN is not configured."
      },
      500,
      corsHeaders
    );
  }

  const keyword =
    url.searchParams.get("keyword") ||
    "crypto";

  const query =
    `${keyword} -is:retweet -is:reply`;

  const params = new URLSearchParams();

  params.set("query", query);
  params.set(
    "tweet.fields",
    "created_at,public_metrics,author_id"
  );
  params.set(
    "expansions",
    "author_id"
  );
  params.set(
    "user.fields",
    "username,name"
  );
  params.set(
    "max_results",
    "10"
  );

  const response = await fetch(
    `https://api.x.com/2/tweets/search/recent?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${env.X_BEARER_TOKEN}`
      }
    }
  );

  const payload =
    await response.json();

  if (!response.ok) {
    return jsonResponse(
      {
        success: false,
        error:
          payload.detail ||
          payload.title ||
          "X API request failed.",
        x_status:
          response.status
      },
      response.status,
      corsHeaders
    );
  }

  const users =
    payload.includes?.users || [];

  const userMap =
    new Map(
      users.map(
        (user) => [
          user.id,
          user
        ]
      )
    );

  const posts =
    (payload.data || []).map(
      (post) => {
        const user =
          userMap.get(
            post.author_id
          );

        return {
          id: post.id,

          author:
            user?.name ||
            "Unknown",

          handle:
            user?.username
              ? `@${user.username}`
              : "@unknown",

          content:
            post.text || "",

          topic:
            keyword.toLowerCase(),

          tags: [],

          age:
            formatAge(
              post.created_at
            ),

          engagement: {
            replies:
              post.public_metrics
                ?.reply_count || 0,

            likes:
              post.public_metrics
                ?.like_count || 0,

            reposts:
              post.public_metrics
                ?.retweet_count || 0
          }
        };
      }
    );

  return jsonResponse(
    {
      success: true,
      source: "x-api",
      query,
      count: posts.length,
      data: posts
    },
    200,
    corsHeaders
  );
}


function formatAge(
  createdAt
) {
  if (!createdAt) {
    return "now";
  }

  const created =
    new Date(createdAt);

  const now =
    new Date();

  const seconds =
    Math.max(
      0,
      Math.floor(
        (now - created) /
        1000
      )
    );

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  return `${days}d`;
}


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
        "Content-Type":
          "application/json; charset=UTF-8",
        ...headers
      }
    }
  );
}
