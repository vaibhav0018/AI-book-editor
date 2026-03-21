"""Prompt template for the summarizer agent — compresses a chapter to ~150-word memory."""

from typing import List, Dict


def build_summary_messages(
    chapter_content: str, book_brief: str, chapter_title: str
) -> List[Dict[str, str]]:
    """Return messages that ask the LLM to produce a concise chapter summary."""
    system = (
        "You are a precise literary summarizer. "
        "Compress the chapter below into a ~150-word summary that preserves:\n"
        "  1. Key plot events and their outcomes\n"
        "  2. Characters introduced or developed\n"
        "  3. Themes or motifs advanced\n"
        "  4. How the chapter ends (cliffhanger, resolution, transition)\n\n"
        "This summary will be used as memory for an AI writing the next chapters, "
        "so accuracy matters more than style. Output ONLY the summary text — "
        "no headings, no bullet points, no meta-commentary."
    )

    user = (
        f"Book concept: {book_brief}\n"
        f"Chapter title: {chapter_title}\n\n"
        f"Chapter text:\n{chapter_content}"
    )

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def build_global_summary_messages(
    existing_summary: str, new_chapter_summary: str, book_brief: str
) -> List[Dict[str, str]]:
    """Return messages that update the rolling global book summary."""
    system = (
        "You maintain a running summary of an entire book in progress. "
        "Given the current global summary and the summary of the newest chapter, "
        "produce an UPDATED global summary (~200 words) that covers the full "
        "story so far. Preserve character arcs, key events, and unresolved threads. "
        "Output ONLY the updated summary text."
    )

    user = (
        f"Book concept: {book_brief}\n\n"
        f"Current global summary:\n{existing_summary or '(No chapters written yet.)'}\n\n"
        f"Newest chapter summary:\n{new_chapter_summary}"
    )

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
