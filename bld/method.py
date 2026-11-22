"""Builds the full M2 (edges) + Old Pochmann (corners) algorithm tables.

The raw data lives in ``constants.py`` (transcribed from RUBIKS_SKILL.md);
this module only assembles it into complete algorithms.
"""
from .constants import (CORNER_BUFFER_LETTERS, CORNER_SETUP, CORNER_TRACE_LETTER,
                        EDGE_BUFFER_LETTERS, EDGE_SETUP, EDGE_SPECIAL,
                        EDGE_SWAP_MOVE, EDGE_TRACE_LETTER, OPPOSITE, PARITY_ALGS,
                        Y_PERM)
from .cube import invert_alg


def edge_alg(letter):
    if letter in EDGE_BUFFER_LETTERS:
        raise ValueError(f"{letter} is an edge buffer sticker; it has no algorithm")
    if letter in EDGE_SPECIAL:
        return EDGE_SPECIAL[letter]
    setup = EDGE_SETUP[letter]
    return f"{setup} {EDGE_SWAP_MOVE} {invert_alg(setup)}"


def corner_alg(letter):
    """setup + altered Y-perm + inverse setup, kept literal as in the skill table."""
    if letter in CORNER_BUFFER_LETTERS:
        raise ValueError(f"{letter} is a corner buffer sticker; it has no algorithm")
    setup = CORNER_SETUP[letter]
    return " ".join(p for p in (setup, Y_PERM, invert_alg(setup)) if p)


EDGE_ALG = {l: edge_alg(l)
            for l in sorted(set(EDGE_SETUP) | set(EDGE_SPECIAL))}
CORNER_ALG = {l: corner_alg(l) for l in CORNER_SETUP}

# Re-exported so callers can keep using ``method.<NAME>``.
__all__ = [
    "CORNER_ALG", "CORNER_BUFFER_LETTERS", "CORNER_SETUP", "CORNER_TRACE_LETTER",
    "EDGE_ALG", "EDGE_BUFFER_LETTERS", "EDGE_SETUP", "EDGE_SPECIAL",
    "EDGE_TRACE_LETTER", "OPPOSITE", "PARITY_ALGS", "Y_PERM",
    "corner_alg", "edge_alg",
]
