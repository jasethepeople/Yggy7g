import { useState, useEffect } from "react";
import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp,
  Award,
  Calendar,
  Timer,
  BookOpen,
  Star,
  Trophy,
  BarChart3,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProgressSession {
  id: string;
  patternId: number;
  startTime: Date;
  endTime?: Date;
  rowsCompleted: number;
  stitchesCompleted: number;
  difficulty: number;
  notes: string;
  mistakes: number;
  technique: string;
}

interface SkillLevel {
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  techniques: string[];
  achievements: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface ProgressTrackerProps {
  pattern: Pattern | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProgressTracker({ pattern, isOpen, onClose }: ProgressTrackerProps) {
  const [currentSession, setCurrentSession] = useState<ProgressSession | null>(null);
  const [sessions, setSessions] = useState<ProgressSession[]>([]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>({
    name: 'Beginner',
    level: 1,
    xp: 250,
    maxXp: 500,
    techniques: ['single-crochet', 'chain'],
    achievements: []
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState({
    currentRow: 1,
    totalRows: 0,
    currentStitch: 1,
    totalStitches: 0,
    timeSpent: 0,
    sessionTime: 0,
    completedSections: [] as string[]
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  // Initialize achievements
  useEffect(() => {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first-pattern',
        name: 'First Steps',
        description: 'Complete your first crochet pattern',
        icon: '🎯',
        unlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Complete 100 stitches in one session',
        icon: '⚡',
        unlocked: false,
        progress: 0,
        maxProgress: 100
      },
      {
        id: 'technique-master',
        name: 'Technique Master',
        description: 'Learn 10 different crochet techniques',
        icon: '🎭',
        unlocked: false,
        progress: skillLevel.techniques.length,
        maxProgress: 10
      },
      {
        id: 'dedicated-crafter',
        name: 'Dedicated Crafter',
        description: 'Spend 10 hours total crocheting',
        icon: '⏰',
        unlocked: false,
        progress: 0,
        maxProgress: 600 // 10 hours in minutes
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a pattern with no mistakes',
        icon: '✨',
        unlocked: false,
        progress: 0,
        maxProgress: 1
      }
    ];
    setAchievements(defaultAchievements);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && currentSession) {
      interval = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          sessionTime: prev.sessionTime + 1
        }));
      }, 60000); // Update every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentSession]);

  // Initialize pattern data
  useEffect(() => {
    if (pattern && isOpen) {
      const patternData = pattern.patternData as any;
      const totalRows = patternData?.height || pattern.height || 30;
      const totalStitches = pattern.stitchCount || (totalRows * 20);
      
      setProgress(prev => ({
        ...prev,
        totalRows,
        totalStitches
      }));
    }
  }, [pattern, isOpen]);

  const startSession = () => {
    if (!pattern) return;

    const session: ProgressSession = {
      id: Date.now().toString(),
      patternId: pattern.id,
      startTime: new Date(),
      rowsCompleted: 0,
      stitchesCompleted: 0,
      difficulty: 1,
      notes: '',
      mistakes: 0,
      technique: 'single-crochet'
    };

    setCurrentSession(session);
    setIsTimerRunning(true);
    setProgress(prev => ({ ...prev, sessionTime: 0 }));

    toast({
      title: "Session Started",
      description: "Good luck with your crocheting!",
    });
  };

  const pauseSession = () => {
    setIsTimerRunning(!isTimerRunning);
    toast({
      title: isTimerRunning ? "Session Paused" : "Session Resumed",
      description: isTimerRunning ? "Take a break!" : "Back to crocheting!",
    });
  };

  const endSession = () => {
    if (!currentSession) return;

    const completedSession = {
      ...currentSession,
      endTime: new Date(),
      rowsCompleted: progress.currentRow - 1,
      stitchesCompleted: progress.currentStitch,
      notes: notes
    };

    setSessions(prev => [...prev, completedSession]);
    setCurrentSession(null);
    setIsTimerRunning(false);
    
    // Update total time spent
    setProgress(prev => ({
      ...prev,
      timeSpent: prev.timeSpent + prev.sessionTime,
      sessionTime: 0
    }));

    // Check for achievements
    checkAchievements(completedSession);

    // Add XP
    const xpGained = Math.floor(progress.sessionTime / 10) + (progress.currentStitch / 10);
    addXP(xpGained);

    toast({
      title: "Session Completed",
      description: `Great work! You gained ${Math.floor(xpGained)} XP.`,
    });
  };

  const updateProgress = (field: string, value: number) => {
    setProgress(prev => {
      const newProgress = { ...prev, [field]: value };
      
      // Calculate completion percentage
      const rowProgress = (newProgress.currentRow / newProgress.totalRows) * 100;
      const stitchProgress = (newProgress.currentStitch / newProgress.totalStitches) * 100;
      
      return newProgress;
    });
  };

  const addXP = (amount: number) => {
    setSkillLevel(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      let newMaxXP = prev.maxXp;

      // Check for level up
      while (newXP >= newMaxXP) {
        newXP -= newMaxXP;
        newLevel++;
        newMaxXP = newLevel * 500; // Increasing XP requirement
        
        toast({
          title: "Level Up!",
          description: `Congratulations! You reached level ${newLevel}!`,
        });
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        maxXp: newMaxXP,
        name: getLevelName(newLevel)
      };
    });
  };

  const getLevelName = (level: number): string => {
    if (level < 5) return 'Beginner';
    if (level < 10) return 'Novice';
    if (level < 20) return 'Intermediate';
    if (level < 35) return 'Advanced';
    if (level < 50) return 'Expert';
    return 'Master Crafter';
  };

  const checkAchievements = (session: ProgressSession) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.unlocked) return achievement;

      let newProgress = achievement.progress || 0;
      let unlocked = false;

      switch (achievement.id) {
        case 'first-pattern':
          if (progress.currentRow >= progress.totalRows) {
            newProgress = 1;
            unlocked = true;
          }
          break;
        case 'speed-demon':
          newProgress = Math.max(newProgress, session.stitchesCompleted);
          unlocked = newProgress >= 100;
          break;
        case 'dedicated-crafter':
          newProgress = progress.timeSpent + progress.sessionTime;
          unlocked = newProgress >= 600;
          break;
        case 'perfectionist':
          if (session.mistakes === 0 && progress.currentRow >= progress.totalRows) {
            newProgress = 1;
            unlocked = true;
          }
          break;
      }

      if (unlocked && !achievement.unlocked) {
        toast({
          title: "Achievement Unlocked!",
          description: `${achievement.icon} ${achievement.name}`,
        });
      }

      return {
        ...achievement,
        progress: newProgress,
        unlocked,
        unlockedAt: unlocked ? new Date() : achievement.unlockedAt
      };
    }));
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCompletionPercentage = (): number => {
    if (progress.totalRows === 0) return 0;
    return Math.min(100, (progress.currentRow / progress.totalRows) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[95vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold">Progress Tracker</h2>
              <p className="text-sm text-gray-600">
                Track your crochet journey with {pattern?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              Level {skillLevel.level} {skillLevel.name}
            </Badge>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="current" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="current">Current Session</TabsTrigger>
              <TabsTrigger value="progress">Overall Progress</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="history">Session History</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session Controls */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Timer className="w-5 h-5 mr-2" />
                        Session Timer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-mono font-bold">
                          {formatTime(progress.sessionTime)}
                        </div>
                        <p className="text-sm text-gray-600">Current session</p>
                      </div>

                      <div className="flex justify-center space-x-2">
                        {!currentSession ? (
                          <Button onClick={startSession} className="bg-green-600 hover:bg-green-700">
                            <Play className="w-4 h-4 mr-2" />
                            Start Session
                          </Button>
                        ) : (
                          <>
                            <Button onClick={pauseSession} variant="outline">
                              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button onClick={endSession} variant="destructive">
                              <Square className="w-4 h-4 mr-2" />
                              End Session
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Current Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Pattern Completion</span>
                          <span>{Math.round(getCompletionPercentage())}%</span>
                        </div>
                        <Progress value={getCompletionPercentage()} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Current Row</Label>
                          <Input
                            type="number"
                            value={progress.currentRow}
                            onChange={(e) => updateProgress('currentRow', Number(e.target.value))}
                            min="1"
                            max={progress.totalRows}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Current Stitch</Label>
                          <Input
                            type="number"
                            value={progress.currentStitch}
                            onChange={(e) => updateProgress('currentStitch', Number(e.target.value))}
                            min="1"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes and Statistics */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Session Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about your current session..."
                        rows={4}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">{progress.totalRows}</div>
                          <div className="text-sm text-gray-600">Total Rows</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">{progress.totalStitches}</div>
                          <div className="text-sm text-gray-600">Total Stitches</div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">{formatTime(progress.timeSpent)}</div>
                          <div className="text-sm text-gray-600">Total Time</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded">
                          <div className="text-2xl font-bold text-orange-600">{sessions.length}</div>
                          <div className="text-sm text-gray-600">Sessions</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="flex-1 overflow-auto p-4">
              <div className="space-y-6">
                {/* Skill Level Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Skill Progression
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{skillLevel.level}</div>
                        <div className="text-sm text-gray-600">{skillLevel.name}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>XP Progress</span>
                          <span>{skillLevel.xp} / {skillLevel.maxXp}</span>
                        </div>
                        <Progress value={(skillLevel.xp / skillLevel.maxXp) * 100} className="h-3" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Learned Techniques</h4>
                      <div className="flex flex-wrap gap-2">
                        {skillLevel.techniques.map((technique, index) => (
                          <Badge key={index} variant="secondary">
                            {technique.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pattern Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pattern Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold">{Math.round(getCompletionPercentage())}%</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold">{formatTime(progress.timeSpent)}</div>
                        <div className="text-sm text-gray-600">Time Invested</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold">{progress.currentStitch}</div>
                        <div className="text-sm text-gray-600">Stitches Made</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className={achievement.unlocked ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-medium">{achievement.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          
                          {achievement.maxProgress && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{achievement.progress} / {achievement.maxProgress}</span>
                              </div>
                              <Progress 
                                value={(achievement.progress! / achievement.maxProgress) * 100} 
                                className="h-2"
                              />
                            </div>
                          )}
                          
                          {achievement.unlocked && (
                            <Badge className="mt-2 bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Unlocked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4" />
                    <p>No sessions yet. Start crocheting to see your history!</p>
                  </div>
                ) : (
                  sessions.map((session, index) => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Session {sessions.length - index}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(session.startTime).toLocaleDateString()} • 
                              {formatTime(session.endTime ? 
                                Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000) 
                                : 0
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{session.stitchesCompleted}</div>
                            <div className="text-sm text-gray-600">stitches</div>
                          </div>
                        </div>
                        
                        {session.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            {session.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}