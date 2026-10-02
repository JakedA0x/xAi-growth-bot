"use strict";

/**
 * X Growth Bot
 * Frontend application logic
 *
 * Data source:
 * Cloudflare Worker API
 */

const API_BASE_URL =
  "https://xai-growth-bot.mhd-aldirahman-56.workers.dev";


/* =========================================================
   01. APPLICATION STATE
   ========================================================= */

const state = {
  topic: "crypto",
  keyword: "",
  results: [],
  isLoading: false,
  hasError: false
};


/* =========================================================
   02. DOM REFERENCES
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
   03. INITIALIZATION
   ========================================================= */

function init() {
  if (
    !elements.form ||
    !elements.topic ||
    !elements.keyword
  ) {
    console.error(
      "X Growth Bot: required DOM elements are missing."
    );

    return;
  }

  bindEvents();

  state.topic =
    normalizeTopic(elements.topic.value);

  state.keyword =
    elements.keyword.value.trim();

  performSearch();
}


/* =========================================================
   04. EVENT HANDLERS
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

  state.topic =
    normalizeTopic(elements.topic.value);

  state.keyword =
    elements.keyword.value.trim();

  performSearch();
}


function handleTopicChange() {
  state.topic =
    normalizeTopic(elements.topic.value);

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
   05. SEARCH
   ========================================================= */

async function performSearch() {
  setLoading(true);
  clearError();

  try {
    const conversations =
      await fetchConversations();

    const filteredResults =
      searchConversations(
        conversations,
        {
          topic: state.topic,
          keyword: state.keyword
        }
      );

    state.results =
      filteredResults;

    renderResults();

  } catch (error) {
    console.error(
      "X Growth Bot search error:",
      error
    );

    handleError(
      "We couldn't load conversations from the backend."
    );

  } finally {
    setLoading(false);
  }
}


/* =========================================================
   06. BACKEND API
   ========================================================= */

async function fetchConversations() {
  const response =
    await fetch(
      `${API_BASE_URL}/api/conversations`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json"
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      `Backend returned HTTP ${response.status}`
    );
  }

  const payload =
    await response.json();

  if (
    !payload.success ||
    !Array.isArray(payload.data)
  ) {
    throw new Error(
      "Invalid backend response."
    );
  }

  return payload.data.map(
    normalizeBackendConversation
  );
}


/* =========================================================
   07. BACKEND DATA NORMALIZATION
   ========================================================= */

function normalizeBackendConversation(
  conversation
) {
  return {
    id:
      conversation.id ||
      crypto.randomUUID(),

    author: {
      name:
        conversation.author ||
        "Unknown",

      handle:
        conversation.handle ||
        "@unknown",

      avatar:
        createAvatar(
          conversation.author ||
          "X"
        )
    },

    topic:
      normalizeTopic(
        conversation.topic ||
        "general"
      ),

    tags:
      Array.isArray(
        conversation.tags
      )
        ? conversation.tags
        : [],

    content:
      conversation.content ||
      "",

    engagement: {
      replies:
        Number(
          conversation.engagement?.replies ||
          0
        ),

      likes:
        Number(
          conversation.engagement?.likes ||
          0
        ),

      reposts:
        Number(
          conversation.engagement?.reposts ||
          0
        )
    },

    age:
      conversation.age ||
      "now"
  };
}


function createAvatar(name) {
  const parts =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return "X";
  }

  return parts
    .slice(0, 2)
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}


/* =========================================================
   08. SEARCH ENGINE
   ========================================================= */

function searchConversations(
  conversations,
  {
    topic,
    keyword
  }
) {
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

  return conversations
    .map(
      (conversation) => ({
        ...conversation,

        relevanceScore:
          calculateRelevance(
            conversation,
            normalizedTopic,
            normalizedKeyword
          )
      })
    )
    .filter(
      (conversation) => {
        const matchesTopic =
          showAllTopics ||
          conversation.topic ===
            normalizedTopic;

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
      }
    )
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    );
}


/* =========================================================
   09. RELEVANCE SCORING
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
      getSearchableText(
        conversation
      );

    if (
      searchableText.includes(
        keyword
      )
    ) {
      score += 30;
    }

    const keywordParts =
      keyword
        .split(/\s+/)
        .filter(Boolean);

    keywordParts.forEach(
      (part) => {
        if (
          searchableText.includes(
            part
          )
        ) {
          score += 5;
        }
      }
    );
  }

  const engagement =
    conversation.engagement.likes +
    conversation.engagement.reposts * 2 +
    conversation.engagement.replies * 3;

  score += Math.min(
    20,
    Math.round(
      engagement / 50
    )
  );

  return Math.min(
    score,
    100
  );
}


/* =========================================================
   10. KEYWORD SEARCH
   ========================================================= */

function matchesKeywordSearch(
  conversation,
  keyword
) {
  const searchableText =
    getSearchableText(
      conversation
    );

  if (
    searchableText.includes(
      keyword
    )
  ) {
    return true;
  }

  const parts =
    keyword
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length > 1) {
    return parts.every(
      (part) =>
        searchableText.includes(
          part
        )
    );
  }

  return false;
}


/* =========================================================
   11. SEARCH HELPERS
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
   12. RENDERING
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
   13. CONVERSATION CARD
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
   14. METRICS
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
   15. UI STATE
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
   16. ERROR HANDLING
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
