"""Check a solution typed by the user.

The user enters the letters exactly as they execute them (including any
C/W/I/S substitution) and says whether they do parity.  Nothing is added or
changed: edge letters run their M2 algorithm, corner letters their Old
Pochmann algorithm, in the order typed.
"""
from . import method
from .constants import LETTERS, PARITY_ALGS
from .cube import (CORNER, EDGE, apply_alg, home_letter, is_solved, piece_of,
                   slot_name)


def normalize(text):
    """'hj DF  ab' -> 'HJDFAB'.  Spaces are ignored, case does not matter."""
    letters = "".join((text or "").split()).upper()
    bad = sorted({c for c in letters if c not in LETTERS})
    if bad:
        raise ValueError(f"not a letter A-X: {' '.join(bad)}")
    return letters


def user_steps(edges, corners, parity_number=None):
    """[(label, algorithm), ...] in execution order: edges, parity, corners."""
    edge_letters, corner_letters = normalize(edges), normalize(corners)
    for l in edge_letters:
        if l in method.EDGE_BUFFER_LETTERS:
            raise ValueError(f"edge letter {l} is the buffer (no algorithm)")
    for l in corner_letters:
        if l in method.CORNER_BUFFER_LETTERS:
            raise ValueError(f"corner letter {l} is the buffer (no algorithm)")
    steps = [(f"Edges {l}", method.EDGE_ALG[l]) for l in edge_letters]
    if parity_number is not None:
        steps.append(("Parity", PARITY_ALGS[parity_number]))
    steps += [(f"Corners {l}", method.CORNER_ALG[l]) for l in corner_letters]
    return steps


# Every Old Pochmann algorithm (altered Y-perm) also swaps the UB and UL edges,
# and every M2 swap also swaps UF and DB.  These side effects only cancel out
# with the right target counts and parity, so the end state can look like
# "corners solved, two edges wrong" when the mistake is really in the corners.
UB_UL = frozenset("AQDE")      # stickers of the UB and UL edges
UF_DB = frozenset("CIWS")      # stickers of the UF and DB edges


def _wrong_stickers(state, kind):
    return frozenset(l for l in LETTERS if home_letter(state, kind, l) != l)


def _piece_names(kind, wrong):
    names = []
    for l in LETTERS:
        if l in wrong:
            # usual piece name: start with the U/D sticker, else the F/B one (UB, DB, FR, UBL)
            stickers = [slot_name(kind, p) for p in piece_of(kind, l)]
            name = min(stickers, key=lambda n: ("UDFBLR".index(n[0]) // 2, n))
            if name not in names:
                names.append(name)
    return names


def check(scrambled_state, steps):
    """Execute ``steps`` on a copy of the scrambled state and report."""
    state = scrambled_state
    for _, alg in steps:
        state = apply_alg(state, alg)
    wrong_e = _wrong_stickers(state, EDGE)
    wrong_c = _wrong_stickers(state, CORNER)

    note = ""
    corner_side_effect = bool(wrong_e) and wrong_e == UB_UL
    if corner_side_effect and not wrong_c:
        note = ("Corners are in place but UB and UL are swapped. Every corner algorithm "
                "also swaps UB/UL, so the number of corner targets has the wrong parity "
                "(odd vs. even) for the parity choice.")
    elif wrong_e == UB_UL | UF_DB and not wrong_c:
        note = ("Only UF/DB and UB/UL are swapped: the parity algorithm is missing "
                "(odd number of edge and corner targets).")
    elif corner_side_effect:
        note = "UB/UL are swapped by the corner algorithms; the mistake is in the corners."

    return {
        "correct": is_solved(state),
        # the UB/UL swap is caused by the corner algorithms, so it counts against corners
        "edges_correct": not wrong_e or corner_side_effect,
        "corners_correct": not wrong_c and not corner_side_effect,
        "wrong_edges": _piece_names(EDGE, wrong_e),
        "wrong_corners": _piece_names(CORNER, wrong_c),
        "note": note,
    }
