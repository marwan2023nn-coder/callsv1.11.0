# Remote Control Architecture

## Overview
The "Remote Control" feature allows a participant (Controller) to control the screen of another participant (Sharer/Host) during a call. This is achieved through a combination of WebRTC for video and input streaming, and native OS APIs for input simulation.

## Components

### 1. Controller (Webapp)
- Captures user input (mouse moves, clicks, key presses) within the video container.
- Translates coordinates to percentages (0.0 to 1.0) to handle resolution differences.
- Sends events via WebRTC DataChannels for minimal latency.

### 2. Relay Server (Go Plugin)
- Manages the "Remote Control" state (who has permission).
- Acts as a signaling relay for granting/revoking control.
- Forwards input events from the Controller to the Sharer.

### 3. Sharer Agent (Desktop App / Desktop API)
- Receives input events from the Relay Server (or directly via DataChannel).
- Uses native system calls to simulate input:
    - **Windows:** `SendInput` API.
    - **Linux (X11):** `XTest` extension.
    - **Linux (Wayland):** `org.freedesktop.portal.RemoteDesktop` via DBus.

## Data Flow
1. **Request:** Controller requests control -> Sharer accepts.
2. **Streaming:**
    - **Screen:** Sharer captures screen -> WebRTC Video Track -> Controller.
    - **Input:** Controller captures Mouse/Keyboard -> WebRTC DataChannel -> Relay Server -> Sharer Agent.
3. **Execution:** Sharer Agent executes native commands to move mouse/type keys.

## Low-Latency Strategy
- **WebRTC DataChannels:** Used for input events to bypass the standard WebSocket overhead.
- **UDP Transport:** Preferred for real-time interaction.
- **Direct RTC Relay:** Events are relayed through the RTC server (rtcd) when possible.
