import { Card, CardContent } from "@/components/ui/card";

type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card className="border-border/60 bg-muted/20 shadow-none">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}