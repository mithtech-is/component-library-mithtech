/**
 * The canvas: the camera, the chrome, and the panel that reads over it.
 *
 * jsdom lays nothing out, so the tests that would need geometry — where a
 * flight lands, what `fit` frames — are not here. What IS here is the whole of
 * the behaviour that has no geometry in it and that a hand-built canvas gets
 * wrong: the ref being the camera rather than the element, the keyboard, the
 * controls being real named buttons, and the click that ends a drag never
 * reaching the thing under the pointer.
 */

import { createRef, useRef, useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { Canvas, CanvasControls, CanvasNode, CanvasPanel, type CanvasApi } from "./index";

const WORLD = { x: 0, y: 0, w: 600, h: 400 };

/** The camera writes to the plane's inline transform; that is the observable. */
const plane = (container: HTMLElement) => container.querySelector(".td-react-canvas-world") as HTMLElement;
const scaleOf = (container: HTMLElement) =>
  Number(/scale\(([-\d.]+)\)/.exec(plane(container).style.transform)?.[1] ?? NaN);
const offsetOf = (container: HTMLElement) => {
  const match = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(plane(container).style.transform);
  return { x: Number(match?.[1]), y: Number(match?.[2]) };
};

describe("Canvas", () => {
  it("names itself as an application and takes focus, so the keyboard works", () => {
    render(<Canvas label="How the systems connect">plane</Canvas>);
    const canvas = screen.getByRole("application", { name: "How the systems connect" });
    // Without the tabindex the arrow keys are unreachable: a canvas nobody can
    // focus is a canvas only a mouse can drive.
    expect(canvas).toHaveAttribute("tabindex", "0");
  });

  it("hands the caller the camera rather than the element", () => {
    /* The ref is the API on purpose. A canvas is DRIVEN — a click on a node
       flies to it, the way back flies out — and a caller holding the section
       can do none of that. */
    const camera = createRef<CanvasApi>();
    const { container } = render(<Canvas ref={camera} label="Estate" world={WORLD}>plane</Canvas>);
    expect(typeof camera.current?.flyTo).toBe("function");
    expect(typeof camera.current?.fit).toBe("function");

    const before = scaleOf(container);
    camera.current!.zoomBy(2);
    expect(scaleOf(container)).toBeCloseTo(before * 2, 5);

    // Relative, because a canvas given a `world` opens framing it rather than
    // at the origin — so the offset before the pan is not zero.
    const start = offsetOf(container);
    camera.current!.panBy(30, -10);
    const after = offsetOf(container);
    expect(after.x - start.x).toBeCloseTo(30, 5);
    expect(after.y - start.y).toBeCloseTo(-10, 5);
  });

  it("clamps the zoom at both ends", () => {
    const camera = createRef<CanvasApi>();
    const { container } = render(<Canvas ref={camera} label="Estate" min={0.5} max={2}>plane</Canvas>);
    camera.current!.zoomBy(100);
    expect(scaleOf(container)).toBe(2);
    camera.current!.zoomBy(0.001);
    expect(scaleOf(container)).toBe(0.5);
  });

  it("pans with the arrows and zooms with the plus and minus keys", async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas label="Estate">plane</Canvas>);
    const canvas = screen.getByRole("application");
    canvas.focus();

    await user.keyboard("{ArrowRight}");
    expect(offsetOf(container).x).toBeLessThan(0);
    await user.keyboard("{ArrowDown}");
    expect(offsetOf(container).y).toBeLessThan(0);

    const before = scaleOf(container);
    await user.keyboard("+");
    expect(scaleOf(container)).toBeGreaterThan(before);
    await user.keyboard("-");
    expect(scaleOf(container)).toBeLessThan(scaleOf(container) * 1.3);
  });

  it("calls onEscape rather than swallowing the key", async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(<Canvas label="Estate" onEscape={onEscape}>plane</Canvas>);
    screen.getByRole("application").focus();
    await user.keyboard("{Escape}");
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("leaves the keyboard alone when it is not interactive", async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas label="Estate" interactive={false}>plane</Canvas>);
    const before = plane(container).style.transform;
    screen.getByRole("application").focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(plane(container).style.transform).toBe(before);
  });

  it("does not let the click that ends a drag reach what was under the pointer", async () => {
    /* The single most common way a hand-built canvas is wrong: pan across a
       map, release, and whatever the pointer happened to stop over opens. The
       click is swallowed in the CAPTURE phase, before the child sees it. */
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const { container } = render(
      <Canvas label="Estate"><button type="button" onClick={onOpen}>CRM</button></Canvas>,
    );
    const viewport = container.querySelector(".td-react-canvas-viewport") as HTMLElement;
    const node = screen.getByRole("button", { name: "CRM" });

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 160, clientY: 140 });
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 160, clientY: 140 });
    fireEvent.click(node);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("forgets the drag once it is over, so the keyboard can still open a node", async () => {
    /* The guard used to hang on `dragged`/`travel` until the next pointerdown.
       A click from the KEYBOARD brings no pointer events with it, so after one
       pan every Enter on a focused node was swallowed — silently, and for as
       long as the reader stayed on the map. The timestamp is now the only
       state that outlives a gesture, and it expires by itself. */
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const { container } = render(
      <Canvas label="Estate"><button type="button" onClick={onOpen}>CRM</button></Canvas>,
    );
    const viewport = container.querySelector(".td-react-canvas-viewport") as HTMLElement;
    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 200, clientY: 180 });
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 200, clientY: 180 });

    // Past the settle window, on the node itself — the canvas section is
    // focusable too, so tabbing from the body would land there first.
    await new Promise(resolve => setTimeout(resolve, 300));
    screen.getByRole("button", { name: "CRM" }).focus();
    await user.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("still opens what the reader actually presses", async () => {
    /* The guard is pointer TRAVEL and a quarter-second settle, not a blanket
       ban on clicking the map — so this is a separate render rather than a
       click appended to the drag above, which would land inside that window
       and be swallowed correctly. */
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<Canvas label="Estate"><button type="button" onClick={onOpen}>CRM</button></Canvas>);
    await user.click(screen.getByRole("button", { name: "CRM" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("suppresses selection while panning, and only while panning", () => {
    /* Dragging across the plane otherwise sweeps a blue selection through every
       label it crosses. Turning selection off outright would cost the thing
       that makes a DOM canvas worth having: the text on it is real. */
    const { container } = render(<Canvas label="Estate">plane</Canvas>);
    const viewport = container.querySelector(".td-react-canvas-viewport") as HTMLElement;
    expect(viewport).not.toHaveAttribute("data-panning");

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 160, clientY: 140 });
    expect(viewport).toHaveAttribute("data-panning", "true");

    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 160, clientY: 140 });
    expect(viewport).not.toHaveAttribute("data-panning");
  });

  it("does not yank a camera the reader has driven back to the whole map", () => {
    /* A canvas mounted inside a closed tab is laid out at 0×0, so its opening
       fit is meaningless until it gains a size — hence the resize refit. The
       half that has to be right is when it STOPS: once the reader or the page
       has driven the camera, a resize must leave it alone, or the map jumps
       out from under whatever they were reading.

       jsdom ships no ResizeObserver — which is why the component checks for it
       — so this stands one up and fires it by hand. */
    const observers: Array<() => void> = [];
    class Stub {
      constructor(callback: () => void) { observers.push(callback); }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", Stub);
    try {
      const camera = createRef<CanvasApi>();
      const { container } = render(<Canvas ref={camera} label="Estate" world={WORLD}>plane</Canvas>);
      expect(observers).toHaveLength(1);

      camera.current!.panBy(40, -25);
      const driven = plane(container).style.transform;
      observers[0]();
      expect(plane(container).style.transform).toBe(driven);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("publishes its scale on the plane, for a label that must not scale with it", () => {
    const camera = createRef<CanvasApi>();
    const { container } = render(<Canvas ref={camera} label="Estate">plane</Canvas>);
    camera.current!.zoomBy(2);
    expect(plane(container).style.getPropertyValue("--td-canvas-scale")).toBe("2");
  });

  it("puts the panel outside the plane, so it does not travel with the camera", () => {
    const { container } = render(
      <Canvas label="Estate" panel={<CanvasPanel open title="CRM">detail</CanvasPanel>}>plane</Canvas>,
    );
    const panel = container.querySelector(".td-react-canvas-panel");
    expect(panel).not.toBeNull();
    // Inside the world it would pan off the screen and shrink on zoom-out.
    expect(plane(container).contains(panel!)).toBe(false);
  });

  it("passes an accessibility audit", async () => {
    const { container } = render(
      <Canvas label="Estate" world={WORLD} hint="drag to pan" breadcrumb={<span>The estate</span>}>plane</Canvas>,
    );
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});

describe("CanvasControls", () => {
  it("draws the map's controls as named buttons, not as bare glyphs", () => {
    render(<Canvas label="Estate" world={WORLD}>plane</Canvas>);
    for (const name of ["Zoom in", "Zoom out", "Fit the whole map on screen"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("drops the fit control when there is no whole view to return to", () => {
    render(<Canvas label="Estate">plane</Canvas>);
    expect(screen.queryByRole("button", { name: "Fit the whole map on screen" })).toBeNull();
  });

  it("draws nothing when the host says it will draw them itself", () => {
    render(<Canvas label="Estate" world={WORLD} controls={false}>plane</Canvas>);
    expect(screen.queryByRole("button", { name: "Zoom in" })).toBeNull();
  });

  it("zooms the camera it was handed", async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas label="Estate" world={WORLD}>plane</Canvas>);
    const before = scaleOf(container);
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(scaleOf(container)).toBeGreaterThan(before);
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(scaleOf(container)).toBeCloseTo(before, 5);
  });

  it("reports the mute state rather than only drawing it", async () => {
    const user = userEvent.setup();
    function Example() {
      const camera = useRef<CanvasApi | null>(null);
      const [muted, setMuted] = useState(false);
      return <CanvasControls camera={camera} sound={{ muted, onToggle: () => setMuted(m => !m) }} />;
    }
    render(<Example />);
    const button = screen.getByRole("button", { name: "Mute interface sounds" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    // The name changes with the state, and `aria-pressed` carries it too — the
    // glyph is not the only thing saying which way the switch is.
    expect(screen.getByRole("button", { name: "Unmute interface sounds" })).toHaveAttribute("aria-pressed", "true");
  });

  it("lays out in a row for a host that draws its own chrome", () => {
    const camera = createRef<CanvasApi>();
    const { container } = render(<CanvasControls camera={camera} direction="row" />);
    expect(container.firstElementChild).toHaveClass("td-react-canvas-controls--row");
  });
});

describe("Canvas housing", () => {
  it("draws its own frame when it is given something to say about itself", () => {
    render(<Canvas label="Estate" title="How the systems connect" world={WORLD}>plane</Canvas>);
    // The frame's plate carries the identity; the canvas is the well's content.
    expect(screen.getByRole("region", { name: "How the systems connect" })).toBeInTheDocument();
    expect(screen.getByRole("application", { name: "Estate" })).toBeInTheDocument();
  });

  it("puts the controls in the frame's head rather than over the map", () => {
    const { container } = render(<Canvas label="Estate" title="Estate" world={WORLD}>plane</Canvas>);
    const cluster = container.querySelector(".td-react-canvas-controls")!;
    // Over the plane it floats; housed, it belongs to the plate.
    expect(cluster).not.toHaveClass("td-react-canvas-controls--floating");
    expect(container.querySelector(".td-react-canvas")!.contains(cluster)).toBe(false);
  });

  it("takes a ground of its own", () => {
    const { container } = render(<Canvas label="Estate" background="rebeccapurple">plane</Canvas>);
    const canvas = container.querySelector(".td-react-canvas") as HTMLElement;
    expect(canvas.style.getPropertyValue("--td-canvas-ground")).toBe("rebeccapurple");
  });

  it("owns fullscreen itself, so the control is not inert until wired", async () => {
    /* A control that does nothing until the page hooks it up is a control that
       ships broken. The canvas keeps the state; `fullscreen` overrides it. */
    const user = userEvent.setup();
    const { container } = render(<Canvas label="Estate" allowFullscreen world={WORLD}>plane</Canvas>);
    /* Queried off the document rather than the container, because in
       fullscreen the canvas is no longer inside it — see the portal below. */
    const canvas = () => document.querySelector(".td-react-canvas") as HTMLElement;
    expect(canvas()).not.toHaveClass("td-react-canvas--fullscreen");
    expect(container.querySelector(".td-react-canvas")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Go fullscreen" }));
    expect(canvas()).toHaveClass("td-react-canvas--fullscreen");
    /* It leaves the host's subtree for the body. A host with a transform, a
       filter or its own z-index confines both `position: fixed` and every
       z-index inside it, so a canvas that stayed put would cover its host and
       nothing else — and the page's own header would go on painting over the
       "fullscreen" map. */
    expect(container.querySelector(".td-react-canvas")).toBeNull();
    expect(canvas().parentElement).toBe(document.body);

    // Escape is the way out of the deepest thing first.
    canvas().focus();
    await user.keyboard("{Escape}");
    expect(canvas()).not.toHaveClass("td-react-canvas--fullscreen");
  });

  it("keeps its controls and its ground when a housed canvas takes the display", async () => {
    /* Both halves of this shipped broken once. The frame's head is off screen
       in fullscreen, so a housed map lost zoom, fit and mute at exactly the
       moment it had the most room for them; and a housed canvas paints no
       ground — correct inside a carved well, and transparent over the whole
       page, which showed the document straight through the map. */
    const user = userEvent.setup();
    const { container } = render(
      <Canvas label="Estate" title="Estate" world={WORLD} allowFullscreen style={{ height: 420 }}>plane</Canvas>,
    );
    // Housed: the head has them, the plane does not.
    const canvas = () => document.querySelector(".td-react-canvas") as HTMLElement;
    expect(canvas().querySelector(".td-react-canvas-controls")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Go fullscreen" }));
    expect(canvas()).toHaveClass("td-react-canvas--fullscreen", "td-react-canvas--standalone");
    // And the caller's own height is dropped, or the "fullscreen" canvas
    // covers the viewport's width and stays its band height with the page
    // showing underneath.
    expect(canvas().style.height).toBe("");
    expect(canvas().querySelector(".td-react-canvas-controls")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Leave fullscreen" })).toBeInTheDocument();
  });

  it("refits when the display changes, even after the reader has driven the camera", async () => {
    /* The bug this covers: a canvas that went fullscreen kept the transform it
       had in a 600px box and showed the reader one corner of the map blown up
       across the whole screen — and gave back the same too-large transform on
       the way out.

       Geometry, so jsdom needs both halves stubbed: a ResizeObserver (it has
       none) and a viewport with a size (it lays nothing out). */
    const observers: Array<() => void> = [];
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) { observers.push(callback); }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;

    let box = { w: 600, h: 400 };
    const proto = window.HTMLElement.prototype;
    const widthSpy = vi.spyOn(proto, "clientWidth", "get").mockImplementation(() => box.w);
    const heightSpy = vi.spyOn(proto, "clientHeight", "get").mockImplementation(() => box.h);

    try {
      const user = userEvent.setup();
      render(<Canvas label="Estate" allowFullscreen world={WORLD} padding={0}>plane</Canvas>);
      const world = () => document.querySelector(".td-react-canvas-world") as HTMLElement;
      const resize = () => observers.forEach(fire => fire());
      resize();
      const fitted = world().style.transform;
      expect(fitted).toContain("scale(1)");

      // The reader drives the camera, which is what normally vetoes a refit.
      const viewport = document.querySelector(".td-react-canvas-viewport") as HTMLElement;
      fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, button: 0, pointerId: 1 });
      fireEvent.pointerMove(viewport, { clientX: 90, clientY: 40, pointerId: 1 });
      fireEvent.pointerUp(viewport, { pointerId: 1 });
      expect(world().style.transform).not.toBe(fitted);

      // Taking the display is not a veto — it is a request to be framed.
      box = { w: 1200, h: 800 };
      await user.click(screen.getByRole("button", { name: "Go fullscreen" }));
      resize();
      expect(world().style.transform).toContain("scale(2)");

      // And giving it back reframes to the box it came home to, rather than
      // leaving the map at twice the size the page has room for.
      box = { w: 600, h: 400 };
      await user.click(screen.getByRole("button", { name: "Leave fullscreen" }));
      resize();
      expect(world().style.transform).toContain("scale(1)");
    } finally {
      widthSpy.mockRestore();
      heightSpy.mockRestore();
      globalThis.ResizeObserver = original;
    }
  });

  it("offers a reset that means more than moving the camera", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<Canvas label="Estate" world={WORLD} onReset={onReset}>plane</Canvas>);
    await user.click(screen.getByRole("button", { name: /Reset the map/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe("CanvasNode", () => {
  it("is a real button wearing the system's card", () => {
    render(<CanvasNode x={10} y={20} title="CRM" onClick={() => {}} />);
    const node = screen.getByRole("button", { name: /CRM/ });
    // A node built as a div with an onClick is most of a map's content gone.
    expect(node.tagName).toBe("BUTTON");
    expect(node).toHaveClass("td-card-surface");
  });

  it("draws its accent as a bar, never as an inset shadow", () => {
    /* `box-shadow` is one property, so an inset edge REPLACES the card's raise
       and the node comes out flat. The accent is a custom property the
       stylesheet draws a pseudo-element from; nothing here writes a shadow. */
    const { container } = render(<CanvasNode x={0} y={0} title="CRM" accent="#00AAFF" />);
    const node = container.firstElementChild as HTMLElement;
    expect(node.style.getPropertyValue("--td-canvas-node-accent")).toBe("#00AAFF");
    expect(node).toHaveAttribute("data-accent");
    expect(node.style.boxShadow).toBe("");
  });

  it("stands where it is put, in world coordinates", () => {
    const { container } = render(<CanvasNode x={120} y={64} w={200} h={90} title="ERP" />);
    const node = container.firstElementChild as HTMLElement;
    expect(node.style.left).toBe("120px");
    expect(node.style.top).toBe("64px");
    expect(node.style.width).toBe("200px");
  });

  it("reports selection to a screen reader, not only with depth", () => {
    const { rerender } = render(<CanvasNode x={0} y={0} title="CRM" />);
    expect(screen.getByRole("button", { name: /CRM/ })).not.toHaveAttribute("aria-pressed", "true");
    rerender(<CanvasNode x={0} y={0} title="CRM" selected />);
    expect(screen.getByRole("button", { name: /CRM/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps a dimmed node clickable — it is context, not noise", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CanvasNode x={0} y={0} title="CRM" dimmed onClick={onClick} />);
    const node = screen.getByRole("button", { name: /CRM/ });
    expect(node).toHaveAttribute("data-dimmed");
    expect(node).toBeEnabled();
    await user.click(node);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("sets its title in the display face at the ramp's floor", () => {
    const { container } = render(<CanvasNode x={0} y={0} title="CRM" sub="Leads and deals" />);
    expect(container.querySelector(".td-react-canvas-node-title")).toHaveClass("td-display-sm");
    expect(container.querySelector(".td-react-canvas-node-sub")).toHaveTextContent("Leads and deals");
  });
});

describe("CanvasPanel", () => {
  it("renders nothing at all when closed", () => {
    const { container } = render(<CanvasPanel open={false} title="CRM">detail</CanvasPanel>);
    expect(container).toBeEmptyDOMElement();
  });

  it("carries td-floating, so a Frame's well cannot flatten it", () => {
    /* The rule strips the background off any plate inside a well. Right for a
       plate the well houses, fatal for one floating over it — the panel goes
       transparent and the map runs through its text. */
    const { container } = render(<CanvasPanel open title="CRM">detail</CanvasPanel>);
    expect(container.firstElementChild).toHaveClass("td-floating", "td-card-surface-static");
  });

  it("keeps the actions out of the scroll region", () => {
    /* Inside the body they scroll away exactly when the reader has finished
       reading and wants them. */
    const { container } = render(
      <CanvasPanel open title="CRM" actions={<button type="button">Back</button>}>detail</CanvasPanel>,
    );
    const body = container.querySelector(".td-react-canvas-panel-body")!;
    const actions = container.querySelector(".td-react-canvas-panel-actions")!;
    expect(body.contains(actions)).toBe(false);
    expect(within(actions as HTMLElement).getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("moves focus to the way out when it opens", () => {
    render(<CanvasPanel open onClose={() => {}} title="CRM">detail</CanvasPanel>);
    // A keyboard reader lands where the answer is rather than being left out
    // on the map.
    expect(screen.getByRole("button", { name: "Close panel" })).toHaveFocus();
  });

  it("draws no close control when the page dismisses it some other way", () => {
    render(<CanvasPanel open title="CRM">detail</CanvasPanel>);
    expect(screen.queryByRole("button", { name: "Close panel" })).toBeNull();
  });

  it("closes on request", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CanvasPanel open onClose={onClose} title="CRM">detail</CanvasPanel>);
    await user.click(screen.getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wears its category on the reading edge only when given one", () => {
    const { container, rerender } = render(<CanvasPanel open title="CRM">detail</CanvasPanel>);
    const panel = () => container.firstElementChild as HTMLElement;
    expect(panel().style.getPropertyValue("--td-canvas-panel-accent")).toBe("");
    rerender(<CanvasPanel open title="CRM" accent="#00AAFF">detail</CanvasPanel>);
    expect(panel().style.getPropertyValue("--td-canvas-panel-accent")).toBe("#00AAFF");
  });

  it("passes an accessibility audit", async () => {
    const { container } = render(
      <CanvasPanel open onClose={() => {}} title="CRM" actions={<button type="button">Back</button>}>
        <p>What the CRM does.</p>
      </CanvasPanel>,
    );
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.filter(item => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
