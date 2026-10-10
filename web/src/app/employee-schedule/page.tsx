"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Calendar, Clock, Plus } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { authHeaders } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { roleLevelOf } from "@/lib/permissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Shift {
  id: string;
  userId: string;
  userName: string;
  day: string;
  startTime: string;
  endTime: string;
  roleLabel: string;
}

interface TeamMember {
  id: string;
  name: string;
  role?: { name: string };
}

export default function EmployeeSchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { currentUser } = useAppStore();
  const isManager = roleLevelOf(currentUser) <= 2;

  // New shift state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const fetchShifts = async () => {
    const res = await fetch('/api/shifts', { headers: authHeaders() });
    if (res.ok) {
      setShifts(await res.json());
    }
  };

  const fetchTeam = async () => {
    const res = await fetch('/api/team', { headers: authHeaders() });
    if (res.ok) {
      setTeamMembers(await res.json());
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchTeam();
  }, []);

  const handleCreateShift = async () => {
    if (!selectedUserId) {
      toast.add({ type: "error", title: "Error", description: "Please select an employee" });
      return;
    }

    const employee = teamMembers.find(m => m.id === selectedUserId);
    if (!employee) return;

    const res = await fetch('/api/shifts', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        userId: employee.id,
        userName: employee.name,
        day: selectedDay,
        startTime,
        endTime,
        roleLabel: employee.role?.name || "Staff"
      })
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Success", description: "Shift created successfully" });
      fetchShifts();
    } else {
      toast.add({ type: "error", title: "Error", description: "Failed to create shift" });
    }
  };

  const handleDeleteShift = async (id: string) => {
    const res = await fetch(`/api/shifts/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    if (res.ok) {
      toast.add({ type: "success", title: "Deleted", description: "Shift deleted" });
      fetchShifts();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading">Employee Scheduler</h1>
      </div>

      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Assign New Shift</CardTitle>
            <CardDescription>Schedule an employee for an upcoming shift.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Employee</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Day</label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Start Time</label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">End Time</label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              <Button onClick={handleCreateShift} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {daysOfWeek.map(day => (
          <div key={day} className="flex flex-col gap-2">
            <h3 className="font-bold text-center border-b-2 border-black pb-2">{day}</h3>
            {shifts.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime)).map(shift => (
              <Card key={shift.id} className="p-3 text-sm bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] border-2 border-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold truncate" title={shift.userName}>{shift.userName}</span>
                  {isManager && (
                    <button onClick={() => handleDeleteShift(shift.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center text-muted-foreground text-xs mb-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {shift.startTime} - {shift.endTime}
                </div>
                <div className="inline-block bg-main/20 text-main-foreground px-2 py-0.5 rounded text-xs font-semibold mt-1">
                  {shift.roleLabel}
                </div>
              </Card>
            ))}
            {shifts.filter(s => s.day === day).length === 0 && (
              <div className="text-center text-muted-foreground text-xs py-4 italic">No shifts</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

