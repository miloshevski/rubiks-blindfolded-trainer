import os
import random
import re
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bld import method
from bld.cube import (CORNER, EDGE, LETTERS, OFFSET, apply_alg, invert_alg,
                      is_solved, piece_of, random_scramble, slot_index,
                      solved_state)
from bld.solver import (edge_execution_letters, solve, trace_cycles, trace_groups, verify)

SKILL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     "RUBIKS_SKILL.md")

SCRAMBLE_1 = "L' D2 B2 D2 B D F D R' F' U D L2 B2 D B2 L2 B2 U' B2 R2"
SCRAMBLE_2 = "D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'"


def scrambled(s):
    return apply_alg(solved_state(), s)


def changed_letters(state, kind):
    return {l for l in LETTERS if state[slot_index(kind, l)] != slot_index(kind, l)}


class MemoCycles(unittest.TestCase):
    def test_groups_split_the_memo(self):
        for scr in (SCRAMBLE_1, SCRAMBLE_2, "R U R' U' F2 D L2 B'"):
            state = scrambled(scr)
            for kind in (EDGE, CORNER):
                groups = trace_groups(state, kind)
                self.assertEqual("".join("".join(g) for g, _ in groups), "".join(trace_cycles(state, kind)))
                self.assertTrue(all(k in ("buffer", "cycle", "flip") for _, k in groups))
                self.assertEqual([k for _, k in groups].count("buffer") <= 1, True)

    def test_flipped_edge_is_a_flip_group(self):
        # "R U R' U' F2 D L2 B'" leaves the A/Q edge flipped in place.
        groups = trace_groups(scrambled("R U R' U' F2 D L2 B'"), EDGE)
        self.assertEqual(groups[-1], (("A", "Q"), "flip"))

    def test_payload_cycles_cover_the_memo(self):
        from bld.api import build_payload
        p = build_payload(SCRAMBLE_1)
        self.assertEqual(sum(c["size"] for c in p["edge_cycles"]), len(p["edge_memo"].replace(" ", "")))
        self.assertEqual(sum(c["size"] for c in p["corner_cycles"]), len(p["corner_memo"].replace(" ", "")))


class TutorialExamples(unittest.TestCase):
    def test_example_1_edge_memo(self):
        memo = trace_cycles(scrambled(SCRAMBLE_1), EDGE)
        self.assertEqual("".join(memo), "MOWECLXARJP")
        self.assertEqual(len(memo), 11)

    def test_example_2_edge_memo_and_execution(self):
        sol = solve(scrambled(SCRAMBLE_2))
        self.assertEqual("".join(sol.edge_memo), "HIEFBOSAGNP")
        self.assertEqual("".join(s.exec_letter for s in sol.edges), "HSEFBOSAGNP")
        # the memorised letter is preserved, only the executed algorithm changes
        self.assertEqual(sol.edges[1].memo_letter, "I")
        self.assertEqual(sol.edges[1].algorithm, method.EDGE_ALG["S"])

    def test_examples_are_solved_and_odd(self):
        for scr in (SCRAMBLE_1, SCRAMBLE_2):
            sol = solve(scrambled(scr))
            self.assertIsNotNone(sol.parity_algorithm)
            self.assertTrue(verify(scr, sol))


class SkillTables(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(SKILL, encoding="utf-8") as f:
            cls.text = f.read()

    def _rows(self, header):
        section = self.text.split(header, 1)[1]
        for line in section.splitlines()[1:]:
            if line.startswith("## ") and not line.startswith(header):
                break
            m = re.match(r"\|\s*([A-X])\s*\|(.*)\|\s*$", line)
            if m:
                yield m.group(1), [c.strip().strip("`") for c in m.group(2).split("|")]

    def test_edge_algorithm_table(self):
        rows = dict(self._rows("## Complete M2 edge algorithms"))
        self.assertEqual(len(rows), 24)
        for letter, (alg,) in rows.items():
            if letter in method.EDGE_BUFFER_LETTERS:
                continue
            self.assertEqual(method.EDGE_ALG[letter], alg, letter)

    def test_corner_algorithm_table(self):
        rows = dict(self._rows("## Old Pochmann corner algorithms"))
        checked = 0
        for letter, (setup, complete) in rows.items():
            if letter in method.CORNER_BUFFER_LETTERS:
                continue
            self.assertEqual(method.CORNER_ALG[letter], complete, letter)
            checked += 1
        self.assertEqual(checked, 21)

    def test_b_face_edge_letters(self):
        from bld.cube import EDGE_NAMES
        self.assertEqual([EDGE_NAMES[LETTERS.index(l)] for l in "QRST"],
                         ["BU", "BL", "BD", "BR"])


class AlgorithmEffects(unittest.TestCase):
    def test_edge_algs_touch_only_edges_and_hit_the_target_piece(self):
        for letter, alg in method.EDGE_ALG.items():
            state = apply_alg(solved_state(), alg)
            self.assertEqual(changed_letters(state, CORNER), set(), letter)
            if letter in "ACIQSW":
                continue            # specials / M2 side effects covered by the pipeline
            moved = changed_letters(state, EDGE)
            self.assertTrue(piece_of(EDGE, letter) <= moved, letter)
            self.assertTrue(piece_of(EDGE, "U") <= moved, letter)

    def test_corner_algs_swap_buffer_with_target_piece(self):
        buffer_piece = piece_of(CORNER, "A")
        for letter, alg in method.CORNER_ALG.items():
            state = apply_alg(solved_state(), alg)
            self.assertEqual(changed_letters(state, CORNER),
                             set(buffer_piece) | set(piece_of(CORNER, letter)), letter)
            # the sticker in the traced buffer slot E lands on the target letter
            self.assertEqual(state[slot_index(CORNER, letter)], slot_index(CORNER, "E"), letter)

    def test_inverse(self):
        for alg in ("R U R' U'", "M2 U' M U2", "F2 R'"):
            self.assertTrue(is_solved(apply_alg(solved_state(), f"{alg} {invert_alg(alg)}")))


class Tracing(unittest.TestCase):
    def test_solved_cube_has_empty_solution(self):
        sol = solve(solved_state())
        self.assertEqual((sol.edges, sol.corners, sol.parity_algorithm), ((), (), None))
        self.assertTrue(verify("", sol))

    def test_flipped_edge_breaks_into_two_targets(self):
        state = list(solved_state())
        j, p = slot_index(EDGE, "J"), slot_index(EDGE, "P")
        state[j], state[p] = state[p], state[j]
        self.assertEqual(trace_cycles(tuple(state), EDGE), ("J", "P"))

    def test_break_selects_unsolved_piece_not_just_wrong_sticker(self):
        # R is solved; the trace after the buffer cycle must skip solved pieces
        memo = trace_cycles(scrambled(SCRAMBLE_1), EDGE)
        self.assertNotIn("N", memo)       # RB edge is already solved, so it is never a target

    def test_numbering_is_continuous_across_breaks(self):
        self.assertEqual("".join(edge_execution_letters("CCCCWW")), "CWCWWC")
        self.assertEqual("".join(edge_execution_letters("MOWECLXARJP")), "MOWECLXARJP")

    def test_state_is_not_modified(self):
        state = scrambled(SCRAMBLE_1)
        copy = tuple(state)
        solve(state)
        self.assertEqual(state, copy)


class RandomScrambles(unittest.TestCase):
    def test_full_pipeline_both_parity_algorithms(self):
        rng = random.Random(2024)
        odd_seen = {1: 0, 2: 0}
        for _ in range(600):
            scr = random_scramble(rng=rng)
            state = scrambled(scr)
            for parity in (1, 2):
                sol = solve(state, parity_number=parity)
                self.assertTrue(verify(scr, sol), (parity, scr))
                self.assertEqual(len(sol.edge_memo) % 2, len(sol.corner_memo) % 2, scr)
                if sol.parity_algorithm:
                    odd_seen[parity] += 1
                    self.assertEqual(sol.parity_algorithm, method.PARITY_ALGS[parity])
        self.assertGreater(odd_seen[1], 100)
        self.assertGreater(odd_seen[2], 100)

    def test_execution_letters_match_memo(self):
        rng = random.Random(7)
        for _ in range(100):
            sol = solve(scrambled(random_scramble(rng=rng)))
            self.assertEqual(tuple(s.exec_letter for s in sol.edges),
                             edge_execution_letters(sol.edge_memo))

    def test_deterministic(self):
        state = scrambled(SCRAMBLE_1)
        self.assertEqual(solve(state), solve(state))


if __name__ == "__main__":
    unittest.main()
