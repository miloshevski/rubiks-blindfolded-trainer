"""Deterministic M2 + Old Pochmann solution generator.

Three kinds of cube state are kept apart:
  * the scrambled state      - immutable input, only ever read;
  * the memo-working state   - derived copy that the edge algorithms and the
                               parity algorithm are applied to, so the corner
                               memo can be traced on what the cube will really
                               look like when the corners start;
  * the verification state   - built from scratch in ``verify`` by executing
                               the *printed* algorithms on the scramble.
"""
from dataclasses import dataclass
from typing import Optional, Tuple

from . import method
from .constants import (DEFAULT_PARITY, LABEL_CORNERS, LABEL_EDGES, LABEL_PARITY,
                        LABEL_SOLVED, LETTERS)
from .cube import (CORNER, EDGE, apply_alg, apply_algs, home_letter, is_solved,
                   piece_of, piece_solved, solved_state)


def trace_groups(state, kind):
    """The memo for ``kind`` (EDGE or CORNER), read from ``state``, split into its cycles.

    Returns ``[(letters, group_kind), ...]`` in memo order, where ``group_kind`` is
      * "buffer" - the cycle that contains the buffer (the memo starts here);
      * "cycle"  - a cycle that was broken into, closed by landing back on its break piece;
      * "flip"   - a piece that is solved in place but flipped (edge) or twisted (corner):
                   its break letter is followed at once by a sticker of the same piece.

    Static sticker tracing from the buffer: the target is the home letter of the sticker
    in the traced buffer slot, then of the sticker in the previous target's slot, and so
    on.  When the cycle returns to the buffer piece it is closed and the memo breaks into
    the unsolved piece whose lowest sticker letter is alphabetically first; that cycle is
    closed when the trace lands back on the break piece (that closing letter is part of the
    memo).  ``state`` is not modified.
    """
    trace_letter = method.EDGE_TRACE_LETTER if kind == EDGE else method.CORNER_TRACE_LETTER
    buffer_piece = piece_of(kind, trace_letter)
    home = {l: home_letter(state, kind, l) for l in LETTERS}

    groups = []
    handled = set()                      # pieces already placed in the memo

    first = []
    cur = trace_letter
    while True:                          # the cycle that contains the buffer
        target = home[cur]
        if target in buffer_piece:
            break
        first.append(target)
        handled.add(piece_of(kind, target))
        cur = target
    if first:
        groups.append((tuple(first), "buffer"))

    while True:                          # cycles that do not contain the buffer
        start = next(
            (l for l in LETTERS
             if l not in buffer_piece
             and piece_of(kind, l) not in handled
             and not piece_solved(state, kind, l)),
            None,
        )
        if start is None:
            return groups
        break_piece = piece_of(kind, start)
        handled.add(break_piece)
        letters = [start]
        cur = start
        while True:
            target = home[cur]
            letters.append(target)
            handled.add(piece_of(kind, target))
            if target in break_piece:
                break
            cur = target
        groups.append((tuple(letters), "flip" if len(letters) == 2 and letters[1] in break_piece else "cycle"))


def trace_cycles(state, kind) -> Tuple[str, ...]:
    """Memo letters for ``kind`` (EDGE or CORNER), read from ``state`` (see ``trace_groups``)."""
    return tuple(l for letters, _ in trace_groups(state, kind) for l in letters)


def edge_execution_letters(memo):
    """Letters actually executed: C/W/I/S on even-numbered targets are swapped
    for their opposite.  Numbering is continuous over the whole memo."""
    return tuple(
        method.OPPOSITE.get(letter, letter) if number % 2 == 0 else letter
        for number, letter in enumerate(memo, start=1)
    )


@dataclass(frozen=True)
class Step:
    memo_letter: str                     # what the human memorises
    exec_letter: str                     # which letter's algorithm is executed
    algorithm: str


@dataclass(frozen=True)
class Solution:
    edges: Tuple[Step, ...]
    parity_number: Optional[int]
    parity_algorithm: Optional[str]
    corners: Tuple[Step, ...]
    # Memo cycles as ((size, kind), ...) in memo order, kind as in ``trace_groups``.
    edge_groups: Tuple[Tuple[int, str], ...] = ()
    corner_groups: Tuple[Tuple[int, str], ...] = ()

    @property
    def edge_memo(self):
        return tuple(s.memo_letter for s in self.edges)

    @property
    def corner_memo(self):
        return tuple(s.memo_letter for s in self.corners)

    def labelled_steps(self):
        """[(label, algorithm), ...] in execution order, e.g. ("Edges F", "B L2 B' M2 B L2 B'")."""
        steps = [(f"Edges {s.memo_letter}", s.algorithm) for s in self.edges]
        if self.parity_algorithm:
            steps.append(("Parity", self.parity_algorithm))
        steps += [(f"Corners {s.memo_letter}", s.algorithm) for s in self.corners]
        return steps

    def algorithms(self):
        """Every algorithm in execution order."""
        return [alg for _, alg in self.labelled_steps()]


def solve(scrambled_state, parity_number=DEFAULT_PARITY) -> Solution:
    """Generate the full blindfold solution for ``scrambled_state``."""
    edge_traced = trace_groups(scrambled_state, EDGE)
    edge_memo = tuple(l for letters, _ in edge_traced for l in letters)
    edge_exec = edge_execution_letters(edge_memo)
    edges = tuple(Step(m, e, method.EDGE_ALG[e]) for m, e in zip(edge_memo, edge_exec))

    # Memo-working state: what the cube looks like when the corners begin.
    working = apply_algs(scrambled_state, (s.algorithm for s in edges))
    parity_alg = None
    if len(edge_memo) % 2 == 1:
        parity_alg = method.PARITY_ALGS[parity_number]
        working = apply_alg(working, parity_alg)

    corner_traced = trace_groups(working, CORNER)
    corner_memo = tuple(l for letters, _ in corner_traced for l in letters)
    corners = tuple(Step(c, c, method.CORNER_ALG[c]) for c in corner_memo)
    return Solution(edges, parity_number if parity_alg else None, parity_alg, corners,
                    tuple((len(letters), k) for letters, k in edge_traced),
                    tuple((len(letters), k) for letters, k in corner_traced))


def verify(scramble, solution) -> bool:
    """Independently execute the printed algorithms on a fresh cube."""
    state = apply_algs(apply_alg(solved_state(), scramble), solution.algorithms())
    return is_solved(state)


def pair_up(letters):
    s = "".join(letters)
    return " ".join(s[i:i + 2] for i in range(0, len(s), 2))


def format_solution(solution) -> str:
    lines = [LABEL_EDGES]
    if not solution.edges:
        lines.append(LABEL_SOLVED)
    for s in solution.edges:
        note = f"   # executed as {s.exec_letter}" if s.exec_letter != s.memo_letter else ""
        lines.append(f"{s.memo_letter}: {s.algorithm}{note}")
    if solution.parity_algorithm:
        lines += [LABEL_PARITY, solution.parity_algorithm]
    lines.append(LABEL_CORNERS)
    if not solution.corners:
        lines.append(LABEL_SOLVED)
    for s in solution.corners:
        lines.append(f"{s.memo_letter}: {s.algorithm}")
    return "\n".join(lines)
