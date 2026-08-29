import { Badge, Card, CardContent, CardHeader, CardTitle, FormField, Input } from "@mithtech-bengaluru/tonaldepth-react";
import { ClientActions } from "./client-actions";

export default function Page() {
  return (
    <main className="td-container td-container--3" style={{ margin: "0 auto", padding: "var(--td-sp-10)" }}>
      <Card>
        <CardHeader><CardTitle>Next.js packed consumer</CardTitle><Badge variant="success">App Router</Badge></CardHeader>
        <CardContent className="td-form">
          <FormField label="Workspace" helperText="Server-rendered field">
            <Input defaultValue="Mithtech Bengaluru" />
          </FormField>
          <ClientActions />
        </CardContent>
      </Card>
    </main>
  );
}
