/**
 * Maps technical errors to user-friendly messages for non-technical users.
 * @param {Error} err - Axios error (has response.data.detail) or plain Error
 * @returns {string} User-friendly message
 */
export function getFriendlyMessage(err) {
  const msg = (err.response?.data?.detail ?? err.message ?? String(err)).toLowerCase()

  // AI/LLM service down or unreachable
  if (
    msg.includes('connection') ||
    msg.includes('econnrefused') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('fetch') ||
    msg.includes('failed to fetch')
  ) {
    return 'AI service is temporarily unavailable. Please check back in a few minutes.'
  }

  // Rate limit or overloaded
  if (msg.includes('rate limit') || msg.includes('ratelimit') || msg.includes('overloaded')) {
    return 'AI is a bit busy right now. Please wait a moment and try again.'
  }

  // API key or auth
  if (msg.includes('api key') || msg.includes('api_key') || msg.includes('authentication') || msg.includes('401')) {
    return 'AI service configuration issue. Please try again later.'
  }

  // Outline / structure issues
  if (msg.includes('outline') || msg.includes('json') || msg.includes('parse')) {
    return "Couldn't generate the outline. Please try again."
  }

  // Content required (summarize, etc.)
  if (msg.includes('no content') || msg.includes('has no content') || msg.includes('content to summarize')) {
    return 'Add some text to the chapter first, then try again.'
  }

  // 404 / not found
  if (msg.includes('not found') || msg.includes('404')) {
    return "This item couldn't be found. It may have been deleted."
  }

  // Export / PDF
  if (msg.includes('export') || msg.includes('pdf')) {
    return "Couldn't create the PDF. Make sure you have at least one chapter with content."
  }

  // Generic fallback
  return "Something went wrong. Please try again."
}
