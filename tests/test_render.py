import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bld.cube import apply_alg, solved_state
from bld.render import FACES, facelets
from bld.server import build_payload


def cube(alg):
    return facelets(apply_alg(solved_state(), alg))


class Facelets(unittest.TestCase):
    def test_solved(self):
        self.assertEqual(facelets(solved_state()), {f: f * 9 for f in FACES})

    def test_u_turn_rows(self):
        # Clockwise U: the F, R, B, L top rows receive the R, B, L, F colors.
        f = cube("U")
        self.assertEqual(f["U"], "U" * 9)
        self.assertEqual(f["F"][:3], "RRR")
        self.assertEqual(f["L"][:3], "FFF")
        self.assertEqual(f["B"][:3], "LLL")
        self.assertEqual(f["R"][:3], "BBB")
        self.assertEqual(f["F"][3:], "FFFFFF")

    def test_r_turn_columns(self):
        # Clockwise R: F's right column receives D, U's right column receives F.
        f = cube("R")
        self.assertEqual(f["F"][2::3], "DDD")
        self.assertEqual(f["U"][2::3], "FFF")
        self.assertEqual(f["B"][0::3], "UUU")
        self.assertEqual(f["D"][2::3], "BBB")

    def test_f_turn_edges(self):
        # Clockwise F: U's bottom row receives L, R's left column receives U.
        f = cube("F")
        self.assertEqual(f["U"][6:], "LLL")
        self.assertEqual(f["R"][0::3], "UUU")
        self.assertEqual(f["D"][:3], "RRR")
        self.assertEqual(f["L"][2::3], "DDD")

    def test_every_color_nine_times(self):
        f = cube("L' D2 B2 D2 B D F D R' F' U D L2 B2 D B2 L2 B2 U' B2 R2")
        allc = "".join(f.values())
        for face in FACES:
            self.assertEqual(allc.count(face), 9)
            self.assertEqual(f[face][4], face)       # center untouched


class Payload(unittest.TestCase):
    def test_payload(self):
        p = build_payload("D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'")
        self.assertTrue(p["verified"])
        self.assertEqual(p["edge_memo"], "HI EF BO SA GN P")
        self.assertEqual(set(p["facelets"]), set(FACES))

    def test_random_is_seeded(self):
        self.assertEqual(build_payload(None, seed=3)["scramble"], build_payload("", seed=3)["scramble"])

    def test_bad_input(self):
        with self.assertRaises(ValueError):
            build_payload("X Y Z")
        with self.assertRaises(ValueError):
            build_payload("R U", parity=9)


if __name__ == "__main__":
    unittest.main()
