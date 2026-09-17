import { StrictMode, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { Button } from "../src/index";
import { Button as LegacyButton } from "@mithtech-bengaluru/tonaldepth-react";

import "../src/styles/index.css";
import "../../react/dist/styles.css";
import "./preview.css";

/* Phosphor fill-weight glyphs, inlined because the preview is not a shipped
   component and the lamp only reads correctly on a filled mass. */
const CHECK = "M243.31,90.91l-128.4,128.4a16,16,0,0,1-22.62,0l-71.62-72a16,16,0,0,1,0-22.61l20-20a16,16,0,0,1,22.58,0L104,144.22l96.76-95.57a16,16,0,0,1,22.59,0l19.95,19.54A16,16,0,0,1,243.31,90.91Z";
const ARROW = "M221.66,133.66l-72,72A8,8,0,0,1,136,200V152H40a8,8,0,0,1-8-8V112a8,8,0,0,1,8-8h96V56a8,8,0,0,1,13.66-5.66l72,72A8,8,0,0,1,221.66,133.66Z";
const TRASH = "M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM112,168a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm0-120H96V40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8Z";

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const VARIANTS = ["default", "secondary", "filled", "destructive", "outline", "ghost", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row">
      <div className="row-label">{label}</div>
      <div className="row-items">{children}</div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {note ? <p className="note">{note}</p> : null}
      {children}
    </section>
  );
}

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-density", density);

  return (
    <div className="page">
      <header>
        <div>
          <h1>TonalDepth UI — Button</h1>
          <p className="note">
            shadcn's structure and API, TonalDepth's material. Hover and press
            the live buttons; the forced-state grid below shows every rung at once.
          </p>
        </div>
        <div className="controls">
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <select value={density} onChange={(e) => setDensity(e.target.value as typeof density)}>
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>
      </header>

      <Section title="Variants" note="Live — hover and press these.">
        {VARIANTS.map((v) => (
          <Row key={v} label={v}>
            <Button variant={v}>Label</Button>
            <Button variant={v}><Glyph d={CHECK} />With lamp</Button>
            <Button variant={v} dot>With dot</Button>
            <Button variant={v} disabled>Disabled</Button>
          </Row>
        ))}
      </Section>

      <Section
        title="The ladder"
        note="Four rungs, side by side. The lamp warms a step at a time — unlit, dim, full, brightest — rather than switching on. Each depth rung carries the same shadow-slot count in the same order, so the transition interpolates instead of snapping."
      >
        {VARIANTS.map((v) => (
          <Row key={v} label={v}>
            <Button variant={v}><Glyph d={CHECK} />Rest</Button>
            <Button variant={v} data-state="hover"><Glyph d={CHECK} />Hover</Button>
            <Button variant={v} aria-pressed="true"><Glyph d={CHECK} />On</Button>
            <Button variant={v} data-state="active"><Glyph d={CHECK} />Press</Button>
          </Row>
        ))}
      </Section>

      <Section title="Sizes">
        {SIZES.map((s) => (
          <Row key={s} label={s}>
            <Button size={s}><Glyph d={CHECK} />Default</Button>
            <Button size={s} variant="filled"><Glyph d={ARROW} />Filled</Button>
            <Button size={s} variant="outline">Outline</Button>
          </Row>
        ))}
        <Row label="icon">
          <Button size="icon-sm" aria-label="Confirm"><Glyph d={CHECK} /></Button>
          <Button size="icon" aria-label="Confirm"><Glyph d={CHECK} /></Button>
          <Button size="icon-lg" aria-label="Confirm"><Glyph d={CHECK} /></Button>
          <Button size="icon" variant="filled" aria-label="Continue"><Glyph d={ARROW} /></Button>
          <Button size="icon" variant="destructive" aria-label="Delete"><Glyph d={TRASH} /></Button>
          <Button size="icon" variant="ghost" aria-label="Confirm"><Glyph d={CHECK} /></Button>
        </Row>
      </Section>

      <Section title="Loading and the dot" note="Both are TonalDepth concepts shadcn's Button has no equivalent for.">
        <Row label="loading">
          <Button loading>Saving</Button>
          <Button loading variant="filled">Saving</Button>
          <Button loading variant="outline">Saving</Button>
        </Row>
        <Row label="dot">
          <Button dot>Idle</Button>
          <Button dot aria-pressed="true">Live</Button>
          <Button dot variant="filled">On a fill</Button>
          <Button dot disabled>Disabled</Button>
        </Row>
      </Section>

      <Section title="The glow override" note="Channel buttons keep the page's own housing and arrive as the lamp's colour alone.">
        <Row label="glow">
          <Button glow="#25D366"><Glyph d={CHECK} />WhatsApp</Button>
          <Button glow="var(--td-accent)"><Glyph d={ARROW} />Call</Button>
          <Button glow="var(--td-green)"><Glyph d={CHECK} />Approve</Button>
        </Row>
      </Section>

      <Section title="In context" note="On the page ground, at the size a real interface uses them.">
        <div className="context">
          <Button variant="filled"><Glyph d={ARROW} />Continue</Button>
          <Button variant="default">Save draft</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </Section>

      <Section
        title="Against the original"
        note="New on top, the existing tonaldepth-react Button beneath it. Same design language is the bar, not identical pixels."
      >
        {(
          [
            ["default", "primary"],
            ["secondary", "secondary"],
            ["filled", "filled"],
            ["destructive", "destructive"],
            ["outline", "outline"],
            ["ghost", "ghost"],
            ["link", "link"],
          ] as const
        ).map(([next, legacy]) => (
          <Row key={next} label={next}>
            <div className="compare">
              <Button variant={next}><Glyph d={CHECK} />New</Button>
              <LegacyButton variant={legacy} leading={<Glyph d={CHECK} />}>Original</LegacyButton>
            </div>
          </Row>
        ))}
      </Section>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
