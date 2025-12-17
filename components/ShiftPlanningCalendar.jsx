// components/ShiftPlanningCalendar.jsx
import { useState, useEffect, useMemo } from 'react';
import { 
  FiCalendar, FiClock, FiUser, FiPlus, FiEdit, FiTrash2, FiCheck, 
  FiX, FiDownload, FiUpload, FiFilter, FiChevronLeft, FiChevronRight,
  FiAlertCircle, FiBarChart2, FiDollarSign, FiMessageSquare
} from 'react-icons/fi';
import { showToast } from '@/lib/toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Shift Item Component
function SortableShiftItem({ shift, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: shift._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getShiftColor = (role) => {
    switch (role) {
      case 'chef': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'waiter': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'delivery': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`mb-2 p-3 rounded-lg border ${getShiftColor(shift.role)} cursor-move hover:shadow-md transition-shadow`}
      onClick={() => onEdit(shift)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{shift.startTime} - {shift.endTime}</div>
          <div className="text-xs opacity-75">{shift.role}</div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(shift.status)}`}>
          {shift.status}
        </span>
      </div>
      {shift.notes && (
        <div className="text-xs mt-2 truncate" title={shift.notes}>
          <FiMessageSquare className="inline w-3 h-3 mr-1" />
          {shift.notes}
        </div>
      )}
      <div className="text-xs mt-1">
        {shift.totalHours || (() => {
          // Calculate hours if not provided
          const start = parseInt(shift.startTime.split(':')[0]) + parseInt(shift.startTime.split(':')[1]) / 60;
          const end = parseInt(shift.endTime.split(':')[0]) + parseInt(shift.endTime.split(':')[1]) / 60;
          const total = end - start;
          return total > 0 ? total : total + 24;
        })()} hrs
        {shift.hourlyRate > 0 && (
          <span className="ml-2">${Math.round((shift.totalHours || 8) * shift.hourlyRate)}</span>
        )}
      </div>
    </div>
  );
}

export default function ShiftPlanningCalendar({ restaurant, employees, onEmployeeUpdate }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    employee: 'all'
  });
  const [stats, setStats] = useState({
    totalShifts: 0,
    confirmedShifts: 0,
    pendingShifts: 0,
    totalHours: 0,
    laborCost: 0
  });

  const shiftFormDefaults = {
    employeeId: '',
    role: 'waiter',
    shiftDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    shiftType: 'full_day',
    notes: '',
    location: 'Main Restaurant',
    breakDuration: 30,
    hourlyRate: 15
  };

  const [shiftForm, setShiftForm] = useState(shiftFormDefaults);

  // Set up sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate week range
  const weekDays = useMemo(() => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeek]);

  // Fetch shifts for the current week
  const fetchShifts = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      const startDate = new Date(weekDays[0]);
      const endDate = new Date(weekDays[6]);
      endDate.setHours(23, 59, 59);

      const params = new URLSearchParams({
        restaurantId: restaurant._id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (filters.role !== 'all') params.append('role', filters.role);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.employee !== 'all') params.append('employeeId', filters.employee);

      const response = await fetch(`/api/shifts?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setShifts(data.shifts || []);
        calculateStats(data.shifts || []);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      showToast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (shiftsData) => {
    const totalShifts = shiftsData.length;
    const confirmedShifts = shiftsData.filter(s => s.status === 'confirmed').length;
    const pendingShifts = shiftsData.filter(s => s.status === 'scheduled').length;
    
    const totalHours = shiftsData.reduce((sum, shift) => {
      if (shift.totalHours) return sum + shift.totalHours;
      // Calculate if not provided
      const start = parseInt(shift.startTime.split(':')[0]) + parseInt(shift.startTime.split(':')[1]) / 60;
      const end = parseInt(shift.endTime.split(':')[0]) + parseInt(shift.endTime.split(':')[1]) / 60;
      const total = end - start;
      return sum + (total > 0 ? total : total + 24);
    }, 0);
    
    const laborCost = shiftsData.reduce((sum, shift) => {
      const hours = shift.totalHours || 8; // Default 8 hours if not provided
      const rate = shift.hourlyRate || 15;
      return sum + (hours * rate);
    }, 0);

    setStats({
      totalShifts,
      confirmedShifts,
      pendingShifts,
      totalHours: Math.round(totalHours * 10) / 10,
      laborCost: Math.round(laborCost * 100) / 100
    });
  };

  // Handle form submission
  const handleSubmitShift = async (e) => {
    e.preventDefault();
    
    try {
      const method = selectedShift ? 'PUT' : 'POST';
      const url = selectedShift ? `/api/shifts/${selectedShift._id}` : '/api/shifts';
      
      const shiftData = {
        ...shiftForm,
        restaurantId: restaurant._id
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData)
      });

      if (response.ok) {
        const result = await response.json();
        showToast.success(result.message || 'Shift saved successfully');
        fetchShifts();
        setShowShiftModal(false);
        setSelectedShift(null);
        setShiftForm(shiftFormDefaults);
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Failed to save shift');
      }
    } catch (error) {
      console.error('Error saving shift:', error);
      showToast.error('Failed to save shift');
    }
  };

  // Handle shift deletion
  const handleDeleteShift = async (shiftId) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast.success('Shift deleted successfully');
        fetchShifts();
      } else {
        showToast.error('Failed to delete shift');
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      showToast.error('Failed to delete shift');
    }
  };

  // Handle shift status update
  const handleUpdateShiftStatus = async (shiftId, action) => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const result = await response.json();
        showToast.success(result.message);
        fetchShifts();
      }
    } catch (error) {
      console.error('Error updating shift status:', error);
      showToast.error('Failed to update shift');
    }
  };

  // Open shift modal for editing
  const openEditShift = (shift) => {
    setSelectedShift(shift);
    setShiftForm({
      employeeId: shift.employeeId?._id || shift.employeeId,
      role: shift.role,
      shiftDate: new Date(shift.shiftDate).toISOString().split('T')[0],
      startTime: shift.startTime,
      endTime: shift.endTime,
      shiftType: shift.shiftType || 'full_day',
      notes: shift.notes || '',
      location: shift.location || 'Main Restaurant',
      breakDuration: shift.breakDuration || 30,
      hourlyRate: shift.hourlyRate || 15
    });
    setShowShiftModal(true);
  };

  // Open shift modal for new shift on specific date
  const openNewShift = (date, employeeId = '') => {
    setSelectedShift(null);
    setShiftForm({
      ...shiftFormDefaults,
      shiftDate: date.toISOString().split('T')[0],
      employeeId: employeeId || ''
    });
    setShowShiftModal(true);
  };

  // Handle drag and drop end
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    // If dragging within the same container (reordering)
    if (active.id !== over.id) {
      // Find the shift being dragged
      const shift = shifts.find(s => s._id === active.id);
      if (!shift) return;

      // Get the target day cell (from over.id which should be day-{index}-employee-{id})
      const match = over.id.match(/day-(\d+)-employee-(.+)/);
      if (match) {
        const dayIndex = parseInt(match[1]);
        const employeeId = match[2];
        const newDate = weekDays[dayIndex];
        
        try {
          const response = await fetch(`/api/shifts/${shift._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shiftDate: newDate.toISOString(),
              employeeId: employeeId
            })
          });

          if (response.ok) {
            showToast.success('Shift moved successfully');
            fetchShifts();
          }
        } catch (error) {
          console.error('Error moving shift:', error);
          showToast.error('Failed to move shift');
        }
      }
    }
  };

  // Export shifts to CSV
  const exportShifts = () => {
    const csvContent = [
      ['Date', 'Employee', 'Role', 'Start Time', 'End Time', 'Hours', 'Status', 'Notes'],
      ...shifts.map(shift => [
        new Date(shift.shiftDate).toLocaleDateString(),
        shift.employeeName || `${shift.employeeId?.firstName} ${shift.employeeId?.lastName}`,
        shift.role,
        shift.startTime,
        shift.endTime,
        shift.totalHours || 8,
        shift.status,
        shift.notes || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Initialize
  useEffect(() => {
    if (restaurant) {
      fetchShifts();
    }
  }, [restaurant, currentWeek, filters]);

  return (
    <div className="p-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg mr-3">
              <FiCalendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Shifts</p>
              <p className="text-2xl font-bold">{stats.totalShifts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold">{stats.confirmedShifts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FiClock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold">{stats.totalHours}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <FiDollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Labor Cost</p>
              <p className="text-2xl font-bold">${stats.laborCost}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <FiAlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingShifts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const prevWeek = new Date(currentWeek);
              prevWeek.setDate(prevWeek.getDate() - 7);
              setCurrentWeek(prevWeek);
            }}
            className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
              {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <p className="text-sm text-gray-600">Week {Math.ceil((weekDays[0].getDate() + 6) / 7)}</p>
          </div>
          
          <button
            onClick={() => {
              const nextWeek = new Date(currentWeek);
              nextWeek.setDate(nextWeek.getDate() + 7);
              setCurrentWeek(nextWeek);
            }}
            className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Today
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Roles</option>
            <option value="chef">Chefs</option>
            <option value="waiter">Waiters</option>
            <option value="delivery">Delivery</option>
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
          </select>
          
          <button
            onClick={() => openNewShift(new Date())}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600"
          >
            <FiPlus className="w-4 h-4" />
            New Shift
          </button>
          
          <button
            onClick={exportShifts}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header with days */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-4 font-semibold text-gray-700">Employee</div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-4 text-center border-l border-gray-200">
                <div className="font-semibold text-gray-900">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${
                  day.toDateString() === new Date().toDateString() 
                    ? 'text-amber-600' 
                    : 'text-gray-700'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Employees and shifts */}
          <div className="max-h-[600px] overflow-y-auto">
            {employees.map((employee) => (
              <div key={employee._id} className="grid grid-cols-8 border-b border-gray-200 hover:bg-gray-50">
                {/* Employee info */}
                <div className="p-4 border-r border-gray-200">
                  <div className="flex items-center gap-3">
                    {employee.avatar ? (
                      <img
                        src={employee.avatar}
                        alt={employee.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                      <div className="text-sm text-gray-600 capitalize">{employee.role}</div>
                    </div>
                  </div>
                </div>

                {/* Shifts for each day */}
                {weekDays.map((day, dayIndex) => {
                  const dayShifts = shifts.filter(shift => {
                    const shiftDate = new Date(shift.shiftDate).toDateString();
                    const currentDay = day.toDateString();
                    return (
                      shift.employeeId?._id === employee._id || 
                      shift.employeeId === employee._id
                    ) && shiftDate === currentDay;
                  });

                  return (
                    <div
                      key={`${employee._id}-${dayIndex}`}
                      data-droppable-id={`day-${dayIndex}-employee-${employee._id}`}
                      className="p-2 border-r border-gray-200 min-h-[100px] relative"
                    >
                      <SortableContext
                        items={dayShifts.map(s => s._id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {dayShifts.map((shift) => (
                          <SortableShiftItem
                            key={shift._id}
                            shift={shift}
                            onEdit={openEditShift}
                            onDelete={handleDeleteShift}
                          />
                        ))}
                      </SortableContext>
                      
                      {/* Add shift button */}
                      <button
                        onClick={() => openNewShift(day, employee._id)}
                        className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-amber-600"
                        title="Add shift"
                      >
                        <FiPlus className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DndContext>

{/* Shift Modal */}
{showShiftModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl lg:max-w-4xl max-h-[90vh] lg:max-h-[85vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {selectedShift ? 'Edit Shift' : 'Create New Shift'}
          </h3>
          <button
            onClick={() => {
              setShowShiftModal(false);
              setSelectedShift(null);
              setShiftForm(shiftFormDefaults);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmitShift} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All your form fields remain the same */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              <select
                value={shiftForm.employeeId}
                onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={shiftForm.role}
                onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              >
                <option value="chef">Chef</option>
                <option value="waiter">Waiter</option>
                <option value="delivery">Delivery Person</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={shiftForm.shiftDate}
                onChange={(e) => setShiftForm({ ...shiftForm, shiftDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Type
              </label>
              <select
                value={shiftForm.shiftType}
                onChange={(e) => setShiftForm({ ...shiftForm, shiftType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="morning">Morning (6AM-2PM)</option>
                <option value="afternoon">Afternoon (2PM-10PM)</option>
                <option value="evening">Evening (5PM-1AM)</option>
                <option value="night">Night (10PM-6AM)</option>
                <option value="full_day">Full Day (9AM-5PM)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shiftForm.hourlyRate}
                onChange={(e) => setShiftForm({ ...shiftForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={shiftForm.breakDuration}
                onChange={(e) => setShiftForm({ ...shiftForm, breakDuration: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={shiftForm.location}
              onChange={(e) => setShiftForm({ ...shiftForm, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Main Restaurant, Kitchen, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={shiftForm.notes}
              onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Special instructions, requirements, etc."
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowShiftModal(false);
                setSelectedShift(null);
                setShiftForm(shiftFormDefaults);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {selectedShift && (
              <button
                type="button"
                onClick={() => handleDeleteShift(selectedShift._id)}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            )}
            
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600"
            >
              {selectedShift ? 'Update Shift' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
    </div>
  );
}