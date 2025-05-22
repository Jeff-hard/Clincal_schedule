import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data - in real app this would come from your API
const mockSchedulePeriods = [
  { id: 1, name: "December 2024", startDate: "2024-12-01", endDate: "2024-12-31", isPublished: true },
  { id: 2, name: "January 2025", startDate: "2025-01-01", endDate: "2025-01-31", isPublished: false },
];

const mockServices = [
  { id: 1, name: "ICU", color: "#3B82F6", serviceType: "weekday" },
  { id: 2, name: "Emergency", color: "#EF4444", serviceType: "call" },
  { id: 3, name: "Surgery", color: "#10B981", serviceType: "weekday" },
  { id: 4, name: "Weekend Call", color: "#8B5CF6", serviceType: "weekend" },
];

const mockAssignments = [
  { id: 1, userId: 1, serviceId: 1, date: "2024-12-15", user: { name: "Dr. Smith", email: "smith@hospital.com" }, service: { name: "ICU", color: "#3B82F6" }},
  { id: 2, userId: 2, serviceId: 2, date: "2024-12-15", user: { name: "Dr. Johnson", email: "johnson@hospital.com" }, service: { name: "Emergency", color: "#EF4444" }},
  { id: 3, userId: 3, serviceId: 3, date: "2024-12-15", user: { name: "Dr. Williams", email: "williams@hospital.com" }, service: { name: "Surgery", color: "#10B981" }},
  { id: 4, userId: 1, serviceId: 4, date: "2024-12-14", user: { name: "Dr. Smith", email: "smith@hospital.com" }, service: { name: "Weekend Call", color: "#8B5CF6" }},
];

const mockCurrentUser = {
  id: 1,
  name: "Dr. Smith",
  email: "smith@hospital.com",
  role: "owner"
};

export default function ScheduleDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState(mockSchedulePeriods[0]);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 15)); // December 15, 2024
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [selectedService, setSelectedService] = useState<number | 'all'>('all');

  // Calculate the week view dates
  const weekDates = useMemo(() => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  // Filter assignments based on selected service and date range
  const filteredAssignments = useMemo(() => {
    return mockAssignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const inDateRange = viewMode === 'week' 
        ? weekDates.some(date => date.toDateString() === assignmentDate.toDateString())
        : assignmentDate.getMonth() === currentDate.getMonth();
      
      const serviceMatch = selectedService === 'all' || assignment.serviceId === selectedService;
      
      return inDateRange && serviceMatch;
    });
  }, [weekDates, currentDate, viewMode, selectedService]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredAssignments.filter(assignment => assignment.date === dateStr);
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Schedule</h1>
          <p className="text-gray-600">Manage and view your clinical assignments</p>
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
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Request Swap
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-lg font-semibold min-w-[200px] text-center">
              {viewMode === 'week' 
                ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={viewMode} onValueChange={(value: 'month' | 'week') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filter by service:</span>
          <Select value={selectedService.toString()} onValueChange={(value) => {
            setSelectedService(value === 'all' ? 'all' : parseInt(value));
          }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {mockServices.map(service => (
                <SelectItem key={service.id} value={service.id.toString()}>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: service.color }}
                    />
                    {service.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={day} className="p-2 text-center font-semibold text-gray-600 border-b">
                {day}
              </div>
            ))}
            
            {/* Date cells */}
            {weekDates.map((date, index) => {
              const assignments = getAssignmentsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const weekend = isWeekend(date);
              
              return (
                <div 
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b ${
                    weekend ? 'bg-gray-50' : 'bg-white'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-blue-600' : weekend ? 'text-gray-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: assignment.service.color }}
                        title={`${assignment.service.name} - ${assignment.user.name}`}
                      >
                        <div className="font-medium">{assignment.service.name}</div>
                        <div className="opacity-90">{assignment.user.name.split(' ')[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2" />
              My Assignments This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAssignments
                .filter(a => a.userId === mockCurrentUser.id)
                .map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{assignment.service.name}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(assignment.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: assignment.service.color }}
                    />
                  </div>
                ))}
              {filteredAssignments.filter(a => a.userId === mockCurrentUser.id).length === 0 && (
                <p className="text-sm text-gray-500">No assignments this week</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">Availability Due</span>
                </div>
                <Badge variant="outline">3 days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Preferences Updated</span>
                </div>
                <Badge variant="secondary">Complete</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2" />
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Staff</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available</span>
                <span className="font-medium text-green-600">10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">On Leave</span>
                <span className="font-medium text-yellow-600">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Coverage</span>
                <span className="font-medium text-green-600">95%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}