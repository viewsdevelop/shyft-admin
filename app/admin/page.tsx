'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft, X, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Agent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface Campaign {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface CampaignAgent {
  id: number;
  agent_id: number;
  campaign_id: number;
  agent_name: string;
  campaign_name: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assignments, setAssignments] = useState<CampaignAgent[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    is_active: true,
  });

  useEffect(() => {
    fetchAgents();
    fetchCampaigns();
    fetchAssignments();
  }, [pagination.page, pagination.limit]);

  const fetchAgents = async () => {
    const res = await fetch(`/api/agents?page=${pagination.page}&limit=${pagination.limit}`);
    const data = await res.json();
    setAgents(data.data || []);
    setPagination(prev => ({
      ...prev,
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 0,
    }));
  };

  const fetchCampaigns = async () => {
    const res = await fetch('/api/campaigns');
    const data = await res.json();
    setCampaigns(data);
  };

  const fetchAssignments = async () => {
    const res = await fetch('/api/campaign-agents');
    const data = await res.json();
    setAssignments(data);
  };

  const handleCreateAgent = async () => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentForm),
      });
      if (res.ok) {
        fetchAgents();
        setIsAgentDialogOpen(false);
        setAgentForm({ first_name: '', last_name: '', email: '', is_active: true });
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentForm({
      first_name: agent.first_name,
      last_name: agent.last_name,
      email: agent.email,
      is_active: agent.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;
    try {
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedAgent, ...agentForm }),
      });
      if (res.ok) {
        fetchAgents();
        setIsEditDialogOpen(false);
        setSelectedAgent(null);
        setAgentForm({ first_name: '', last_name: '', email: '', is_active: true });
      }
    } catch (error) {
      console.error('Error updating agent:', error);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...agent, is_active: !agent.is_active }),
      });
      if (res.ok) {
        fetchAgents();
      }
    } catch (error) {
      console.error('Error updating agent:', error);
    }
  };

  const handleDeleteAgent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      const res = await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAgents();
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleCreateAssignment = async (agentId: number, campaignId: number) => {
    try {
      const res = await fetch('/api/campaign-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, campaign_id: campaignId }),
      });
      if (res.ok) {
        fetchAssignments();
        setIsAssignmentDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    try {
      const res = await fetch(`/api/campaign-agents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const getAgentAssignments = (agentId: number) => {
    return assignments.filter(a => a.agent_id === agentId);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          </div>
          <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Agent</DialogTitle>
                <DialogDescription>
                  Create a new agent profile
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={agentForm.first_name}
                    onChange={(e) => setAgentForm({ ...agentForm, first_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={agentForm.last_name}
                    onChange={(e) => setAgentForm({ ...agentForm, last_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={agentForm.email}
                    onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={agentForm.is_active}
                    onChange={(e) => setAgentForm({ ...agentForm, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateAgent}>Create Agent</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agents</CardTitle>
            <CardDescription>
              Manage agents and their campaign assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Campaigns</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No agents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((agent) => {
                      const agentAssignments = getAgentAssignments(agent.id);
                      return (
                        <TableRow key={agent.id}>
                          <TableCell className="font-medium">
                            {agent.first_name} {agent.last_name}
                          </TableCell>
                          <TableCell>{agent.email}</TableCell>
                          <TableCell>
                            <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                              {agent.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {agentAssignments.slice(0, 2).map((assignment) => (
                                <Badge key={assignment.id} variant="outline" className="text-xs">
                                  {assignment.campaign_name}
                                </Badge>
                              ))}
                              {agentAssignments.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{agentAssignments.length - 2} more
                                </Badge>
                              )}
                              {agentAssignments.length === 0 && (
                                <span className="text-sm text-muted-foreground">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(agent.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(agent)}>
                                  {agent.is_active ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <Dialog open={isAssignmentDialogOpen && selectedAgent?.id === agent.id} onOpenChange={(open) => {
                                  setIsAssignmentDialogOpen(open);
                                  if (!open) setSelectedAgent(null);
                                }}>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => {
                                      e.preventDefault();
                                      setSelectedAgent(agent);
                                      setIsAssignmentDialogOpen(true);
                                    }}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Assign Campaign
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Assign Campaign</DialogTitle>
                                      <DialogDescription>
                                        Assign a campaign to {agent.first_name} {agent.last_name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <Select
                                        onValueChange={(value) => {
                                          handleCreateAssignment(agent.id, parseInt(value));
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a campaign" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {campaigns
                                            .filter(c => c.is_active)
                                            .filter(c => !agentAssignments.some(a => a.campaign_id === c.id))
                                            .map((campaign) => (
                                              <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                                {campaign.name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteAgent(agent.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} agents
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Agent Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update agent information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={agentForm.first_name}
                  onChange={(e) => setAgentForm({ ...agentForm, first_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={agentForm.last_name}
                  onChange={(e) => setAgentForm({ ...agentForm, last_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={agentForm.email}
                  onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={agentForm.is_active}
                  onChange={(e) => setAgentForm({ ...agentForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit_is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAgent}>Update Agent</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
