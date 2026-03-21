"""LangChain-based chapter summarization: stuff vs map_reduce, routed by tiktoken."""

from __future__ import annotations

import logging
from typing import Tuple

import tiktoken
from langchain_classic.chains.summarize import load_summarize_chain
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import settings

logger = logging.getLogger(__name__)

STUFF_PROMPT = PromptTemplate(
    input_variables=["text"],
    template=(
        "You are a precise literary summarizer. Compress the material below into a "
        "~150-word summary that preserves: (1) key plot events and outcomes, "
        "(2) characters introduced or developed, (3) themes or motifs, "
        "(4) how the section ends. This summary feeds memory for later chapters. "
        "Accuracy over style. Output ONLY the summary prose.\n\n{text}\n\nSUMMARY:"
    ),
)

MAP_PROMPT = PromptTemplate(
    input_variables=["text"],
    template=(
        "Summarize this excerpt for a novel's running memory (~60–80 words). "
        "Keep names, causal links, and emotional stakes. Output ONLY summary prose.\n\n"
        "{text}\n\nEXCERPT SUMMARY:"
    ),
)

COMBINE_PROMPT = PromptTemplate(
    input_variables=["text"],
    template=(
        "Merge the partial summaries below into ONE ~150-word chapter summary "
        "for long-form story memory (plot, characters, themes, ending beat). "
        "Output ONLY the merged summary.\n\n{text}\n\nFINAL CHAPTER SUMMARY:"
    ),
)


def _encoding():
    try:
        return tiktoken.encoding_for_model(settings.OPENAI_MODEL)
    except KeyError:
        return tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_encoding().encode(text))


def _context_header(book_brief: str, chapter_title: str) -> str:
    return f"Book concept: {book_brief}\nChapter title: {chapter_title}\n\n"


async def summarize_chapter_langchain(
    chapter_content: str,
    book_brief: str,
    chapter_title: str,
) -> Tuple[str, str]:
    """
    Single-pass stuff summarization when under token budget; otherwise split with
    RecursiveCharacterTextSplitter (tiktoken-sized chunks) and map_reduce.
    """
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("LangChain chapter summary requires OPENAI_API_KEY")

    body = (chapter_content or "").strip()
    if not body:
        return "", settings.OPENAI_MODEL

    header = _context_header(book_brief, chapter_title)
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        temperature=0.3,
    )
    model_tag = settings.OPENAI_MODEL

    total_tokens = count_tokens(header + body)
    if total_tokens <= settings.LANGCHAIN_STUFF_MAX_TOKENS:
        chain = load_summarize_chain(
            llm,
            chain_type="stuff",
            prompt=STUFF_PROMPT,
            verbose=False,
        )
        docs = [Document(page_content=header + body)]
        out = await chain.ainvoke({"input_documents": docs})
        text = out.get("output_text", "").strip()
        return text, model_tag

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.LANGCHAIN_MAP_CHUNK_TOKENS,
        chunk_overlap=settings.LANGCHAIN_MAP_CHUNK_OVERLAP,
        length_function=count_tokens,
    )
    raw_chunks = splitter.split_text(body) or [body]
    docs = [Document(page_content=header + chunk) for chunk in raw_chunks]

    chain = load_summarize_chain(
        llm,
        chain_type="map_reduce",
        map_prompt=MAP_PROMPT,
        combine_prompt=COMBINE_PROMPT,
        verbose=False,
        token_max=settings.LANGCHAIN_MAP_REDUCE_TOKEN_MAX,
    )
    out = await chain.ainvoke({"input_documents": docs})
    text = out.get("output_text", "").strip()
    return text, model_tag
