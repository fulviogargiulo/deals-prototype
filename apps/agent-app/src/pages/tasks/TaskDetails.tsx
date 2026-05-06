import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User, Target, CheckCircle, Clock, AlertTriangle, Circle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { useData, mockTasks } from "@/contexts/data-context";

export function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClientById, getOpportunityById } = useData();

  if (!id) {
    return <div className="p-6">Task ID not found</div>;
  }

  const task = mockTasks.find(t => t.id === id);
  
  if (!task) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
        <p className="text-muted-foreground mb-4">The task you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/tasks')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const client = task.clientId ? getClientById(task.clientId) : null;
  const opportunity = task.opportunityId ? getOpportunityById(task.opportunityId) : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-status-closed" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-status-active" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
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

  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(task.status)}
          <TrackedTitle title={task.title}>
            <h1 className="text-3xl font-bold">{task.title}</h1>
          </TrackedTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {task.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    task.status === 'completed' ? 'bg-status-closed text-status-closed-foreground' :
                    task.status === 'in-progress' ? 'bg-status-active text-status-active-foreground' :
                    task.status === 'overdue' ? 'bg-warning text-warning-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {task.status === 'in-progress' ? 'In Progress' : task.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Priority:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Due Date:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className={task.status === 'overdue' ? 'text-warning' : ''}>
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                </div>

                {task.completedAt && (
                  <div>
                    <span className="font-medium">Completed:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="w-4 h-4 text-status-closed" />
                      <span>{formatDate(task.completedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {task.status !== 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button>Mark as Complete</Button>
                  {task.status === 'todo' && (
                    <Button variant="outline">Start Progress</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <UserAvatar name={client.fullName} />
                  <div>
                    <p className="font-medium">{client.fullName}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  View Client Details
                </Button>
              </CardContent>
            </Card>
          )}

          {opportunity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Related Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{opportunity.title}</p>
                    <StatusBadge variant="opportunity-type" status={opportunity.type}>
                      {opportunity.type}
                    </StatusBadge>
                  </div>
                  {opportunity.priceRange && (
                    <p className="text-sm text-muted-foreground">
                      {opportunity.priceRange.currency}{opportunity.priceRange.min.toLocaleString()} - {opportunity.priceRange.currency}{opportunity.priceRange.max.toLocaleString()}
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => navigate(`/opportunities/${opportunity.id}`)}
                >
                  View Opportunity Details
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Task Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">Created:</span>
                <p className="text-muted-foreground">{formatDate(task.createdAt)}</p>
              </div>
              <div className="text-sm">
                <span className="font-medium">Last Updated:</span>
                <p className="text-muted-foreground">{formatDate(task.updatedAt)}</p>
              </div>
              {task.dueDate && (
                <div className="text-sm">
                  <span className="font-medium">Due Date:</span>
                  <p className="text-muted-foreground">{formatDate(task.dueDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}