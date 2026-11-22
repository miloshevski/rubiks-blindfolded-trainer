"""Generate a random scramble and print the M2 + Old Pochmann blindfold solution."""
import argparse
import random
import sys

from bld.constants import DEFAULT_PARITY, PARITY_ALGS
from bld.cube import apply_alg, random_scramble, solved_state
from bld.solver import format_solution, pair_up, solve, verify


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--scramble", help="scramble to use instead of a random one")
    ap.add_argument("--seed", type=int, help="seed for the random scramble")
    ap.add_argument("--parity", type=int, choices=sorted(PARITY_ALGS), default=DEFAULT_PARITY,
                    help="which parity algorithm to use when needed (default %(default)s)")
    args = ap.parse_args(argv)

    scramble = args.scramble or random_scramble(rng=random.Random(args.seed))
    state = apply_alg(solved_state(), scramble)
    solution = solve(state, parity_number=args.parity)

    print(f"Scramble: {scramble}")
    print(f"Edge memo:   {pair_up(solution.edge_memo)}  ({len(solution.edge_memo)} targets)")
    print(f"Corner memo: {pair_up(solution.corner_memo)}  ({len(solution.corner_memo)} targets)")
    print()
    print(format_solution(solution))
    if not verify(scramble, solution):
        print("\nERROR: solution does not solve the cube", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
