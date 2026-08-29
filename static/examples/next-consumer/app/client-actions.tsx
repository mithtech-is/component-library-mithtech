"use client";

import { useState } from "react";
import { Button, ConfirmButton, MultiStep, Spotlight } from "@mithtech-bengaluru/tonaldepth-react";

/**
 * The components that need a callback, which a server component cannot pass.
 *
 * Everything else added in this build is rendered straight from `page.tsx` on
 * purpose — see the note there.
 */
export function ClientActions() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  return (
    <>
      <Button variant="primary" onClick={() => setCount(value => value + 1)}>Pressed {count}</Button>
      <ConfirmButton label="Delete build" onConfirm={() => setCount(0)} />
      <MultiStep
        steps={[
          { label: "Discovery", title: "Scope the problem" },
          { label: "Build", title: "Ship in sprints" },
        ]}
      />
      <Button variant="secondary" onClick={() => setOpen(true)}>Open Spotlight</Button>
      <Spotlight
        open={open}
        onOpenChange={setOpen}
        query={query}
        onQueryChange={setQuery}
        actions={[{ id: "a", label: "Solutions", detail: "/solutions", group: "Pages" }]}
      />
    </>
  );
}
