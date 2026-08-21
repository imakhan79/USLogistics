import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex min-h-[60vh] items-center justify-center">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="max-w-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
