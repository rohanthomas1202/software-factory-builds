/**
 * Analytics API Routes
 * GET /api/analytics - Get analytics data for current user's projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { AnalyticsData, TaskStatus, TaskPriority, Project, Task, User } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all projects where user is a member
    const userProjects = Array.from(store.projects.values()).filter(project => 
      project.memberIds.includes(user.id) || project.ownerId === user.id
    );

    // Get all tasks from user's projects
    const allTasks: Task[] = [];
    const allBoards = Array.from(store.boards.values());
    
    userProjects.forEach(project => {
      const projectBoards = allBoards.filter(board => board.projectId === project.id);
      projectBoards.forEach(board => {
        const boardTasks = Array.from(store.tasks.values()).filter(task => task.boardId === board.id);
        allTasks.push(...boardTasks);
      });
    });

    // Calculate task status distribution
    const taskStatusCounts = {
      todo: allTasks.filter(task => task.status === 'todo').length,
      inProgress: allTasks.filter(task => task.status === 'inProgress').length,
      review: allTasks.filter(task => task.status === 'review').length,
      done: allTasks.filter(task => task.status === 'done').length,
    };

    // Calculate priority distribution
    const priorityCounts = {
      low: allTasks.filter(task => task.priority === 'low').length,
      medium: allTasks.filter(task => task.priority === 'medium').length,
      high: allTasks.filter(task => task.priority === 'high').length,
      critical: allTasks.filter(task => task.priority === 'critical').length,
    };

    // Calculate completion rate
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'done').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average completion time (in days)
    let totalCompletionTime = 0;
    let completedTasksWithDates = 0;
    
    allTasks.forEach(task => {
      if (task.status === 'done' && task.createdAt && task.updatedAt) {
        const created = new Date(task.createdAt);
        const updated = new Date(task.updatedAt);
        const diffTime = Math.abs(updated.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalCompletionTime += diffDays;
        completedTasksWithDates++;
      }
    });
    
    const averageCompletionTime = completedTasksWithDates > 0 
      ? totalCompletionTime / completedTasksWithDates 
      : 0;

    // Calculate workload per user
    const userWorkload: Record<string, number> = {};
    const allUsers = Array.from(store.users.values());
    
    allTasks.forEach(task => {
      if (task.assigneeId) {
        userWorkload[task.assigneeId] = (userWorkload[task.assigneeId] || 0) + 1;
      }
    });

    // Get user details for workload
    const workloadData = Object.entries(userWorkload).map(([userId, taskCount]) => {
      const user = allUsers.find(u => u.id === userId);
      const completedTasks = allTasks.filter(t => 
        t.assigneeId === userId && t.status === 'done'
      ).length;
      const inProgressTasks = allTasks.filter(t => 
        t.assigneeId === userId && t.status === 'inProgress'
      ).length;
      
      return {
        userId,
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || '',
        userAvatar: user?.avatar,
        totalTasks: taskCount,
        completedTasks,
        inProgressTasks,
        pendingTasks: taskCount - completedTasks - inProgressTasks,
        completionRate: taskCount > 0 ? (completedTasks / taskCount) * 100 : 0,
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks);

    // Calculate daily task creation for last 30 days
    const dailyTaskCounts: Array<{ date: string; count: number }> = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const tasksCreatedOnDate = allTasks.filter(task => {
        if (!task.createdAt) return false;
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateString;
      }).length;
      
      dailyTaskCounts.push({
        date: dateString,
        count: tasksCreatedOnDate,
      });
    }

    // Calculate project-wise statistics
    const projectStats = userProjects.map(project => {
      const projectBoards = allBoards.filter(board => board.projectId === project.id);
      const projectTasks = allTasks.filter(task => 
        projectBoards.some(board => board.id === task.boardId)
      );
      
      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter(t => t.status === 'done').length,
        completionRate: projectTasks.length > 0 
          ? (projectTasks.filter(t => t.status === 'done').length / projectTasks.length) * 100 
          : 0,
        overdueTasks: projectTasks.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate < new Date() && t.status !== 'done';
        }).length,
      };
    });

    // Calculate overdue tasks
    const overdueTasks = allTasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date();
    }).length;

    // Prepare analytics data
    const analyticsData: AnalyticsData = {
      overview: {
        totalProjects: userProjects.length,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      },
      taskStatusDistribution: taskStatusCounts,
      priorityDistribution: priorityCounts,
      workload: workloadData,
      dailyTaskTrends: dailyTaskCounts,
      projectStats,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}