"""
Assembles token-bounded prompt context for chapter generation and edits.

Core logic: book brief + global_summary + prior chapter full text +
other chapters' summaries only (Phase 1 Step 11 / Phase 2).
"""
