"""Regenerate offline resources from the authoritative Python cube engine.

Run from the repository root: python3 scripts/generate_resources.py
"""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from bld.api import algs_payload, build_payload
from bld.cube import invert_alg
from bld.method import CORNER_ALG, EDGE_ALG

TUTORIAL_1 = "L' D2 B2 D2 B D F D R' F' U D L2 B2 D B2 L2 B2 U' B2 R2"
TUTORIAL_2 = "D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'"
FLIPS = "M' U M' U M' U2 M U M U M U2"
TWISTS = "R' D' R D " * 2 + "U' " + "R' D' R D " * 4 + "U"

def edges(letters):
    return invert_alg(' '.join(EDGE_ALG[c] for c in letters))


def resource(key, scramble):
    payload = build_payload(scramble)
    assert payload['verified'], key
    return {'id': key, **payload}


def write(name, data):
    (ROOT / 'web/src/data' / name).write_text(json.dumps(data, separators=(',', ':')) + '\n')


def main():
    examples = [('intro', "R U R' U'"), ('speffz', 'R2 U2'),
                ('buffers', edges('BJ')),
                ('corners', invert_alg(CORNER_ALG['J'] + ' ' + CORNER_ALG['V'])),
                ('m2', edges('BJ')), ('special', TUTORIAL_2), ('cycles', edges('BJBLBL')),
                ('orientation', FLIPS), ('parity', TUTORIAL_1), ('full', TUTORIAL_2)]
    write('fixtures.json', [resource(key, scramble) for key, scramble in examples])
    cases = []
    for prefix, algorithm in [('flipped-edges', FLIPS), ('twisted-corners', TWISTS)]:
        for i, setup in enumerate(['', 'R2', 'F2']):
            cases.append(resource(f'{prefix}-{i+1}', f'{setup} {algorithm} {invert_alg(setup)}'.strip()))
    for letters in ['BJBFLF', 'BJBLAL', 'BJBLBL']:
        cases.append(resource(f'cycle-{letters.lower()}', edges(letters)))
    write('practice-fixtures.json', cases)
    write('algorithms.json', algs_payload())


if __name__ == '__main__':
    main()
