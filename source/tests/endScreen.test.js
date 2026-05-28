import { JSDOM } from 'jsdom';
import {
  formatElapsedTime,
  createEndScreen,
  renderEndScreen,
  showEndScreen,
} from '../js/endScreen.js';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

describe('formatElapsedTime', () => {
  it('formats a positive number with two decimals and a trailing s', () => {
    expect(formatElapsedTime(12.345)).toBe('12.35s');
  });

  it('formats zero seconds', () => {
    expect(formatElapsedTime(0)).toBe('0.00s');
  });

  it('formats whole-number seconds with two trailing decimals', () => {
    expect(formatElapsedTime(60)).toBe('60.00s');
  });

  it('throws when given a non-number', () => {
    expect(() => formatElapsedTime('5')).toThrowError(
      'formatElapsedTime expects a number.',
    );
  });
});

describe('createEndScreen', () => {
  const sampleMetrics = {
    wpm: 42,
    accuracy: 95.5,
    errorCount: 3,
    elapsedSeconds: 30,
  };

  it('returns a section element', () => {
    const section = createEndScreen(sampleMetrics);

    expect(section).toBeInstanceOf(HTMLElement);
    expect(section.tagName).toBe('SECTION');
  });

  it('applies the end-screen class and aria-label', () => {
    const section = createEndScreen(sampleMetrics);

    expect(section.classList.contains('end-screen')).toBe(true);
    expect(section.getAttribute('aria-label')).toBe(
      'End of round performance metrics',
    );
  });

  it('renders the Round Complete heading', () => {
    const section = createEndScreen(sampleMetrics);
    const heading = section.querySelector('h2');

    expect(heading).not.toBeNull();
    expect(heading.textContent).toBe('Round Complete');
  });

  it('shows wpm, accuracy, error count, and formatted time', () => {
    const section = createEndScreen(sampleMetrics);

    expect(section.querySelector('[data-testid="metric-wpm"]').textContent)
      .toBe('42');
    expect(
      section.querySelector('[data-testid="metric-accuracy"]').textContent,
    ).toBe('95.5%');
    expect(section.querySelector('[data-testid="metric-errors"]').textContent)
      .toBe('3');
    expect(section.querySelector('[data-testid="metric-time"]').textContent)
      .toBe('30.00s');
  });

  it('defaults missing metric fields to zero', () => {
    const section = createEndScreen({});

    expect(section.querySelector('[data-testid="metric-wpm"]').textContent)
      .toBe('0');
    expect(
      section.querySelector('[data-testid="metric-accuracy"]').textContent,
    ).toBe('0%');
    expect(section.querySelector('[data-testid="metric-errors"]').textContent)
      .toBe('0');
    expect(section.querySelector('[data-testid="metric-time"]').textContent)
      .toBe('0.00s');
  });

  it('throws when metrics is null', () => {
    expect(() => createEndScreen(null)).toThrowError(
      'createEndScreen expects a metrics object.',
    );
  });

  it('throws when metrics is undefined', () => {
    expect(() => createEndScreen(undefined)).toThrowError(
      'createEndScreen expects a metrics object.',
    );
  });

  it('throws when metrics is not an object', () => {
    expect(() => createEndScreen('not-an-object')).toThrowError(
      'createEndScreen expects a metrics object.',
    );
  });

  it('omits the Next Level button when no next level is given', () => {
    const section = createEndScreen(sampleMetrics);
    expect(section.querySelector('[data-testid="next-level"]')).toBeNull();
  });

  it('renders a Next Level link to the given level when provided', () => {
    const section = createEndScreen(sampleMetrics, { nextLevelId: 'expert-feed' });
    const next = section.querySelector('[data-testid="next-level"]');

    expect(next).not.toBeNull();
    expect(next.getAttribute('href')).toBe('game.html?level=expert-feed');
  });
});

describe('renderEndScreen', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('appends the end screen to the container', () => {
    const result = renderEndScreen(container, {
      wpm: 10,
      accuracy: 100,
      errorCount: 0,
      elapsedSeconds: 5,
    });

    expect(container.children.length).toBe(1);
    expect(container.firstElementChild).toBe(result);
    expect(result.classList.contains('end-screen')).toBe(true);
  });

  it('clears any existing content in the container before rendering', () => {
    const stale = document.createElement('p');
    stale.textContent = 'previous round';
    container.appendChild(stale);

    renderEndScreen(container, {
      wpm: 1,
      accuracy: 1,
      errorCount: 0,
      elapsedSeconds: 1,
    });

    expect(container.children.length).toBe(1);
    expect(container.querySelector('p')).toBeNull();
  });

  it('throws when the container is not an HTMLElement', () => {
    expect(() => renderEndScreen(null, {})).toThrowError(
      'renderEndScreen expects an HTMLElement container.',
    );
    expect(() => renderEndScreen('#root', {})).toThrowError(
      'renderEndScreen expects an HTMLElement container.',
    );
  });

  it('propagates errors from createEndScreen when metrics are invalid', () => {
    expect(() => renderEndScreen(container, null)).toThrowError(
      'createEndScreen expects a metrics object.',
    );
  });
});

describe('showEndScreen', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders metrics derived from round data into the container', () => {
    const endScreen = showEndScreen(container, {
      targetText: 'hello',
      typedText: 'hello',
      startTime: 0,
      endTime: 60000,
    });

    expect(container.firstElementChild).toBe(endScreen);
    expect(
      endScreen.querySelector('[data-testid="metric-accuracy"]').textContent,
    ).toBe('100%');
    expect(endScreen.querySelector('[data-testid="metric-errors"]').textContent)
      .toBe('0');
    expect(endScreen.querySelector('[data-testid="metric-time"]').textContent)
      .toBe('60.00s');
  });

  it('reflects mistakes in the rendered metrics', () => {
    const endScreen = showEndScreen(container, {
      targetText: 'abcd',
      typedText: 'abxd',
      startTime: 0,
      endTime: 60000,
    });

    expect(
      endScreen.querySelector('[data-testid="metric-accuracy"]').textContent,
    ).toBe('75%');
    expect(endScreen.querySelector('[data-testid="metric-errors"]').textContent)
      .toBe('1');
  });
});
