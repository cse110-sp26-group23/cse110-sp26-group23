import { parsePrompt, stripMarkers, hasSnippets } from '../js/snippets.js';

describe('parsePrompt', () => {
  it('returns the text unchanged with an all-false mask when there are no markers', () => {
    const { text, mask } = parsePrompt('<h1>Hello</h1>');

    expect(text).toBe('<h1>Hello</h1>');
    expect(mask.length).toBe(text.length);
    expect(mask.some(Boolean)).toBe(false);
  });

  it('strips the delimiters and marks only the snippet characters', () => {
    const { text, mask } = parsePrompt('<div class="{{card}}">');

    expect(text).toBe('<div class="card">');
    // The four characters of "card" are the snippet; everything else is scaffold.
    const snippetChars = text
      .split('')
      .filter((_, i) => mask[i])
      .join('');
    expect(snippetChars).toBe('card');
  });

  it('keeps text.length and mask.length in sync', () => {
    const { text, mask } = parsePrompt('a{{bc}}d{{e}}');

    expect(mask.length).toBe(text.length);
  });

  it('marks a snippet at the very start of a line', () => {
    const { text, mask } = parsePrompt('{{section}} rest');

    expect(text).toBe('section rest');
    expect(mask.slice(0, 'section'.length).every(Boolean)).toBe(true);
    expect(mask[text.indexOf(' ')]).toBe(false);
  });

  it('marks a snippet at the very end of a line', () => {
    const { text, mask } = parsePrompt('display: {{flex}}');

    expect(text).toBe('display: flex');
    expect(mask[text.length - 1]).toBe(true);
    expect(mask[0]).toBe(false);
  });

  it('marks two snippets on a single line, masking both regions as snippet', () => {
    const { text, mask } = parsePrompt('<{{div}} class="{{row}}">');

    expect(text).toBe('<div class="row">');
    const snippetChars = text
      .split('')
      .filter((_, i) => mask[i])
      .join('');
    // Both markers on the line are honored, left to right.
    expect(snippetChars).toBe('divrow');
  });

  it('handles multiple lines, marking snippets per line and leaving plain lines untouched', () => {
    const marked = '<{{section}}>\n  <p>plain</p>\n  <{{button}}>x</button>';
    const { text, mask } = parsePrompt(marked);

    expect(text).toBe('<section>\n  <p>plain</p>\n  <button>x</button>');
    // The middle line has no snippet.
    const lines = text.split('\n');
    const secondLineStart = lines[0].length + 1;
    for (let i = secondLineStart; i < secondLineStart + lines[1].length; i += 1) {
      expect(mask[i]).toBe(false);
    }
  });

  it('does not let markers cross line boundaries: an unclosed {{ is literal', () => {
    const { text, mask } = parsePrompt('a {{b\nc}} d');

    // No same-line close, so both delimiters stay as literal text.
    expect(text).toBe('a {{b\nc}} d');
    expect(mask.some(Boolean)).toBe(false);
  });

  it('treats a newline as scaffold', () => {
    const { text, mask } = parsePrompt('{{a}}\n{{b}}');

    expect(text).toBe('a\nb');
    expect(mask[text.indexOf('\n')]).toBe(false);
  });

  it('returns empty output for an empty string', () => {
    expect(parsePrompt('')).toEqual({ text: '', mask: [] });
  });

  it('is safe on non-string input', () => {
    expect(parsePrompt(null)).toEqual({ text: '', mask: [] });
    expect(parsePrompt(undefined)).toEqual({ text: '', mask: [] });
  });

  it('drops empty markers without creating snippet characters', () => {
    const { text, mask } = parsePrompt('a{{}}b');

    expect(text).toBe('ab');
    expect(mask.some(Boolean)).toBe(false);
  });
});

describe('stripMarkers', () => {
  it('removes all delimiters', () => {
    expect(stripMarkers('<{{h1}}>Hi</h1>')).toBe('<h1>Hi</h1>');
  });

  it('leaves un-marked text unchanged', () => {
    expect(stripMarkers('plain text')).toBe('plain text');
  });

  it('leaves an unclosed marker as literal text', () => {
    expect(stripMarkers('a {{ b')).toBe('a {{ b');
  });
});

describe('hasSnippets', () => {
  it('is true when at least one snippet is present', () => {
    expect(hasSnippets('color: {{red}};')).toBe(true);
  });

  it('is false when there are no markers', () => {
    expect(hasSnippets('color: red;')).toBe(false);
  });

  it('is false for an empty marker', () => {
    expect(hasSnippets('a{{}}b')).toBe(false);
  });
});
