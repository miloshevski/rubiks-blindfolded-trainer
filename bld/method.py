"""M2 (edges) + Old Pochmann (corners) data, transcribed from RUBIKS_SKILL.md.

Nothing here is invented: setups, special algorithms, the altered Y-permutation,
corner setups and parity algorithms are the ones recorded in the skill file.
"""
from .cube import invert_alg

# --- edges (buffer DF = stickers K/U) -------------------------------------------
EDGE_BUFFER_LETTERS = ("K", "U")
EDGE_TRACE_LETTER = "U"          # sticker read in the buffer slot (matches the tutorial examples)

EDGE_SETUP = {
    "B": "R U R' U'", "D": "L' U' L U", "E": "B L' B'", "F": "B L2 B'",
    "G": "B L B'", "H": "L B L' B'", "J": "U R U'", "L": "U' L' U",
    "M": "B' R B", "N": "R' B' R B", "O": "B' R' B", "P": "B' R2 B",
    "R": "U' L U", "T": "U R' U'", "V": "U R2 U'", "X": "U' L2 U",
}

# Dedicated algorithms (A is a bare M2; the others are not setup + M2 + undo).
EDGE_SPECIAL = {
    "A": "M2",
    "C": "U2 M' U2 M'",
    "I": "D M' U R2 U' M U R2 U' D' M2",
    "Q": "U B' R U' B M2 B' U R' B U'",
    "S": "M2 D U R2 U' M' U R2 U' M D'",
    "W": "M U2 M U2",
}

# After an odd number of M2 swaps UF and DB are swapped, so on even-numbered
# targets these letters are executed as their opposite.
OPPOSITE = {"C": "W", "W": "C", "I": "S", "S": "I"}


def edge_alg(letter):
    if letter in EDGE_BUFFER_LETTERS:
        raise ValueError(f"{letter} is an edge buffer sticker; it has no algorithm")
    if letter in EDGE_SPECIAL:
        return EDGE_SPECIAL[letter]
    setup = EDGE_SETUP[letter]
    return f"{setup} M2 {invert_alg(setup)}"


EDGE_ALG = {l: edge_alg(l) for l in "ABCDEFGHIJLMNOPQRSTVWX"}

# --- corners (buffer UBL = stickers A/E/R) ---------------------------------------
CORNER_BUFFER_LETTERS = ("A", "E", "R")
# With the supplied algorithms the sticker in slot E is the one sent to the target.
CORNER_TRACE_LETTER = "E"

Y_PERM = "R U' R' U' R U R' F' R U R' U' R' F R"      # the skill's "altered Y-permutation"

CORNER_SETUP = {
    "B": "R2", "C": "F2 D", "D": "F2", "F": "F' D", "G": "F'", "H": "D' R",
    "I": "F R'", "J": "R'", "K": "F' R'", "L": "F2 R'", "M": "F", "N": "R' F",
    "O": "R2 F", "P": "R F", "Q": "R D'", "S": "D F'", "T": "R", "U": "D",
    "V": "", "W": "D'", "X": "D2",
}


def corner_alg(letter):
    """setup + altered Y-perm + inverse setup, kept literal as in the skill table."""
    if letter in CORNER_BUFFER_LETTERS:
        raise ValueError(f"{letter} is a corner buffer sticker; it has no algorithm")
    setup = CORNER_SETUP[letter]
    return " ".join(p for p in (setup, Y_PERM, invert_alg(setup)) if p)


CORNER_ALG = {l: corner_alg(l) for l in CORNER_SETUP}

# --- parity ----------------------------------------------------------------------
PARITY_ALGS = {
    1: "M2 U' M U2 M U' M' U2 M' U2",
    2: "D' L2 D M2 D' L2 D",
}
