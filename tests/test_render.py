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

    def test_m_moves_centers(self):
        f = cube("M2")
        self.assertEqual((f["U"][4], f["D"][4], f["F"][4], f["B"][4]), ("D", "U", "B", "F"))
        self.assertEqual((f["L"][4], f["R"][4]), ("L", "R"))
        f = cube("M")                                  # M follows L: F gets U, U gets B
        self.assertEqual((f["F"][4], f["U"][4]), ("U", "B"))
        self.assertEqual(cube("M2 M2"), {x: x * 9 for x in FACES})

    def test_face_turns_keep_centers(self):
        f = cube("U R F D L B U2 R' F2")
        for face in FACES:
            self.assertEqual(f[face][4], face)

    def test_every_color_nine_times(self):
        f = cube("L' D2 B2 D2 B D F D R' F' U D L2 B2 D B2 L2 B2 U' B2 R2")
        allc = "".join(f.values())
        for face in FACES:
            self.assertEqual(allc.count(face), 9)
            self.assertEqual(f[face][4], face)       # no slice moves: centers stay


class Letters(unittest.TestCase):
    def test_absolute_letters_follow_speffz(self):
        from bld.render import ABSOLUTE_LETTERS as A
        self.assertEqual(A["U"], "AABD.BDCC")      # UBL UB UBR / UL . UR / UFL UF UFR
        self.assertEqual(A["F"], "IIJL.JLKK")
        self.assertEqual(A["R"], "MMNP.NPOO")
        self.assertEqual(A["B"], "QQRT.RTSS")      # B face seen from behind: R=BL, T=BR
        self.assertEqual(A["L"], "EEFH.FHGG")
        self.assertEqual(A["D"], "UUVX.VXWW")

    def test_relative_letters_move_with_stickers(self):
        from bld.render import ABSOLUTE_LETTERS, sticker_letters
        self.assertEqual(sticker_letters(solved_state()), ABSOLUTE_LETTERS)
        rel = sticker_letters(apply_alg(solved_state(), "R"))
        self.assertEqual(rel["F"], "IIVL.VLKW")     # D-face stickers came up to F's right column
        self.assertEqual(rel["F"][4], ".")          # centers never get a letter

    def test_payload_has_letters_for_every_frame(self):
        p = build_payload("R U")
        self.assertIn("absolute_letters", p)
        self.assertEqual(p["letters"], __import__("bld.render", fromlist=["x"]).sticker_letters(
            apply_alg(solved_state(), "R U")))
        self.assertTrue(all("letters" in f for f in p["frames"]))
        from bld.render import ABSOLUTE_LETTERS
        self.assertEqual(p["frames"][-1]["letters"], ABSOLUTE_LETTERS)


class Payload(unittest.TestCase):
    def test_payload(self):
        p = build_payload("D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'")
        self.assertTrue(p["verified"])
        self.assertEqual(p["edge_memo"], "HI EF BO SA GN P")
        self.assertEqual(set(p["facelets"]), set(FACES))

    def test_frames_replay_every_move_and_end_solved(self):
        p = build_payload("D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'")
        moves = [m for line in p["solution"].splitlines() if ":" in line and line[1] == ":"
                 for m in line.split(":", 1)[1].split("#")[0].split()]
        parity = p["solution"].split("Parity:\n")[1].splitlines()[0].split()
        self.assertEqual(len(p["frames"]), len(moves) + len(parity))
        self.assertEqual(p["frames"][-1]["facelets"], {f: f * 9 for f in FACES})
        self.assertEqual(p["frames"][0]["label"], "Edges H")
        self.assertEqual(p["frames"][0]["move"], "L")

    def test_solved_cube_has_no_frames(self):
        self.assertEqual(build_payload("R R'")["frames"], [])

    def test_random_is_seeded(self):
        self.assertEqual(build_payload(None, seed=3)["scramble"], build_payload("", seed=3)["scramble"])

    def test_bad_input(self):
        with self.assertRaises(ValueError):
            build_payload("X Y Z")
        with self.assertRaises(ValueError):
            build_payload("R U", parity=9)


if __name__ == "__main__":
    unittest.main()
