"""JSON payloads of the web API: one scramble and its solution, a typed solution check,
and the full algorithm list.  Pure functions; ``server.py`` does the HTTP side."""
import random

from .constants import (CORNER_BUFFER_LETTERS, CORNER_NAMES, CORNER_SETUP, DEFAULT_PARITY,
                        EDGE_BUFFER_LETTERS, EDGE_NAMES, EDGE_SETUP, EDGE_SPECIAL,
                        EDGE_SWAP_MOVE, LETTERS, OPPOSITE, PARITY_ALGS, Y_PERM)
from .cube import apply_alg, invert_alg, random_scramble, solved_state
from .practice import check, normalize, user_steps
from .render import ABSOLUTE_LETTERS, facelets, sticker_letters
from .solver import format_solution, pair_up, solve, verify, trace_cycles
from .cube import EDGE, CORNER, slot_name
from .method import EDGE_ALG, CORNER_ALG


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
        "steps": structured_steps(state, solution),
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
    from .cube import home_letter
    final = state
    for _, alg in steps:
        final = apply_alg(final, alg)
    result["wrong_stickers"] = [sticker_id(kind, letter) for kind in (EDGE, CORNER)
                                for letter in LETTERS if home_letter(final, kind, letter) != letter]
    result["edges"] = normalize(edges)
    result["corners"] = normalize(corners)
    result["frames"] = frames_for(state, steps)
    return result


def frames_for(state, labelled):
    """Cube after every single move of [(label, algorithm), ...]."""
    frames = []
    for step_index, (label, alg) in enumerate(labelled):
        for move in alg.split():
            state = apply_alg(state, move)
            frames.append({"step": step_index, "label": label, "move": move, "facelets": facelets(state),
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


def sticker_id(kind, letter):
    name = slot_name(kind, letter)
    face = name[0]
    index = next(
        i for i, value in enumerate(ABSOLUTE_LETTERS[face])
        if value == letter and (i % 2 == 1 if kind == EDGE else i != 4 and i % 2 == 0))
    return f"{face}{index}"


def structured_steps(state, solution):
    result, position = [], 0
    working = state
    for kind, steps in ((EDGE, solution.edges), (CORNER, solution.corners)):
        events = []
        trace_cycles(working, kind, events)
        for step, event in zip(steps, events):
            buffer = "U" if kind == EDGE else "E"
            result.append({**event, "phase": kind + "s", "execution_target": step.exec_letter,
                           "algorithm": step.algorithm, "setup": (EDGE_SETUP.get(step.exec_letter, "") if kind == EDGE else CORNER_SETUP.get(step.exec_letter, "")), "start": position,
                           "buffer_sticker": sticker_id(kind, buffer),
                           "target_sticker": sticker_id(kind, step.memo_letter)})
            working = apply_alg(working, step.algorithm)
            position += len(step.algorithm.split())
        if kind == EDGE and solution.parity_algorithm:
            result.append({"phase": "parity", "memo_target": None, "execution_target": None,
                           "cycle_break": False, "algorithm": solution.parity_algorithm,
                           "start": position, "setup": "", "buffer_sticker": None, "target_sticker": None})
            working = apply_alg(working, solution.parity_algorithm)
            position += len(solution.parity_algorithm.split())
    return result


def state_payload(scramble):
    if not scramble or not scramble.strip():
        raise ValueError("no scramble")
    state = apply_alg(solved_state(), _clean(scramble))
    return {"scramble": _clean(scramble), "facelets": facelets(state), "letters": None}


def algorithm_check(first):
    kind, letter = first("kind"), first("letter")
    table = {"edges": EDGE_ALG, "corners": CORNER_ALG}
    if kind not in table or letter not in table[kind]:
        raise ValueError("Choose a non-buffer edge or corner target")
    expected = apply_alg(solved_state(), table[kind][letter])
    actual = apply_alg(solved_state(), first("algorithm"))
    return {"correct": actual == expected}


API.update({"/api/state": lambda first: state_payload(first("scramble")),
            "/api/algorithm-check": algorithm_check})
