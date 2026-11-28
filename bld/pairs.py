"""The default letter-pair words (web/src/data/letter-pairs.json), read only.

The Pairs page bundles the file at build time. A visitor's own edits live in their browser,
never on the server, so nobody can change the words for anyone else.
"""
import json
import os

PAIRS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          "web", "src", "data", "letter-pairs.json")


def load_pairs():
    with open(PAIRS_FILE, encoding="utf-8") as f:
        return json.load(f)
