import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Calendar, User, CheckCircle, Clock, AlertTriangle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { useData, mockTasks } from "@/contexts/data-context";
import { TaskStatus, TaskPriority } from "@/types";
import { PageContainer } from "@/components/layout/page-container";

export function TasksList() {
  const { getClientById, getOpportunityById } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  
  const navigate = useNavigate();

  const filteredTasks = mockTasks.filter(task => {
    const client = task.clientId ? getClientById(task.clientId) : null;
    const opportunity = task.opportunityId ? getOpportunityById(task.opportunityId) : null;
    
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity?.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-status-closed" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-status-active" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-warning text-warning-foreground';
      case 'medium':
        return 'bg-status-active text-status-active-foreground';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) return 'Today';
    if (isOverdue) return `Overdue (${date.toLocaleDateString()})`;
    return date.toLocaleDateString();
  };

  const getStatusCounts = () => {
    return {
      all: mockTasks.length,
      todo: mockTasks.filter(t => t.status === 'todo').length,
      'in-progress': mockTasks.filter(t => t.status === 'in-progress').length,
      completed: mockTasks.filter(t => t.status === 'completed').length,
      overdue: mockTasks.filter(t => t.status === 'overdue').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <PageContainer>
      {/* Invisible tracking sentinel for global header */}
      <TrackedTitle title="Tasks">
        <div className="h-px w-full" aria-hidden="true" />
      </TrackedTitle>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Manage your tasks and activities</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">{statusCounts.todo}</div>
            <div className="text-sm text-muted-foreground">To Do</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-status-active">{statusCounts['in-progress']}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-status-closed">{statusCounts.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{statusCounts.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks, clients, or opportunities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Statuses</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('todo')}>To Do</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>In Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('overdue')}>Overdue</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Priority: {priorityFilter === 'all' ? 'All' : priorityFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPriorityFilter('all')}>All Priorities</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('urgent')}>Urgent</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('high')}>High</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>Medium</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('low')}>Low</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => {
              const client = task.clientId ? getClientById(task.clientId) : null;
              const opportunity = task.opportunityId ? getOpportunityById(task.opportunityId) : null;
              
              return (
                <TableRow 
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className="font-medium">{task.title}</span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      {opportunity && (
                        <div className="flex items-center gap-1 mt-1">
                          <StatusBadge variant="tag" className="text-xs">
                            {opportunity.title}
                          </StatusBadge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      task.status === 'completed' ? 'bg-status-closed text-status-closed-foreground' :
                      task.status === 'in-progress' ? 'bg-status-active text-status-active-foreground' :
                      task.status === 'overdue' ? 'bg-warning text-warning-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    {client ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar name={client.fullName} size="sm" />
                        <span className="text-sm">{client.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className={task.status === 'overdue' ? 'text-warning' : ''}>
                        {formatDueDate(task.dueDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                      {task.status !== 'completed' && (
                        <Button size="sm" variant="ghost">
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks found matching your criteria</p>
        </div>
      )}
      </div>
    </PageContainer>
  );
}