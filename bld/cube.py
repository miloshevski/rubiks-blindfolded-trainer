"""Sticker-level 3x3 cube model (Speffz lettering).

A cube state is an immutable tuple of 54 ints.  Index ``i`` is a *slot*
(a sticker position); the value is the *home slot* of the sticker that is
currently sitting there.  Slots 0-23 are the edge stickers A-X, slots 24-47
are the corner stickers A-X, slots 48-53 are the centers U R F D L B.
Face turns only spin their own center in place; slice moves (M) move centers.

Nothing in this module mutates a state: every operation returns a new tuple.
"""
import random

from .constants import CENTER_NAMES, CORNER_NAMES, EDGE_NAMES, LETTERS

EDGE, CORNER = "edge", "corner"
OFFSET = {EDGE: 0, CORNER: 24}
CENTER_OFFSET = 48

FACE_VECTORS = _FACE = {
    "U": (0, 1, 0), "D": (0, -1, 0),
    "R": (1, 0, 0), "L": (-1, 0, 0),
    "F": (0, 0, 1), "B": (0, 0, -1),
}


def _slot(name):
    """(position vector, normal vector) of a sticker named like 'UBL'."""
    pos = tuple(sum(_FACE[c][i] for c in name) for i in range(3))
    return pos, _FACE[name[0]]


_NAMES = {EDGE: EDGE_NAMES, CORNER: CORNER_NAMES}
SLOTS = ([_slot(n) for n in EDGE_NAMES] + [_slot(n) for n in CORNER_NAMES]
         + [_slot(n) for n in CENTER_NAMES])
NUM_SLOTS = len(SLOTS)
_SLOT_INDEX = {s: i for i, s in enumerate(SLOTS)}
assert len(set(SLOTS)) == NUM_SLOTS == 54


def center_index(face):
    return CENTER_OFFSET + CENTER_NAMES.index(face)


def centers_solved(state):
    return all(state[i] == i for i in range(CENTER_OFFSET, NUM_SLOTS))


def slot_name(kind, letter):
    return _NAMES[kind][LETTERS.index(letter)]


def slot_index(kind, letter):
    return OFFSET[kind] + LETTERS.index(letter)


def piece_of(kind, letter):
    """Letters of all stickers that belong to the same cubie as ``letter``."""
    pos = SLOTS[slot_index(kind, letter)][0]
    return frozenset(
        l for l in LETTERS if SLOTS[slot_index(kind, l)][0] == pos
    )


# --- moves -----------------------------------------------------------------
# Clockwise quarter turn of each face (seen from that face) as a vector map;
# M follows the direction of L.
_ROT = {
    "U": lambda x, y, z: (-z, y, x),
    "D": lambda x, y, z: (z, y, -x),
    "R": lambda x, y, z: (x, z, -y),
    "L": lambda x, y, z: (x, -z, y),
    "M": lambda x, y, z: (x, -z, y),
    "F": lambda x, y, z: (y, -x, z),
    "B": lambda x, y, z: (-y, x, z),
}
_LAYER = {
    "U": lambda p: p[1] == 1, "D": lambda p: p[1] == -1,
    "R": lambda p: p[0] == 1, "L": lambda p: p[0] == -1,
    "M": lambda p: p[0] == 0,
    "F": lambda p: p[2] == 1, "B": lambda p: p[2] == -1,
}


def _quarter_turn_perm(face):
    """src[j] = slot whose sticker lands in slot j after one clockwise turn."""
    src = list(range(NUM_SLOTS))
    for i, (pos, normal) in enumerate(SLOTS):
        if _LAYER[face](pos):
            dest = _SLOT_INDEX[(_ROT[face](*pos), _ROT[face](*normal))]
            src[dest] = i
    return tuple(src)


_QUARTER = {f: _quarter_turn_perm(f) for f in _ROT}


def _compose(first, second):
    """Permutation equal to applying ``first`` and then ``second``."""
    return tuple(first[s] for s in second)


def _move_perm(token):
    face, suffix = token[0], token[1:]
    if face not in _QUARTER or suffix not in ("", "'", "2"):
        raise ValueError(f"bad move: {token!r}")
    q = _QUARTER[face]
    q2 = _compose(q, q)
    return {"": q, "2": q2, "'": _compose(q2, q)}[suffix]


_MOVE_CACHE = {}


def apply_alg(state, alg):
    """Return a new state with ``alg`` (space separated moves) applied."""
    for token in alg.split():
        perm = _MOVE_CACHE.get(token)
        if perm is None:
            perm = _MOVE_CACHE[token] = _move_perm(token)
        state = tuple(state[s] for s in perm)
    return state


def invert_alg(alg):
    out = []
    for t in reversed(alg.split()):
        if t.endswith("2"):
            out.append(t)
        elif t.endswith("'"):
            out.append(t[:-1])
        else:
            out.append(t + "'")
    return " ".join(out)


# --- state helpers ---------------------------------------------------------
def solved_state():
    return tuple(range(NUM_SLOTS))


def is_solved(state):
    return state == solved_state()


def home_letter(state, kind, letter):
    """Letter of the slot where the sticker now at ``letter`` belongs."""
    return LETTERS[state[slot_index(kind, letter)] - OFFSET[kind]]


def piece_solved(state, kind, letter):
    """True if the whole cubie containing ``letter`` is in place and oriented."""
    return all(home_letter(state, kind, l) == l for l in piece_of(kind, letter))


# --- scrambles -------------------------------------------------------------
_AXIS = {"U": 0, "D": 0, "L": 1, "R": 1, "F": 2, "B": 2}


def random_scramble(length=20, rng=None):
    """Random-move scramble: no repeated face, no 'U D U' style redundancy."""
    rng = rng or random.Random()
    moves, history = [], []
    while len(moves) < length:
        face = rng.choice("UDLRFB")
        if history and face == history[-1]:
            continue
        if len(history) >= 2 and _AXIS[face] == _AXIS[history[-1]] == _AXIS[history[-2]]:
            continue
        history.append(face)
        moves.append(face + rng.choice(["", "'", "2"]))
    return " ".join(moves)
