import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Coming in Phase 2</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>This module is next</CardTitle>
          <CardDescription>
            {title} will be built in the next phase. Navigation stays available so the demo can walk the full product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sample records for this area are already loaded in the demo data store.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
