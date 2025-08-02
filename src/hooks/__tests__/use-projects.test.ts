import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjects } from '../use-projects';
import { ProjectStatus } from '@/types/project';

// Mock setTimeout to avoid delays in tests
jest.useFakeTimers();

describe('useProjects', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('loads projects on mount', async () => {
    const { result } = renderHook(() => useProjects());

    expect(result.current.loading).toBe(true);
    expect(result.current.projects).toEqual([]);

    // Fast-forward timers to resolve the mock API call
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('filters projects by search query', async () => {
    const { result } = renderHook(() => useProjects({ search: 'E-commerce' }));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].name).toContain('E-commerce');
  });

  it('filters projects by status', async () => {
    const { result } = renderHook(() => useProjects({ status: ProjectStatus.ACTIVE }));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.projects.forEach(project => {
      expect(project.status).toBe(ProjectStatus.ACTIVE);
    });
  });

  it('creates a new project', async () => {
    const { result } = renderHook(() => useProjects());

    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCount = result.current.projects.length;

    const newProjectData = {
      name: 'New Test Project',
      description: 'A new test project',
      status: ProjectStatus.PLANNING,
      timeline: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: [],
        phases: [],
      },
      resources: [],
      risks: [],
      collaborators: [],
      documents: [],
    };

    let createdProject;
    await act(async () => {
      createdProject = await result.current.createProject(newProjectData);
      jest.advanceTimersByTime(1000); // Mock API delay
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(createdProject).toBeDefined();
    expect(createdProject.name).toBe('New Test Project');
    expect(result.current.projects.length).toBe(initialCount + 1);
  });

  it('updates a project', async () => {
    const { result } = renderHook(() => useProjects());

    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const projectId = result.current.projects[0].id;
    const updateData = { name: 'Updated Project Name' };

    await act(async () => {
      await result.current.updateProject(projectId, updateData);
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedProject = result.current.projects.find(p => p.id === projectId);
    expect(updatedProject?.name).toBe('Updated Project Name');
  });

  it('deletes a project', async () => {
    const { result } = renderHook(() => useProjects());

    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCount = result.current.projects.length;
    const projectId = result.current.projects[0].id;

    await act(async () => {
      await result.current.deleteProject(projectId);
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects.length).toBe(initialCount - 1);
    expect(result.current.projects.find(p => p.id === projectId)).toBeUndefined();
  });

  it('handles pagination', async () => {
    const { result } = renderHook(() => useProjects({ page: 1, limit: 1 }));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects.length).toBe(1);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalCount).toBeGreaterThan(1);
  });

  it('refreshes projects', async () => {
    const { result } = renderHook(() => useProjects());

    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshProjects();
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects.length).toBeGreaterThan(0);
  });

  it('handles errors gracefully', async () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create a hook that will trigger an error by using an invalid search
    const { result } = renderHook(() => useProjects());

    // Wait for initial load
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to delete a non-existent project to trigger an error
    await act(async () => {
      try {
        await result.current.deleteProject('non-existent-id');
        jest.advanceTimersByTime(500);
      } catch (error) {
        // Expected to throw
      }
    });

    consoleSpy.mockRestore();
  });
});