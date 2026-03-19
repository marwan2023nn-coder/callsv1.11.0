package main

import (
	"encoding/json"
	"fmt"
	"runtime"
)

// RemoteControlEvent defines the structure for input events sent from the Controller.
type RemoteControlEvent struct {
	Action   string  `json:"action"` // move, mousedown, mouseup, scroll, keydown, keyup
	X        float64 `json:"x"`      // 0.0 to 1.0 (Percentage)
	Y        float64 `json:"y"`      // 0.0 to 1.0 (Percentage)
	Button   int     `json:"button"`
	Key      string  `json:"key"`    // e.g., "A", "Enter", "Control"
	CtrlKey  bool    `json:"ctrlKey"`
	ShiftKey bool    `json:"shiftKey"`
	AltKey   bool    `json:"altKey"`
	MetaKey  bool    `json:"metaKey"`
}

// GetLocalScreenResolution returns the resolution of the primary monitor.
// In a real implementation, you would use a library like 'github.com/go-vgo/robotgo'
// or native calls to GetSystemMetrics (Win) or XDisplayWidth (Linux).
func GetLocalScreenResolution() (width, height int) {
	// Mock values for PoC
	return 1920, 1080
}

// HandleRemoteControlMessage is the WRAPPER that bridges JSON events with Native Simulation.
func HandleRemoteControlMessage(payload []byte) error {
	var ev RemoteControlEvent
	if err := json.Unmarshal(payload, &ev); err != nil {
		return fmt.Errorf("failed to decode remote control event: %w", err)
	}

	// 1. Coordinate Mapping: Convert percentages to actual pixels.
	screenWidth, screenHeight := GetLocalScreenResolution()
	absX := int(ev.X * float64(screenWidth))
	absY := int(ev.Y * float64(screenHeight))

	// 2. Dispatch to the correct native driver based on the OS.
	switch runtime.GOOS {
	case "windows":
		return simulateWindowsInput(ev, absX, absY)
	case "linux":
		return simulateLinuxInput(ev, absX, absY)
	default:
		return fmt.Errorf("OS %s not supported for remote control simulation", runtime.GOOS)
	}
}

// --- Windows Implementation (Win32 API) ---
func simulateWindowsInput(ev RemoteControlEvent, x, y int) error {
	fmt.Printf("[Windows Win32] Executing %s at (%d, %d)\n", ev.Action, x, y)

	switch ev.Action {
	case "move":
		// Use SendInput with MOUSEEVENTF_ABSOLUTE
		fmt.Printf("  -> win32.SendInput: MouseMove to (%d, %d) using normalized coords: %d, %d\n", x, y, (x*65535)/1920, (y*65535)/1080)
	case "mousedown", "mouseup":
		fmt.Printf("  -> win32.SendInput: Mouse Button %d (%s)\n", ev.Button, ev.Action)
	case "keydown", "keyup":
		fmt.Printf("  -> win32.SendInput: Keyboard Key %s (%s) Modifiers: Ctrl:%v, Shift:%v\n", ev.Key, ev.Action, ev.CtrlKey, ev.ShiftKey)
	}
	return nil
}

// --- Linux Implementation (X11 & Wayland) ---
func simulateLinuxInput(ev RemoteControlEvent, x, y int) error {
	fmt.Printf("[Linux] Executing %s at (%d, %d)\n", ev.Action, x, y)

	// Implementation Note:
	// If XDG_SESSION_TYPE == "x11", use libXtst (XTestFakeMotionEvent).
	// If XDG_SESSION_TYPE == "wayland", use DBus org.freedesktop.portal.RemoteDesktop.

	switch ev.Action {
	case "move":
		fmt.Printf("  -> X11: XTestFakeMotionEvent(display, %d, %d, 0)\n", x, y)
		fmt.Printf("  -> Wayland: portal.NotifyPointerMotion(session_handle, options, %d, %d)\n", x, y)
	case "keydown", "keyup":
		fmt.Printf("  -> Simulating key: %s Action: %s\n", ev.Key, ev.Action)
	}
	return nil
}

// --- Screen Capture PoC ---
func captureScreen() {
	fmt.Println("Capturing screen for streaming...")
	if runtime.GOOS == "windows" {
		fmt.Println("  -> Windows: Using Desktop Duplication API (DDA) for 60FPS zero-copy capture.")
	} else if runtime.GOOS == "linux" {
		fmt.Println("  -> Linux: Using PipeWire to stream frames from Wayland/X11 compositor.")
	}
}

func mainPOC() {
	fmt.Println("Remote Control Wrapper & PoC started.")

	// Example 1: Simulate Mouse Move from JSON
	jsonMove := `{"action": "move", "x": 0.25, "y": 0.75}`
	HandleRemoteControlMessage([]byte(jsonMove))

	// Example 2: Simulate Key Press from JSON
	jsonKey := `{"action": "keydown", "key": "Enter", "ctrlKey": true}`
	HandleRemoteControlMessage([]byte(jsonKey))

	captureScreen()
}
