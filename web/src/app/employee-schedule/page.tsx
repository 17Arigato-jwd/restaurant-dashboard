"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, Clock, Plus, PlaneTakeoff } from "lucide-react";
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

interface RoleInfo {
  id: string;
  name: string;
  level: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatarUrl?: string;
  status?: string;
  role?: RoleInfo;
  dishSpecialty?: string;
  weeklySchedule?: string;
  leaveStatus?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const LEAVE_OPTIONS = [
  { value: "__none__", label: "No leave filed" },
  { value: "Pending", label: "Leave pending" },
  { value: "Approved", label: "Leave approved" },
];

/** Treats an empty/placeholder leave value as "no leave filed". */
const hasLeave = (member?: TeamMember | null) => {
  const status = (member?.leaveStatus || "").trim().toLowerCase();
  return status.length > 0 && status !== "none" && status !== "not applied";
};

export default function EmployeeSchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const { currentUser } = useAppStore();
  const isManager = (roleLevelOf(currentUser) ?? 99) <= 2;

  // New shift state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchShifts();
    fetchTeam();
  }, []);

  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId) || null;
  const memberShifts = selectedMember ? shifts.filter((s) => s.userId === selectedMember.id) : [];
  const memberOnLeave = hasLeave(selectedMember);

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

  const handleLeaveChange = async (value: string) => {
    if (!selectedMember) return;
    const leaveStatus = value === "__none__" ? "" : value;
    const res = await fetch(`/api/team/${selectedMember.id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ leaveStatus }),
    });
    if (res.ok) {
      toast.add({
        type: "success",
        title: "Leave updated",
        description: leaveStatus ? `${selectedMember.name}: ${leaveStatus}` : `${selectedMember.name} has no leave filed.`,
      });
      fetchTeam();
    } else {
      toast.add({ type: "error", title: "Error", description: "Failed to update leave status" });
    }
  };

  const memberLeave = (userId: string) => hasLeave(teamMembers.find((m) => m.id === userId));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading">Employee Scheduler</h1>
          <p className="text-muted-foreground mt-1">Inspect each team member and manage their weekly shifts and leave.</p>
        </div>
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
                <Select value={selectedUserId} onValueChange={(value) => setSelectedUserId(value ?? "")}>
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
                <Select value={selectedDay} onValueChange={(value) => setSelectedDay(value ?? "")}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => (
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

      {/* Member roster + selected member detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
            <CardDescription>Select a member to view details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic p-4 text-center border-2 border-dashed rounded-base">
                No team members yet.
              </p>
            ) : teamMembers.map((member) => {
              const onLeave = hasLeave(member);
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-base border-2 text-left transition-colors ${
                    selectedMemberId === member.id ? 'border-black bg-main/10' : 'border-transparent hover:bg-muted/50'
                  }`}
                >
                  <Avatar className="size-10 shrink-0 border-2 border-black">
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : (
                      <AvatarFallback className="bg-main text-main-foreground font-bold text-sm">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate">{member.name}</span>
                      {onLeave && (
                        <Badge variant="outline" className="bg-amber-100 border-amber-400 text-amber-800 text-[10px] shrink-0">
                          <PlaneTakeoff className="w-3 h-3 mr-1" /> {member.leaveStatus}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{member.role?.name || 'Staff'}</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" /> Weekly Schedule
            </CardTitle>
            <CardDescription>
              {selectedMember ? `Live shifts for ${selectedMember.name}` : "Select a team member to view their week."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedMember ? (
              <p className="text-sm text-muted-foreground italic p-8 text-center border-2 border-dashed rounded-base">
                No member selected.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Member details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border-2 border-black rounded-base shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">Role</h5>
                    <p className="font-semibold">{selectedMember.role?.name || 'Staff'}</p>
                  </div>
                  <div className="p-4 border-2 border-black rounded-base shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</h5>
                    <p className="font-semibold break-all">{selectedMember.email}</p>
                  </div>
                  <div className="p-4 border-2 border-black rounded-base shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">Dish Specialty</h5>
                    <p className="font-semibold">{selectedMember.dishSpecialty || "Not specified"}</p>
                  </div>
                  <div className={`p-4 border-2 rounded-base shadow-[2px_2px_0px_rgba(0,0,0,1)] ${memberOnLeave ? 'border-amber-500 bg-amber-50' : 'border-black'}`}>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">Leave Status</h5>
                    <p className={`font-semibold ${memberOnLeave ? 'text-amber-800' : ''}`}>
                      {memberOnLeave ? selectedMember.leaveStatus : "No leave filed"}
                    </p>
                  </div>
                </div>

                {memberOnLeave && (
                  <div className="flex items-start gap-3 p-4 border-2 border-amber-500 bg-amber-50 rounded-base">
                    <PlaneTakeoff className="w-5 h-5 text-amber-700 mt-0.5" />
                    <p className="text-sm font-semibold text-amber-900">
                      {selectedMember.name} has filed for leave ({selectedMember.leaveStatus}). Shifts below are flagged for coverage.
                    </p>
                  </div>
                )}

                {isManager && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold">Update leave</label>
                    <Select
                      value={memberOnLeave ? (selectedMember.leaveStatus || "__none__") : "__none__"}
                      onValueChange={(value) => handleLeaveChange(value ?? "__none__")}
                    >
                      <SelectTrigger className="bg-white w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAVE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Week schedule */}
                <div className="border-2 border-black rounded-base overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b-2 border-black text-sm uppercase">
                        <th className="p-3 font-bold border-r-2 border-black">Day</th>
                        <th className="p-3 font-bold border-r-2 border-black">Shift Time</th>
                        <th className="p-3 font-bold">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black">
                      {DAYS.map(day => {
                        const dayShifts = memberShifts.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                        return (
                          <tr key={day} className={dayShifts.length > 0 && memberOnLeave ? 'bg-amber-50/60' : 'hover:bg-muted/20'}>
                            <td className="p-3 font-semibold border-r-2 border-black w-1/4">{day}</td>
                            <td className="p-3 border-r-2 border-black">
                              {dayShifts.length > 0 ? (
                                <div className="space-y-2">
                                  {dayShifts.map(s => (
                                    <div
                                      key={s.id}
                                      className={`flex items-center text-sm font-mono px-2 py-1 rounded border-2 w-max ${
                                        memberOnLeave ? 'bg-amber-100 border-amber-400' : 'bg-blue-50 border-blue-200'
                                      }`}
                                    >
                                      <Clock className="w-3 h-3 mr-2" /> {s.startTime} - {s.endTime}
                                      {memberOnLeave && <span className="ml-2 text-[10px] font-bold uppercase text-amber-800">on leave</span>}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-sm">Off</span>
                              )}
                            </td>
                            <td className="p-3">
                              {dayShifts.length > 0 ? (
                                <div className="space-y-2">
                                  {dayShifts.map(s => (
                                    <div key={s.id} className="text-sm font-semibold">{s.roleLabel}</div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full weekly board */}
      <div>
        <h2 className="text-xl font-bold mb-3">All Shifts This Week</h2>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS.map(day => (
            <div key={day} className="flex flex-col gap-2">
              <h3 className="font-bold text-center border-b-2 border-black pb-2">{day}</h3>
              {shifts.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime)).map(shift => {
                const onLeave = memberLeave(shift.userId);
                return (
                  <Card
                    key={shift.id}
                    className={`p-3 text-sm border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all ${onLeave ? 'bg-amber-50 border-amber-500' : 'bg-white border-black'}`}
                  >
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
                    {onLeave && (
                      <div className="mt-2 text-[10px] font-bold uppercase text-amber-800 flex items-center">
                        <PlaneTakeoff className="w-3 h-3 mr-1" /> On leave
                      </div>
                    )}
                  </Card>
                );
              })}
              {shifts.filter(s => s.day === day).length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-4 italic">No shifts</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
