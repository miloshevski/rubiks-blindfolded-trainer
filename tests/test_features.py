import json
import pathlib
import unittest
from bld.api import build_payload, check_payload, state_payload, sticker_id, algorithm_check
from bld.cube import apply_alg, solved_state, is_solved, centers_solved
from bld.solver import solve, verify
from bld.method import EDGE_ALG

ROOT = pathlib.Path(__file__).resolve().parents[1]

class StructuredSolutions(unittest.TestCase):
    def test_metadata_matches_execution(self):
        payload = build_payload("D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'")
        state = apply_alg(solved_state(), payload['scramble'])
        offset = 0
        for step in payload['steps']:
            self.assertEqual(step['start'], offset)
            if step['phase'] != 'parity':
                self.assertEqual(step['target_sticker'], sticker_id(step['phase'][:-1], step['memo_target']))
            state = apply_alg(state, step['algorithm'])
            offset += len(step['algorithm'].split())
        self.assertTrue(is_solved(state))
        self.assertEqual(payload['steps'][1]['memo_target'], 'I')
        self.assertEqual(payload['steps'][1]['execution_target'], 'S')
        self.assertEqual(offset, len(payload['frames']))

    def test_lightweight_state_contains_no_solution(self):
        light = state_payload("R U R' U'")
        full = build_payload(light['scramble'])
        self.assertEqual(light['facelets'], full['facelets'])
        self.assertNotIn('solution', light)
        self.assertNotIn('edge_memo', light)

    def test_wrong_sticker_ids_are_exact(self):
        result = check_payload('R', '', '')
        self.assertFalse(result['correct'])
        self.assertTrue(result['wrong_stickers'])
        self.assertEqual(len(result['wrong_stickers']), len(set(result['wrong_stickers'])))

    def test_equivalent_algorithm_check(self):
        params = {'kind':'edges','letter':'B','algorithm':'R R R R ' + EDGE_ALG['B']}
        self.assertTrue(algorithm_check(lambda k, default='':params.get(k,default))['correct'])

    def test_published_fixtures_match_engine(self):
        fixtures = json.loads((ROOT/'web/src/data/fixtures.json').read_text())
        self.assertEqual(len(fixtures), 10)
        fixtures += json.loads((ROOT/'web/src/data/practice-fixtures.json').read_text())
        for fixture in fixtures:
            with self.subTest(fixture=fixture['id']):
                self.assertTrue(centers_solved(apply_alg(solved_state(), fixture['scramble'])))
                self.assertTrue(fixture['verified'])
                payload = build_payload(fixture['scramble'])
                for key,value in payload.items():
                    self.assertEqual(fixture[key], value)
                for parity in (1,2):
                    self.assertTrue(verify(fixture['scramble'], solve(apply_alg(solved_state(),fixture['scramble']),parity)))

class OrientationResources(unittest.TestCase):
    def test_orientation_exercises_are_legal_pure_orientation_cases(self):
        from bld.cube import EDGE, CORNER, LETTERS, home_letter, piece_of, piece_solved
        cases = json.loads((ROOT/'web/src/data/practice-fixtures.json').read_text())
        for case in cases:
            if not case['id'].startswith(('flipped-', 'twisted-')):
                continue
            state = apply_alg(solved_state(), case['scramble'])
            kind = EDGE if case['id'].startswith('flipped-') else CORNER
            other = CORNER if kind == EDGE else EDGE
            self.assertTrue(all(piece_solved(state, other, l) for l in LETTERS), case['id'])
            self.assertTrue(all(piece_of(kind, home_letter(state, kind, l)) == piece_of(kind, l)
                                for l in LETTERS), case['id'])
            self.assertFalse(all(piece_solved(state, kind, l) for l in LETTERS), case['id'])
