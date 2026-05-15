import { greet } from '../js/app.js';

describe('greet', () => {
  it('returns a hello-world greeting', () => {
    expect(greet('world')).toBe('Hello, world!');
  });

  it('includes the supplied name in the greeting', () => {
    expect(greet('Brendan')).toBe('Hello, Brendan!');
  });
});
