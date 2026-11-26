"""The letter-pair words (web/src/data/letter-pairs.json): read them, and save an edited word.

The file is the single source of truth: the Pairs page bundles it at build time and also
reads it through the API, so an edit shows up on reload without a rebuild.
"""
import json
import os
import tempfile

PAIRS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          "web", "src", "data", "letter-pairs.json")
MAX_WORD = 40


def load_pairs():
    with open(PAIRS_FILE, encoding="utf-8") as f:
        return json.load(f)


def set_pair(pair, word):
    """Replace the word of an existing pair (e.g. "AB") and rewrite the file.  Raises ValueError."""
    pairs = load_pairs()
    if pair not in pairs:
        raise ValueError(f"unknown pair {pair!r}")
    word = " ".join(str(word).split())
    if not word:
        raise ValueError("the word cannot be empty")
    if len(word) > MAX_WORD:
        raise ValueError(f"the word is longer than {MAX_WORD} characters")
    pairs[pair] = word
    # Same layout as the checked-in file (2-space indent, no trailing newline), written atomically.
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(PAIRS_FILE), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(pairs, f, indent=2, ensure_ascii=False)
        os.replace(tmp, PAIRS_FILE)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise
    return {"pair": pair, "word": word}
