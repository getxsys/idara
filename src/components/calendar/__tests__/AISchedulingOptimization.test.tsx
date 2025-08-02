import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AISchedulingOptimization } from '../AISchedulingOptimization';
import { EventType, EventPriority, EventStatus } from '@/types/calendar';

// Mock the scheduling optimization service
jest.mock('@/lib/services/scheduling-optimization', () => ({
  SchedulingOptimizationService: jest.fn().mockImplementation(() => ({
    optimizeSchedule: jest.fn().mockResolvedValue({
      optimizedEvents: [],
      improvements: [
        {
          type: 'overall_efficiency',
          description: 'Schedule efficiency improved by 15%',
          impact: 'high',
          timesSaved: 45,
        },
      ],
      energyScore: 0.85,
    }),
    findOptimalTimes: jest.fn().mockResolvedValue({
      suggestedTimes: [
        {
          startTime: new Date('2024-01-16T10:00:00Z'),
          endTime: new Date('2024-01-16T11:00:00Z'),
          confidence: 0.95,
          reason: 'Optimal time - high energy, no conflicts',
        },
      ],
      conflicts: [],
      travelTimeConsiderations: [],
      preparationSuggestions: ['Prepare meeting agenda', 'Review participant backgrounds'],
    }),
  })),
}));

const mockEvents = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    location: 'Conference Room A',
    isAllDay: false,
    type: EventType.MEETING,
    priority: EventPriority.HIGH,
    status: EventStatus.CONFIRMED,
    organizerId: 'user-123',
    attendees: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('AISchedulingOptimization', () => {
  const mockProps = {
    userId: 'user-123',
    events: mockEvents,
    onScheduleOptimized: jest.fn(),
    onTimeSlotSelected: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the AI scheduling optimization interface', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    expect(screen.getByText('AI Scheduling Optimization')).toBeInTheDocument();
    expect(screen.getByText('Leverage AI to optimize your schedule and improve productivity')).toBeInTheDocument();
    expect(screen.getByText('Optimize Schedule')).toBeInTheDocument();
  });

  it('displays optimization options', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    expect(screen.getByText('Smart Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Meeting Optimizer')).toBeInTheDocument();
    expect(screen.getByText('Schedule Analysis')).toBeInTheDocument();
    expect(screen.getByText('Travel Optimization')).toBeInTheDocument();
  });

  it('shows optimization tools cards', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    expect(screen.getByText('Find Optimal Times')).toBeInTheDocument();
    expect(screen.getByText('Optimize Meeting')).toBeInTheDocument();
    expect(screen.getByText('Analyze Schedule')).toBeInTheDocument();
  });

  it('displays AI insights panel', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Peak Productivity Hours')).toBeInTheDocument();
    expect(screen.getByText('Travel Optimization')).toBeInTheDocument();
    expect(screen.getByText('Meeting Efficiency')).toBeInTheDocument();
  });

  it('handles schedule optimization', async () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const optimizeButton = screen.getByText('Optimize Schedule');
    fireEvent.click(optimizeButton);

    // Should show loading state
    expect(screen.getByText('Optimizing...')).toBeInTheDocument();

    // Wait for optimization to complete
    await waitFor(() => {
      expect(screen.getByText('Optimization Results')).toBeInTheDocument();
    });

    expect(screen.getByText('Optimization Complete')).toBeInTheDocument();
    expect(screen.getByText('Schedule efficiency improved by 15%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument(); // Energy score
  });

  it('opens smart scheduling dialog', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const findTimesButton = screen.getByText('Find Optimal Times');
    fireEvent.click(findTimesButton);

    expect(screen.getByText('Smart Scheduling Assistant')).toBeInTheDocument();
    expect(screen.getByLabelText('Meeting Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument();
  });

  it('opens meeting optimizer dialog', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const optimizeMeetingButton = screen.getByText('Optimize Meeting');
    fireEvent.click(optimizeMeetingButton);

    expect(screen.getByText('Meeting Optimization')).toBeInTheDocument();
    expect(screen.getByText('Optimize meeting times considering all participants')).toBeInTheDocument();
  });

  it('opens schedule analysis dialog', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const analyzeButton = screen.getByText('Analyze Schedule');
    fireEvent.click(analyzeButton);

    expect(screen.getByText('Schedule Analysis & Insights')).toBeInTheDocument();
  });

  it('allows selecting optimization options', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const meetingOptimizerCard = screen.getByText('Meeting Optimizer').closest('.cursor-pointer');
    fireEvent.click(meetingOptimizerCard!);

    // The card should be selected (this would be indicated by styling changes)
    expect(meetingOptimizerCard).toBeInTheDocument();
  });

  it('calls onScheduleOptimized when optimization is applied', async () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const optimizeButton = screen.getByText('Optimize Schedule');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Apply Changes')).toBeInTheDocument();
    });

    const applyButton = screen.getByText('Apply Changes');
    fireEvent.click(applyButton);

    expect(mockProps.onScheduleOptimized).toHaveBeenCalled();
  });
});

describe('SmartSchedulingForm', () => {
  const mockProps = {
    userId: 'user-123',
    events: mockEvents,
    onTimeSlotSelected: jest.fn(),
  };

  it('renders smart scheduling form fields', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const findTimesButton = screen.getByText('Find Optimal Times');
    fireEvent.click(findTimesButton);

    expect(screen.getByLabelText('Meeting Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Attendees (emails, comma-separated)')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Virtual Meeting')).toBeInTheDocument();
  });

  it('allows filling out the form', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const findTimesButton = screen.getByText('Find Optimal Times');
    fireEvent.click(findTimesButton);

    const titleInput = screen.getByLabelText('Meeting Title');
    fireEvent.change(titleInput, { target: { value: 'Project Review' } });

    const durationInput = screen.getByLabelText('Duration (minutes)');
    fireEvent.change(durationInput, { target: { value: '90' } });

    const attendeesInput = screen.getByLabelText('Attendees (emails, comma-separated)');
    fireEvent.change(attendeesInput, { target: { value: 'john@example.com, jane@example.com' } });

    expect(titleInput).toHaveValue('Project Review');
    expect(durationInput).toHaveValue(90);
    expect(attendeesInput).toHaveValue('john@example.com, jane@example.com');
  });

  it('finds optimal times when form is submitted', async () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const findTimesButton = screen.getByText('Find Optimal Times');
    fireEvent.click(findTimesButton);

    const titleInput = screen.getByLabelText('Meeting Title');
    fireEvent.change(titleInput, { target: { value: 'Project Review' } });

    const findOptimalTimesButton = screen.getByText('Find Optimal Times');
    fireEvent.click(findOptimalTimesButton);

    expect(screen.getByText('Finding Optimal Times...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
    });

    expect(screen.getByText('95% match')).toBeInTheDocument();
    expect(screen.getByText('Optimal time - high energy, no conflicts')).toBeInTheDocument();
  });

  it('allows selecting a suggested time slot', async () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const findTimesButton = screen.getByText('Find Optimal Times');
    fireEvent.click(findTimesButton);

    const titleInput = screen.getByLabelText('Meeting Title');
    fireEvent.change(titleInput, { target: { value: 'Project Review' } });

    const findOptimalTimesButton = screen.getByText('Find Optimal Times');
    fireEvent.click(findOptimalTimesButton);

    await waitFor(() => {
      expect(screen.getByText('Select This Time')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('Select This Time');
    fireEvent.click(selectButton);

    expect(mockProps.onTimeSlotSelected).toHaveBeenCalled();
  });

  it('disables find times button when title is empty', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const findTimesButton = screen.getByText('Find Optimal Times');
    fireEvent.click(findTimesButton);

    const findOptimalTimesButton = screen.getByText('Find Optimal Times');
    expect(findOptimalTimesButton).toBeDisabled();

    const titleInput = screen.getByLabelText('Meeting Title');
    fireEvent.change(titleInput, { target: { value: 'Project Review' } });

    expect(findOptimalTimesButton).not.toBeDisabled();
  });
});

describe('ScheduleAnalysisPanel', () => {
  const mockProps = {
    userId: 'user-123',
    events: mockEvents,
  };

  it('displays schedule analysis metrics', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const analyzeButton = screen.getByText('Analyze Schedule');
    fireEvent.click(analyzeButton);

    expect(screen.getByText('Productivity Score')).toBeInTheDocument();
    expect(screen.getByText('Time Utilization')).toBeInTheDocument();
    expect(screen.getByText('Meeting Efficiency')).toBeInTheDocument();
    expect(screen.getByText('Work-Life Balance')).toBeInTheDocument();
  });

  it('shows AI insights and recommendations', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const analyzeButton = screen.getByText('Analyze Schedule');
    fireEvent.click(analyzeButton);

    expect(screen.getByText('AI Insights & Recommendations')).toBeInTheDocument();
    expect(screen.getByText('High Meeting Load')).toBeInTheDocument();
    expect(screen.getByText('Good Time Blocking')).toBeInTheDocument();
    expect(screen.getByText('Travel Optimization')).toBeInTheDocument();
  });

  it('displays impact badges for insights', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const analyzeButton = screen.getByText('Analyze Schedule');
    fireEvent.click(analyzeButton);

    expect(screen.getByText('high impact')).toBeInTheDocument();
    expect(screen.getByText('medium impact')).toBeInTheDocument();
  });

  it('allows closing the analysis panel', () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const analyzeButton = screen.getByText('Analyze Schedule');
    fireEvent.click(analyzeButton);

    expect(screen.getByText('Schedule Analysis & Insights')).toBeInTheDocument();

    const closeButton = screen.getByText('Close Analysis');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Schedule Analysis & Insights')).not.toBeInTheDocument();
  });
});

describe('OptimizationResults', () => {
  const mockProps = {
    userId: 'user-123',
    events: mockEvents,
    onScheduleOptimized: jest.fn(),
  };

  it('displays optimization improvements', async () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const optimizeButton = screen.getByText('Optimize Schedule');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Optimization Complete')).toBeInTheDocument();
    });

    expect(screen.getByText('1 improvements found')).toBeInTheDocument();
    expect(screen.getByText('Schedule efficiency improved by 15%')).toBeInTheDocument();
    expect(screen.getByText('Saves 45 minutes • high impact')).toBeInTheDocument();
  });

  it('shows energy score', async () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const optimizeButton = screen.getByText('Optimize Schedule');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Energy Score')).toBeInTheDocument();
    });

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('allows applying optimization changes', async () => {
    render(<AISchedulingOptimization {...mockProps} />);

    const optimizeButton = screen.getByText('Optimize Schedule');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Apply Changes')).toBeInTheDocument();
    });

    const applyButton = screen.getByText('Apply Changes');
    fireEvent.click(applyButton);

    expect(mockProps.onScheduleOptimized).toHaveBeenCalled();
  });
});