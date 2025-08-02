import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectGrid } from '../ProjectGrid';
import { Project, ProjectStatus } from '@/types/project';

// Mock the Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  description: 'A test project description',
  status: ProjectStatus.ACTIVE,
  timeline: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    milestones: [],
    phases: [
      {
        id: 'p1',
        name: 'Phase 1',
        description: 'First phase',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-01'),
        status: 'completed' as const,
        tasks: [],
        progress: 100,
      },
      {
        id: 'p2',
        name: 'Phase 2',
        description: 'Second phase',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        status: 'in_progress' as const,
        tasks: [],
        progress: 50,
      },
    ],
  },
  resources: [
    {
      id: 'r1',
      type: 'human' as const,
      name: 'Developer',
      allocation: 100,
      cost: 5000,
      availability: [],
    },
  ],
  risks: [
    {
      id: 'risk1',
      title: 'Test Risk',
      description: 'A test risk',
      category: 'technical' as const,
      probability: 0.3,
      impact: 0.7,
      severity: 'medium' as const,
      mitigation: 'Test mitigation',
      owner: 'Test Owner',
      status: 'monitoring' as const,
      identifiedAt: new Date(),
      reviewDate: new Date(),
    },
  ],
  aiInsights: {
    healthScore: 85,
    riskLevel: 'medium' as const,
    completionPrediction: new Date('2024-06-25'),
    budgetVariance: -5.2,
    scheduleVariance: 2.1,
    recommendations: [
      {
        id: 'rec1',
        type: 'schedule_optimization' as const,
        title: 'Test Recommendation',
        description: 'A test recommendation',
        priority: 'medium' as const,
        actionRequired: true,
        estimatedImpact: 'Test impact',
        createdAt: new Date(),
      },
    ],
    trends: [],
    lastUpdated: new Date(),
  },
  collaborators: ['user1', 'user2'],
  documents: [],
  clientId: 'client1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

const mockOnUpdate = jest.fn();
const mockOnDelete = jest.fn();

describe('ProjectGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project cards correctly', () => {
    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project description')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('displays progress correctly', () => {
    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Progress should be average of phases: (100 + 50) / 2 = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows health score with correct color', () => {
    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const healthScore = screen.getByText('85/100');
    expect(healthScore).toBeInTheDocument();
    expect(healthScore).toHaveClass('text-green-600'); // Score >= 80 should be green
  });

  it('displays active risks count', () => {
    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('1 risk')).toBeInTheDocument();
  });

  it('shows AI recommendation preview', () => {
    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('AI Recommendation:')).toBeInTheDocument();
    expect(screen.getByText('A test recommendation')).toBeInTheDocument();
  });

  it('handles dropdown menu actions', async () => {
    mockOnUpdate.mockResolvedValue(undefined);

    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Click dropdown menu
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    // Click "Mark Active" option
    const markActiveButton = screen.getByText('Mark Active');
    fireEvent.click(markActiveButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('1', { status: ProjectStatus.ACTIVE });
    });
  });

  it('shows empty state when no projects', () => {
    render(
      <ProjectGrid
        projects={[]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No projects found. Create your first project to get started.')).toBeInTheDocument();
  });

  it('handles delete action', async () => {
    mockOnDelete.mockResolvedValue(undefined);

    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Click dropdown menu
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    // Click delete option
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });
  });

  it('displays team member count', () => {
    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // 2 collaborators
  });

  it('formats dates correctly', () => {
    render(
      <ProjectGrid
        projects={[mockProject]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Should show formatted end date
    expect(screen.getByText('Jun 30, 2024')).toBeInTheDocument();
  });
});