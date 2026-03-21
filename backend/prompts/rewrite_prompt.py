"""Prompt templates for the editor agent — rewrite, improve, continue, summarize, change tone."""

from typing import List, Dict, Optional

# Maps action types to specific system instructions
_ACTION_INSTRUCTIONS = {
    "rewrite": (
        "Rewrite the selected text to improve clarity, flow, and impact "
        "while preserving the original meaning and tone. "
        "Return ONLY the rewritten text."
    ),
    "improve": (
        "Improve the selected text: sharpen word choice, vary sentence structure, "
        "strengthen imagery, and enhance readability. Keep the same meaning and length. "
        "Return ONLY the improved text."
    ),
    "continue": (
        "Continue writing from where the selected text ends. "
        "Match the existing tone, style, and pacing. Write 2-4 additional paragraphs. "
        "Return ONLY the continuation (do not repeat the original text)."
    ),
    "summarize": (
        "Summarize the selected text into a concise paragraph "
        "that captures the key points. Return ONLY the summary."
    ),
    "change_tone": (
        "Rewrite the selected text with a different tone as specified by the user. "
        "Preserve the factual content but shift the voice. "
        "Return ONLY the rewritten text."
    ),
    "make_shorter": (
        "Condense the selected text to roughly half its length "
        "while preserving the core meaning and key details. "
        "Return ONLY the shortened text."
    ),
    "make_longer": (
        "Expand the selected text with additional detail, description, or elaboration. "
        "Roughly double the length while staying on topic. "
        "Return ONLY the expanded text."
    ),
    "custom_edit": (
        "Edit the selected text according to the user's custom instruction below. "
        "Return ONLY the edited text."
    ),
}


def build_editor_messages(
    action: str,
    selected_text: str,
    chapter_title: Optional[str] = None,
    chapter_brief: Optional[str] = None,
    tone: Optional[str] = None,
    custom_instruction: Optional[str] = None,
) -> List[Dict[str, str]]:
    """Return messages for the editor agent based on the requested action."""
    instruction = _ACTION_INSTRUCTIONS.get(action)
    if not instruction:
        raise ValueError(f"Unknown editor action: {action}")

    system = (
        "You are an expert fiction editor working inside a book writing tool. "
        f"{instruction}"
    )

    user_parts = [f"Selected text:\n{selected_text}"]
    if chapter_title:
        user_parts.insert(0, f"Chapter: {chapter_title}")
    if chapter_brief:
        user_parts.insert(1, f"Chapter intent: {chapter_brief}")
    if tone and action == "change_tone":
        user_parts.append(f"Target tone: {tone}")
    if custom_instruction and action == "custom_edit":
        user_parts.append(f"Instruction: {custom_instruction}")

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": "\n\n".join(user_parts)},
    ]
