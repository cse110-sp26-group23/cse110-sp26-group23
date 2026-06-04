/**
 * One-shot authoring helper: re-marks the prompt packs with `{{...}}` snippets
 * (up to two per typed line) and flips intermediate/expert levels to mobile.
 *
 * Safety: for every level it asserts that stripping the markers from the new
 * html/css yields byte-identical text to the original pack, so this can only
 * ADD markers, never alter the underlying webpage. Run once, then delete.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'source', 'data', 'prompts');

// Mirror of stripMarkers in source/js/prompts.js (per-line, markers never cross
// a line boundary).
function stripMarkers(text) {
  return String(text)
    .split('\n')
    .map((line) => line.replace(/\{\{([\s\S]*?)\}\}/g, '$1'))
    .join('\n');
}

// Marked html/css keyed by level id. A missing html/css means "leave the
// original unchanged" (used for the non-typed half of html_only / css_only).
const MARKED = {
  // ─── BEGINNER ────────────────────────────────────────────────────────────
  'beginner-breaking-news': {
    html: `<{{header}} class="{{masthead}}">
  <{{span}} class="{{badge}}">Breaking</span>
  <{{h1}}>City Unveils New Riverside Park</h1>
  <{{p}} class="{{lede}}">A long-awaited green space opens downtown this weekend.</p>
  <p class="{{meta}}">By Jordan Vale &middot; <{{time}}>June 3, 2026</time></p>
  <{{hr}}>
  <{{p}}>Officials promise trails, gardens, and room to breathe.</p>
  <{{a}} href="{{#story}}">Read the full story</a>
</header>`,
  },

  'beginner-sale-badge': {
    css: `.badge {
  {{display}}: {{inline-block}};
  {{background}}: {{#f97316}};
  {{color}}: {{white}};
  {{padding}}: {{6px 14px}};
  {{border-radius}}: {{999px}};
  {{font-weight}}: {{700}};
  {{font-size}}: {{13px}};
  {{letter-spacing}}: {{0.08em}};
  {{text-transform}}: {{uppercase}};
}`,
  },

  'beginner-newsletter': {
    html: `<{{section}} class="{{signup}}">
  <{{h3}}>Stay in the loop</h3>
  <{{p}}>Get our weekly digest in your inbox.</p>
  <{{form}}>
    <{{label}} for="{{email}}">Email</label>
    <{{input}} id="email" type="{{email}}" placeholder="you@site.com">
    <{{button}} type="{{submit}}">Subscribe</button>
  </form>
</section>`,
    css: `.signup { font-family: {{sans-serif}}; max-width: {{280px}}; }
.signup input {
  {{width}}: {{100%}};
  {{padding}}: {{8px 10px}};
  {{border}}: {{1px solid #ddd}};
  {{border-radius}}: {{8px}};
  {{box-sizing}}: {{border-box}};
}
.signup button {
  {{margin-top}}: {{8px}};
  {{border}}: {{none}};
  {{border-radius}}: {{999px}};
  {{background}}: {{#f97316}};
  {{color}}: {{white}};
  {{padding}}: {{8px 18px}};
  {{cursor}}: {{pointer}};
}`,
  },

  // ─── INTERMEDIATE ────────────────────────────────────────────────────────
  'intermediate-product-card': {
    html: `<{{div}} class="{{card}}">
  <{{div}} class="{{thumb}}">
    <{{span}} class="{{flag}}">Sale</span>
  </div>
  <{{div}} class="{{body}}">
    <{{h3}} class="{{name}}">Trail Runner Pack</h3>
    <{{p}} class="{{desc}}">22L daypack for weekend trips.</p>
    <{{div}} class="{{row}}">
      <{{span}} class="{{price}}">$64</span>
      <{{button}} class="{{buy}}">Add to cart</button>
    </div>
  </div>
</div>`,
    css: `.card {
  {{width}}: {{240px}};
  {{border-radius}}: {{14px}};
  {{overflow}}: {{hidden}};
  {{box-shadow}}: 0 6px 20px rgba(0,0,0,0.12);
  {{font-family}}: {{sans-serif}};
}
.thumb {
  {{position}}: {{relative}};
  {{aspect-ratio}}: 4 / 3;
  {{background}}: linear-gradient(135deg, #f97316, #fbbf24);
}
.flag {
  {{position}}: {{absolute}};
  {{top}}: {{10px}};
  {{left}}: {{10px}};
  {{background}}: {{#222}};
  {{color}}: {{white}};
  {{padding}}: {{3px 10px}};
  {{border-radius}}: {{999px}};
  {{font-size}}: {{12px}};
}
.body { {{padding}}: {{12px}}; }
.name { {{margin}}: {{0 0 4px}}; }
.desc { {{margin}}: {{0 0 12px}}; color: #666; font-size: 14px; }
.row { {{display}}: {{flex}}; align-items: center; justify-content: space-between; }
.price { {{font-size}}: {{20px}}; font-weight: 700; }
.buy { {{border}}: {{none}}; border-radius: 8px; background: #f97316; color: white; padding: 8px 14px; cursor: pointer; }`,
  },

  'intermediate-kanban-column': {
    html: `<{{section}} class="{{column}}">
  <{{header}} class="{{col-head}}">
    <{{h3}}>In Progress</h3>
    <{{span}} class="{{count}}">3</span>
  </header>
  <{{article}} class="{{ticket}}">
    <{{span}} class="tag {{bug}}">Bug</span>
    <{{p}}>Login button misaligned on mobile</p>
  </article>
  <{{article}} class="{{ticket}}">
    <{{span}} class="tag {{feat}}">Feature</span>
    <{{p}}>Add dark mode toggle to settings</p>
  </article>
  <{{article}} class="{{ticket}}">
    <{{span}} class="tag {{docs}}">Docs</span>
    <{{p}}>Document the export endpoint</p>
  </article>
</section>`,
    css: `.column {
  {{width}}: {{260px}};
  {{display}}: {{flex}};
  {{flex-direction}}: {{column}};
  {{gap}}: {{10px}};
  {{background}}: {{#f4f4f4}};
  {{padding}}: {{12px}};
  {{border-radius}}: {{12px}};
  {{font-family}}: {{sans-serif}};
}
.col-head { {{display}}: {{flex}}; align-items: center; justify-content: space-between; }
.col-head h3 { {{margin}}: {{0}}; font-size: 15px; }
.count { {{background}}: {{#ddd}}; border-radius: 999px; padding: 1px 9px; font-size: 13px; }
.ticket { {{background}}: {{white}}; border-radius: 8px; padding: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.ticket p { {{margin}}: {{6px 0 0}}; font-size: 14px; }
.tag { {{text-transform}}: {{uppercase}}; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 6px; color: white; }
.bug { {{background}}: {{#e23}}; }
.feat { {{background}}: {{#2a8}}; }
.docs { {{background}}: {{#58c}}; }`,
  },

  'intermediate-stats-dashboard': {
    css: `.dash {
  {{display}}: {{grid}};
  {{grid-template-columns}}: repeat(3, 1fr);
  {{gap}}: {{10px}};
  {{width}}: {{320px}};
  {{font-family}}: {{sans-serif}};
}
.tile { {{background}}: {{white}}; border-radius: 12px; padding: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
.tile .num { {{font-size}}: {{26px}}; font-weight: 700; color: #222; }
.tile .label { {{font-size}}: {{12px}}; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
.track { {{margin-top}}: {{10px}}; height: 8px; background: #eee; border-radius: 999px; overflow: hidden; }
.track .fill { {{height}}: {{100%}}; background: linear-gradient(90deg, #f97316, #fbbf24); }
.w70 { {{width}}: {{70%}}; }
.w45 { {{width}}: {{45%}}; }
.w90 { {{width}}: {{90%}}; }`,
  },

  // ─── EXPERT ──────────────────────────────────────────────────────────────
  'expert-chat-app': {
    html: `<{{div}} class="{{chat}}">
  <{{header}} class="{{bar}}">
    <{{span}} class="{{avatar}}">M</span>
    <{{div}} class="{{who}}">
      <{{strong}}>Maya Chen</strong>
      <{{span}} class="{{status}}">online</span>
    </div>
  </header>
  <{{main}} class="{{thread}}">
    <{{div}} class="msg {{in}}">Hey, did you push the fix?</div>
    <{{div}} class="msg {{out}}">Just merged it a minute ago.</div>
    <{{div}} class="msg {{in}}">Amazing, thank you!</div>
    <{{div}} class="msg {{out}}">No problem at all.</div>
  </main>
  <{{footer}} class="{{compose}}">
    <{{input}} placeholder="Message">
    <{{button}}>Send</button>
  </footer>
</div>`,
    css: `.chat {
  {{width}}: {{320px}};
  {{border}}: {{1px solid #eee}};
  {{border-radius}}: {{14px}};
  {{overflow}}: {{hidden}};
  {{font-family}}: {{sans-serif}};
}
.bar {
  {{display}}: {{flex}};
  {{align-items}}: {{center}};
  {{gap}}: {{10px}};
  {{padding}}: {{10px 12px}};
  {{background}}: {{#f97316}};
  {{color}}: {{white}};
}
.avatar {
  {{width}}: {{36px}};
  {{height}}: {{36px}};
  {{border-radius}}: {{50%}};
  {{background}}: {{#ffe8d6}};
  {{color}}: {{#f97316}};
  {{font-weight}}: {{700}};
  {{text-align}}: {{center}};
  {{line-height}}: {{36px}};
}
.who { {{display}}: {{flex}}; flex-direction: column; }
.status { {{font-size}}: {{12px}}; opacity: 0.85; }
.thread {
  {{display}}: {{flex}};
  {{flex-direction}}: {{column}};
  {{gap}}: {{8px}};
  {{padding}}: {{12px}};
  {{background}}: {{#fafafa}};
}
.msg {
  {{max-width}}: {{75%}};
  {{padding}}: {{8px 12px}};
  {{font-size}}: {{14px}};
}
.in {
  {{align-self}}: {{flex-start}};
  {{background}}: {{#eee}};
  {{border-radius}}: 14px 14px 14px 2px;
}
.out {
  {{align-self}}: {{flex-end}};
  {{background}}: {{#f97316}};
  {{color}}: {{white}};
  {{border-radius}}: 14px 14px 2px 14px;
}
.compose {
  {{display}}: {{flex}};
  {{gap}}: {{8px}};
  {{padding}}: {{10px}};
}
.compose input {
  {{flex}}: {{1}};
  {{border}}: {{1px solid #ddd}};
  {{border-radius}}: {{999px}};
  {{padding}}: {{8px 14px}};
}
.compose button {
  {{border}}: {{none}};
  {{border-radius}}: {{999px}};
  {{background}}: {{#f97316}};
  {{color}}: {{white}};
  {{padding}}: {{8px 16px}};
  {{cursor}}: {{pointer}};
}`,
  },

  'expert-vertical-video': {
    html: `<{{div}} class="{{reel}}">
  <{{div}} class="{{scrim}}"></div>
  <{{aside}} class="{{rail}}">
    <{{div}} class="{{act}}">+</div>
    <{{div}} class="{{act}}">C</div>
    <{{div}} class="{{act}}">S</div>
  </aside>
  <{{div}} class="{{caption}}">
    <{{strong}}>@trailmix</strong>
    <{{p}}>Sunrise hike, no filter needed.</p>
  </div>
</div>`,
    css: `.reel {
  {{position}}: {{relative}};
  {{width}}: {{220px}};
  {{aspect-ratio}}: 9 / 16;
  {{border-radius}}: {{16px}};
  {{overflow}}: {{hidden}};
  {{background}}: linear-gradient(160deg, #fbbf24, #f97316);
  {{font-family}}: {{sans-serif}};
  {{color}}: {{white}};
}
.scrim {
  {{position}}: {{absolute}};
  {{inset}}: {{0}};
  {{background}}: linear-gradient(to top, rgba(0,0,0,0.55), transparent 45%);
}
.rail {
  {{position}}: {{absolute}};
  {{right}}: {{10px}};
  {{bottom}}: {{70px}};
  {{display}}: {{flex}};
  {{flex-direction}}: {{column}};
  {{gap}}: {{14px}};
  {{z-index}}: {{2}};
}
.act {
  {{width}}: {{40px}};
  {{height}}: {{40px}};
  {{border-radius}}: {{50%}};
  {{background}}: rgba(255,255,255,0.25);
  {{text-align}}: {{center}};
  {{line-height}}: {{40px}};
  {{font-weight}}: {{700}};
}
.caption {
  {{position}}: {{absolute}};
  {{left}}: {{12px}};
  {{bottom}}: {{14px}};
  {{z-index}}: {{2}};
  {{max-width}}: {{150px}};
}
.caption p { {{margin}}: {{4px 0 0}}; font-size: 13px; }`,
  },

  'expert-course-lesson': {
    html: `<{{div}} class="{{app}}">
  <{{nav}} class="{{side}}">
    <{{h4}}>CSS Basics</h4>
    <{{ul}}>
      <{{li}}>Selectors</li>
      <{{li}} class="{{active}}">The Box Model</li>
      <{{li}}>Flexbox</li>
      <{{li}}>Grid</li>
    </ul>
  </nav>
  <{{main}} class="{{lesson}}">
    <{{h1}}>The Box Model</h1>
    <{{div}} class="{{video}}">></div>
    <{{div}} class="{{track}}"><div class="fill"></div></div>
    <{{p}}>Every element is a box with padding, border, and margin.</p>
    <{{pre}}><{{code}}>div {
  padding: 16px;
  border: 2px solid;
}</code></pre>
    <{{button}} class="{{next}}">Next lesson</button>
  </main>
</div>`,
    css: `.app {
  {{display}}: {{grid}};
  {{grid-template-columns}}: {{180px 1fr}};
  {{gap}}: {{16px}};
  {{max-width}}: {{560px}};
  {{font-family}}: {{sans-serif}};
  {{color}}: {{#222}};
}
.side { {{background}}: {{#f4f4f4}}; border-radius: 12px; padding: 12px; }
.side h4 { {{margin}}: {{0 0 8px}}; }
.side ul { {{list-style}}: {{none}}; margin: 0; padding: 0; }
.side li { {{padding}}: {{6px 8px}}; border-radius: 6px; font-size: 14px; color: #666; }
.side .active { {{background}}: {{#f97316}}; color: white; font-weight: 600; }
.video {
  {{aspect-ratio}}: 16 / 9;
  {{display}}: {{flex}};
  {{align-items}}: {{center}};
  {{justify-content}}: {{center}};
  {{background}}: linear-gradient(135deg, #f97316, #fbbf24);
  {{color}}: {{white}};
  {{font-size}}: {{32px}};
  {{border-radius}}: {{10px}};
}
.track { {{height}}: {{8px}}; margin: 12px 0; background: #eee; border-radius: 999px; overflow: hidden; }
.fill { {{width}}: {{40%}}; height: 100%; background: #f97316; }
.lesson pre {
  {{background}}: {{#222}};
  {{color}}: {{#fbbf24}};
  {{padding}}: {{12px}};
  {{border-radius}}: {{8px}};
  {{font-size}}: {{13px}};
  {{overflow-x}}: {{auto}};
}
.next {
  {{border}}: {{none}};
  {{border-radius}}: {{8px}};
  {{background}}: {{#f97316}};
  {{color}}: {{white}};
  {{padding}}: {{10px 18px}};
  {{cursor}}: {{pointer}};
}`,
  },
};

// Levels whose mobile flag must be flipped on.
const MOBILE_ON = new Set([
  'intermediate-product-card',
  'intermediate-kanban-column',
  'intermediate-stats-dashboard',
  'expert-chat-app',
  'expert-vertical-video',
  'expert-course-lesson',
]);

const files = ['beginner.json', 'intermediate.json', 'expert.json'];
let failures = 0;

// Pass 1: build + verify everything before touching disk.
const pending = files.map((file) => {
  const full = path.join(dir, file);
  const original = JSON.parse(fs.readFileSync(full, 'utf8'));
  const updated = original.map((level) => {
    const marked = MARKED[level.id] || {};
    const next = { ...level };
    if (MOBILE_ON.has(level.id)) next.mobile = true;

    if (marked.html !== undefined) {
      if (stripMarkers(marked.html) !== stripMarkers(level.html)) {
        console.error(`MISMATCH html in ${level.id}`);
        failures += 1;
      }
      next.html = marked.html;
    }
    if (marked.css !== undefined) {
      if (stripMarkers(marked.css) !== stripMarkers(level.css)) {
        console.error(`MISMATCH css in ${level.id}`);
        failures += 1;
      }
      next.css = marked.css;
    }
    return next;
  });
  return { full, file, updated };
});

if (failures > 0) {
  console.error(`\n${failures} mismatch(es) — NOTHING written. Fix markers.`);
  process.exit(1);
}

// Pass 2: write.
for (const { full, file, updated } of pending) {
  fs.writeFileSync(full, `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`wrote ${file} (${updated.length} levels)`);
}
console.log('done');
