import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Settings,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Download,
  Upload,
  Play,
  Pause,
  Edit,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Target,
  Zap
} from 'lucide-react';

// Mock data
const mockSchedulePeriods = [
  { 
    id: 1, 
    name: "January 2025", 
    startDate: "2025-01-01", 
    endDate: "2025-01-31", 
    isPublished: false,
    isLocked: false,
    availabilityDeadline: "2024-12-20",
    totalSlots: 248,
    filledSlots: 235,
    pendingSwaps: 3
  },
  { 
    id: 2, 
    name: "December 2024", 
    startDate: "2024-12-01", 
    endDate: "2024-12-31", 
    isPublished: true,
    isLocked: true,
    availabilityDeadline: "2024-11-20",
    totalSlots: 248,
    filledSlots: 248,
    pendingSwaps: 1
  }
];

const mockServices = [
  { id: 1, name: "ICU", color: "#3B82F6", serviceType: "weekday", minStaff: 1, maxStaff: 2, isActive: true },
  { id: 2, name: "Emergency", color: "#EF4444", serviceType: "call", minStaff: 1, maxStaff: 1, isActive: true },
  { id: 3, name: "Surgery", color: "#10B981", serviceType: "weekday", minStaff: 2, maxStaff: 3, isActive: true },
  { id: 4, name: "Weekend Call", color: "#8B5CF6", serviceType: "weekend", minStaff: 1, maxStaff: 1, isActive: true },
  { id: 5, name: "Night Float", color: "#F59E0B", serviceType: "call", minStaff: 1, maxStaff: 1, isActive: false },
];

const mockPendingSwaps = [
  {
    id: 1,
    requester: { name: "Dr. Smith", email: "smith@hospital.com" },
    targetUser: { name: "Dr. Johnson", email: "johnson@hospital.com" },
    requesterShift: { date: "2025-01-15", service: "ICU" },
    targetShift: { date: "2025-01-16", service: "Emergency" },
    reason: "Family commitment",
    requestedAt: "2024-12-20T10:00:00Z",
    priority: "normal"
  },
  {
    id: 2,
    requester: { name: "Dr. Williams", email: "williams@hospital.com" },
    targetUser: null,
    requesterShift: { date: "2025-01-25", service: "Weekend Call" },
    targetShift: null,
    reason: "Wedding attendance - urgent",
    requestedAt: "2024-12-21T16:45:00Z",
    priority: "urgent"
  }
];

const mockTeamStats = {
  totalStaff: 12,
  activeStaff: 11,
  onLeave: 1,
  avgShiftsPerWeek: 4.2,
  satisfactionScore: 78,
  fairnessScore: 85
};

const mockGenerationSettings = {
  fairnessWeight: 40,
  preferenceWeight: 60,
  maxConsecutiveDays: 7,
  maxWeekendsPerMonth: 1,
  minRestHours: 12
};

export default function AdminSchedulerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'periods' | 'services' | 'swaps' | 'analytics' | 'settings'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(mockSchedulePeriods[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showNewPeriodDialog, setShowNewPeriodDialog] = useState(false);
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
  const [generationSettings, setGenerationSettings] = useState(mockGenerationSettings);

  // New period form state
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    startDate: '',
    endDate: '',
    availabilityDeadline: ''
  });

  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    serviceType: 'weekday',
    color: '#3B82F6',
    minStaff: 1,
    maxStaff: 1
  });

  const generateSchedule = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate schedule generation progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleApproveSwap = (swapId: number) => {
    // In real app, this would make an API call
    console.log('Approving swap:', swapId);
  };

  const handleRejectSwap = (swapId: number) => {
    // In real app, this would make an API call
    console.log('Rejecting swap:', swapId);
  };

  const publishSchedule = () => {
    // In real app, this would make an API call
    console.log('Publishing schedule for period:', selectedPeriod.id);
  };

  const createNewPeriod = () => {
    // In real app, this would make an API call
    console.log('Creating new period:', newPeriod);
    setShowNewPeriodDialog(false);
    setNewPeriod({ name: '', startDate: '', endDate: '', availabilityDeadline: '' });
  };

  const createNewService = () => {
    // In real app, this would make an API call
    console.log('Creating new service:', newService);
    setShowNewServiceDialog(false);
    setNewService({
      name: '',
      description: '',
      serviceType: 'weekday',
      color: '#3B82F6',
      minStaff: 1,
      maxStaff: 1
    });
  };

  const getCompletionPercentage = (period: any) => {
    return Math.round((period.filledSlots / period.totalSlots) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduler Administration</h1>
          <p className="text-gray-600">Manage clinical schedules and team assignments</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod.id.toString()} onValueChange={(value) => {
            const period = mockSchedulePeriods.find(p => p.id.toString() === value);
            if (period) setSelectedPeriod(period);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockSchedulePeriods.map(period => (
                <SelectItem key={period.id} value={period.id.toString()}>
                  {period.name}
                  {period.isPublished && <Badge className="ml-2" variant="secondary">Published</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'periods', name: 'Schedule Periods', icon: Calendar },
            { id: 'services', name: 'Services', icon: Settings },
            { id: 'swaps', name: 'Pending Swaps', icon: RefreshCw, count: mockPendingSwaps.length },
            { id: 'analytics', name: 'Analytics', icon: Target },
            { id: 'settings', name: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Staff</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {mockTeamStats.activeStaff}/{mockTeamStats.totalStaff}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Schedule Completion</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {getCompletionPercentage(selectedPeriod)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <RefreshCw className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Swaps</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedPeriod.pendingSwaps}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                    <p className="text-2xl font-bold text-gray-900">{mockTeamStats.satisfactionScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Period Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Period: {selectedPeriod.name}</span>
                <div className="flex items-center space-x-2">
                  {selectedPeriod.isPublished ? (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Draft
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Coverage Progress</Label>
                  <Progress value={getCompletionPercentage(selectedPeriod)} className="mt-2" />
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedPeriod.filledSlots} / {selectedPeriod.totalSlots} slots filled
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Availability Deadline</Label>
                  <div className="text-sm text-gray-900 mt-2">
                    {new Date(selectedPeriod.availabilityDeadline).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(selectedPeriod.availabilityDeadline) > new Date() ? 'Upcoming' : 'Passed'}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Period Duration</Label>
                  <div className="text-sm text-gray-900 mt-2">
                    {new Date(selectedPeriod.startDate).toLocaleDateString()} - {new Date(selectedPeriod.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600">31 days</div>
                </div>
              </div>

              {/* Generation Controls */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Schedule Generation</h3>
                    <p className="text-sm text-gray-600">
                      {selectedPeriod.isPublished ? 'Schedule is published and locked' : 'Generate assignments for this period'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {isGenerating && (
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <Progress value={generationProgress} />
                        </div>
                        <span className="text-sm text-gray-600">{generationProgress}%</span>
                      </div>
                    )}
                    
                    {!selectedPeriod.isPublished && (
                      <>
                        <Button
                          variant="outline"
                          onClick={generateSchedule}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Generate Schedule
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={publishSchedule}
                          disabled={getCompletionPercentage(selectedPeriod) < 90}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publish Schedule
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Schedule generated successfully</p>
                    <p className="text-xs text-gray-600">94% satisfaction score achieved</p>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Swap request pending approval</p>
                    <p className="text-xs text-gray-600">Dr. Williams requesting urgent swap</p>
                  </div>
                  <span className="text-xs text-gray-500">4 hours ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Availability submissions complete</p>
                    <p className="text-xs text-gray-600">All team members submitted preferences</p>
                  </div>
                  <span className="text-xs text-gray-500">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Periods Tab */}
      {activeTab === 'periods' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Schedule Periods</h2>
            <Dialog open={showNewPeriodDialog} onOpenChange={setShowNewPeriodDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Period
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Schedule Period</DialogTitle>
                  <DialogDescription>
                    Set up a new scheduling period for your team.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="period-name">Period Name</Label>
                    <Input
                      id="period-name"
                      value={newPeriod.name}
                      onChange={(e) => setNewPeriod(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., February 2025"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newPeriod.startDate}
                        onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={newPeriod.endDate}
                        onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="deadline">Availability Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newPeriod.availabilityDeadline}
                      onChange={(e) => setNewPeriod(prev => ({ ...prev, availabilityDeadline: e.target.value }))}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewPeriodDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewPeriod}>
                    Create Period
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockSchedulePeriods.map((period) => (
              <Card key={period.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{period.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {period.isPublished ? (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                      {period.isLocked && (
                        <Badge variant="secondary">Locked</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <div>Period: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}</div>
                    <div>Deadline: {new Date(period.availabilityDeadline).toLocaleDateString()}</div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Coverage</span>
                      <span>{period.filledSlots}/{period.totalSlots} slots</span>
                    </div>
                    <Progress value={getCompletionPercentage(period)} />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-gray-600">
                      {period.pendingSwaps} pending swaps
                    </span>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Clinical Services</h2>
            <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Service</DialogTitle>
                  <DialogDescription>
                    Add a new clinical service to your scheduling system.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="service-name">Service Name</Label>
                    <Input
                      id="service-name"
                      value={newService.name}
                      onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Cardiology"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="service-desc">Description</Label>
                    <Textarea
                      id="service-desc"
                      value={newService.description}
                      onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the service..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service-type">Service Type</Label>
                      <Select value={newService.serviceType} onValueChange={(value) => 
                        setNewService(prev => ({ ...prev, serviceType: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekday">Weekday</SelectItem>
                          <SelectItem value="weekend">Weekend</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="service-color">Color</Label>
                      <Input
                        id="service-color"
                        type="color"
                        value={newService.color}
                        onChange={(e) => setNewService(prev => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-staff">Min Staff Required</Label>
                      <Input
                        id="min-staff"
                        type="number"
                        value={newService.minStaff}
                        onChange={(e) => setNewService(prev => ({ ...prev, minStaff: parseInt(e.target.value) }))}
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="max-staff">Max Staff Allowed</Label>
                      <Input
                        id="max-staff"
                        type="number"
                        value={newService.maxStaff}
                        onChange={(e) => setNewService(prev => ({ ...prev, maxStaff: parseInt(e.target.value) }))}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewServiceDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewService}>
                    Create Service
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockServices.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: service.color }}
                      />
                      <h3 className="font-semibold">{service.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {service.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{service.serviceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff Range:</span>
                      <span>{service.minStaff} - {service.maxStaff}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      {service.isActive ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                      {service.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Swaps Tab */}
      {activeTab === 'swaps' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Pending Swap Requests</h2>
          
          <div className="space-y-4">
            {mockPendingSwaps.map((swap) => (
              <Card key={swap.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{swap.requester.name}</h3>
                          {swap.priority === 'urgent' && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(swap.requestedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Requesting to swap</h4>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <div className="font-medium">{swap.requesterShift.service}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(swap.requesterShift.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        {swap.targetShift && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">For</h4>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="font-medium">{swap.targetShift.service}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(swap.targetShift.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                with {swap.targetUser?.name}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!swap.targetShift && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Open Request</h4>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-600">
                                Looking for anyone to cover this shift
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Reason</h4>
                        <p className="text-sm text-gray-600">{swap.reason}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRejectSwap(swap.id)}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleApproveSwap(swap.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {mockPendingSwaps.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending swaps</h3>
                  <p className="text-gray-600">All swap requests have been processed.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Scheduling Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Score</span>
                    <span className="text-2xl font-bold text-green-600">{mockTeamStats.satisfactionScore}%</span>
                  </div>
                  <Progress value={mockTeamStats.satisfactionScore} className="h-3" />
                  <div className="text-sm text-gray-600">
                    Based on preference fulfillment and constraint compliance
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fairness Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Distribution Equity</span>
                    <span className="text-2xl font-bold text-blue-600">{mockTeamStats.fairnessScore}%</span>
                  </div>
                  <Progress value={mockTeamStats.fairnessScore} className="h-3" />
                  <div className="text-sm text-gray-600">
                    Equal distribution of shifts and weekend coverage
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Analytics dashboard coming soon</p>
                <p className="text-sm text-gray-500">Track team workload, satisfaction trends, and scheduling efficiency</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Generation Settings</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Adjust how the scheduling algorithm prioritizes different factors
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Fairness Weight</Label>
                  <span className="text-sm font-medium">{generationSettings.fairnessWeight}%</span>
                </div>
                <Slider
                  value={[generationSettings.fairnessWeight]}
                  onValueChange={([value]) => setGenerationSettings(prev => ({ ...prev, fairnessWeight: value }))}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-gray-600 mt-1">
                  How much to prioritize equal distribution of shifts
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Preference Weight</Label>
                  <span className="text-sm font-medium">{generationSettings.preferenceWeight}%</span>
                </div>
                <Slider
                  value={[generationSettings.preferenceWeight]}
                  onValueChange={([value]) => setGenerationSettings(prev => ({ ...prev, preferenceWeight: value }))}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-gray-600 mt-1">
                  How much to prioritize individual preferences
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max-consecutive">Max Consecutive Days</Label>
                  <Input
                    id="max-consecutive"
                    type="number"
                    value={generationSettings.maxConsecutiveDays}
                    onChange={(e) => setGenerationSettings(prev => ({ 
                      ...prev, 
                      maxConsecutiveDays: parseInt(e.target.value) 
                    }))}
                    min="1"
                    max="14"
                  />
                </div>

                <div>
                  <Label htmlFor="max-weekends">Max Weekends/Month</Label>
                  <Input
                    id="max-weekends"
                    type="number"
                    value={generationSettings.maxWeekendsPerMonth}
                    onChange={(e) => setGenerationSettings(prev => ({ 
                      ...prev, 
                      maxWeekendsPerMonth: parseInt(e.target.value) 
                    }))}
                    min="0"
                    max="5"
                  />
                </div>

                <div>
                  <Label htmlFor="min-rest">Min Rest Hours</Label>
                  <Input
                    id="min-rest"
                    type="number"
                    value={generationSettings.minRestHours}
                    onChange={(e) => setGenerationSettings(prev => ({ 
                      ...prev, 
                      minRestHours: parseInt(e.target.value) 
                    }))}
                    min="8"
                    max="24"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline">
                  Reset to Defaults
                </Button>
                <Button>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}