'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Textarea } from '@/components/UI/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/Select';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { Switch } from '@/components/UI/Switch';
import { Label } from '@/components/UI/Label';
import { toast } from 'react-hot-toast';
import { X, Users, Lock, Globe, Calendar, FolderKanban, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

const TEAM_MEMBERS = [
  { id: '1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/01.png' },
  { id: '2', name: 'Taylor Swift', email: 'taylor@example.com', avatar: '/avatars/02.png' },
  { id: '3', name: 'Chris Lee', email: 'chris@example.com', avatar: '/avatars/03.png' },
  { id: '4', name: 'Jordan Smith', email: 'jordan@example.com', avatar: '/avatars/04.png' },
  { id: '5', name: 'Morgan Brown', email: 'morgan@example.com', avatar: '/avatars/05.png' },
];

const PROJECT_TEMPLATES = [
  { id: 'blank', name: 'Blank Project', description: 'Start from scratch', icon: '📋' },
  { id: 'software', name: 'Software Development', description: 'Agile development workflow', icon: '💻' },
  { id: 'marketing', name: 'Marketing Campaign', description: 'Campaign planning template', icon: '📈' },
  { id: 'design', name: 'Design Project', description: 'Design sprint workflow', icon: '🎨' },
  { id: 'research', name: 'Research Project', description: 'Research and analysis template', icon: '🔬' },
];

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: 'blank',
    visibility: 'private',
    color: '#3b82f6',
    startDate: '',
    endDate: '',
    enableKanban: true,
    enableChat: true,
    enableDocs: true,
    teamMembers: [] as string[],
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTeamMemberToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(memberId)
        ? prev.teamMembers.filter(id => id !== memberId)
        : [...prev.teamMembers, memberId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newProject = {
        id: `project-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        template: formData.template,
        visibility: formData.visibility,
        color: formData.color,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        endDate: formData.endDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'current-user-id',
        teamMembers: formData.teamMembers,
        features: {
          kanban: formData.enableKanban,
          chat: formData.enableChat,
          docs: formData.enableDocs,
        },
        progress: 0,
        status: 'active' as const,
        isStarred: false,
        tasks: {
          total: 0,
          completed: 0,
          pending: 0,
        },
      };

      onProjectCreated(newProject);
      toast.success('Project created successfully!');
      handleClose();
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      template: 'blank',
      visibility: 'private',
      color: '#3b82f6',
      startDate: '',
      endDate: '',
      enableKanban: true,
      enableChat: true,
      enableDocs: true,
      teamMembers: [],
    });
    onClose();
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />
        
        <div className="relative z-10 w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
              <p className="text-sm text-gray-500">Step {step} of 3</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-4">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex flex-col items-center">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2",
                      step >= stepNum 
                        ? "border-blue-600 bg-blue-600 text-white" 
                        : "border-gray-300 text-gray-400"
                    )}>
                      {stepNum}
                    </div>
                    <span className="mt-2 text-xs font-medium text-gray-600">
                      {stepNum === 1 && 'Basic Info'}
                      {stepNum === 2 && 'Team & Settings'}
                      {stepNum === 3 && 'Features'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative mt-2">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-300" />
                <div 
                  className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-300"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="mb-2 block">Project Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter project name"
                      className="w-full"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="mb-2 block">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your project..."
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="mb-2 block">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="mb-2 block">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="template" className="mb-2 block">Template</Label>
                    <Select
                      value={formData.template}
                      onValueChange={(value) => handleInputChange('template', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TEMPLATES.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <span>{template.icon}</span>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-xs text-gray-500">{template.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Team & Settings */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label className="mb-4 block">Project Visibility</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleInputChange('visibility', 'private')}
                        className={cn(
                          "flex flex-col items-center rounded-lg border-2 p-4 transition-all",
                          formData.visibility === 'private'
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Lock className="mb-2 h-6 w-6 text-gray-600" />
                        <span className="font-medium">Private</span>
                        <span className="mt-1 text-sm text-gray-500">Only team members can access</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('visibility', 'public')}
                        className={cn(
                          "flex flex-col items-center rounded-lg border-2 p-4 transition-all",
                          formData.visibility === 'public'
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Globe className="mb-2 h-6 w-6 text-gray-600" />
                        <span className="font-medium">Public</span>
                        <span className="mt-1 text-sm text-gray-500">Visible to everyone</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-4 block">Add Team Members</Label>
                    <div className="space-y-2">
                      {TEAM_MEMBERS.map((member) => (
                        <div
                          key={member.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 transition-all",
                            formData.teamMembers.includes(member.id)
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar src={member.avatar} alt={member.name} />
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                          <Switch
                            checked={formData.teamMembers.includes(member.id)}
                            onCheckedChange={() => handleTeamMemberToggle(member.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="color" className="mb-2 block">Project Color</Label>
                    <div className="flex gap-2">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleInputChange('color', color)}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 transition-transform",
                            formData.color === color ? "scale-110 border-gray-900" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Features */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <FolderKanban className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Kanban Board</div>
                          <div className="text-sm text-gray-500">Visual task management with drag & drop</div>
                        </div>
                      </div>
                      <Switch
                        checked={formData.enableKanban}
                        onCheckedChange={(checked) => handleInputChange('enableKanban', checked)}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-100 p-2">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Team Chat</div>
                          <div className="text-sm text-gray-500">Real-time messaging and collaboration</div>
                        </div>
                      </div>
                      <Switch
                        checked={formData.enableChat}
                        onCheckedChange={(checked) => handleInputChange('enableChat', checked)}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-100 p-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Documentation</div>
                          <div className="text-sm text-gray-500">Shared docs and knowledge base</div>
                        </div>
                      </div>
                      <Switch
                        checked={formData.enableDocs}
                        onCheckedChange={(checked) => handleInputChange('enableDocs', checked)}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="mb-2 font-medium text-gray-900">Summary</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Project:</span>
                        <span className="font-medium">{formData.name || 'Untitled'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Visibility:</span>
                        <Badge variant={formData.visibility === 'private' ? 'secondary' : 'outline'}>
                          {formData.visibility === 'private' ? 'Private' : 'Public'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Team Members:</span>
                        <span>{formData.teamMembers.length} selected</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
                <div>
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.name.trim() || isLoading}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading || !formData.name.trim()}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Project
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}