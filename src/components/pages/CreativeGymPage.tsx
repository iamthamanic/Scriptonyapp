import { Trophy, Flame, Calendar, Camera, Music, Palette, Film as FilmIcon, Feather } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { EmptyState } from "../EmptyState";

export function CreativeGymPage() {
  const level = 1;
  const xp = 0;
  const maxXp = 100;
  const streak = 0;

  const challenges = [
    {
      id: "1",
      title: "Prompt Forge",
      description: "Übe, kreative Prompts zu erstellen.",
      status: "available",
    },
    {
      id: "2",
      title: "Style Lock",
      description: "Schreibe in einem festen Stil.",
      status: "available",
    },
    {
      id: "3",
      title: "Constraint Bench",
      description: "Schreibe unter Restriktionen.",
      status: "available",
    },
  ];

  const artForms = [
    { id: "1", title: "Comedy Writing", icon: Palette },
    { id: "2", title: "Songwriting", icon: Music },
    { id: "3", title: "Visual Arts", icon: Palette },
    { id: "4", title: "Photography", icon: Camera },
    { id: "5", title: "Filmmaking", icon: FilmIcon },
  ];

  const achievements = [
    { id: "1", title: "First Challenge", unlocked: false },
    { id: "2", title: "7 Day Streak", unlocked: false },
    { id: "3", title: "Creative Explorer", unlocked: false },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 py-6 bg-gradient-to-b from-primary/5 to-transparent">
        <p className="text-muted-foreground">
          Trainiere deine Kreativität
        </p>
      </div>

      {/* Level Card - Mobile optimiert */}
      <div className="px-4 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Level</p>
                <p className="font-bold">Level {level}</p>
              </div>
              <div className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1.5">
                <Flame className="size-4 text-accent" />
                <div>
                  <p className="text-xs font-medium">{streak} Tage</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Progress</p>
              <Progress value={(xp / maxXp) * 100} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">{xp} / {maxXp} XP</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="challenges" className="w-full px-4">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="artforms">Art Forms</TabsTrigger>
        </TabsList>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-3">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="active:scale-[0.98] transition-transform">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-base">{challenge.title}</CardTitle>
                <CardDescription className="text-sm mt-1">{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button className="w-full h-11">Start Challenge</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Art Forms Tab */}
        <TabsContent value="artforms" className="space-y-3">
          {artForms.map((form) => {
            const Icon = form.icon;
            return (
              <Card key={form.id} className="active:scale-[0.98] transition-transform">
                <CardHeader className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{form.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Quick Access Achievement Preview */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2>Achievements</h2>
          <Badge variant="secondary">{achievements.filter(a => a.unlocked).length}/{achievements.length}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((achievement) => (
            <Card 
              key={achievement.id}
              className={`${achievement.unlocked ? "border-primary" : "opacity-50"} active:scale-95 transition-transform`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`rounded-full p-3 mb-2 ${
                  achievement.unlocked 
                    ? "bg-primary/10" 
                    : "bg-muted"
                }`}>
                  <Trophy className={`size-6 ${
                    achievement.unlocked 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  }`} />
                </div>
                <h4 className="text-xs leading-tight">{achievement.title}</h4>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}