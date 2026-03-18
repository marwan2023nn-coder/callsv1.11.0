# Integration Guide: Connecting Control to Screen Sharing

Since you already have a functional "Screen Sharing" feature, adding "Remote Control" involves two main parts: capturing events on the Receiver's side and executing them on the Sharer's side.

## 1. Receiver Side (The one WHO CONTROLS)

The Receiver sees the video stream. You need to wrap your `<video>` element to capture events:

```javascript
// Webapp (React/JS)
const handleMouseEvent = (e) => {
    const rect = videoElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;  // Percentage 0.0 to 1.0
    const y = (e.clientY - rect.top) / rect.height;   // Percentage 0.0 to 1.0

    const payload = {
        action: e.type, // 'mousemove', 'mousedown', 'mouseup'
        x: x,
        y: y,
        button: e.button
    };

    // Send via WebRTC DataChannel for low latency
    dataChannel.send(JSON.stringify(payload));
};
```

## 2. Server/Relay (The Bridge)

The server receives the message and forwards it to the Sharer's desktop agent. In your Mattermost Plugin:
- Ensure the sender is authorized.
- Use `rtcRemoteControlEventMessage` to relay the event to the Sharer.

## 3. Sharer Side (The one WHO IS CONTROLLED)

The Desktop Agent (written in Go) receives the message and uses the logic in `remote_control_poc.go`:

### Conversion Logic (Go)
```go
func executeEvent(ev RemoteControlEvent) {
    // Get local screen resolution
    screenWidth, screenHeight := getLocalScreenResolution()

    // Calculate absolute pixels
    absX := int(ev.X * float64(screenWidth))
    absY := int(ev.Y * float64(screenHeight))

    // Call native APIs (Win32 / X11 / Wayland)
    nativeSimulateMove(absX, absY)
}
```

## 4. Why Percentage-based Coordinates?
- **Aspect Ratio:** The Receiver's video window might have a different aspect ratio than the Sharer's screen.
- **Resolution:** A 4K screen controlled by a 1080p laptop works seamlessly because percentages (0.5, 0.5) always point to the center of the screen regardless of the resolution.

## 5. Security Check (The "Kill Switch")
Always ensure the Sharer has a button to:
1. **Pause Control:** Keep sharing but ignore remote inputs.
2. **Stop Sharing:** Kill the stream and the control session instantly.
