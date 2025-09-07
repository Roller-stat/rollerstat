import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function LatestEdition() {
  return (
    <div className="w-full lg:w-3/4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Latest Edition</h2>
      
      <Card className="overflow-hidden">
        <div className="aspect-video bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
          <span className="text-muted-foreground">Featured Image Placeholder</span>
        </div>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">News</Badge>
            <span className="text-sm text-muted-foreground">2 hours ago</span>
          </div>
          <CardTitle className="text-2xl">
            European Roller Hockey Championship 2024: Exciting Updates
          </CardTitle>
          <CardDescription className="text-base">
            Get the latest updates from the European Roller Hockey Championship happening across multiple venues in Spain and Portugal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The championship has been nothing short of spectacular with teams from across Europe showcasing incredible skill and determination. 
            This year&apos;s tournament features some of the most competitive matches we&apos;ve seen in recent years...
          </p>
          <Button>Read Full Article</Button>
        </CardContent>
      </Card>
    </div>
  );
}
