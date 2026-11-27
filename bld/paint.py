"""A cube painted by hand: the 54 sticker colours turned back into a cube state.

Someone who scrambled a real cube by hand has no move sequence, only what they see.  The web app
lets them paint the unfolded net and sends the colours as a "scramble" that starts with ``~``:
54 face letters, nine per face in the order U R F D L B, each face in reading order (the same
strings ``render.facelets`` produces).  Every function that takes a scramble goes through
``scramble_state``, so a painted cube works everywhere a move sequence does.

Not every painting is a cube: this module checks that the centres are standard, that every piece
exists exactly once and that corners are not mirrored.  Whether the pieces are in a reachable
arrangement (one flipped edge, one swapped pair...) is checked by the solver's own verification.
"""
from .cube import SLOTS, apply_alg, solved_state
from .render import FACES, _FACE_OF_NORMAL, sticker_cell

PAINT_PREFIX = "~"


def is_painted(scramble):
    return scramble.lstrip().startswith(PAINT_PREFIX)


def _cubies():
    """{position: [sticker slots of that piece]} for the 12 edges and 8 corners."""
    pieces = {}
    for slot in range(48):
        pieces.setdefault(SLOTS[slot][0], []).append(slot)
    return pieces


_PIECES = _cubies()
_NAME = {slot: _FACE_OF_NORMAL[SLOTS[slot][1]] for slot in range(54)}      # face the sticker lies on
_BY_COLOURS = {frozenset(_NAME[s] for s in slots): slots for slots in _PIECES.values()}


def _det(vectors):
    (a, b, c), (d, e, f), (g, h, i) = vectors
    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)


def state_from_facelets(text):
    """Cube state for 54 painted colours; ValueError (with a message for the person) if impossible."""
    text = "".join(text.split())
    if len(text) != 54 or any(ch not in FACES for ch in text):
        raise ValueError("a painted cube needs all 54 stickers coloured")
    colour = {}
    for slot in range(54):
        face, cell = sticker_cell(slot)
        colour[slot] = text[FACES.index(face) * 9 + cell]
    for centre in range(48, 54):
        if colour[centre] != _NAME[centre]:
            raise ValueError("the centres must keep their colours: white up, green front, red right")
    for face in FACES:
        if text.count(face) != 9:
            raise ValueError(f"each colour must be used on exactly nine stickers ({face} has {text.count(face)})")

    state = list(solved_state())
    seen = set()
    for position, slots in _PIECES.items():
        colours = frozenset(colour[s] for s in slots)
        home = _BY_COLOURS.get(colours) if len(colours) == len(slots) else None
        if home is None:
            kind = "edge" if len(slots) == 2 else "corner"
            raise ValueError(f"a {kind} with colours {' '.join(sorted(colour[s] for s in slots))} does not exist on a cube")
        if tuple(home) in seen:
            raise ValueError(f"the piece {'-'.join(sorted(_NAME[s] for s in home))} appears twice")
        seen.add(tuple(home))
        target = {_NAME[h]: h for h in home}
        for s in slots:
            state[s] = target[colour[s]]
        if len(slots) == 3:      # a corner whose colours run the wrong way round is mirrored: impossible
            if _det([SLOTS[s][1] for s in slots]) * _det([SLOTS[state[s]][1] for s in slots]) < 0:
                raise ValueError("a corner is mirrored: its colours run the wrong way round")
    return tuple(state)


def scramble_state(scramble):
    """Cube state of a scramble: a move sequence, or a painted cube ("~" and 54 colours)."""
    scramble = scramble.strip()
    if scramble.startswith(PAINT_PREFIX):
        return state_from_facelets(scramble[len(PAINT_PREFIX):])
    return apply_alg(solved_state(), scramble)
