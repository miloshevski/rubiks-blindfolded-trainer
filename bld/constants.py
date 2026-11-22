"""All hardcoded method data, transcribed from RUBIKS_SKILL.md.

Pure constants: no logic lives here.  ``method.py`` builds the full algorithm
tables from these, and ``cube.py`` uses the sticker names.
"""

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWX"

# --- Speffz sticker lettering, in letter order A..X ----------------------------
# (The B-face edge row is R=BL, T=BR; see the skill's edge-table note.)
EDGE_NAMES = (
    "UB UR UF UL  LU LF LD LB  FU FR FD FL  RU RB RD RF  BU BL BD BR  DF DR DB DL"
).split()
CORNER_NAMES = (
    "UBL UBR UFR UFL  LUB LUF LDF LDB  FUL FUR FDR FDL  RUF RUB RDB RDF  "
    "BUR BUL BDL BDR  DFL DFR DBR DBL"
).split()

# Center stickers, one per face (tracked so slice moves like M2 render correctly).
CENTER_NAMES = ["U", "R", "F", "D", "L", "B"]

# --- edges (M2, buffer DF = stickers K/U) --------------------------------------
EDGE_BUFFER_LETTERS = ("K", "U")
EDGE_TRACE_LETTER = "U"          # sticker read in the buffer slot (matches the tutorial examples)
EDGE_SWAP_MOVE = "M2"

# Setup moves; the algorithm is  setup + M2 + inverse(setup).
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

# --- corners (Old Pochmann, buffer UBL = stickers A/E/R) ------------------------
CORNER_BUFFER_LETTERS = ("A", "E", "R")
# With the supplied algorithms the sticker in slot E is the one sent to the target.
CORNER_TRACE_LETTER = "E"

Y_PERM = "R U' R' U' R U R' F' R U R' U' R' F R"      # the skill's "altered Y-permutation"

# Setup moves; the algorithm is  setup + Y_PERM + inverse(setup).
CORNER_SETUP = {
    "B": "R2", "C": "F2 D", "D": "F2", "F": "F' D", "G": "F'", "H": "D' R",
    "I": "F R'", "J": "R'", "K": "F' R'", "L": "F2 R'", "M": "F", "N": "R' F",
    "O": "R2 F", "P": "R F", "Q": "R D'", "S": "D F'", "T": "R", "U": "D",
    "V": "", "W": "D'", "X": "D2",
}

# --- parity ----------------------------------------------------------------------
PARITY_ALGS = {
    1: "M2 U' M U2 M U' M' U2 M' U2",
    2: "D' L2 D M2 D' L2 D",
}
DEFAULT_PARITY = 1

# --- output labels ---------------------------------------------------------------
LABEL_EDGES = "Edges:"
LABEL_PARITY = "Parity:"
LABEL_CORNERS = "Corners:"
LABEL_SOLVED = "(already solved)"
