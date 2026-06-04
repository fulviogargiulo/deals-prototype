import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { 
  Users, 
  Target, 
  AlertCircle, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useData, mockTasks } from "@/contexts/data-context";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { PageContainer } from "@/components/layout/page-container";

export function Dashboard() {
  const navigate = useNavigate();
  const { getAllClientsWithOpportunities, opportunities } = useData();
  const allClients = getAllClientsWithOpportunities();
  const pendingVerification = allClients.filter(c => c.verificationStatus === 'pending').length;
  const totalOpportunities = opportunities.length;
  const newOpportunities = opportunities.filter(o => o.status === 'new').length;
  const activeOpportunities = opportunities.filter(o => o.status === 'active').length;
  const pendingTasks = mockTasks.filter(t => t.status === 'todo').length;
  const overdueTasks = mockTasks.filter(t => t.status === 'overdue').length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Mock performance data
  const monthlyDeals = [4, 6, 3, 8, 5, 7]; // Last 6 months
  const monthlyRevenue = 320000; // This month's revenue
  const lastMonthRevenue = 280000;
  const revenueChange = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);
  
  const opportunityTypes = {
    buy: opportunities.filter(o => o.type === 'buy').length,
    sell: opportunities.filter(o => o.type === 'sell').length,
    rent: opportunities.filter(o => o.type === 'rent').length,
    lease: opportunities.filter(o => o.type === 'lease').length,
  };

  const taskProgress = {
    completed: mockTasks.filter(t => t.status === 'completed').length,
    inProgress: mockTasks.filter(t => t.status === 'in-progress').length,
    todo: mockTasks.filter(t => t.status === 'todo').length,
    overdue: mockTasks.filter(t => t.status === 'overdue').length,
  };

  const totalRevenue = monthlyDeals.reduce((sum, deals) => sum + (deals * 45000), 0);
  const avgDealValue = totalRevenue / monthlyDeals.reduce((sum, deals) => sum + deals, 0);

  return (
    <PageContainer className="space-y-8 animate-fade-in">
      {/* Hero Section with Apple-Style Glass Effect and Animated Purple Blobs */}
      <div className="relative overflow-hidden rounded-3xl p-8 border border-foreground/10 backdrop-blur-2xl bg-gradient-to-br from-background/40 via-background/20 to-transparent animate-scale-in">
        {/* Animated Purple Blobs Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-transparent"></div>
          
          {/* Animated purple blobs */}
          <div className="absolute inset-0">
            {/* Large blob 1 - Deep purple */}
            <div 
              className="absolute w-80 h-80 bg-gradient-to-br from-purple-600/30 to-purple-800/20 rounded-full blur-3xl"
              style={{ 
                top: '-20%', 
                left: '-10%',
                animation: 'blob1 20s ease-in-out infinite',
              }}
            ></div>
            
            {/* Large blob 2 - Violet */}
            <div 
              className="absolute w-96 h-96 bg-gradient-to-br from-violet-500/25 to-purple-700/15 rounded-full blur-3xl"
              style={{ 
                top: '20%', 
                right: '-15%',
                animation: 'blob2 25s ease-in-out infinite reverse',
              }}
            ></div>
            
            {/* Medium blob 3 - Indigo */}
            <div 
              className="absolute w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-600/15 rounded-full blur-2xl"
              style={{ 
                bottom: '-10%', 
                left: '30%',
                animation: 'blob3 18s ease-in-out infinite',
              }}
            ></div>
            
            {/* Medium blob 4 - Fuchsia */}
            <div 
              className="absolute w-72 h-72 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/15 rounded-full blur-2xl"
              style={{ 
                top: '60%', 
                left: '10%',
                animation: 'blob4 22s ease-in-out infinite reverse',
              }}
            ></div>
            
            {/* Small accent blobs */}
            <div 
              className="absolute w-32 h-32 bg-gradient-to-br from-purple-400/25 to-violet-600/20 rounded-full blur-xl"
              style={{ 
                top: '10%', 
                left: '60%',
                animation: 'blob5 15s ease-in-out infinite',
              }}
            ></div>
            
            <div 
              className="absolute w-40 h-40 bg-gradient-to-br from-indigo-400/25 to-purple-500/20 rounded-full blur-xl"
              style={{ 
                bottom: '20%', 
                right: '20%',
                animation: 'blob6 17s ease-in-out infinite reverse',
              }}
            ></div>
          </div>
        </div>
        
        <div className="relative z-10">
          <TrackedTitle title="Dashboard">
            <h1 className="text-4xl font-semibold mb-2 text-foreground">
              {getGreeting()}, Nino
            </h1>
          </TrackedTitle>
          <p className="text-lg text-foreground/80 mb-6">
            Here's your performance overview and key insights
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-tier-info" />
              <Activity className="w-4 h-4 text-tier-info" />
              <span className="text-foreground/80"><span className="font-semibold text-tier-info">{activeOpportunities}</span> active deals</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-tier-warning" />
              <Clock className="w-4 h-4 text-tier-warning" />
              <span className="text-foreground/80"><span className="font-semibold text-tier-warning">3</span> pending tasks</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-tier-success" />
              <DollarSign className="w-4 h-4 text-tier-success" />
              <span className="text-foreground/80"><span className="font-semibold text-tier-success">€{(monthlyRevenue / 1000).toFixed(0)}K</span> revenue</span>
            </div>
          </div>
        </div>
        
        {/* CSS animations for blobs */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes blob1 {
              0%, 100% { 
                transform: translateX(0px) translateY(0px) scale(1);
              }
              25% { 
                transform: translateX(-20px) translateY(-30px) scale(1.1);
              }
              50% { 
                transform: translateX(20px) translateY(20px) scale(0.9);
              }
              75% { 
                transform: translateX(-10px) translateY(10px) scale(1.05);
              }
            }
            @keyframes blob2 {
              0%, 100% { 
                transform: translateX(0px) translateY(0px) scale(1) rotate(0deg);
              }
              33% { 
                transform: translateX(30px) translateY(-20px) scale(1.2) rotate(120deg);
              }
              66% { 
                transform: translateX(-25px) translateY(15px) scale(0.8) rotate(240deg);
              }
            }
            @keyframes blob3 {
              0%, 100% { 
                transform: translateX(0px) translateY(0px) scale(1);
              }
              30% { 
                transform: translateX(25px) translateY(-15px) scale(1.15);
              }
              70% { 
                transform: translateX(-15px) translateY(25px) scale(0.85);
              }
            }
            @keyframes blob4 {
              0%, 100% { 
                transform: translateX(0px) translateY(0px) scale(1) rotate(0deg);
              }
              40% { 
                transform: translateX(-30px) translateY(-10px) scale(1.1) rotate(160deg);
              }
              80% { 
                transform: translateX(20px) translateY(20px) scale(0.9) rotate(320deg);
              }
            }
            @keyframes blob5 {
              0%, 100% { 
                transform: translateX(0px) translateY(0px) scale(1);
              }
              50% { 
                transform: translateX(-15px) translateY(15px) scale(1.3);
              }
            }
            @keyframes blob6 {
              0%, 100% { 
                transform: translateX(0px) translateY(0px) scale(1);
              }
              25% { 
                transform: translateX(15px) translateY(-20px) scale(0.8);
              }
              75% { 
                transform: translateX(-10px) translateY(10px) scale(1.2);
              }
            }
          `
        }} />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <EnhancedCard 
            hover 
            className="group cursor-pointer transform transition-all duration-200 hover:scale-105" 
            onClick={() => navigate('/clients')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
              <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold mb-2">{allClients.length}</div>
              <div className="flex items-center gap-2">
                {pendingVerification > 0 && (
                  <StatusBadge variant="verification" status="pending">
                    {pendingVerification} pending
                  </StatusBadge>
                )}
              </div>
            </CardContent>
          </EnhancedCard>
        </div>

        <div className="animate-fade-in opacity-0" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          <EnhancedCard 
            hover 
            className="group cursor-pointer transform transition-all duration-200 hover:scale-105" 
            onClick={() => navigate('/opportunities')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
              <div className="p-2 bg-secondary rounded-xl transition-colors">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold mb-2">{activeOpportunities}</div>
              <div className="text-sm text-muted-foreground">Currently negotiating</div>
            </CardContent>
          </EnhancedCard>
        </div>

        <div className="animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <EnhancedCard 
            hover 
            className="group cursor-pointer transform transition-all duration-200 hover:scale-105" 
            onClick={() => navigate('/opportunities')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
              <div className="p-2 bg-secondary rounded-xl transition-colors">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold mb-2">€{(monthlyRevenue / 1000).toFixed(0)}K</div>
              <div className="flex items-center gap-1 text-sm">
                {parseFloat(revenueChange) > 0 ? (
                  <ArrowUp className="w-3 h-3 text-tier-success" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-destructive" />
                )}
                <span className={parseFloat(revenueChange) > 0 ? "text-tier-success" : "text-destructive"}>
                  {revenueChange}% vs last month
                </span>
              </div>
            </CardContent>
          </EnhancedCard>
        </div>

        <div className="animate-fade-in opacity-0" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
          <EnhancedCard 
            hover 
            className="group cursor-pointer transform transition-all duration-200 hover:scale-105" 
            onClick={() => navigate('/tasks')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
              <div className="p-2 bg-secondary rounded-xl transition-colors">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold mb-2">{pendingTasks + overdueTasks}</div>
              <div className="text-sm text-muted-foreground">
                {overdueTasks > 0 ? `${overdueTasks} overdue` : 'All up to date'}
              </div>
            </CardContent>
          </EnhancedCard>
        </div>
      </div>

      {/* Analytics Section - 3 Columns: Performance | Opportunities | Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <EnhancedCard hover className="cursor-pointer transform transition-all duration-200 hover:scale-105" onClick={() => navigate('/opportunities')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last 6 months:</span>
                <span className="font-medium">{monthlyDeals.reduce((sum, deals) => sum + deals, 0)} total deals</span>
              </div>
              <div className="flex items-end gap-1 h-24">
                {monthlyDeals.map((deals, index) => {
                  const maxDeals = Math.max(...monthlyDeals);
                  const height = maxDeals > 0 ? (deals / maxDeals) * 80 : 0;
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                  return (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <div 
                        className="bg-primary hover:bg-primary/80 transition-colors w-full rounded-t-sm min-h-[8px] flex items-end justify-center text-xs text-primary-foreground font-medium"
                        style={{ height: `${height + 8}px` }}
                        title={`${months[index]}: ${deals} deals`}
                      >
                        {deals > 0 && deals}
                      </div>
                      <span className="text-xs text-muted-foreground">{months[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard hover className="cursor-pointer transform transition-all duration-200 hover:scale-105" onClick={() => navigate('/opportunities')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-opportunity-buy" />
              Opportunity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(opportunityTypes).map(([type, count], index) => {
                const colors = ['bg-primary', 'bg-opportunity-buy', 'bg-opportunity-rent', "bg-tier-warning-bg"];
                const percentage = totalOpportunities > 0 ? ((count / totalOpportunities) * 100).toFixed(1) : '0';
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[index]} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-6">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard hover className="cursor-pointer transform transition-all duration-200 hover:scale-105" onClick={() => navigate('/tasks')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(taskProgress).map(([status, count], index) => {
                const colors = ['bg-tier-success', 'bg-tier-info', 'bg-muted', 'bg-tier-warning'];
                const labels = ['Completed', 'In Progress', 'To Do', 'Overdue'];
                const maxCount = Math.max(...Object.values(taskProgress));
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                return (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{labels[index]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[index]} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-6">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6">
        <EnhancedCard hover className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]" onClick={() => navigate('/opportunities')}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-opportunity-buy" />
                Recent Activity
              </CardTitle>
              <span className="text-sm text-muted-foreground">Last 7 days</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.slice(0, 5).map((opportunity, index) => (
                <div 
                  key={opportunity.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-2 transition-all duration-200 animate-fade-in group cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/opportunities/${opportunity.id}`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {opportunity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {opportunity.type} • {opportunity.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="opportunity-status" status={opportunity.status}>
                      {opportunity.status === 'new' ? 'New' : opportunity.status}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    </PageContainer>
  );
}