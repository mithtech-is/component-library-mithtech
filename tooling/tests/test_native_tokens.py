import json
import subprocess
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
class NativeTokenTests(unittest.TestCase):
    def test_native_outputs_are_deterministic_and_canonical(self):
        targets = [ROOT/"packages/nativewind/src/tokens.ts", ROOT/"packages/flutter/lib/src/generated/tonaldepth_tokens.dart"]
        before = [path.read_bytes() for path in targets]
        subprocess.run(["python", "tooling/tokens/build_native.py"], cwd=ROOT, check=True, capture_output=True)
        self.assertEqual(before, [path.read_bytes() for path in targets])
        source = json.loads((ROOT/"tokens/source/tokens.json").read_text(encoding="utf-8"))
        brand = next(item for item in source["tokens"] if item["path"] == "color.brand")["$value"]
        self.assertIn(brand, targets[0].read_text(encoding="utf-8"))
        self.assertIn("FFFF5E29", targets[1].read_text(encoding="utf-8"))
