import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Mock data
const mockServices = [
  { id: 1, name: "ICU", color: "#3B82F6", serviceType: "weekday", description: "Intensive Care Unit" },
  { id: 2, name: "Emergency", color: "#EF4444", serviceType: "call", description: "Emergency Department" },
  { id: 3, name: "Surgery", color: "#10B981", serviceType: "weekday", description: "Operating Room" },
  { id: 4, name: "Weekend Call", color: "#8B5CF6", serviceType: "weekend", description: "Weekend Coverage" },
  { id: 5, name: "Night Call", color: "#F59E0B", serviceType: "call", description: "Night Coverage" },
];

const mockSchedulePeriod = {
  id: 1,
  name: "January 2025",
  startDate: "2025-01-01",
  endDate: "2025-01-31",
  availabilityDeadline: "2024-12-20"
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityForm() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'preferences' | 'constraints'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  
  // Calendar state - stores availability for each date/service combination
  const [availability, setAvailability] = useState<{
    [key: string]: { // date-serviceId
      preference: 'prefer' | 'available' | 'unavailable' | 'emergency_only';
      priority: number;
      notes: string;
    }
  }>({
    '2025-01-15-1': { preference: 'prefer', priority: 5, notes: 'Good with ICU' },
    '2025-01-15-2': { preference: 'available', priority: 3, notes: '' },
    '2025-01-16-1': { preference: 'unavailable', priority: 1, notes: 'Conference' },
  });

  // General preferences
  const [preferences, setPreferences] = useState({
    maxConsecutiveDays: 7,
    maxWeekendsPerMonth: 1,
    preferBackToBackWeeks: false,
    preferTwoWeeksInRow: false,
    preferredServices: [1, 3] as number[],
    blackoutDates: ['2025-01-20', '2025-01-21'] as string[],
    preferredDaysOff: [0, 6] as number[], // Sunday, Saturday
    maxShiftsPerWeek: 5,
    minRestHoursBetweenShifts: 12,
  });

  // Generate calendar dates for the period
  const calendarDates = useMemo(() => {
    const dates = [];
    const start = new Date(mockSchedulePeriod.startDate);
    const end = new Date(mockSchedulePeriod.endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    return dates;
  }, []);

  const getAvailabilityKey = (date: Date, serviceId: number) => {
    return `${date.toISOString().split('T')[0]}-${serviceId}`;
  };

  const getAvailability = (date: Date, serviceId: number) => {
    const key = getAvailabilityKey(date, serviceId);
    return availability[key] || { preference: 'available', priority: 3, notes: '' };
  };

  const setAvailabilityForDate = (date: Date, serviceId: number, updates: Partial<typeof availability[string]>) => {
    const key = getAvailabilityKey(date, serviceId);
    setAvailability(prev => ({
      ...prev,
      [key]: { ...getAvailability(date, serviceId), ...updates }
    }));
  };

  const getPreferenceColor = (preference: string) => {
    switch (preference) {
      case 'prefer': return 'bg-green-500 text-white';
      case 'available': return 'bg-blue-500 text-white';
      case 'unavailable': return 'bg-red-500 text-white';
      case 'emergency_only': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  const getPreferenceIcon = (preference: string) => {
    switch (preference) {
      case 'prefer': return <Heart className="h-3 w-3" />;
      case 'available': return <CheckCircle className="h-3 w-3" />;
      case 'unavailable': return <AlertCircle className="h-3 w-3" />;
      case 'emergency_only': return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const handleBulkUpdate = (preference: string) => {
    if (!selectedDate || !selectedService) return;
    
    const date = new Date(selectedDate);
    setAvailabilityForDate(date, selectedService, { preference: preference as any });
  };

  const applyToAllDates = (serviceId: number, preference: string) => {
    calendarDates.forEach(date => {
      setAvailabilityForDate(date, serviceId, { preference: preference as any });
    });
  };

  const saveAvailability = () => {
    // In real app, this would save to your API
    console.log('Saving availability:', availability);
    console.log('Saving preferences:', preferences);
    // Show success message
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability & Preferences</h1>
          <p className="text-gray-600">
            Submit your availability for {mockSchedulePeriod.name}
          </p>
          <div className="flex items-center mt-2 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
            <span>Deadline: {new Date(mockSchedulePeriod.availabilityDeadline).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button onClick={saveAvailability} className="bg-orange-500 hover:bg-orange-600">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'calendar', name: 'Calendar View', icon: CalendarDays },
            { id: 'preferences', name: 'General Preferences', icon: Settings },
            { id: 'constraints', name: 'Constraints', icon: Info },
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
            </button>
          ))}
        </nav>
      </div>

      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Service selector and legend */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Label>Select Service:</Label>
              <Select 
                value={selectedService?.toString() || ''} 
                onValueChange={(value) => setSelectedService(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
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

            {/* Legend */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 w-4 h-4 rounded flex items-center justify-center">
                  <Heart className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm">Prefer</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-500 w-4 h-4 rounded flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-yellow-500 w-4 h-4 rounded flex items-center justify-center">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm">Emergency Only</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-red-500 w-4 h-4 rounded flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm">Unavailable</span>
              </div>
            </div>
          </div>

          {selectedService && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: mockServices.find(s => s.id === selectedService)?.color }}
                    />
                    {mockServices.find(s => s.id === selectedService)?.name} Schedule
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Quick Apply:</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyToAllDates(selectedService, 'prefer')}
                      className="text-green-600 border-green-300"
                    >
                      All Prefer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyToAllDates(selectedService, 'available')}
                      className="text-blue-600 border-blue-300"
                    >
                      All Available
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyToAllDates(selectedService, 'unavailable')}
                      className="text-red-600 border-red-300"
                    >
                      All Unavailable
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {/* Day headers */}
                  {dayNames.map(day => (
                    <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                  
                  {/* Calendar grid */}
                  {calendarDates.map((date, index) => {
                    const avail = getAvailability(date, selectedService);
                    const weekend = isWeekend(date);
                    const isBlackout = preferences.blackoutDates.includes(date.toISOString().split('T')[0]);
                    
                    return (
                      <div
                        key={index}
                        className={`p-2 border rounded cursor-pointer hover:shadow-md transition-shadow ${
                          weekend ? 'bg-gray-50' : 'bg-white'
                        } ${isBlackout ? 'ring-2 ring-red-300' : ''}`}
                        onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                      >
                        <div className="text-sm font-medium text-center mb-2">
                          {date.getDate()}
                        </div>
                        
                        <div className="space-y-1">
                          <div 
                            className={`text-xs p-1 rounded text-center ${getPreferenceColor(avail.preference)}`}
                          >
                            <div className="flex items-center justify-center">
                              {getPreferenceIcon(avail.preference)}
                            </div>
                          </div>
                          
                          {avail.priority !== 3 && (
                            <div className="text-xs text-center text-gray-600">
                              P{avail.priority}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Date detail editor */}
          {selectedDate && selectedService && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Edit {new Date(selectedDate).toLocaleDateString()} - {mockServices.find(s => s.id === selectedService)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preference Level</Label>
                  <RadioGroup
                    value={getAvailability(new Date(selectedDate), selectedService).preference}
                    onValueChange={(value) => handleBulkUpdate(value)}
                    className="flex space-x-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="prefer" />
                      <Label className="text-green-600">Prefer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="available" />
                      <Label className="text-blue-600">Available</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="emergency_only" />
                      <Label className="text-yellow-600">Emergency Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unavailable" />
                      <Label className="text-red-600">Unavailable</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Priority (1-5)</Label>
                  <Slider
                    value={[getAvailability(new Date(selectedDate), selectedService).priority]}
                    onValueChange={([value]) => 
                      setAvailabilityForDate(new Date(selectedDate), selectedService, { priority: value })
                    }
                    min={1}
                    max={5}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    Current: {getAvailability(new Date(selectedDate), selectedService).priority}
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={getAvailability(new Date(selectedDate), selectedService).notes}
                    onChange={(e) => 
                      setAvailabilityForDate(new Date(selectedDate), selectedService, { notes: e.target.value })
                    }
                    placeholder="Add any notes about this assignment..."
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Scheduling Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Maximum Consecutive Days</Label>
                  <Input
                    type="number"
                    value={preferences.maxConsecutiveDays}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxConsecutiveDays: parseInt(e.target.value)
                    }))}
                    min={1}
                    max={14}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Maximum Weekends Per Month</Label>
                  <Input
                    type="number"
                    value={preferences.maxWeekendsPerMonth}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxWeekendsPerMonth: parseInt(e.target.value)
                    }))}
                    min={0}
                    max={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Maximum Shifts Per Week</Label>
                  <Input
                    type="number"
                    value={preferences.maxShiftsPerWeek}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxShiftsPerWeek: parseInt(e.target.value)
                    }))}
                    min={1}
                    max={7}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Minimum Rest Hours Between Shifts</Label>
                  <Input
                    type="number"
                    value={preferences.minRestHoursBetweenShifts}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      minRestHoursBetweenShifts: parseInt(e.target.value)
                    }))}
                    min={8}
                    max={24}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={preferences.preferBackToBackWeeks}
                    onCheckedChange={(checked) => setPreferences(prev => ({
                      ...prev,
                      preferBackToBackWeeks: checked as boolean
                    }))}
                  />
                  <Label>Prefer back-to-back weeks when possible</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={preferences.preferTwoWeeksInRow}
                    onCheckedChange={(checked) => setPreferences(prev => ({
                      ...prev,
                      preferTwoWeeksInRow: checked as boolean
                    }))}
                  />
                  <Label>Prefer two weeks in a row</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Preferred Services (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                {mockServices.map(service => (
                  <div key={service.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={preferences.preferredServices.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPreferences(prev => ({
                            ...prev,
                            preferredServices: [...prev.preferredServices, service.id]
                          }));
                        } else {
                          setPreferences(prev => ({
                            ...prev,
                            preferredServices: prev.preferredServices.filter(id => id !== service.id)
                          }));
                        }
                      }}
                    />
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: service.color }}
                      />
                      <Label>{service.name}</Label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferred Days Off</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Select your preferred days off (if possible)</Label>
              <div className="grid grid-cols-7 gap-2 mt-3">
                {dayNames.map((day, index) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      checked={preferences.preferredDaysOff.includes(index)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPreferences(prev => ({
                            ...prev,
                            preferredDaysOff: [...prev.preferredDaysOff, index]
                          }));
                        } else {
                          setPreferences(prev => ({
                            ...prev,
                            preferredDaysOff: prev.preferredDaysOff.filter(d => d !== index)
                          }));
                        }
                      }}
                    />
                    <Label className="text-sm">{day.slice(0, 3)}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Constraints Tab */}
      {activeTab === 'constraints' && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduling Constraints & Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">How the Algorithm Works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your preferences are weighted and combined with fairness considerations</li>
                <li>• "Prefer" assignments are heavily favored in the algorithm</li>
                <li>• Weekend and holiday shifts are distributed as evenly as possible</li>
                <li>• Consecutive day limits are strictly enforced</li>
                <li>• Emergency-only slots are only used when absolutely necessary</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Blackout dates (marked in red) will never be assigned</li>
                <li>• Priority levels help fine-tune when you're available vs preferred</li>
                <li>• The system tries to honor service preferences but may assign elsewhere if needed</li>
                <li>• All constraints can be overridden by administrators in emergency situations</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Swap Requests</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• You can request swaps after the schedule is published</li>
                <li>• The system will suggest potential swap partners based on availability</li>
                <li>• Both 2-way and 3-way swaps are supported</li>
                <li>• All swaps require approval from a scheduler or administrator</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}