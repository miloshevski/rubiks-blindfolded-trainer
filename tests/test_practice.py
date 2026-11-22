import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bld.practice import normalize, user_steps
from bld.render import FACES
from bld.server import check_payload

SCRAMBLE_2 = "D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'"
# What the generator prints for scramble 2: executed edge letters, parity alg 1, corners.
EDGES_2 = "HS EF BO SA GN P"
CORNERS_2 = "BN CS WJ DG DK V"


class Normalize(unittest.TestCase):
    def test_case_and_spacing(self):
        self.assertEqual(normalize("hs ef  Bo\tsa"), "HSEFBOSA")
        self.assertEqual(normalize(""), "")
        self.assertEqual(normalize(None), "")

    def test_rejects_other_characters(self):
        for bad in ("hj'df", "ab1", "yz", "a-b"):
            with self.assertRaises(ValueError):
                normalize(bad)

    def test_rejects_buffer_letters(self):
        with self.assertRaises(ValueError):
            user_steps("BK", "")
        with self.assertRaises(ValueError):
            user_steps("", "BE")


class Check(unittest.TestCase):
    def test_correct_solution(self):
        r = check_payload(SCRAMBLE_2, EDGES_2.lower(), CORNERS_2.replace(" ", ""), parity_number=1)
        self.assertTrue(r["correct"])
        self.assertEqual(r["edges"], "HSEFBOSAGNP")
        self.assertEqual(r["frames"][-1]["facelets"], {f: f * 9 for f in FACES})

    def test_parity_alg_2_also_works(self):
        self.assertTrue(check_payload(SCRAMBLE_2, EDGES_2, CORNERS_2, parity_number=2)["correct"])

    def test_nothing_is_added_for_the_user(self):
        # without the user's own substitution (HI instead of HS) it is wrong
        self.assertFalse(check_payload(SCRAMBLE_2, "HI EF BO SA GN P", CORNERS_2, 1)["correct"])
        # without parity it is wrong
        self.assertFalse(check_payload(SCRAMBLE_2, EDGES_2, CORNERS_2, None)["correct"])

    def test_wrong_corners_reported(self):
        r = check_payload(SCRAMBLE_2, EDGES_2, "BN CS WJ DG DK", 1)
        self.assertFalse(r["correct"])
        self.assertFalse(r["corners_correct"])
        self.assertTrue(r["edges_correct"])        # UB/UL swap is blamed on the corners
        self.assertEqual(r["wrong_edges"], ["UB", "UL"])

    def test_corners_in_place_but_ub_ul_swapped_blames_corners(self):
        # Cube whose only problem is the UBL/UBR corners: one corner alg places them,
        # but that alg also swaps UB/UL, so the corners part is not correct.
        from bld import method
        from bld.cube import EDGE, apply_alg, slot_index, solved_state
        from bld.practice import check
        state = list(apply_alg(solved_state(), method.CORNER_ALG["B"]))
        for a, b in (("A", "D"), ("Q", "E")):          # undo its UB/UL edge swap
            i, j = slot_index(EDGE, a), slot_index(EDGE, b)
            state[i], state[j] = state[j], state[i]
        r = check(tuple(state), [("Corners B", method.CORNER_ALG["B"])])
        self.assertFalse(r["correct"])
        self.assertEqual(r["wrong_corners"], [])
        self.assertEqual(r["wrong_edges"], ["UB", "UL"])
        self.assertFalse(r["corners_correct"])
        self.assertTrue(r["edges_correct"])
        self.assertIn("UB and UL are swapped", r["note"])

    def test_missing_parity_is_explained(self):
        r = check_payload(SCRAMBLE_2, EDGES_2, CORNERS_2, None)
        self.assertFalse(r["correct"])
        self.assertTrue(r["corners_correct"] or "parity" in r["note"])
        self.assertIn("parity", r["note"])

    def test_frame_count_matches_moves(self):
        r = check_payload(SCRAMBLE_2, "A", "V", None)
        self.assertEqual([f["move"] for f in r["frames"]][:1], ["M2"])
        self.assertEqual(len(r["frames"]), 1 + 15)

    def test_needs_a_scramble(self):
        with self.assertRaises(ValueError):
            check_payload("", "A", "", None)


if __name__ == "__main__":
    unittest.main()
