"use strict";

/**
 * X Growth Bot
 * Frontend application logic
 *
 * Current stage:
 * - Mock conversation data
 * - Topic filtering
 * - Keyword search
 * - Relevance scoring
 * - Loading state
 * - Empty state
 * - Error state
 *
 * Future:
 * - X API integration
 * - AI-assisted response drafting
 * - Analytics
 */


/* =========================================================
   01. MOCK DATA
   ========================================================= */

const CONVERSATIONS = [
  {
    id: "conv-001",
    author: {
      name: "Alex Morgan",
      handle: "@alexmorgan",
      avatar: "AM"
    },
    topic: "crypto",
    tags: ["crypto", "market", "bitcoin"],
    content:
      "What narratives do you think will drive the next phase of the crypto market?",
    engagement: {
      replies: 24,
      likes: 186,
      reposts: 31
    },
    age: "18m"
  },

  {
    id: "conv-002",
    author: {
      name: "Base Builder",
      handle: "@basebuilder",
      avatar: "BB"
    },
    topic: "base",
    tags: ["base", "builders", "ethereum"],
    content:
      "Building on Base has become significantly easier. What tools are developers using most right now?",
    engagement: {
      replies: 18,
      likes: 142,
      reposts: 27
    },
    age: "32m"
  },

  {
    id: "conv-003",
    author: {
      name: "DeFi Research",
      handle: "@defiresearch",
      avatar: "DR"
    },
    topic: "defi",
    tags: ["defi", "liquidity", "yield"],
    content:
      "Which DeFi primitives do you think still have the most room for innovation?",
    engagement: {
      replies: 42,
      likes: 231,
      reposts: 38
    },
    age: "47m"
  },

  {
    id: "conv-004",
    author: {
      name: "AI Frontier",
      handle: "@aifrontier",
      avatar: "AF"
    },
    topic: "ai",
    tags: ["ai", "agents", "crypto"],
    content:
      "AI agents are becoming more autonomous. Where do you see the strongest use cases emerging?",
    engagement: {
      replies: 36,
      likes: 319,
      reposts: 51
    },
    age: "1h"
  },

  {
    id: "conv-005",
    author: {
      name: "Web3 Daily",
      handle: "@web3daily",
      avatar: "WD"
    },
    topic: "web3",
    tags: ["web3", "community", "builders"],
    content:
      "What makes a Web3 community actually sustainable beyond token incentives?",
    engagement: {
      replies: 29,
      likes: 204,
      reposts: 44
    },
    age: "1h"
  },

  {
    id: "conv-006",
    author: {
      name: "Meme Terminal",
      handle: "@memeterminal",
      avatar: "MT"
    },
    topic: "memecoin",
    tags: ["memecoin", "community", "culture"],
    content:
      "Memecoins are increasingly driven by community culture. What separates a lasting meme from a short-lived trend?",
    engagement: {
      replies: 67,
      likes: 487,
      reposts: 83
    },
    age: "2h"
  },

  {
    id: "conv-007",
    author: {
      name: "Onchain Analyst",
      handle: "@onchainanalyst",
      avatar: "OA"
    },
    topic: "crypto",
    tags: ["crypto", "onchain", "data"],
    content:
      "On-chain data is showing some interesting changes in market behavior. What metrics are you watching?",
    engagement: {
      replies: 21,
      likes: 173,
      reposts: 29
    },
    age: "2h"
  },

  {
    id: "conv-008",
    author: {
      name: "Protocol Labs",
      handle: "@protocollabs",
      avatar: "PL"
    },
    topic: "web3",
    tags: ["web3", "protocol", "infrastructure"],
    content:
      "Infrastructure remains one of the most overlooked parts of Web3. Which areas need better developer tooling?",
    engagement: {
      replies: 15,
      likes: 119,
      reposts: 18
    },
    age: "3h"
  }
];


/* =========================================================
   02. APPLICATION STATE
   ========================================================= */

const state = {
  topic: "crypto",
  keyword: "",
  results: [],
  isLoading: false,
  hasError: false
};


/* =========================================================
   03. DOM REFERENCES
   ========================================================= */

const elements = {
  form: document.querySelector("#search-form"),
  topic: document.querySelector("#topic"),
  keyword: document.querySelector("#keyword"),
  searchButton: document.querySelector("#search-button"),

  resultCount: document.querySelector("#result-count"),
  conversationList: document.querySelector("#conversation-list"),

  loadingState: document.querySelector("#loading-state"),
  emptyState: document.querySelector("#empty-state"),

  errorState: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  retryButton: document.querySelector("#retry-button")
};


/* =========================================================
   04. INITIALIZATION
   ========================================================= */

function init() {
  if (!elements.form || !elements.topic || !elements.keyword) {
    console.error(
      "X Growth Bot: required DOM elements are missing."
    );

    return;
  }

  bindEvents();

  state.topic = normalizeTopic(elements.topic.value);
  state.keyword = elements.keyword.value.trim();

  performSearch();
}


/* =========================================================
   05. EVENT HANDLERS
   ========================================================= */

function bindEvents() {
  elements.form.addEventListener(
    "submit",
    handleSearchSubmit
  );

  elements.topic.addEventListener(
    "change",
    handleTopicChange
  );

  elements.keyword.addEventListener(
    "input",
    handleKeywordInput
  );

  elements.retryButton?.addEventListener(
    "click",
    handleRetry
  );
}


function handleSearchSubmit(event) {
  event.preventDefault();

  state.topic = normalizeTopic(
    elements.topic.value
  );

  state.keyword =
    elements.keyword.value.trim();

  performSearch();
}


function handleTopicChange() {
  state.topic = normalizeTopic(
    elements.topic.value
  );

  performSearch();
}


function handleKeywordInput() {
  state.keyword =
    elements.keyword.value.trim();
}


function handleRetry() {
  state.hasError = false;

  performSearch();
}


/* =========================================================
   06. SEARCH
   ========================================================= */

async function performSearch() {
  setLoading(true);
  clearError();

  try {
    /*
     * Simulate network latency.
     * This will later be replaced with an API request.
     */
    await delay(500);

    const filteredResults =
      searchConversations({
        topic: state.topic,
        keyword: state.keyword
      });

    state.results = filteredResults;

    renderResults();
  } catch (error) {
    console.error(
      "X Growth Bot search error:",
      error
    );

    handleError(
      "We couldn't process the search. Please try again."
    );
  } finally {
    setLoading(false);
  }
}


/* =========================================================
   07. SEARCH ENGINE
   ========================================================= */

function searchConversations({
  topic,
  keyword
}) {
  const normalizedTopic =
    normalizeTopic(topic);

  const normalizedKeyword =
    String(keyword || "")
      .trim()
      .toLowerCase();

  const showAllTopics =
    !normalizedTopic ||
    normalizedTopic === "all" ||
    normalizedTopic === "all-topics";

  return CONVERSATIONS
    .map((conversation) => {
      const score =
        calculateRelevance(
          conversation,
          normalizedTopic,
          normalizedKeyword
        );

      return {
        ...conversation,
        relevanceScore: score
      };
    })
    .filter((conversation) => {
      const matchesTopic =
        showAllTopics ||
        conversation.topic === normalizedTopic;

      const matchesKeyword =
        !normalizedKeyword ||
        matchesKeywordSearch(
          conversation,
          normalizedKeyword
        );

      return (
        matchesTopic &&
        matchesKeyword
      );
    })
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    );
}


/* =========================================================
   08. RELEVANCE SCORING
   ========================================================= */

function calculateRelevance(
  conversation,
  topic,
  keyword
) {
  let score = 0;

  const showAllTopics =
    !topic ||
    topic === "all" ||
    topic === "all-topics";

  if (
    showAllTopics ||
    conversation.topic === topic
  ) {
    score += 50;
  }

  if (keyword) {
    const searchableText =
      getSearchableText(conversation);

    if (
      searchableText.includes(keyword)
    ) {
      score += 30;
    }

    const keywordParts =
      keyword
        .split(/\s+/)
        .filter(Boolean);

    keywordParts.forEach((part) => {
      if (
        searchableText.includes(part)
      ) {
        score += 5;
      }
    });
  }

  /*
   * Engagement contributes a small amount.
   * Relevance remains more important than volume.
   */
  const engagement =
    conversation.engagement.likes +
    conversation.engagement.reposts * 2 +
    conversation.engagement.replies * 3;

  score += Math.min(
    20,
    Math.round(engagement / 50)
  );

  return Math.min(
    score,
    100
  );
}


/* =========================================================
   09. KEYWORD SEARCH
   ========================================================= */

function matchesKeywordSearch(
  conversation,
  keyword
) {
  const searchableText =
    getSearchableText(
      conversation
    );

  /*
   * Exact phrase match.
   */
  if (
    searchableText.includes(keyword)
  ) {
    return true;
  }

  /*
   * Also support multiple words.
   *
   * Example:
   * "crypto market"
   *
   * Both words must exist.
   */
  const parts =
    keyword
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length > 1) {
    return parts.every((part) =>
      searchableText.includes(part)
    );
  }

  return false;
}


/* =========================================================
   10. SEARCH HELPERS
   ========================================================= */

function getSearchableText(
  conversation
) {
  return [
    conversation.content,
    conversation.author.name,
    conversation.author.handle,
    conversation.topic,
    ...conversation.tags
  ]
    .join(" ")
    .toLowerCase();
}


function normalizeTopic(topic) {
  return String(topic || "")
    .trim()
    .toLowerCase();
}


/* =========================================================
   11. RENDERING
   ========================================================= */

function renderResults() {
  elements.conversationList.replaceChildren();

  updateResultCount(
    state.results.length
  );

  if (
    state.results.length === 0
  ) {
    showEmptyState();
    return;
  }

  hideEmptyState();

  const fragment =
    document.createDocumentFragment();

  state.results.forEach(
    (conversation) => {
      fragment.appendChild(
        createConversationCard(
          conversation
        )
      );
    }
  );

  elements.conversationList.appendChild(
    fragment
  );
}


/* =========================================================
   12. CONVERSATION CARD
   ========================================================= */

function createConversationCard(
  conversation
) {
  const article =
    document.createElement(
      "article"
    );

  article.className =
    "conversation-card";

  article.dataset.id =
    conversation.id;

  const header =
    document.createElement(
      "div"
    );

  header.className =
    "conversation-card-header";

  const author =
    document.createElement(
      "div"
    );

  author.className =
    "conversation-author";

  const avatar =
    document.createElement(
      "span"
    );

  avatar.className =
    "conversation-avatar";

  avatar.textContent =
    conversation.author.avatar;

  avatar.setAttribute(
    "aria-hidden",
    "true"
  );

  const authorInfo =
    document.createElement(
      "div"
    );

  const authorName =
    document.createElement(
      "strong"
    );

  authorName.textContent =
    conversation.author.name;

  const handle =
    document.createElement(
      "span"
    );

  handle.textContent =
    conversation.author.handle;

  authorInfo.append(
    authorName,
    handle
  );

  author.append(
    avatar,
    authorInfo
  );

  const age =
    document.createElement(
      "time"
    );

  age.textContent =
    conversation.age;

  age.className =
    "conversation-age";

  header.append(
    author,
    age
  );


  const content =
    document.createElement(
      "p"
    );

  content.className =
    "conversation-content";

  content.textContent =
    conversation.content;


  const footer =
    document.createElement(
      "div"
    );

  footer.className =
    "conversation-card-footer";


  const metrics =
    document.createElement(
      "div"
    );

  metrics.className =
    "conversation-metrics";

  metrics.append(
    createMetric(
      "Replies",
      conversation.engagement.replies
    ),

    createMetric(
      "Likes",
      conversation.engagement.likes
    ),

    createMetric(
      "Reposts",
      conversation.engagement.reposts
    )
  );


  const relevance =
    document.createElement(
      "span"
    );

  relevance.className =
    "conversation-relevance";

  relevance.textContent =
    `${conversation.relevanceScore}% relevant`;


  footer.append(
    metrics,
    relevance
  );


  article.append(
    header,
    content,
    footer
  );

  return article;
}


/* =========================================================
   13. METRICS
   ========================================================= */

function createMetric(
  label,
  value
) {
  const metric =
    document.createElement(
      "span"
    );

  metric.className =
    "conversation-metric";

  metric.textContent =
    `${formatNumber(value)} ${label}`;

  return metric;
}


function formatNumber(value) {
  return new Intl.NumberFormat(
    "en-US",
    {
      notation: "compact",
      maximumFractionDigits: 1
    }
  ).format(value);
}


/* =========================================================
   14. UI STATE
   ========================================================= */

function setLoading(
  isLoading
) {
  state.isLoading =
    isLoading;

  if (
    elements.loadingState
  ) {
    elements.loadingState.hidden =
      !isLoading;
  }

  if (
    elements.searchButton
  ) {
    elements.searchButton.disabled =
      isLoading;
  }

  if (isLoading) {
    if (
      elements.emptyState
    ) {
      elements.emptyState.hidden =
        true;
    }

    if (
      elements.errorState
    ) {
      elements.errorState.hidden =
        true;
    }
  }
}


function showEmptyState() {
  if (
    elements.emptyState
  ) {
    elements.emptyState.hidden =
      false;
  }
}


function hideEmptyState() {
  if (
    elements.emptyState
  ) {
    elements.emptyState.hidden =
      true;
  }
}


function updateResultCount(
  count
) {
  if (
    elements.resultCount
  ) {
    elements.resultCount.textContent =
      `${count} ${
        count === 1
          ? "result"
          : "results"
      }`;
  }
}


/* =========================================================
   15. ERROR HANDLING
   ========================================================= */

function handleError(
  message
) {
  state.hasError =
    true;

  if (
    elements.errorMessage
  ) {
    elements.errorMessage.textContent =
      message;
  }

  if (
    elements.errorState
  ) {
    elements.errorState.hidden =
      false;
  }

  elements.conversationList.replaceChildren();

  updateResultCount(0);
}


function clearError() {
  state.hasError =
    false;

  if (
    elements.errorState
  ) {
    elements.errorState.hidden =
      true;
  }
}


/* =========================================================
   16. UTILITIES
   ========================================================= */

function delay(
  milliseconds
) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}


/* =========================================================
   17. START APPLICATION
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init,
    { once: true }
  );
} else {
  init();
}
