# Implementation Guide: Remote Control for Windows & Linux

This guide provides technical details on how to implement high-performance screen capture and input simulation for cross-platform desktop environments.

## 1. Input Simulation Handling

### Windows (Win32 API)
- **API:** `SendInput` from `user32.dll`.
- **Normalization:** Windows expects mouse coordinates to be mapped to a virtual screen range of `0-65535`. Multiply the percentage value by 65535 before sending.
- **Flags:** Use `MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE` for direct positioning.

### Linux X11 (Ubuntu/Debian)
- **Library:** `libXtst` (X Test Extension).
- **Tooling:** `xdotool` is a common command-line tool, but for C/Go integration, use `XTestFakeMotionEvent`.
- **Dependencies:** `libxtst-dev` must be installed.

### Linux Wayland (Modern Ubuntu)
- **Strategy:** Wayland blocks direct input simulation for security. Use the **Remote Desktop Portal** (`org.freedesktop.portal.RemoteDesktop`).
- **Mechanism:** Interact via DBus. The application must request a session, and the user must grant permission via a system dialog.
- **Alternative:** For specific compositors (like GNOME or KDE), there are private DBus interfaces (e.g., `org.gnome.Mutter.RemoteDesktop`).

## 2. Screen Capture & Streaming Performance

### High-Efficiency Capture
- **Windows:** Use **Desktop Duplication API**. It provides direct access to the GPU frame buffer, which is much faster than `BitBlt`.
- **Linux:** Use **PipeWire**. It is the standard for both X11 and Wayland. It provides a zero-copy mechanism to share video buffers between the screen capturer and the application.

### Latency Reduction (WebRTC)
- **Content Hint:** Set `track.contentHint = 'text'` on the video track. This tells the encoder (VP9/AV1) to prioritize sharpness and detail over frame rate, which is crucial for reading text or code during remote control.
- **Rate Control:** Use VBR (Variable Bitrate) but cap the maximum to prevent congestion.
- **Data Channels:** Send keyboard/mouse events via **Unreliable/Unordered DataChannels** to avoid HOL (Head-of-Line) blocking. If one mouse move is lost, it's better to process the next one immediately than to wait for retransmission.

## 3. Security Considerations

- **Authorization:** Only the participant currently sharing their screen can grant "Remote Control" permission.
- **Explicit Grant:** The host must receive a visible prompt to "Allow Remote Control" from a specific user.
- **Visual Feedback:** A clear visual indicator (e.g., a colored border or a floating bar) must be shown on the host's screen while remote control is active.
- **Panic Disconnect:** Provide a global hotkey (e.g., ESC or Ctrl+Alt+Shift+Q) for the host to instantly kill the remote control session and disconnect the agent.
- **Encryption:** All input events must be sent over DTLS-encrypted WebRTC DataChannels.

## 4. Proposed Stack
- **Backend:** Go (for sysadmin and signaling).
- **Agent:** Go or Rust (for native system calls).
- **Communication:** WebRTC (P2P when possible, via TURN/Relay otherwise).
