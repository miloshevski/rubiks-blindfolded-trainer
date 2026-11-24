"""JSON payloads of the web API: one scramble and its solution, a typed solution check,
and the full algorithm list.  Pure functions; ``server.py`` does the HTTP side."""
import random

from .constants import (CORNER_BUFFER_LETTERS, CORNER_NAMES, CORNER_SETUP, DEFAULT_PARITY,
                        EDGE_BUFFER_LETTERS, EDGE_NAMES, EDGE_SETUP, EDGE_SPECIAL,
                        EDGE_SWAP_MOVE, LETTERS, OPPOSITE, PARITY_ALGS, Y_PERM)
from .cube import apply_alg, invert_alg, random_scramble, solved_state
from .practice import check, normalize, user_steps
from .render import ABSOLUTE_LETTERS, facelets, sticker_letters
from .solver import format_solution, pair_up, solve, verify


def _check_parity(parity):
    if parity not in PARITY_ALGS:
        raise ValueError(f"parity must be one of {sorted(PARITY_ALGS)}")


def _clean(scramble):
    """Scramble with runs of whitespace collapsed to single spaces."""
    return " ".join(scramble.split())


def build_payload(scramble=None, seed=None, parity=DEFAULT_PARITY):
    """Everything the page needs for one scramble.  Raises ValueError on bad input."""
    _check_parity(parity)
    if not scramble or not scramble.strip():
        scramble = random_scramble(rng=random.Random(seed))
    scramble = _clean(scramble)
    state = apply_alg(solved_state(), scramble)
    solution = solve(state, parity_number=parity)
    return {
        "scramble": scramble,
        "facelets": facelets(state),
        "letters": sticker_letters(state),          # relative lettering of this state
        "absolute_letters": ABSOLUTE_LETTERS,
        "edge_memo": pair_up(solution.edge_memo),
        "corner_memo": pair_up(solution.corner_memo),
        "solution": format_solution(solution),
        "verified": verify(scramble, solution),
        "frames": frames_for(state, solution.labelled_steps()),
    }


def check_payload(scramble, edges, corners, parity_number=None):
    """Run the user's typed solution on the scramble.  Raises ValueError on bad input."""
    if not scramble or not scramble.strip():
        raise ValueError("no scramble")
    if parity_number is not None:
        _check_parity(parity_number)
    state = apply_alg(solved_state(), _clean(scramble))
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


def _api_cube(first):
    seed = first("seed")
    return build_payload(first("scramble", None), int(seed) if seed else None,
                         int(first("parity", DEFAULT_PARITY)))


def _api_check(first):
    parity = int(first("parity_alg", DEFAULT_PARITY)) if first("parity") == "1" else None
    return check_payload(first("scramble"), first("edges"), first("corners"), parity)


# Endpoint -> handler(first), where first(key, default="") reads one query parameter.
API = {"/api/cube": _api_cube, "/api/check": _api_check, "/api/algs": lambda first: algs_payload()}
