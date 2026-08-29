"use client";

import { useState } from "react";
import { Button } from "@mithtech-bengaluru/tonaldepth-react";

export function ClientActions() {
  const [count, setCount] = useState(0);
  return <Button variant="primary" onClick={() => setCount(value => value + 1)}>Pressed {count}</Button>;
}
