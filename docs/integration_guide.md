# Integration Guide: Remote Control for Mattermost Calls

This guide provides the necessary steps to integrate the **Remote Control Wrapper** into the Mattermost Desktop client or a helper agent.

## 1. Data Flow Summary

The Controller (User A) triggers events in their browser, which are then relayed to the Sharer (User B).

```
[Controller UI] --(WebRTC DataChannel)--> [Relay Server] --(WebRTC DataChannel)--> [Sharer Desktop Agent] --(Native API)--> [Simulated Input]
```

## 2. Using the Go Wrapper

The Go Wrapper in `server/remote_control_poc.go` acts as the **Native Driver**. To integrate it:

### Step A: Receive Remote Control Messages
In your desktop agent's RTC message handler, listen for events of type `rtcRemoteControlEventMessage` (Type 11).

### Step B: Call the Wrapper
Pass the incoming message payload to the `HandleRemoteControlMessage` function.

```go
// Desktop Agent (Go)
func onDataChannelMessage(msg []byte) {
    // 1. Ensure control is authorized for this session.
    // 2. Pass to the Wrapper.
    err := remote_control.HandleRemoteControlMessage(msg)
    if err != nil {
        log.Errorf("Remote control execution failed: %v", err)
    }
}
```

## 3. Coordinate Mapping Details

The Controller's UI sends coordinates as **Percentages (0.0 to 1.0)**.

The Wrapper's `HandleRemoteControlMessage` converts these using the **Sharer's Local Resolution**:

```go
// Inside HandleRemoteControlMessage:
screenWidth, screenHeight := GetLocalScreenResolution()
absX := int(ev.X * float64(screenWidth))
absY := int(ev.Y * float64(screenHeight))
```

This approach eliminates "drift" caused by resolution or aspect ratio mismatches between User A and User B.

## 4. Platform-Specific Integration

### Windows (Win32)
Ensure the executable has permissions to call `SendInput`. On some systems, the application might need to be run as Administrator if the target application (the one being controlled) is also running as Administrator (due to UIPI - User Interface Privilege Isolation).

### Linux (X11 & Wayland)
- **X11:** Ensure `libxtst-dev` is installed.
- **Wayland:** The agent must be integrated with **PipeWire** for screen capture and the **Remote Desktop Portal** for input simulation. The portal requires an initial user interaction to grant permission.

## 5. Security & Safety
- **Authorization:** Only execute events if the `remoteControlSessionID` matches the authorized controller's ID.
- **Visual Feedback:** Show a "Control Active" banner on the Sharer's screen.
- **Kill Switch:** Provide a global hotkey (e.g., Ctrl+Alt+Shift+Q) to instantly terminate the control session.
