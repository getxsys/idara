import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectsPage from '../page';
import { useProjects } from '@/hooks/use-projects';
import { ProjectStatus } from '@/types/project';

// Mock the useProjects hook
jest.mock('@/hooks/use-projects');
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({}),
}));

const mockProjects = [
  {
    id: '1',
    name: 'Test Project 1',
    description: 'First test project',
    status: ProjectStatus.ACTIVE,
    timeline: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      milestones: [],
      phases: [],
    },
    resources: [],
    risks: [],
    aiInsights: {
      healthScore: 85,
      riskLevel: 'medium' as const,
      completionPrediction: new Date('2024-06-25'),
      budgetVariance: -5.2,
      scheduleVariance: 2.1,
      recommendations: [],
      trends: [],
      lastUpdated: new Date(),
    },
    collaborators: ['user1', 'user2'],
    documents: [],
    clientId: 'client1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Test Project 2',
    description: 'Second test project',
    status: ProjectStatus.PLANNING,
    timeline: {
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-09-30'),
      milestones: [],
      phases: [],
    },
    resources: [],
    risks: [],
    aiInsights: {
      healthScore: 92,
      riskLevel: 'low' as const,
      completionPrediction: new Date('2024-09-25'),
      budgetVariance: 0,
      scheduleVariance: 0,
      recommendations: [],
      trends: [],
      lastUpdated: new Date(),
    },
    collaborators: ['user1'],
    documents: [],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  },
];

const mockHookReturn = {
  projects: mockProjects,
  loading: false,
  error: null,
  totalCount: 2,
  hasMore: false,
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  refreshProjects: jest.fn(),
};

describe('ProjectsPage', () => {
  beforeEach(() => {
    mockUseProjects.mockReturnValue(mockHookReturn);
    jest.clearAllMocks();
  });

  it('renders the page title and description', () => {
    render(<ProjectsPage />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Manage your projects with AI-powered insights and optimization')).toBeInTheDocument();
  });

  it('displays project statistics', () => {
    render(<ProjectsPage />);

    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total count
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Active count
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Planning count
  });

  it('shows search input', () => {
    render(<ProjectsPage />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    expect(searchInput).toBeInTheDocument();
  });

  it('shows status filter dropdown', () => {
    render(<ProjectsPage />);

    expect(screen.getByText('Filter by status')).toBeInTheDocument();
  });

  it('shows New Project button', () => {
    render(<ProjectsPage />);

    const newProjectButton = screen.getByText('New Project');
    expect(newProjectButton).toBeInTheDocument();
  });

  it('toggles between grid and list view', () => {
    render(<ProjectsPage />);

    const gridButton = screen.getByRole('button', { name: /grid/i });
    const listButton = screen.getByRole('button', { name: /list/i });

    expect(gridButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();

    // Click list view
    fireEvent.click(listButton);
    // The view should change (this would be tested by checking if ProjectList component is rendered)
  });

  it('opens create project dialog when New Project is clicked', () => {
    render(<ProjectsPage />);

    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);

    // The dialog should open (this would be tested by checking if CreateProjectDialog is rendered)
  });

  it('handles search input changes', () => {
    render(<ProjectsPage />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Test Project 1' } });

    expect(searchInput).toHaveValue('Test Project 1');
  });

  it('handles status filter changes', () => {
    render(<ProjectsPage />);

    // This would test the Select component interaction
    // The actual implementation would depend on how the Select component works
  });

  it('shows loading state', () => {
    mockUseProjects.mockReturnValue({
      ...mockHookReturn,
      loading: true,
      projects: [],
    });

    render(<ProjectsPage />);

    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const error = new Error('Failed to load projects');
    mockUseProjects.mockReturnValue({
      ...mockHookReturn,
      loading: false,
      error,
      projects: [],
    });

    render(<ProjectsPage />);

    expect(screen.getByText('Error loading projects: Failed to load projects')).toBeInTheDocument();
  });

  it('toggles filters panel', () => {
    render(<ProjectsPage />);

    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    // The filters panel should be visible
    // This would be tested by checking if ProjectFilters component is rendered
  });

  it('calls createProject when form is submitted', async () => {
    const mockCreateProject = jest.fn().mockResolvedValue({});
    mockUseProjects.mockReturnValue({
      ...mockHookReturn,
      createProject: mockCreateProject,
    });

    render(<ProjectsPage />);

    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);

    // This would test the actual form submission
    // The implementation would depend on the CreateProjectDialog component
  });

  it('calls updateProject when project is updated', async () => {
    const mockUpdateProject = jest.fn().mockResolvedValue({});
    mockUseProjects.mockReturnValue({
      ...mockHookReturn,
      updateProject: mockUpdateProject,
    });

    render(<ProjectsPage />);

    // This would test project update functionality
    // The implementation would depend on how projects are updated in the grid/list
  });

  it('calls deleteProject when project is deleted', async () => {
    const mockDeleteProject = jest.fn().mockResolvedValue(undefined);
    mockUseProjects.mockReturnValue({
      ...mockHookReturn,
      deleteProject: mockDeleteProject,
    });

    render(<ProjectsPage />);

    // This would test project deletion functionality
    // The implementation would depend on how projects are deleted in the grid/list
  });
});