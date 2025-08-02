import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '../use-websocket'

// Mock WebSocket
let mockWebSocketInstances: MockWebSocket[] = []

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(public url: string) {
    mockWebSocketInstances.push(this)
    // Simulate connection opening after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }))
    }
  }

  // Helper method to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

// Replace global WebSocket with mock
global.WebSocket = MockWebSocket as any

describe('useWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWebSocketInstances = []
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test'
      })
    )

    expect(result.current.isConnected).toBe(false)
    expect(result.current.isConnecting).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('connects successfully', async () => {
    const onConnect = jest.fn()
    
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test',
        onConnect
      })
    )

    // Wait for connection to open
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    expect(result.current.isConnected).toBe(true)
    expect(result.current.isConnecting).toBe(false)
    expect(onConnect).toHaveBeenCalledTimes(1)
  })

  it('handles incoming messages', async () => {
    const onMessage = jest.fn()
    let mockWs: MockWebSocket

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test',
        onMessage
      })
    )

    // Wait for connection and get reference to mock WebSocket
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      mockWs = mockWebSocketInstances[0]
    })

    // Simulate receiving a message
    act(() => {
      mockWs!.simulateMessage({ type: 'test', data: 'hello' })
    })

    expect(onMessage).toHaveBeenCalledWith({ type: 'test', data: 'hello' })
  })

  it('sends messages when connected', async () => {
    let mockWs: MockWebSocket
    const sendSpy = jest.fn()

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test'
      })
    )

    // Wait for connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      mockWs = mockWebSocketInstances[0]
      mockWs.send = sendSpy
    })

    // Send a message
    act(() => {
      result.current.sendMessage({ type: 'test', data: 'hello' })
    })

    expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({ type: 'test', data: 'hello' }))
  })

  it('handles connection errors', async () => {
    const onError = jest.fn()
    let mockWs: MockWebSocket

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test',
        onError
      })
    )

    // Wait for connection and simulate error
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      mockWs = mockWebSocketInstances[0]
    })

    act(() => {
      mockWs!.simulateError()
    })

    expect(result.current.error).toBe('WebSocket connection error')
    expect(onError).toHaveBeenCalled()
  })

  it('handles disconnection', async () => {
    const onDisconnect = jest.fn()
    let mockWs: MockWebSocket

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test',
        onDisconnect
      })
    )

    // Wait for connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      mockWs = mockWebSocketInstances[0]
    })

    expect(result.current.isConnected).toBe(true)

    // Simulate disconnection
    act(() => {
      mockWs!.close()
    })

    expect(result.current.isConnected).toBe(false)
    expect(onDisconnect).toHaveBeenCalled()
  })

  it('can manually disconnect', async () => {
    let mockWs: MockWebSocket
    const closeSpy = jest.fn()

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test'
      })
    )

    // Wait for connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      mockWs = mockWebSocketInstances[0]
      mockWs.close = closeSpy
    })

    // Manual disconnect
    act(() => {
      result.current.disconnect()
    })

    expect(closeSpy).toHaveBeenCalled()
  })

  it('can manually reconnect', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test'
      })
    )

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    expect(result.current.isConnected).toBe(true)

    // Disconnect and reconnect
    act(() => {
      result.current.disconnect()
    })

    expect(result.current.isConnected).toBe(false)

    act(() => {
      result.current.reconnect()
    })

    expect(result.current.isConnecting).toBe(true)

    // Wait for reconnection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    expect(result.current.isConnected).toBe(true)
  })

  it('attempts to reconnect automatically on connection loss', async () => {
    let mockWs: MockWebSocket

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test',
        reconnectInterval: 100,
        maxReconnectAttempts: 2
      })
    )

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      mockWs = mockWebSocketInstances[0]
    })

    expect(result.current.isConnected).toBe(true)

    // Simulate connection loss
    act(() => {
      mockWs!.close()
    })

    expect(result.current.isConnected).toBe(false)

    // Wait for reconnection attempt
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    // Should attempt to reconnect
    expect(result.current.isConnecting).toBe(true)
  })

  it('stops reconnecting after max attempts', async () => {
    let mockWs: MockWebSocket

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080/test',
        reconnectInterval: 50,
        maxReconnectAttempts: 1
      })
    )

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      mockWs = mockWebSocketInstances[0]
    })

    // Simulate connection loss
    act(() => {
      mockWs!.close()
    })

    // Wait for reconnection attempts to exhaust
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    // Should not be trying to reconnect anymore
    expect(result.current.isConnecting).toBe(false)
    expect(result.current.isConnected).toBe(false)
  })
})