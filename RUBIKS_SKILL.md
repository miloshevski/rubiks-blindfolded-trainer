---
name: m2-old-pochmann-understanding
description: Understand and explain the 3x3 blindfold Rubik's Cube method using M2 for edges and Old Pochmann for corners, including the exact tutorial algorithms, edge memo examples, even-position opposite substitutions, parity, and cubie-state representation supplied by the user. Use for reasoning about this specific method, not R2.
---

# M2 Edges + Old Pochmann Corners — Understanding Only

Use only the method and details recorded here. Do not implement a solver or add new algorithms, conventions, or assumptions. Do not use R2 for corners. The sticker mapping below is standard Speffz, consistent with the supplied M2 buffer letters, but the tutorial did not explicitly provide its full lettering diagram. The two supplied example memo sequences are edge sequences, not complete corner memos.

## Human workflow

1. Scramble and inspect the cube.
2. Trace edge sticker cycles from the DF edge buffer and memorize target letters; break into unsolved cycles when necessary.
3. Trace corner sticker cycles separately using Old Pochmann with the UBL buffer; memorize corner targets. Use the supplied altered Y-permutation and corner setup table below. The Speffz lettering reference is an explicitly identified convention.
4. Group memo into letter pairs.
5. Execute M2 edge targets in order. For C/W/I/S on even-numbered edge target occurrences, execute the opposite sticker algorithm instead.
6. If memo parity is odd, execute the selected parity algorithm after edges and before corners.
7. Execute Old Pochmann corner targets using setup + altered Y-permutation + inverse setup.

The exact cycle-break choice can vary; the supplied examples alone do not establish a deterministic cycle-break policy.

## Cube state

```python
cube = {
    "cp": list(range(8)),   # corner permutation
    "co": [0] * 8,          # corner orientation
    "ep": list(range(12)),  # edge permutation
    "eo": [0] * 12          # edge orientation
}
```

This is a solved cube. `cp[i]` and `ep[i]` identify the piece occupying a position; `co[i]` ranges 0–2, `eo[i]` ranges 0–1. Fixed centers need not be stored. Sticker letters require a separate mapping from piece positions and orientations. Use the Speffz sticker reference below, distinguishing this standard convention from lettering explicitly confirmed by the tutorial.

## Sticker lettering (Speffz convention)

Letters name **individual stickers**, not entire pieces. Every edge has two stickers and every corner has three; the two or three letters of a piece refer to the same physical cubie from different face directions. Use fixed cube orientation: U=up, D=down, F=front, B=back, L=left, R=right. The first character in a position label indicates the face carrying that sticker; e.g. `UF` and `FU` are the two stickers of one edge, while `UFR`, `FUR`, and `RUF` are three stickers of one corner. Each face is lettered clockwise in reading order around its stickers: four edges per face, four corners per face. The six centers are not lettered.

**Edges — 24 stickers (A–X):**

| Face | Letter → sticker position |
|---|---|
| U | A=UB, B=UR, C=UF, D=UL |
| L | E=LU, F=LF, G=LD, H=LB |
| F | I=FU, J=FR, K=FD, L=FL |
| R | M=RU, N=RB, O=RD, P=RF |
| B | Q=BU, R=BL, S=BD, T=BR |
| D | U=DF, V=DR, W=DB, X=DL |

Thus **K (FD)** and **U (DF)** are the two stickers of the DF edge buffer. Example: `C` means the U-face sticker on the UF edge; its other sticker is `I` (FU). The M2 opposite-execution pairs **C/W** and **I/S** are *special algorithm substitutions*, not the two stickers on one edge: C and I belong to the same physical UF edge, while W and S belong to the same physical DB edge.

**Corners — 24 stickers (A–X):**

| Face | Letter → sticker position |
|---|---|
| U | A=UBL, B=UBR, C=UFR, D=UFL |
| L | E=LUB, F=LUF, G=LDF, H=LDB |
| F | I=FUL, J=FUR, K=FDR, L=FDL |
| R | M=RUF, N=RUB, O=RDB, P=RDF |
| B | Q=BUR, R=BUL, S=BDL, T=BDR |
| D | U=DFL, V=DFR, W=DBR, X=DBL |

For the commonly used **UBL corner buffer**, its three sticker letters under this convention are **A (UBL), E (LUB), and R (BUL)**. Example: C (UFR), J (FUR), and M (RUF) all denote different stickers of the same corner. With the supplied Old Pochmann algorithms, the corner memo is traced by reading the sticker currently in buffer slot **E** (LUB): each corner algorithm sends the sticker from E to the target slot.

**Edge-table note:** the B-face edge letters are R=BL and T=BR (viewed from behind, like the other faces), which matches the tutorial setup moves and both example memos.

**Provenance limitation:** The provided tutorial algorithms identify the edge buffer as K/U and are consistent with this standard edge lettering. The tutorial did **not** supply a complete sticker diagram or independently confirm its corner lettering, so do not claim its exact corner memo convention is confirmed. The two example sequences are edge memos only.

## Two tutorial examples (verbatim)

Scramble 1:
`L' D2 B2 D2 B D F D R' F' U D L2 B2 D B2 L2 B2 U' B2 R2`

Edge memo: `MO WE CL XA RJ P` (11 edge targets, odd).

Scramble 2:
`D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'`

Edge memo: `HI EF BO SA GN P` (11 edge targets, odd). `HI` is executed as `HS`, because I occurs in an even target position.

## M2 edge mechanics

- Edge buffer: DF. Letters K and U are buffer stickers; no target algorithm.
- Main swap move: `M2`.
- For ordinary targets, full algorithm = setup + `M2` + inverse setup.
- For special targets A, C, I, Q, S, W, use the exact dedicated algorithms below (A is `M2`).
- The special opposite pairs are **C ↔ W** and **I ↔ S**.
- If C, W, I, or S occurs as the **second letter of a memo pair** (i.e., even-numbered target in the overall edge sequence), replace it with its opposite **for algorithm execution**, not for the original memorized sticker or cube state. Example `HI` → execute `HS`. Pair boundaries are continuous across the memo.

## Tutorial setup moves (without M2 or inverse)

| Letter | Setup |
|---|---|
| A | none |
| B | R U R' U' |
| C | special |
| D | L' U' L U |
| E | B L' B' |
| F | B L2 B' |
| G | B L B' |
| H | L B L' B' |
| I | special |
| J | U R U' |
| K | buffer |
| L | U' L' U |
| M | B' R B |
| N | R' B' R B |
| O | B' R' B |
| P | B' R2 B |
| Q | special |
| R | U' L U |
| S | special |
| T | U R' U' |
| U | buffer |
| V | U R2 U' |
| W | special |
| X | U' L2 U |

## Complete M2 edge algorithms

These expand ordinary setup moves as `setup M2 inverse(setup)` and preserve the tutorial's special algorithms.

| Letter | Full algorithm |
|---|---|
| A | `M2` |
| B | `R U R' U' M2 U R U' R'` |
| C | `U2 M' U2 M'` |
| D | `L' U' L U M2 U' L' U L` |
| E | `B L' B' M2 B L B'` |
| F | `B L2 B' M2 B L2 B'` |
| G | `B L B' M2 B L' B'` |
| H | `L B L' B' M2 B L B' L'` |
| I | `D M' U R2 U' M U R2 U' D' M2` |
| J | `U R U' M2 U R' U'` |
| K | buffer — no algorithm |
| L | `U' L' U M2 U' L U` |
| M | `B' R B M2 B' R' B` |
| N | `R' B' R B M2 B' R' B R` |
| O | `B' R' B M2 B' R B` |
| P | `B' R2 B M2 B' R2 B` |
| Q | `U B' R U' B M2 B' U R' B U'` |
| R | `U' L U M2 U' L' U` |
| S | `M2 D U R2 U' M' U R2 U' M D'` |
| T | `U R' U' M2 U R U'` |
| U | buffer — no algorithm |
| V | `U R2 U' M2 U R2 U'` |
| W | `M U2 M U2` |
| X | `U' L2 U M2 U' L2 U` |

## Old Pochmann corner algorithms

Corner buffer: UBL (stickers A, E, R in the Speffz reference). The supplied corner swap is the **altered Y-permutation**:

`R U' R' U' R U R' F' R U R' U' R' F R`

For each non-buffer target, execute **setup + altered Y-permutation + inverse setup**. The inverse reverses move order and inverts each turn. V has no setup and uses the altered Y-permutation directly. A, E, R are buffer stickers and have no target algorithm.

| Letter | Setup | Complete execution (setup + swap + unsetup) |
|---|---|---|
| A | buffer | no algorithm |
| B | `R2` | `R2 R U' R' U' R U R' F' R U R' U' R' F R R2` |
| C | `F2 D` | `F2 D R U' R' U' R U R' F' R U R' U' R' F R D' F2` |
| D | `F2` | `F2 R U' R' U' R U R' F' R U R' U' R' F R F2` |
| E | buffer | no algorithm |
| F | `F' D` | `F' D R U' R' U' R U R' F' R U R' U' R' F R D' F` |
| G | `F'` | `F' R U' R' U' R U R' F' R U R' U' R' F R F` |
| H | `D' R` | `D' R R U' R' U' R U R' F' R U R' U' R' F R R' D` |
| I | `F R'` | `F R' R U' R' U' R U R' F' R U R' U' R' F R R F'` |
| J | `R'` | `R' R U' R' U' R U R' F' R U R' U' R' F R R` |
| K | `F' R'` | `F' R' R U' R' U' R U R' F' R U R' U' R' F R R F` |
| L | `F2 R'` | `F2 R' R U' R' U' R U R' F' R U R' U' R' F R R F2` |
| M | `F` | `F R U' R' U' R U R' F' R U R' U' R' F R F'` |
| N | `R' F` | `R' F R U' R' U' R U R' F' R U R' U' R' F R F' R` |
| O | `R2 F` | `R2 F R U' R' U' R U R' F' R U R' U' R' F R F' R2` |
| P | `R F` | `R F R U' R' U' R U R' F' R U R' U' R' F R F' R'` |
| Q | `R D'` | `R D' R U' R' U' R U R' F' R U R' U' R' F R D R'` |
| R | buffer | no algorithm |
| S | `D F'` | `D F' R U' R' U' R U R' F' R U R' U' R' F R F D'` |
| T | `R` | `R R U' R' U' R U R' F' R U R' U' R' F R R'` |
| U | `D` | `D R U' R' U' R U R' F' R U R' U' R' F R D'` |
| V | none | `R U' R' U' R U R' F' R U R' U' R' F R` |
| W | `D'` | `D' R U' R' U' R U R' F' R U R' U' R' F R D` |
| X | `D2` | `D2 R U' R' U' R U R' F' R U R' U' R' F R D2` |


## Parity

Use one of the tutorial's two alternatives **after solving edges and before solving corners** if the memorized number of edge/corner targets is odd. With correct memorization, edge and corner memo counts should have matching odd/even parity.

1. `M2 U' M U2 M U' M' U2 M' U2`
2. `D' L2 D M2 D' L2 D`

## Scope and limitations

The supplied tutorial material now includes M2 edge algorithms, the altered Y-permutation, and corner setup moves, but no explicit full sticker lettering diagrams. The Speffz tables above are a standard reference, not a confirmed diagram from the tutorial. Understand OP as buffer-based corner cycling; do not manufacture other algorithms or claim the sample edge memo can be reproduced uniquely without lettering and cycle-break conventions.

Tutorial reference: https://www.speedsolving.com/wiki/index.php/M2/R2 (consult only M2 information; ignore R2).