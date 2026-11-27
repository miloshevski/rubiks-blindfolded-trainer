"""Turn a cube state into the 54 facelet colors a renderer needs.

Each face is a 9-character string in reading order (row by row, top-left to
bottom-right) as seen when looking at that face from outside the cube, using
the usual unfolded net: U has B at its top; D has F at its top; L, F, R, B are
read with U at the top.  Characters are face letters (U R F D L B) naming the
face whose center has that sticker's color.
"""
from .constants import LETTERS
from .cube import CENTER_OFFSET, FACE_VECTORS, SLOTS, solved_state

NO_LETTER = "."                 # centers carry no letter

FACES = "URFDLB"
_FACE_OF_NORMAL = {v: k for k, v in FACE_VECTORS.items()}


# (row, col) in the 3x3 grid of a face for a sticker at position (x, y, z).
_CELL = {
    "U": lambda x, y, z: (1 + z, 1 + x),
    "D": lambda x, y, z: (1 - z, 1 + x),
    "F": lambda x, y, z: (1 - y, 1 + x),
    "B": lambda x, y, z: (1 - y, 1 - x),
    "R": lambda x, y, z: (1 - y, 1 - z),
    "L": lambda x, y, z: (1 - y, 1 + z),
}


def _grids(state, value):
    """{face: 9-char string} with ``value(home_slot)`` for every sticker position."""
    grids = {f: [[f] * 3 for _ in range(3)] for f in FACES}
    for slot, home in enumerate(state):
        pos, normal = SLOTS[slot]
        face = _FACE_OF_NORMAL[normal]
        row, col = _CELL[face](*pos)
        grids[face][row][col] = value(home)
    return {f: "".join("".join(r) for r in g) for f, g in grids.items()}


def sticker_cell(slot):
    """(face letter, cell 0-8 in that face's string) of a sticker slot's position."""
    pos, normal = SLOTS[slot]
    face = _FACE_OF_NORMAL[normal]
    row, col = _CELL[face](*pos)
    return face, row * 3 + col


def facelets(state):
    """{face letter: 9-char color string} for ``state``."""
    return _grids(state, lambda home: _FACE_OF_NORMAL[SLOTS[home][1]])


def _speffz(slot):
    """Speffz letter of a sticker slot (edges 0-23, corners 24-47); centers have none."""
    return NO_LETTER if slot >= CENTER_OFFSET else LETTERS[slot % 24]


def sticker_letters(state):
    """Relative lettering: the letter of the physical sticker now at each position."""
    return _grids(state, _speffz)


# Absolute lettering: the letter of each position, fixed regardless of the state.
ABSOLUTE_LETTERS = sticker_letters(solved_state())
