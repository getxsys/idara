'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Eye,
  Archive,
  Trash2,
  Clock,
  ExternalLink,
  Star,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  Calendar,
  FileText,
  Settings,
  TrendingUp,
  Shield,
  Award,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
} from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onMarkAsRead: () => void;
  onArchive: () => void;
  onDismiss: () => void;
  className?: string;
}

export function NotificationItem({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onArchive,
  onDismiss,
  className = '',
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeIcon = (type: NotificationType) => {
    const iconClass = "h-4 w-4";
    
    switch (type) {
      case NotificationType.SYSTEM:
        return <Settings className={iconClass} />;
      case NotificationType.USER_ACTION:
        return <Users className={iconClass} />;
      case NotificationType.COLLABORATION:
        return <MessageSquare className={iconClass} />;
      case NotificationType.PROJECT_UPDATE:
        return <FileText className={iconClass} />;
      case NotificationType.CLIENT_UPDATE:
        return <Users className={iconClass} />;
      case NotificationType.CALENDAR_EVENT:
        return <Calendar className={iconClass} />;
      case NotificationType.AI_INSIGHT:
        return <Zap className={iconClass} />;
      case NotificationType.SECURITY_ALERT:
        return <Shield className={iconClass} />;
      case NotificationType.PERFORMANCE_ALERT:
        return <TrendingUp className={iconClass} />;
      case NotificationType.REMINDER:
        return <Clock className={iconClass} />;
      case NotificationType.ACHIEVEMENT:
        return <Award className={iconClass} />;
      case NotificationType.MARKETING:
        return <Star className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      case NotificationPriority.URGENT:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case NotificationPriority.HIGH:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case NotificationPriority.NORMAL:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case NotificationPriority.LOW:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: NotificationPriority) => {
    const iconClass = "h-3 w-3";
    
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return <XCircle className={`${iconClass} text-red-600`} />;
      case NotificationPriority.URGENT:
        return <AlertTriangle className={`${iconClass} text-orange-600`} />;
      case NotificationPriority.HIGH:
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
      case NotificationPriority.NORMAL:
        return <Info className={`${iconClass} text-blue-600`} />;
      case NotificationPriority.LOW:
        return <CheckCircle className={`${iconClass} text-gray-600`} />;
      default:
        return <Info className={`${iconClass} text-gray-600`} />;
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.WORK:
        return 'bg-blue-100 text-blue-800';
      case NotificationCategory.PERSONAL:
        return 'bg-green-100 text-green-800';
      case NotificationCategory.SYSTEM:
        return 'bg-gray-100 text-gray-800';
      case NotificationCategory.SOCIAL:
        return 'bg-purple-100 text-purple-800';
      case NotificationCategory.UPDATES:
        return 'bg-indigo-100 text-indigo-800';
      case NotificationCategory.ALERTS:
        return 'bg-red-100 text-red-800';
      case NotificationCategory.REMINDERS:
        return 'bg-yellow-100 text-yellow-800';
      case NotificationCategory.ACHIEVEMENTS:
        return 'bg-emerald-100 text-emerald-800';
      case NotificationCategory.MARKETING:
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead();
    }

    // Handle navigation if URL is provided
    if (notification.data?.url) {
      window.open(notification.data.url, '_blank');
    }
  };

  const handleActionClick = (action: any) => {
    if (action.url) {
      window.open(action.url, '_blank');
    }
    // Handle other action types as needed
  };

  const formatRelevanceScore = (score: number) => {
    return Math.round(score * 100);
  };

  return (
    <div
      className={`
        relative p-4 border-l-4 transition-all duration-200 cursor-pointer
        ${notification.isRead ? 'bg-background' : 'bg-muted/30'}
        ${getPriorityColor(notification.priority)}
        ${isHovered ? 'shadow-md' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        <div className="flex items-center pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Icon/Avatar */}
        <div className="flex-shrink-0 pt-1">
          {notification.data?.imageUrl ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={notification.data.imageUrl} />
              <AvatarFallback>
                {getTypeIcon(notification.type)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {getTypeIcon(notification.type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Title and Priority */}
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium text-sm truncate ${
                  notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {notification.title}
                </h4>
                {notification.priority !== NotificationPriority.NORMAL && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {getPriorityIcon(notification.priority)}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{notification.priority} priority</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Message */}
              <p className={`text-sm mb-2 line-clamp-2 ${
                notification.isRead ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {notification.message}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                </span>
                
                <Badge variant="secondary" className={getCategoryColor(notification.category)}>
                  {notification.category}
                </Badge>

                {notification.metadata?.aiGenerated && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI-generated notification</p>
                        {notification.metadata.confidence && (
                          <p>Confidence: {Math.round(notification.metadata.confidence * 100)}%</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">
                        {formatRelevanceScore(notification.relevanceScore)}%
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Relevance score: {formatRelevanceScore(notification.relevanceScore)}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {notification.actions.slice(0, 2).map((action) => (
                    <Button
                      key={action.id}
                      variant={action.style === 'primary' ? 'default' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(action);
                      }}
                    >
                      {action.label}
                      {action.url && <ExternalLink className="h-3 w-3 ml-1" />}
                    </Button>
                  ))}
                  {notification.actions.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{notification.actions.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead();
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mark as read</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.isRead && (
                    <DropdownMenuItem onClick={onMarkAsRead}>
                      <Eye className="h-4 w-4 mr-2" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={onDismiss}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Dismiss
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 h-2 w-2 bg-primary rounded-full"></div>
      )}
    </div>
  );
}