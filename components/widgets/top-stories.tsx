import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TopStories() {
  const stories = [
    {
      id: 1,
      title: "New Training Techniques Revolutionizing the Sport",
      category: "Training",
      time: "4 hours ago",
      excerpt: "Coaches across Europe are adopting innovative training methods..."
    },
    {
      id: 2,
      title: "Player Spotlight: Rising Star from Italy",
      category: "Players",
      time: "6 hours ago",
      excerpt: "Meet the young talent making waves in Italian roller hockey..."
    },
    {
      id: 3,
      title: "Equipment Review: Latest Gear for 2024",
      category: "Equipment",
      time: "1 day ago",
      excerpt: "Our comprehensive review of the newest roller hockey equipment..."
    },
    {
      id: 4,
      title: "League Updates: Season Standings",
      category: "League",
      time: "2 days ago",
      excerpt: "Current standings and upcoming matches across European leagues..."
    }
  ];

  return (
    <div className="w-full lg:w-1/4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Top Stories</h2>
      
      <div className="space-y-4">
        {stories.map((story) => (
          <Card key={story.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">{story.category}</Badge>
                <span className="text-xs text-muted-foreground">{story.time}</span>
              </div>
              <CardTitle className="text-sm leading-tight">
                {story.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs mb-3">
                {story.excerpt}
              </CardDescription>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-xs">
                Read more →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
