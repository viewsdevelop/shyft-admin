'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ArrowLeft, Trophy, TrendingUp, Calendar, Clock, Target, ChevronsUpDown, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

interface KPI {
  period: string;
  total_hours: number;
  work_days: number;
}

interface Campaign {
  id: number;
  name: string;
  description: string;
}

interface Agent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function CustomerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentParam = searchParams.get('agentId');
  const agentId = agentParam ? parseInt(agentParam, 10) : null;
  const [kpis, setKpis] = useState<{ [key: string]: KPI[] }>({});
  const [agent, setAgent] = useState<Agent | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [logForm, setLogForm] = useState({
    hours: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [logStatus, setLogStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    if (!agentId) {
      return;
    }
    fetchAgent(agentId);
    fetchCampaigns(agentId);
  }, [agentId]);
  const fetchAgent = async (id: number) => {
    const res = await fetch(`/api/agents?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setAgent(data);
    }
  };


  useEffect(() => {
    if (agentId && selectedCampaign) {
      fetchKPIs('day', selectedCampaign, agentId);
      fetchKPIs('week', selectedCampaign, agentId);
      fetchKPIs('month', selectedCampaign, agentId);
    }
  }, [selectedCampaign, agentId]);

  const fetchCampaigns = async (currentAgentId: number) => {
    const res = await fetch(`/api/campaigns?agentId=${currentAgentId}`);
    const data = await res.json();
    setCampaigns(data);

    if (!data.length) {
      setSelectedCampaign(null);
      setKpis({});
      return;
    }

    setSelectedCampaign((prev) => {
      if (prev && data.some((campaign: Campaign) => campaign.id === prev)) {
        return prev;
      }
      return data[0].id;
    });
  };

  const fetchKPIs = async (period: 'day' | 'week' | 'month', campaignId: number, currentAgentId: number) => {
    const res = await fetch(
      `/api/kpi?campaignId=${campaignId}&agentId=${currentAgentId}&groupBy=${period}`
    );
    const data = await res.json();
    setKpis(prev => ({ ...prev, [period]: data }));
    
    if (period === 'day') {
      const total = data.reduce((sum: number, kpi: KPI) => sum + kpi.total_hours, 0);
      setTotalHours(total);
      const newLevel = Math.floor(total / 10) + 1;
      const newXp = ((total % 10) * 10).toFixed(1);
      setLevel(newLevel);
      setXp(Number(newXp));
    }
  };

  const formatChartData = (data: KPI[], period: 'day' | 'week' | 'month') => {
    return data.map(kpi => {
      let label = kpi.period;
      if (period === 'day') {
        try {
          label = format(parseISO(kpi.period), 'MMM dd');
        } catch {
          label = kpi.period;
        }
      } else if (period === 'week') {
        label = `Week ${kpi.period.split('-W')[1]}`;
      } else if (period === 'month') {
        try {
          label = format(parseISO(kpi.period + '-01'), 'MMM yyyy');
        } catch {
          label = kpi.period;
        }
      }
      return {
        period: label,
        hours: parseFloat(kpi.total_hours.toFixed(2)),
        days: kpi.work_days,
      };
    }).reverse();
  };

  const getCurrentStreak = () => {
    if (!kpis.day || kpis.day.length === 0) return 0;
    const sorted = [...kpis.day].sort((a, b) => b.period.localeCompare(a.period));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sorted.length; i++) {
      const kpiDate = new Date(sorted[i].period);
      kpiDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - kpiDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === i && sorted[i].total_hours > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getAchievements = () => {
    const achievements = [];
    if (totalHours >= 100) achievements.push({ name: 'Centurion', icon: '🏆', desc: '100+ hours worked' });
    if (totalHours >= 50) achievements.push({ name: 'Half Century', icon: '⭐', desc: '50+ hours worked' });
    if (getCurrentStreak() >= 7) achievements.push({ name: 'Week Warrior', icon: '🔥', desc: '7+ day streak' });
    if (level >= 5) achievements.push({ name: 'Level Master', icon: '👑', desc: 'Level 5+' });
    return achievements;
  };

  const chartData = kpis[groupBy] ? formatChartData(kpis[groupBy], groupBy) : [];
  const streak = getCurrentStreak();
  const achievements = getAchievements();

  if (!agentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <CardTitle>Agent Login Required</CardTitle>
            <CardDescription>
              Please enter through the main page with your work email to view your personalized dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/')}>
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-gray-900">
                Customer Dashboard
              </h1>
              {agent && (
                <p className="text-lg text-muted-foreground">
                  {agent.first_name} {agent.last_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gamification Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Trophy className="h-12 w-12" />
                  </motion.div>
                  <div>
                    <div className="text-sm opacity-90">Level {level}</div>
                    <div className="text-2xl font-bold">{xp}/100 XP</div>
                    <div className="w-48 bg-white/20 rounded-full h-2 mt-2">
                      <motion.div
                        className="bg-white rounded-full h-2"
                        initial={{ width: 0 }}
                        animate={{ width: `${xp}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-sm opacity-90">Total Hours</div>
                    <div className="text-3xl font-bold">{totalHours.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Current Streak</div>
                    <div className="text-3xl font-bold flex items-center gap-1">
                      {streak} <span className="text-2xl">🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.name}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1, type: 'spring' }}
                      className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200"
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <div className="font-semibold">{achievement.name}</div>
                        <div className="text-xs text-gray-600">{achievement.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Campaign Selector */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Campaign</CardTitle>
              <CardDescription>Use the dropdown to switch between campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-muted-foreground">No campaigns have been assigned to you yet.</p>
              ) : (
                <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={campaignPopoverOpen}
                      className="w-full md:w-1/2 justify-between bg-white"
                    >
                      {selectedCampaign
                        ? campaigns.find((campaign) => campaign.id === selectedCampaign)?.name ?? 'Select campaign'
                        : 'Select campaign'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                    <Command>
                      <CommandInput placeholder="Search campaigns..." className="h-10" />
                      <CommandList>
                        <CommandEmpty>No campaign found.</CommandEmpty>
                        <CommandGroup>
                          {campaigns.map((campaign) => (
                            <CommandItem
                              key={campaign.id}
                              value={campaign.name}
                              onSelect={() => {
                                setSelectedCampaign(campaign.id);
                                setCampaignPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedCampaign === campaign.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {campaign.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Log Hours</CardTitle>
              <CardDescription>Add new work sessions to keep your KPIs up-to-date</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No campaigns available. Once a campaign is assigned to you, you'll be able to log hours here.
                </p>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedCampaign || !agentId) return;
                    const hoursValue = parseFloat(logForm.hours);
                    if (Number.isNaN(hoursValue) || hoursValue <= 0) {
                      setLogStatus({ type: 'error', message: 'Please enter a valid number of hours.' });
                      return;
                    }
                    if (!logForm.date) {
                      setLogStatus({ type: 'error', message: 'Please select a date.' });
                      return;
                    }
                    setLogLoading(true);
                    setLogStatus(null);
                    try {
                      const res = await fetch('/api/kpi', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          campaignId: selectedCampaign,
                          agentId,
                          hoursWorked: hoursValue,
                          workDate: logForm.date,
                        }),
                      });

                      if (!res.ok) {
                        throw new Error('Unable to log hours');
                      }

                      await fetchKPIs('day', selectedCampaign, agentId);
                      await fetchKPIs('week', selectedCampaign, agentId);
                      await fetchKPIs('month', selectedCampaign, agentId);

                      setLogStatus({ type: 'success', message: 'Hours logged successfully!' });
                      setLogForm((prev) => ({ ...prev, hours: '' }));
                    } catch (error) {
                      setLogStatus({ type: 'error', message: 'Unable to log hours. Please try again.' });
                    } finally {
                      setLogLoading(false);
                    }
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours Worked</Label>
                      <Input
                        id="hours"
                        type="number"
                        step="0.25"
                        min="0"
                        placeholder="e.g. 6.5"
                        value={logForm.hours}
                        onChange={(e) => setLogForm((prev) => ({ ...prev, hours: e.target.value }))}
                        disabled={logLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={logForm.date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setLogForm((prev) => ({ ...prev, date: e.target.value }))}
                        disabled={logLoading}
                      />
                    </div>
                  </div>
                  {logStatus && (
                    <p
                      className={cn(
                        'text-sm',
                        logStatus.type === 'success' ? 'text-green-600' : 'text-destructive'
                      )}
                    >
                      {logStatus.message}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={logLoading || !selectedCampaign}>
                    {logLoading ? 'Logging...' : 'Log Hours'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* KPI Charts */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hours Worked</CardTitle>
            <CardDescription>Track your work hours by different time periods</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as 'day' | 'week' | 'month')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day">
                  <Calendar className="h-4 w-4 mr-2" />
                  Daily
                </TabsTrigger>
                <TabsTrigger value="week">
                  <Calendar className="h-4 w-4 mr-2" />
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="month">
                  <Calendar className="h-4 w-4 mr-2" />
                  Monthly
                </TabsTrigger>
              </TabsList>

              <TabsContent value="day" className="mt-6">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No data available for daily view
                  </div>
                )}
              </TabsContent>

              <TabsContent value="week" className="mt-6">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No data available for weekly view
                  </div>
                )}
              </TabsContent>

              <TabsContent value="month" className="mt-6">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#ec4899" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No data available for monthly view
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Daily Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpis.day && kpis.day.length > 0
                    ? (kpis.day.reduce((sum, kpi) => sum + kpi.total_hours, 0) / kpis.day.length).toFixed(2)
                    : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Based on recent data</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpis.week && kpis.week.length > 0
                    ? kpis.week[0].total_hours.toFixed(2)
                    : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Current week</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpis.month && kpis.month.length > 0
                    ? kpis.month[0].total_hours.toFixed(2)
                    : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Current month</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

