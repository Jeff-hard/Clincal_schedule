import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  RefreshCw,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Search,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

// Mock data for demonstration
const mockSwapRequests = [
  {
    id: 1,
    requester: { id: 1, name: "Dr. Smith", email: "smith@hospital.com" },
    targetUser: { id: 2, name: "Dr. Johnson", email: "johnson@hospital.com" },
    requesterAssignment: { date: "2025-01-15", service: { name: "ICU", color: "#3B82F6" } },
    targetAssignment: { date: "2025-01-16", service: { name: "Emergency", color: "#EF4444" } },
    status: "pending",
    reason: "Family commitment on the 15th",
    requestedAt: "2024-12-20T10:00:00Z",
    swapType: "2-way"
  },
  {
    id: 2,
    requester: { id: 3, name: "Dr. Williams", email: "williams@hospital.com" },
    targetUser: { id: 1, name: "Dr. Smith", email: "smith@hospital.com" },
    requesterAssignment: { date: "2025-01-20", service: { name: "Surgery", color: "#10B981" } },
    targetAssignment: { date: "2025-01-22", service: { name: "ICU", color: "#3B82F6" } },
    status: "approved",
    reason: "Conference attendance",
    requestedAt: "2024-12-18T14:30:00Z",
    respondedAt: "2024-12-19T09:15:00Z",
    swapType: "2-way"
  },
  {
    id: 3,
    requester: { id: 2, name: "Dr. Johnson", email: "johnson@hospital.com" },
    targetUser: null,
    requesterAssignment: { date: "2025-01-25", service: { name: "Weekend Call", color: "#8B5CF6" } },
    targetAssignment: null,
    status: "pending",
    reason: "Need weekend off for wedding",
    requestedAt: "2024-12-21T16:45:00Z",
    swapType: "open"
  }
];

const mockCurrentUser = {
  id: 1,
  name: "Dr. Smith",
  email: "smith@hospital.com",
  role: "owner"
};

const mockMyAssignments = [
  { id: 1, date: "2025-01-15", service: { name: "ICU", color: "#3B82F6" } },
  { id: 2, date: "2025-01-20", service: { name: "Emergency", color: "#EF4444" } },
  { id: 3, date: "2025-01-25", service: { name: "Surgery", color: "#10B981" } },
];

const mockSuggestions = [
  {
    targetUser: { id: 2, name: "Dr. Johnson", email: "johnson@hospital.com" },
    targetAssignment: { date: "2025-01-16", service: { name: "Emergency", color: "#EF4444" } },
    compatibility: 85,
    reason: "Both available and preferred services match"
  },
  {
    targetUser: { id: 3, name: "Dr. Williams", email: "williams@hospital.com" },
    targetAssignment: { date: "2025-01-17", service: { name: "ICU", color: "#3B82F6" } },
    compatibility: 72,
    reason: "Good availability match"
  }
];

export default function SwapManagement() {
  const [activeTab, setActiveTab] = useState<'my-requests' | 'incoming' | 'create' | 'browse'>('my-requests');
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'default' as const, color: 'text-yellow-600', icon: Clock },
      approved: { variant: 'default' as const, color: 'text-green-600', icon: CheckCircle },
      rejected: { variant: 'destructive' as const, color: 'text-red-600', icon: XCircle },
      completed: { variant: 'secondary' as const, color: 'text-blue-600', icon: CheckCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredRequests = mockSwapRequests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  const myRequests = filteredRequests.filter(req => req.requester.id === mockCurrentUser.id);
  const incomingRequests = filteredRequests.filter(req => 
    req.targetUser?.id === mockCurrentUser.id && req.status === 'pending'
  );

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleCreateSwapRequest = () => {
    if (!selectedAssignment || !swapReason.trim()) return;
    
    // In real app, this would make an API call
    console.log('Creating swap request:', {
      assignmentId: selectedAssignment,
      reason: swapReason
    });
    
    setSelectedAssignment(null);
    setSwapReason('');
    setActiveTab('my-requests');
  };

  const handleRespondToSwap = (swapId: number, response: 'approve' | 'reject') => {
    // In real app, this would make an API call
    console.log(`${response} swap request ${swapId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Swap Requests</h1>
          <p className="text-gray-600">Manage schedule swaps and trades</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'my-requests', name: 'My Requests', icon: RefreshCw, count: myRequests.length },
            { id: 'incoming', name: 'Incoming', icon: ArrowRightLeft, count: incomingRequests.length },
            { id: 'create', name: 'Create Request', icon: Plus },
            { id: 'browse', name: 'Browse Open', icon: Search },
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

      {/* My Requests Tab */}
      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Swap Requests</h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {myRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusBadge(request.status)}
                          <Badge variant="outline">{request.swapType.toUpperCase()}</Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(request.requestedAt)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Your Assignment</h4>
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: request.requesterAssignment.service.color }}
                            />
                            <div>
                              <div className="font-medium">{request.requesterAssignment.service.name}</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(request.requesterAssignment.date)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {request.targetAssignment && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Requested Assignment</h4>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: request.targetAssignment.service.color }}
                              />
                              <div>
                                <div className="font-medium">{request.targetAssignment.service.name}</div>
                                <div className="text-sm text-gray-600">
                                  {formatDate(request.targetAssignment.date)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Reason</h4>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>
                      
                      {request.targetUser && (
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(request.targetUser.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{request.targetUser.name}</div>
                            <div className="text-xs text-gray-500">{request.targetUser.email}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {myRequests.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No swap requests</h3>
                  <p className="text-gray-600 mb-4">You haven't created any swap requests yet.</p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Incoming Requests Tab */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Requests for Your Shifts</h2>
          
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(request.requester.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{request.requester.name}</div>
                            <div className="text-sm text-gray-500">wants to swap with you</div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(request.requestedAt)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">They're offering</h4>
                          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: request.requesterAssignment.service.color }}
                            />
                            <div>
                              <div className="font-medium">{request.requesterAssignment.service.name}</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(request.requesterAssignment.date)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">For your shift</h4>
                          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: request.targetAssignment?.service.color }}
                            />
                            <div>
                              <div className="font-medium">{request.targetAssignment?.service.name}</div>
                              <div className="text-sm text-gray-600">
                                {request.targetAssignment && formatDate(request.targetAssignment.date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Their reason</h4>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRespondToSwap(request.id, 'reject')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button 
                      onClick={() => handleRespondToSwap(request.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {incomingRequests.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No incoming requests</h3>
                  <p className="text-gray-600">No one has requested to swap with your shifts yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create Request Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Create Swap Request</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Select Assignment to Swap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Your upcoming assignments</Label>
              <div className="space-y-2">
                {mockMyAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAssignment === assignment.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAssignment(assignment.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: assignment.service.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{assignment.service.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(assignment.date)}
                        </div>
                      </div>
                      {selectedAssignment === assignment.id && (
                        <CheckCircle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for swap request</Label>
                <Textarea
                  id="reason"
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Please explain why you need this swap..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedAssignment) {
                      setShowSuggestions(!showSuggestions);
                    }
                  }}
                  disabled={!selectedAssignment}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showSuggestions ? 'Hide' : 'Show'} Suggestions
                </Button>
                
                <Button 
                  onClick={handleCreateSwapRequest}
                  disabled={!selectedAssignment || !swapReason.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Open Request
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Suggestions */}
          {showSuggestions && selectedAssignment && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Swap Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(suggestion.targetUser.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{suggestion.targetUser.name}</div>
                            <div className="text-sm text-gray-600">
                              {suggestion.targetAssignment.service.name} • {formatDate(suggestion.targetAssignment.date)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {suggestion.compatibility}% match
                          </div>
                          <Button size="sm" className="mt-2">
                            Request Swap
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{suggestion.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Browse Open Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Open Swap Requests</h2>
          
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No open requests</h3>
              <p className="text-gray-600">There are no open swap requests at this time.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}