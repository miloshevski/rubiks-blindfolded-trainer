export interface Lesson {
  id: string;
  title: string;
  explanation: string;
  exercise: string;
  question: string;
  answers: string[];
  correct: number;
  hint: string;
  glossary: string[];
  source: string;
}
const source = 'https://www.speedsolving.com/wiki/index.php/M2/R2';
const cornerSource = 'https://www.speedsolving.com/wiki/index.php/Classic_Pochmann';
export const LESSONS: Lesson[] = [
  {
    id: 'intro',
    title: 'Introduction to BLD',
    explanation:
      'Blindfold solving has two parts: inspect and memorize with your eyes open, then execute remembered targets without looking. This trainer uses M2 for edges and Old Pochmann for corners. Start with a cube you can already solve normally; practice accuracy before speed.',
    exercise:
      'Play the demonstration, then pause and step one move in each direction. Watch how a sequence changes the cube.',
    question: 'When do you memorize the cube?',
    answers: [
      'Before covering your eyes',
      'During blind execution',
      'Only after the edges are solved',
    ],
    correct: 0,
    hint: 'Inspection supplies the information you will need later.',
    glossary: ['memo', 'target'],
    source,
  },
  {
    id: 'speffz',
    title: 'Speffz lettering',
    explanation:
      'Each edge sticker and each corner sticker has its own A–X label. An edge has two stickers and a corner has three; letters identify stickers, not entire pieces. Four letters belong to each face in order U, L, F, R, B, D. The center is never a target.',
    exercise:
      'Turn on absolute letters. Find C on the U face, then find its other edge sticker I on F. Open letter recognition practice to test yourself.',
    question: 'What does one letter identify?',
    answers: ['A whole face', 'One sticker', 'A complete algorithm sequence'],
    correct: 1,
    hint: 'C and I name different stickers on the same UF edge.',
    glossary: ['sticker', 'Speffz'],
    source,
  },
  {
    id: 'buffers',
    title: 'Buffers and targets',
    explanation:
      'A buffer is the fixed working piece. M2 reads sticker U at DF; Old Pochmann reads sticker E at LUB on the UBL corner. Read the sticker in the buffer, name its home, then follow the sticker at that target slot. Continue until the buffer piece closes the cycle.',
    exercise:
      'Inspect the edge memo, locate its first target in absolute lettering, then play only the first target algorithm.',
    question: 'Which edge buffer sticker does this trainer read?',
    answers: ['U at DF', 'C at UF', 'E at LU'],
    correct: 0,
    hint: 'The DF buffer has stickers U and K; tracing reads the D-face sticker.',
    glossary: ['buffer', 'target', 'cycle'],
    source,
  },
  {
    id: 'corners',
    title: 'Old Pochmann corners',
    explanation:
      'For every non-buffer corner target, perform setup, the altered Y permutation, then the inverse setup. The traced sticker is E. V uses the permutation directly; A, E and R are buffer stickers. Each corner algorithm also swaps UB and UL edges, so target count and parity matter.',
    exercise:
      'Step through a corner target. Identify setup, swap and undo in the algorithm reference. Replay the inverse setup slowly.',
    question: 'How do you undo a setup?',
    answers: ['Repeat its moves unchanged', 'Reverse move order and invert every turn', 'Use M2'],
    correct: 1,
    hint: 'The inverse of R U is U′ R′.',
    glossary: ['setup', 'inverse', 'buffer'],
    source: cornerSource,
  },
  {
    id: 'm2',
    title: 'M2 edges',
    explanation:
      'Ordinary targets use setup + M2 + inverse setup. K and U are buffer stickers and have no target algorithm. A, C, I, Q, S and W have dedicated algorithms. M2 has intermediate side effects, so judge the complete sequence rather than expecting every intermediate cube to look solved.',
    exercise:
      'Replay the first edge target and identify the M2 core. Compare B and J in Algorithms.',
    question: 'Which letters are the edge buffer?',
    answers: ['A and E', 'K and U', 'C and W'],
    correct: 1,
    hint: 'They are the two stickers on DF.',
    glossary: ['setup', 'buffer'],
    source,
  },
  {
    id: 'special',
    title: 'M2 special cases',
    explanation:
      'On even-numbered edge targets, execute C as W, W as C, I as S and S as I. Numbering continues across cycle breaks. Keep the original sticker in your memo and dictionary: only the executed algorithm changes. In HI, the second target I executes S.',
    exercise:
      'Find HI at the start of this fixture. Step the H algorithm, then the I memo target; inspect its S execution algorithm.',
    question: 'How is the memo pair HI executed?',
    answers: ['HI', 'HS', 'HW'],
    correct: 1,
    hint: 'I is even and its opposite is S.',
    glossary: ['memo', 'target'],
    source,
  },
  {
    id: 'cycles',
    title: 'Cycle breaks',
    explanation:
      'When tracing returns to the buffer but unsolved pieces remain, choose an unsolved non-buffer sticker to open another cycle. Close that cycle by tracing back to the break piece. This solver deterministically chooses the unsolved piece with the alphabetically earliest sticker; other valid human choices may differ.',
    exercise:
      'Locate a cycle-break step in the demonstration metadata. Follow the targets until the break piece returns.',
    question: 'What happens to M2 target numbering at a cycle break?',
    answers: ['It restarts at one', 'It continues', 'It becomes irrelevant'],
    correct: 1,
    hint: 'Even-position substitutions use the complete edge sequence.',
    glossary: ['cycle', 'cycle break'],
    source,
  },
  {
    id: 'orientation',
    title: 'Orientation cases',
    explanation:
      'A piece can occupy its correct position while its stickers are oriented incorrectly. Flipped edges and twisted corners must still be traced. Legal cube states constrain orientation: a single isolated flipped edge or twisted corner is not a legal scramble. Use verified examples rather than inventing impossible states.',
    exercise:
      'Inspect the unsolved stickers in this legal orientation example. Trace the stickers, including repeated visits to the same physical piece.',
    question: 'Is a piece solved just because it is in its home position?',
    answers: ['Yes', 'Only if its stickers are also correctly oriented', 'Only for corners'],
    correct: 1,
    hint: 'A flipped edge has the right position but the wrong sticker directions.',
    glossary: ['orientation', 'sticker'],
    source,
  },
  {
    id: 'parity',
    title: 'Parity',
    explanation:
      'In this M2/OP implementation, an odd edge target count requires the selected parity algorithm after edges and before corners. The printed corner trace uses the state after those operations. Both supported parity algorithms are verified; keep the configured selection when following playback.',
    exercise:
      'Count the eleven edge targets, play the parity phase, then observe the corners. Do not infer a corner mistake solely from remaining edge swaps.',
    question: 'Where does the parity algorithm go?',
    answers: ['Before the scramble', 'After edges, before corners', 'After every memo pair'],
    correct: 1,
    hint: 'Edges → parity if needed → corners.',
    glossary: ['parity', 'memo'],
    source,
  },
  {
    id: 'full',
    title: 'First complete solve',
    explanation:
      'Apply a scramble, memorize edge and corner targets in pairs, and choose vivid mnemonic words. Practice the edge execution substitutions separately. Execute edges, parity if needed, then corners. Check your recalled execution letters and inspect any remaining pieces. The computer verifies its printed algorithms on a fresh scrambled cube.',
    exercise:
      'Open this scramble in Solver, hide the memo, write your recall, check it, and use Render mine to inspect execution.',
    question: 'Which letters does the recall checker execute?',
    answers: [
      'Exactly the execution letters you type',
      'Automatically corrected memo letters',
      'Only the first pair',
    ],
    correct: 0,
    hint: 'The checker does not silently apply M2 substitutions to typed execution letters.',
    glossary: ['memo', 'parity', 'target'],
    source,
  },
];
export const GLOSSARY: Record<string, string> = {
  memo: 'The target sequence you remember before execution.',
  target: 'The sticker slot receiving the sticker from the buffer.',
  sticker: 'One colored face of a physical cubie.',
  Speffz: 'The standard A–X sticker lettering used by default.',
  buffer: 'The fixed working piece used by the method.',
  cycle: 'A chain of sticker destinations that returns to its starting piece.',
  'cycle break': 'Opening another unsolved cycle after reaching the buffer.',
  setup: 'Moves that place a target in position for the core swap.',
  inverse: 'An algorithm that undoes another algorithm.',
  orientation: 'The direction a piece’s stickers face at a position.',
  parity: 'An odd/even property requiring a method-specific correction.',
};
