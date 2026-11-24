import { randomScrambleForEvent } from 'cubing/scramble';
self.onmessage = async (event: MessageEvent<number>) => {
  try {
    self.postMessage({
      id: event.data,
      scramble: (await randomScrambleForEvent('333')).toString(),
    });
  } catch (error) {
    self.postMessage({ id: event.data, error: String(error) });
  }
};
