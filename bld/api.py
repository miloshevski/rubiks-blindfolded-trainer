"""JSON payloads of the web API: one scramble and its solution, a typed solution check,
and the full algorithm list.  Pure functions; ``server.py`` does the HTTP side."""
import random

from . import pairs
from .constants import (CORNER_BUFFER_LETTERS, CORNER_NAMES, CORNER_SETUP, DEFAULT_PARITY,
                        EDGE_BUFFER_LETTERS, EDGE_NAMES, EDGE_SETUP, EDGE_SPECIAL,
                        EDGE_SWAP_MOVE, LETTERS, OPPOSITE, PARITY_ALGS, Y_PERM)
from .cube import CORNER, EDGE, apply_alg, invert_alg, random_scramble, slot_index, solved_state
from .paint import is_painted, scramble_state
from .practice import check, normalize, user_steps
from .render import ABSOLUTE_LETTERS, facelets, sticker_cell, sticker_letters
from .solver import format_solution, pair_up, solve, verify


def _check_parity(parity):
    if parity not in PARITY_ALGS:
        raise ValueError(f"parity must be one of {sorted(PARITY_ALGS)}")


MAX_SCRAMBLE_MOVES = 300     # a real scramble has about 20; this only keeps a bot from sending a huge one


def _clean(scramble):
    """Scramble with runs of whitespace collapsed to single spaces; ValueError if it is absurdly long."""
    moves = scramble.split()
    if len(moves) > MAX_SCRAMBLE_MOVES:
        raise ValueError(f"the scramble is too long ({MAX_SCRAMBLE_MOVES} moves at most)")
    return " ".join(moves)


UNREACHABLE = ("this cube cannot be solved: a single edge is flipped, a single corner is twisted, "
               "or two pieces are swapped. Check the colours you painted")


def build_payload(scramble=None, seed=None, parity=DEFAULT_PARITY):
    """Everything the page needs for one scramble.  Raises ValueError on bad input."""
    _check_parity(parity)
    if not scramble or not scramble.strip():
        scramble = random_scramble(rng=random.Random(seed))
    scramble = _clean(scramble)
    state = scramble_state(scramble)
    solution = solve(state, parity_number=parity)
    verified = verify(scramble, solution)
    if is_painted(scramble) and not verified:
        raise ValueError(UNREACHABLE)
    return {
        "scramble": scramble,
        "facelets": facelets(state),
        "letters": sticker_letters(state),          # relative lettering of this state
        "absolute_letters": ABSOLUTE_LETTERS,
        "edge_memo": pair_up(solution.edge_memo),
        "corner_memo": pair_up(solution.corner_memo),
        # Memo cycles in memo order: {"size": letters in the cycle, "kind": "buffer" | "cycle" | "flip"}.
        "edge_cycles": [{"size": n, "kind": k} for n, k in solution.edge_groups],
        "corner_cycles": [{"size": n, "kind": k} for n, k in solution.corner_groups],
        "solution": format_solution(solution),
        "verified": verified,
        "frames": frames_for(state, solution.labelled_steps()),
    }


def check_payload(scramble, edges, corners, parity_number=None):
    """Run the user's typed solution on the scramble.  Raises ValueError on bad input."""
    if not scramble or not scramble.strip():
        raise ValueError("no scramble")
    if parity_number is not None:
        _check_parity(parity_number)
    state = scramble_state(_clean(scramble))
    steps = user_steps(edges, corners, parity_number)
    result = check(state, steps)
    result["edges"] = normalize(edges)
    result["corners"] = normalize(corners)
    result["frames"] = frames_for(state, steps)
    return result


def frames_for(state, labelled):
    """Cube after every single move of [(label, algorithm), ...]."""
    frames = []
    for label, alg in labelled:
        for move in alg.split():
            state = apply_alg(state, move)
            frames.append({"label": label, "move": move, "facelets": facelets(state),
                           "letters": sticker_letters(state)})
    return frames


def algs_payload():
    """Every algorithm of the method, split into setup / core / undo for display."""
    def row(letter, sticker, setup, core, undo="", **extra):
        return {"letter": letter, "sticker": sticker, "setup": setup, "core": core,
                "undo": undo, **extra}

    edges = []
    for letter, sticker in zip(LETTERS, EDGE_NAMES):
        if letter in EDGE_BUFFER_LETTERS:
            edges.append(row(letter, sticker, "", "", buffer=True))
        elif letter in EDGE_SPECIAL:
            edges.append(row(letter, sticker, "", EDGE_SPECIAL[letter],
                             opposite=OPPOSITE.get(letter), special=True))
        else:
            setup = EDGE_SETUP[letter]
            edges.append(row(letter, sticker, setup, EDGE_SWAP_MOVE, invert_alg(setup),
                             opposite=OPPOSITE.get(letter)))
    corners = []
    for letter, sticker in zip(LETTERS, CORNER_NAMES):
        if letter in CORNER_BUFFER_LETTERS:
            corners.append(row(letter, sticker, "", "", buffer=True))
        else:
            setup = CORNER_SETUP[letter]
            corners.append(row(letter, sticker, setup, Y_PERM, invert_alg(setup) if setup else ""))
    for r in edges + corners:     # the full algorithm, exactly as the solver runs it
        r["alg"] = " ".join(p for p in (r["setup"], r["core"], r["undo"]) if p)
    return {
        "edges": edges, "corners": corners,
        "parity": [{"number": n, "alg": a} for n, a in sorted(PARITY_ALGS.items())],
        "default_parity": DEFAULT_PARITY,
    }


def demo_payload(kind, letter):
    """One target's algorithm played on a solved cube, for the tutorial's animation.

    ``frames`` carry the phase of each move as their label ("setup", "swap", "undo"; a dedicated
    algorithm is all "swap"), and ``marks`` say which stickers are the buffer and the target.
    Raises ValueError for an unknown kind or letter, or for a buffer letter (it has no algorithm).
    """
    if kind not in ("edge", "corner"):
        raise ValueError("kind must be edge or corner")
    piece = EDGE if kind == "edge" else CORNER
    rows = algs_payload()["edges" if kind == "edge" else "corners"]
    row = next((r for r in rows if r["letter"] == letter), None)
    if row is None:
        raise ValueError(f"unknown {kind} letter {letter!r}")
    if row.get("buffer"):
        raise ValueError(f"{letter} is a buffer: it has no algorithm")
    parts = [{"phase": phase, "alg": alg} for phase, alg in
             (("setup", row["setup"]), ("swap", row["core"]), ("undo", row["undo"])) if alg]
    buffers = EDGE_BUFFER_LETTERS if kind == "edge" else CORNER_BUFFER_LETTERS

    def mark(role, one):
        face, index = sticker_cell(slot_index(piece, one))
        return {"face": face, "index": index, "role": role, "letter": one}

    solved = solved_state()
    return {
        "kind": kind, "letter": letter, "sticker": row["sticker"], "parts": parts,
        "buffers": list(buffers),
        "marks": [mark("buffer", b) for b in buffers] + [mark("target", letter)],
        "start": {"facelets": facelets(solved), "letters": ABSOLUTE_LETTERS},
        "absolute_letters": ABSOLUTE_LETTERS,
        "frames": frames_for(solved, [(p["phase"], p["alg"]) for p in parts]),
    }


def solve_demo_payload(scramble, part):
    """A scramble's edge or corner execution, target by target, for the tutorial's animation.

    Same shape as ``demo_payload`` but every target is its own part (phase "Edges B", "Corners C"),
    ``start`` is the scrambled cube and there are no marks.  Raises ValueError for bad input.
    """
    if part not in ("edges", "corners"):
        raise ValueError("part must be edges or corners")
    if not scramble or not scramble.strip():
        raise ValueError("no scramble")
    scramble = _clean(scramble)
    state = scramble_state(scramble)
    solution = solve(state)
    prefix = "Edges " if part == "edges" else "Corners "
    steps = [(label, alg) for label, alg in solution.labelled_steps() if label.startswith(prefix)]
    if part == "corners":      # the edges (and parity) go first, so the corners start from that state
        before = [alg for label, alg in solution.labelled_steps() if not label.startswith(prefix)]
        for alg in before:
            state = apply_alg(state, alg)
    memo = solution.edge_memo if part == "edges" else solution.corner_memo
    groups = solution.edge_groups if part == "edges" else solution.corner_groups
    return {
        "kind": part[:-1], "letter": "", "sticker": "", "scramble": scramble,
        "parts": [{"phase": label, "alg": alg} for label, alg in steps],
        "targets": list(memo), "groups": [{"size": n, "kind": k} for n, k in groups],
        "buffers": [], "marks": [],
        "start": {"facelets": facelets(state), "letters": sticker_letters(state)},
        "absolute_letters": ABSOLUTE_LETTERS,
        "frames": frames_for(state, steps),
    }


def _api_demo(first):
    if first("scramble"):
        return solve_demo_payload(first("scramble"), first("part", "edges"))
    return demo_payload(first("kind"), first("letter"))


def _api_cube(first):
    seed = first("seed")
    return build_payload(first("scramble", None), int(seed) if seed else None,
                         int(first("parity", DEFAULT_PARITY)))


def _api_check(first):
    parity = int(first("parity_alg", DEFAULT_PARITY)) if first("parity") == "1" else None
    return check_payload(first("scramble"), first("edges"), first("corners"), parity)


# Endpoint -> handler(first), where first(key, default="") reads one query parameter.
API = {"/api/cube": _api_cube, "/api/check": _api_check, "/api/algs": lambda first: algs_payload(),
       "/api/demo": _api_demo,
       "/api/pairs": lambda first: pairs.load_pairs()}


def _api_set_pair(body):
    if not isinstance(body, dict):
        raise ValueError("expected a JSON object")
    return pairs.set_pair(body.get("pair"), body.get("word"))


# Endpoints that change something: they take a JSON body.
POST_API = {"/api/pairs": _api_set_pair}
