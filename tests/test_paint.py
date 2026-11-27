import os
import random
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from bld.api import build_payload, check_payload
from bld.cube import apply_alg, random_scramble, solved_state
from bld.paint import scramble_state, state_from_facelets
from bld.render import facelets


def painted(grids):
    return "~" + "".join("".join(grids[f]) for f in "URFDLB")


def solved_grids():
    return {k: list(v) for k, v in facelets(solved_state()).items()}


class Paint(unittest.TestCase):
    def test_painting_a_scrambled_cube_gives_the_same_state_and_solution(self):
        rng = random.Random(7)
        for _ in range(25):
            scramble = random_scramble(rng=rng)
            state = apply_alg(solved_state(), scramble)
            self.assertEqual(scramble_state(painted(facelets(state))), state)
            a, b = build_payload(painted(facelets(state)), None, 1), build_payload(scramble, None, 1)
            self.assertEqual(a["solution"], b["solution"])
            self.assertTrue(a["verified"])

    def test_a_painted_cube_works_in_the_solution_check(self):
        state = apply_alg(solved_state(), "R U R' U'")
        payload = build_payload(painted(facelets(state)), None, 1)
        result = check_payload(payload["scramble"], payload["edge_memo"], payload["corner_memo"], None)
        self.assertIn("correct", result)

    def test_impossible_paintings_are_refused(self):
        g = solved_grids()
        g["U"][0] = "D"
        with self.assertRaisesRegex(ValueError, "nine stickers"):
            state_from_facelets(painted(g)[1:])
        with self.assertRaisesRegex(ValueError, "54"):
            state_from_facelets("UUU")
        g = solved_grids()
        g["U"][4] = "F"
        g["F"][4] = "U"
        with self.assertRaisesRegex(ValueError, "centres"):
            state_from_facelets(painted(g)[1:])
        g = solved_grids()      # a corner's colours the wrong way round
        g["U"][8], g["F"][2] = g["F"][2], g["U"][8]
        with self.assertRaisesRegex(ValueError, "mirrored|exist|twice"):
            state_from_facelets(painted(g)[1:])

    def test_unreachable_positions_are_refused(self):
        g = solved_grids()      # one flipped edge
        g["U"][7], g["F"][1] = g["F"][1], g["U"][7]
        with self.assertRaisesRegex(ValueError, "cannot be solved"):
            build_payload(painted(g), None, 1)
        g = solved_grids()      # two swapped edges
        g["U"][7], g["U"][5] = g["U"][5], g["U"][7]
        g["F"][1], g["R"][1] = g["R"][1], g["F"][1]
        with self.assertRaisesRegex(ValueError, "cannot be solved"):
            build_payload(painted(g), None, 1)


if __name__ == "__main__":
    unittest.main()
