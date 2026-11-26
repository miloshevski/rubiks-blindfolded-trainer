import type { ReactNode } from 'react';
import type { TutorialData } from '../../hooks/useTutorialData';
import { EXAMPLE_SCRAMBLE, FLIP_SCRAMBLE, solveHref } from '../../lib/tutorial';
import { parseSolution } from '../../lib/solution';
import { PageLink } from '../home/PageLink';
import { AlgTable, Box, ExampleMemo, H, L, LetterNet, Loading, Note, OL, P, ParityTable, Try, UL } from './parts';

export interface Lesson {
  id: string;
  title: string;
  /** One line under the title in the lesson list. */
  summary: string;
  body: (d: TutorialData) => ReactNode;
}

const link = 'text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent';

/** The executed letters of the example's edge memo, with the substituted ones marked. */
function ExecutedLetters({ d }: { d: TutorialData }) {
  if (!d.example) return <Loading />;
  const rows = parseSolution(d.example.solution).find(s => s.kind === 'edges')?.rows ?? [];
  return (
    <Box className="flex flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap gap-x-2 gap-y-3" aria-label="Edge targets, in order">
        {rows.map((r, i) => (
          <div key={i} className="flex min-w-[34px] flex-col items-center gap-1">
            <span className="font-mono text-[10px] text-ink-3">{i + 1}</span>
            <span className="font-mono text-[18px] font-medium text-ink">{r.letter}</span>
            <span className={`font-mono text-[13px] ${r.exec ? 'font-semibold text-accent' : 'text-ink-3'}`}>{r.exec ? `→ ${r.exec}` : '·'}</span>
          </div>
        ))}
      </div>
      <p className="m-0 text-[12px] text-ink-3">Top: the target number. Middle: the letter you memorised. Bottom: the letter you execute when it differs.</p>
    </Box>
  );
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'how', title: 'How blindfold solving works', summary: 'Memorise, then execute',
    body: () => (
      <>
        <P>A blindfolded solve has two phases. First you <b className="text-ink">look</b> at the scrambled cube and turn what you see into a short list of letters. Then you put the blindfold on and <b className="text-ink">execute</b> that list, one algorithm per letter, without ever seeing the cube again.</P>
        <P>Each algorithm does one small job: it swaps one piece into its place. Because the algorithms are built to leave everything else untouched, doing them in order solves the whole cube.</P>
        <H>The method used here</H>
        <UL>
          <li><b className="text-ink">Edges</b> with <b className="text-ink">M2</b>: the middle slice turned twice, with a few moves to set up and undo.</li>
          <li><b className="text-ink">Corners</b> with <b className="text-ink">Old Pochmann</b>: one fixed swap algorithm (an altered Y-permutation) with setup moves.</li>
          <li><b className="text-ink">Speffz</b> lettering: every sticker has a letter, A to X.</li>
        </UL>
        <H>The whole solve, in order</H>
        <OL>
          <li>Inspect the scramble and memorise the <b className="text-ink">edge</b> letters.</li>
          <li>Memorise the <b className="text-ink">corner</b> letters.</li>
          <li>Put the blindfold on. Execute the edges.</li>
          <li>If the edge count is odd, do a <b className="text-ink">parity</b> algorithm.</li>
          <li>Execute the corners. Take the blindfold off: solved.</li>
        </OL>
        <Note title="How to use this tutorial">
          Every algorithm and every example on these pages comes straight from the same engine that powers the Solve page, so what you read here is exactly what the trainer will tell you to do. Work through the ten lessons in order; each one ends with something to try.
        </Note>
      </>
    ),
  },
  {
    id: 'letters', title: 'Name every sticker', summary: 'Speffz letters A to X',
    body: d => (
      <>
        <P>To memorise a cube you need a name for every spot on it. This method uses <b className="text-ink">Speffz</b>: each face has eight lettered stickers, four edges and four corners, and the letters run around the face clockwise.</P>
        <LetterNet letters={d.letters} />
        <UL>
          <li>The faces are lettered in this order: <b className="text-ink">Up, Left, Front, Right, Back, Down</b>.</li>
          <li>Four letters per face: <L>A–D</L> on Up, <L>E–H</L> on Left, <L>I–L</L> on Front, <L>M–P</L> on Right, <L>Q–T</L> on Back, <L>U–X</L> on Down.</li>
          <li>The centres have no letter: they never move.</li>
          <li>Edges and corners are lettered separately, so there is an edge <L>B</L> and a corner <L>B</L>. You always know which one you mean from where you are in the memo.</li>
        </UL>
        <H>Letters name stickers, not pieces</H>
        <P>An edge piece has two stickers, so two letters. A corner has three. The letters of one piece are the same piece seen from different faces. For example the top edge at the front is <L>C</L> on its Up sticker and <L>I</L> on its Front sticker.</P>
        <Try question="Which letter is the Front sticker of the Up-Front edge?">It is <L>I</L>. Its other sticker, on the Up face, is <L>C</L>.</Try>
        <P>The <PageLink to="drill" className={link}>Letter drill</PageLink> blinks a sticker on the cube and asks for its letter. Spend a few sessions there until the lettering is automatic; everything else builds on it.</P>
      </>
    ),
  },
  {
    id: 'buffers', title: 'Buffers and swaps', summary: 'The idea behind every algorithm',
    body: d => (
      <>
        <P>Every algorithm in this method <b className="text-ink">swaps the piece in one fixed place, the buffer, with the piece at the target you name</b>. Repeating that swap sends each piece home, one after another.</P>
        <UL>
          <li><b className="text-ink">Edge buffer:</b> the Down-Front edge. Its stickers are <L>K</L> and <L>U</L>.</li>
          <li><b className="text-ink">Corner buffer:</b> the Up-Back-Left corner. Its stickers are <L>A</L>, <L>E</L> and <L>R</L>.</li>
        </UL>
        <P>A buffer letter is never a target, so those letters have no algorithm. You will see them marked <i>buffer</i> on the <PageLink to="algs" className={link}>Algorithms</PageLink> page.</P>
        <H>One algorithm, three parts</H>
        <P>Every target algorithm has the same shape:</P>
        <Box className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[13px]">
            <span className="rounded border border-line px-2 py-1 text-ink">setup</span><span className="text-ink-3">+</span>
            <span className="rounded border border-accent bg-accent-bg px-2 py-1 text-accent">swap</span><span className="text-ink-3">+</span>
            <span className="rounded border border-line px-2 py-1 text-ink-2">undo</span>
          </div>
          <p className="m-0 mt-3 text-[13px] leading-[1.6] text-ink-2">The <b className="text-ink">setup</b> brings the target into reach of the swap. The <b className="text-ink">swap</b> is the same for every edge (<L>M2</L>) and the same for every corner (the Y-permutation). The <b className="text-ink">undo</b> is the setup backwards, so the rest of the cube is exactly as it was.</p>
        </Box>
        <H>An edge example</H>
        <AlgTable rows={d.algs?.edges} letters={['B']} note="buffer" />
        <P>That is the whole algorithm for edge <L>B</L>: the highlighted <L>M2</L> is the swap, the moves before it are the setup and the moves after it are the undo.</P>
      </>
    ),
  },
  {
    id: 'trace', title: 'Trace the edge memo', summary: 'Turn the cube into letters',
    body: d => (
      <>
        <P>Now the first half of a solve: reading the cube. You follow the swaps the algorithms will make, and write down the target of each one.</P>
        <OL>
          <li>Look at the sticker in the <b className="text-ink">buffer</b> position.</li>
          <li>Find where that sticker <b className="text-ink">belongs</b> on a solved cube. The letter of that position is your <b className="text-ink">first target</b>.</li>
          <li>Go to that target position. Look at the sticker there and find where <i>it</i> belongs. That letter is the next target.</li>
          <li>Keep following. When the sticker you find belongs to the <b className="text-ink">buffer piece itself</b>, the cycle is closed. You do not write the buffer letter.</li>
        </OL>
        <P>Executing the targets in the order you wrote them, each swap sends the buffer's piece to the target and brings the target's piece into the buffer, ready for the next swap. Do all of them and the cycle is solved.</P>
        <H>A real example</H>
        <P>This is the scramble the Solve page produces the memo of. The edge memo is the first row; the letters are grouped in pairs to make them easier to remember.</P>
        <ExampleMemo cube={d.example} />
        <Try question="How many edge targets does this memo have?">
          {d.example ? <>It has <b className="text-ink">{d.example.edge_memo.replace(/\s/g, '').length}</b> letters, so {d.example.edge_memo.replace(/\s/g, '').length} targets. Remember that number: it decides whether you need the parity algorithm later.</> : 'Loading…'}
        </Try>
        <P><a className={link} href={solveHref(EXAMPLE_SCRAMBLE)}>Open this scramble on the Solve page</a> to see it on the 3D cube and step through the solution.</P>
      </>
    ),
  },
  {
    id: 'cycles', title: 'Cycles, flips and twists', summary: 'When the trace runs out',
    body: d => (
      <>
        <P>Sometimes you return to the buffer piece while other pieces are still wrong. Then you <b className="text-ink">break into a new cycle</b>.</P>
        <H>Breaking a cycle</H>
        <OL>
          <li>Pick any piece that is not solved and is not the buffer piece. (This trainer always picks the one with the alphabetically first letter, so its memo is always the same.)</li>
          <li>Write that piece's sticker letter as your next target.</li>
          <li>Trace from there, as before, until you land back on that same piece. This time you <b className="text-ink">write the closing letter too</b>.</li>
          <li>Repeat until every piece is solved.</li>
        </OL>
        <P>Each cycle is a separate loop of pieces. On the Solve page every cycle is underlined in its own colour, so you can see where one ends and the next begins.</P>
        <H>Flipped edges and twisted corners</H>
        <P>A piece can be in the right place but turned the wrong way: a <b className="text-ink">flipped edge</b>, or a <b className="text-ink">twisted corner</b>. It still needs fixing, and it is traced as a tiny cycle of two letters: write one sticker of the piece, then another sticker of the same piece.</P>
        <P>In this example the last edge pair and the last corner pair are exactly that. They are marked in yellow, and the memo summary names them.</P>
        <ExampleMemo cube={d.flips} />
        <Note title="Where to practise this">
          <a className={link} href={solveHref(FLIP_SCRAMBLE)}>Open this scramble on the Solve page</a>, find the yellow pairs, and look at their algorithms in the solution list.
        </Note>
      </>
    ),
  },
  {
    id: 'edges', title: 'Execute edges with M2', summary: 'Setup, M2, undo, and one special rule',
    body: d => (
      <>
        <P>Time to execute. For an ordinary edge target the algorithm is <b className="text-ink">setup, <L>M2</L>, undo</b>. Here are three of them, straight from the server's table:</P>
        <AlgTable rows={d.algs?.edges} letters={['A', 'B', 'E']} note="buffer" />
        <UL>
          <li><L>A</L> needs no setup: it is just <L>M2</L>.</li>
          <li>For <L>B</L> and <L>E</L> the setup moves the target into the middle slice; the undo is the setup in reverse.</li>
        </UL>
        <H>Dedicated algorithms</H>
        <P>Five edge targets break the pattern and have their own algorithms: <L>C</L>, <L>I</L>, <L>Q</L>, <L>S</L> and <L>W</L>. (<L>A</L> is just <L>M2</L>.) Two of them:</P>
        <AlgTable rows={d.algs?.edges} letters={['C', 'W']} note="buffer" />
        <H>The even-position rule</H>
        <P>Count the targets of the edge memo from 1, continuously across the pairs. On every <b className="text-ink">even-numbered</b> target, if the letter is <L>C</L>, <L>W</L>, <L>I</L> or <L>S</L>, you <b className="text-ink">execute its opposite</b> instead:</P>
        <UL>
          <li><L>C</L> ↔ <L>W</L></li>
          <li><L>I</L> ↔ <L>S</L></li>
        </UL>
        <P>You still memorise the original letter. Only the algorithm you perform changes. Here is the example memo from lesson 4:</P>
        <ExecutedLetters d={d} />
        <P>The second target, <L>I</L>, is at an even position, so it is executed as <L>S</L>. The Solve page marks such letters with a dotted underline and lists them as "executed as".</P>
        <Try question="Target 7 is S. Is it swapped?">
          No. Target 7 is odd, so the letter is executed as written. Only even-numbered targets are swapped.
        </Try>
      </>
    ),
  },
  {
    id: 'corners', title: 'Corners with Old Pochmann', summary: 'One swap, many setups',
    body: d => (
      <>
        <P>Corners work the same way, with a different swap. You trace the corner memo exactly like the edge memo, but from the <b className="text-ink">corner buffer</b> (letters <L>A</L>, <L>E</L>, <L>R</L>), using corner letters. The edge algorithms leave the corners alone. (The parity algorithm does move some corners; the Solve page takes that into account when it shows your corner memo.)</P>
        <P>The algorithm for a target is <b className="text-ink">setup, the altered Y-permutation, undo</b>:</P>
        <AlgTable rows={d.algs?.corners} letters={['V', 'B', 'G']} note="buffer" />
        <UL>
          <li>The highlighted moves are the Y-permutation. It is the same for every corner.</li>
          <li><L>V</L> needs no setup, so it is the Y-permutation alone.</li>
          <li>Other targets add a few setup moves, and the same moves backwards at the end.</li>
        </UL>
        <Note title="No substitution here">
          The even-position rule is only for edges. Execute every corner letter exactly as you memorised it.
        </Note>
        <P>Corners can also be twisted in place. They are traced as a two-letter cycle, like a flipped edge. The full list of corner algorithms is on the <PageLink to="algs" className={link}>Algorithms</PageLink> page.</P>
      </>
    ),
  },
  {
    id: 'parity', title: 'Parity', summary: 'When the edge count is odd',
    body: d => (
      <>
        <P>Edges and corners are swapped in twos, so for a legal cube the number of edge targets and the number of corner targets are either <b className="text-ink">both odd or both even</b>. When they are odd, one extra algorithm is needed to fix the leftover swap. That is <b className="text-ink">parity</b>.</P>
        <OL>
          <li>Count your edge targets while you memorise.</li>
          <li>If the count is <b className="text-ink">odd</b>, plan a parity algorithm.</li>
          <li>Execute it after the edges and before the corners.</li>
        </OL>
        <P>There are two algorithms to choose from. Either one works; pick one and learn it:</P>
        <ParityTable algs={d.algs} />
        <P>The Solve page marks parity at the end of the edge memo with a <b className="text-ink">PARITY</b> tag, and you can choose which algorithm it uses in the bar at the top.</P>
        <Try question="The example memo has 11 edge targets. Is parity needed?">
          Yes. 11 is odd. Execute the edges, then the parity algorithm, then the corners.
        </Try>
      </>
    ),
  },
  {
    id: 'memorise', title: 'Memorise in pairs', summary: 'Turn letters into images',
    body: () => (
      <>
        <P>Remembering twenty separate letters is hard. Remembering a few images is easy. So the memo is read in <b className="text-ink">pairs of letters</b>, and each pair gets a word or image.</P>
        <UL>
          <li>Group the edge letters in pairs (<L>HI EF BO …</L>). If the count is odd, the last letter stands alone.</li>
          <li>Group the corner letters in pairs the same way.</li>
          <li>There are 24 × 24 = 576 pairs. Each one needs a word or image that you will recognise instantly.</li>
          <li>Then link the images in a story, or place them along a route you know well. Walking the story gives you the letters back in order.</li>
        </UL>
        <P>The <PageLink to="pairs" className={link}>Pairs</PageLink> page has a starting word for all 576 pairs. Turn on <b className="text-ink">Edit words</b> to replace any of them with the image that works best for you. The words you change are saved.</P>
        <Note title="Pairs and the even-position rule">
          Pair boundaries run continuously through the edge memo, which is why the second letter of every pair is an even-numbered target. That makes the rule from lesson 6 easy to spot: it is always the second letter of a pair.
        </Note>
      </>
    ),
  },
  {
    id: 'practice', title: 'Put it together', summary: 'A first full solve, then practice',
    body: () => (
      <>
        <P>You now know the whole method. Here is the checklist for a first full solve:</P>
        <OL>
          <li>Get a scramble (the Solve page draws one, or paste your own).</li>
          <li>Trace and memorise the <b className="text-ink">edges</b>; count them.</li>
          <li>Trace and memorise the <b className="text-ink">corners</b>.</li>
          <li>Type your memo into the <b className="text-ink">Recall check</b> to test your memory and your tracing.</li>
          <li>Press play to watch the solution on the cube and see where you went wrong.</li>
          <li>When you can do all of that reliably, try it with the blindfold on: edges, parity if needed, then corners.</li>
        </OL>
        <H>Where to go next</H>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
          {[
            ['solve', 'Solve', 'Practise on scrambles and check your memo.'],
            ['drill', 'Letter drill', 'Make the lettering automatic.'],
            ['algs', 'Algorithms', 'Learn the algorithms you need.'],
            ['pairs', 'Pairs', 'Make your pair words.'],
            ['timer', 'Timer', 'Time your attempts.'],
          ].map(([to, title, text]) => (
            <PageLink key={to} to={to as 'solve'} className="flex flex-col gap-1 rounded-md border border-rule bg-raise p-4 text-ink no-underline transition-colors duration-[120ms] hover:border-edge-2 hover:bg-raise-2">
              <span className="text-[14px] font-semibold">{title} →</span>
              <span className="text-[12.5px] leading-[1.55] text-ink-2">{text}</span>
            </PageLink>
          ))}
        </div>
      </>
    ),
  },
];
