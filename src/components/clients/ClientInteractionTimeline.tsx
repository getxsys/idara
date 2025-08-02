'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  FileText,
  Video,
  Users,
  Filter,
  Search,
  Clock,
  User,
  Paperclip
} from 'lucide-react';
import { Client, Interaction, InteractionType, InteractionOutcome } from '@/types/client';
import InteractionForm from './InteractionForm';

interface ClientInteractionTimelineProps {
  client: Client;
  onInteractionAdd: (interaction: Interaction) => void;
  onInteractionEdit?: (interaction: Interaction) => void;
  onInteractionDelete?: (interactionId: string) => void;
}

export default function ClientInteractionTimeline({ 
  client, 
  onInteractionAdd, 
  onInteractionEdit, 
  onInteractionDelete 
}: ClientInteractionTimelineProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<InteractionType | 'all'>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<InteractionOutcome | 'all'>('all');
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case InteractionType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case InteractionType.PHONE_CALL:
        return <Phone className="h-4 w-4" />;
      case InteractionType.VIDEO_CALL:
        return <Video className="h-4 w-4" />;
      case InteractionType.MEETING:
        return <Users className="h-4 w-4" />;
      case InteractionType.PROPOSAL:
        return <FileText className="h-4 w-4" />;
      case InteractionType.CONTRACT_REVIEW:
        return <FileText className="h-4 w-4" />;
      case InteractionType.SUPPORT_TICKET:
        return <MessageSquare className="h-4 w-4" />;
      case InteractionType.SOCIAL_MEDIA:
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getOutcomeBadgeVariant = (outcome: InteractionOutcome) => {
    switch (outcome) {
      case InteractionOutcome.POSITIVE:
        return 'default';
      case InteractionOutcome.DEAL_CLOSED:
        return 'default';
      case InteractionOutcome.NEGATIVE:
        return 'destructive';
      case InteractionOutcome.DEAL_LOST:
        return 'destructive';
      case InteractionOutcome.ACTION_REQUIRED:
        return 'secondary';
      case InteractionOutcome.FOLLOW_UP_SCHEDULED:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600';
    if (sentiment < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatInteractionType = (type: InteractionType) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatOutcome = (outcome: InteractionOutcome) => {
    return outcome.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter interactions
  const filteredInteractions = client.interactions.filter(interaction => {
    const matchesSearch = searchTerm === '' || 
      interaction.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || interaction.type === typeFilter;
    const matchesOutcome = outcomeFilter === 'all' || interaction.outcome === outcomeFilter;
    
    return matchesSearch && matchesType && matchesOutcome;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddInteraction = (interaction: Interaction) => {
    onInteractionAdd(interaction);
    setShowAddForm(false);
  };

  const handleEditInteraction = (interaction: Interaction) => {
    if (onInteractionEdit) {
      onInteractionEdit(interaction);
    }
    setEditingInteraction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Interaction Timeline</h3>
          <p className="text-sm text-muted-foreground">
            {client.interactions.length} total interactions
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Interaction
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search interactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as InteractionType | 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(InteractionType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatInteractionType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={(value) => setOutcomeFilter(value as InteractionOutcome | 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {Object.values(InteractionOutcome).map((outcome) => (
                  <SelectItem key={outcome} value={outcome}>
                    {formatOutcome(outcome)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredInteractions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No interactions found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Interaction
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredInteractions.map((interaction, index) => (
            <Card key={interaction.id} className="relative">
              {/* Timeline connector */}
              {index < filteredInteractions.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-border" />
              )}
              
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {getInteractionIcon(interaction.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{interaction.subject}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {interaction.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant={getOutcomeBadgeVariant(interaction.outcome)}>
                          {formatOutcome(interaction.outcome)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingInteraction(interaction)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(interaction.date)}</span>
                      </div>
                      
                      {interaction.duration && (
                        <div className="flex items-center space-x-1">
                          <span>Duration: {formatDuration(interaction.duration)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Contact: {client.contact.primaryContact.firstName} {client.contact.primaryContact.lastName}</span>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {formatInteractionType(interaction.type)}
                      </Badge>
                    </div>
                    
                    {/* Sentiment */}
                    {interaction.sentiment && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">Sentiment: </span>
                        <span className={`text-xs font-medium ${getSentimentColor(interaction.sentiment.overall)}`}>
                          {interaction.sentiment.overall > 0 ? 'Positive' : 
                           interaction.sentiment.overall < 0 ? 'Negative' : 'Neutral'}
                          {' '}({(interaction.sentiment.confidence * 100).toFixed(0)}% confidence)
                        </span>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {interaction.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {interaction.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Attachments */}
                    {interaction.attachments.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span>{interaction.attachments.length} attachment{interaction.attachments.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Follow-up */}
                    {interaction.followUpRequired && interaction.followUpDate && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                        <p className="text-xs text-yellow-800">
                          <strong>Follow-up required:</strong> {formatDate(interaction.followUpDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Interaction Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Interaction</CardTitle>
          </CardHeader>
          <CardContent>
            <InteractionForm
              clientId={client.id}
              onSubmit={handleAddInteraction}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Interaction Form */}
      {editingInteraction && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Interaction</CardTitle>
          </CardHeader>
          <CardContent>
            <InteractionForm
              clientId={client.id}
              initialData={editingInteraction}
              onSubmit={handleEditInteraction}
              onCancel={() => setEditingInteraction(null)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}