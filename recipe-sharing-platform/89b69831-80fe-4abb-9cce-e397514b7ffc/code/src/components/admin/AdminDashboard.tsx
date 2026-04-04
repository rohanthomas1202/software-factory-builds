import React from 'react';
import { 
  Shield, 
  ChefHat, 
  Users, 
  FileText, 
  BarChart, 
  AlertTriangle, 
  Settings, 
  TrendingUp, 
  Clock, 
  Star,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Progress } from '@/components/ui/Progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Separator } from '@/components/ui/Separator';
import { Recipe, User, Comment } from '@/lib/types';

interface AdminDashboardProps {
  totalUsers: number;
  totalRecipes: number;
  totalComments: number;
  newUsers: number;
  newRecipes: number;
  pendingReview: number;
  topRatedRecipes: Recipe[];
  mostActiveUsers: User[];
  recentActivities: any[];
}

export function AdminDashboard({
  totalUsers,
  totalRecipes,
  totalComments,
  newUsers,
  newRecipes,
  pendingReview,
  topRatedRecipes,
  mostActiveUsers,
  recentActivities
}: AdminDashboardProps) {
  const stats = [
    {
      title: 'Total Users',
      value: totalUsers.toLocaleString(),
      change: `+${newUsers} this week`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Recipes',
      value: totalRecipes.toLocaleString(),
      change: `+${newRecipes} this week`,
      icon: ChefHat,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Comments',
      value: totalComments.toLocaleString(),
      change: '+12% from last week',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Pending Review',
      value: pendingReview,
      change: 'Requires attention',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    }
  ];

  const quickActions = [
    {
      title: 'Review Flagged Content',
      description: 'Check flagged recipes and comments',
      icon: Shield,
      action: 'Review',
      variant: 'destructive' as const
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: Users,
      action: 'Manage',
      variant: 'default' as const
    },
    {
      title: 'Analytics Report',
      description: 'View detailed platform analytics',
      icon: BarChart,
      action: 'View',
      variant: 'outline' as const
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: Settings,
      action: 'Configure',
      variant: 'outline' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your platform, review content, and monitor activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Administrator
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <Button variant={action.variant} size="sm" className="w-full">
                      {action.action}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for detailed views */}
          <Tabs defaultValue="recipes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recipes">Top Recipes</TabsTrigger>
              <TabsTrigger value="users">Active Users</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recipes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Rated Recipes</CardTitle>
                  <CardDescription>
                    Highest rated recipes on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipe</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRatedRecipes.map((recipe) => (
                        <TableRow key={recipe.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={recipe.imageUrl} alt={recipe.title} />
                                <AvatarFallback>
                                  <ChefHat className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{recipe.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {recipe.category}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={recipe.author.avatar} />
                                <AvatarFallback>
                                  {recipe.author.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{recipe.author.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              <span>{recipe.averageRating.toFixed(1)}</span>
                              <span className="text-muted-foreground text-sm">
                                ({recipe.ratings.length})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {recipe.isFlagged ? (
                              <Badge variant="destructive">Flagged</Badge>
                            ) : recipe.reports.length > 0 ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                Reported
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Clean
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                  <CardDescription>
                    Users with highest engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Recipes</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mostActiveUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>
                                  {user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4" />
                              <span>{user.recipes?.length || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{user.comments?.length || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(user.joinDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                Admin
                              </Badge>
                            ) : user.isVerified ? (
                              <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline">Member</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest platform activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {activity.type === 'recipe' && <ChefHat className="h-4 w-4" />}
                          {activity.type === 'comment' && <FileText className="h-4 w-4" />}
                          {activity.type === 'user' && <Users className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {activity.time}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Platform Health */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
              <CardDescription>
                System status and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Server Uptime</span>
                  <span className="text-sm font-medium">99.8%</span>
                </div>
                <Progress value={99.8} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage Usage</span>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Sessions</span>
                  <span className="text-sm font-medium">1,234</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">All systems operational</span>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Content requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingReview > 0 ? (
                  Array.from({ length: Math.min(3, pendingReview) }).map((_, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">Reported Recipe</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Multiple user reports
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">No pending reports</p>
                    <p className="text-xs text-muted-foreground">
                      All content is clean
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Metrics</CardTitle>
              <CardDescription>
                Weekly platform growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">User Growth</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    +{newUsers} users
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Recipe Growth</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    +{newRecipes} recipes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Avg. Session</span>
                  </div>
                  <span className="text-sm font-medium">4m 32s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}