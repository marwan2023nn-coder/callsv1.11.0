package main

import (
	"testing"
	"time"

	"github.com/mattermost/mattermost-plugin-calls/server/cluster"
	"github.com/mattermost/mattermost-plugin-calls/server/db"
	"github.com/mattermost/mattermost-plugin-calls/server/public"

	serverMocks "github.com/mattermost/mattermost-plugin-calls/server/mocks/github.com/mattermost/mattermost-plugin-calls/server/interfaces"
	pluginMocks "github.com/mattermost/mattermost-plugin-calls/server/mocks/github.com/mattermost/mattermost/server/public/plugin"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestRemoteControlEventValidation(t *testing.T) {
	t.Run("valid events", func(t *testing.T) {
		events := []public.RemoteControlEvent{
			{Action: "move", X: 0.5, Y: 0.5},
			{Action: "mousedown", X: 0.1, Y: 0.9},
			{Action: "mouseup", X: 1.0, Y: 0.0},
			{Action: "scroll", DeltaX: 10, DeltaY: -10},
			{Action: "keydown", Key: "Enter"},
			{Action: "keyup", Key: "Escape"},
		}

		for _, ev := range events {
			require.NoError(t, ev.Validate())
		}
	})

	t.Run("invalid coordinates", func(t *testing.T) {
		events := []public.RemoteControlEvent{
			{Action: "move", X: -0.1, Y: 0.5},
			{Action: "move", X: 1.1, Y: 0.5},
			{Action: "mousedown", X: 0.5, Y: -1.0},
			{Action: "mouseup", X: 0.5, Y: 2.0},
		}

		for _, ev := range events {
			require.Error(t, ev.Validate())
		}
	})

	t.Run("invalid action", func(t *testing.T) {
		ev := public.RemoteControlEvent{Action: "hack", X: 0.5, Y: 0.5}
		require.Error(t, ev.Validate())
	})
}

func TestHandleClientMessageTypeScreenOff_ClearsRemoteControl(t *testing.T) {
	mockAPI := &pluginMocks.MockAPI{}
	mockMetrics := &serverMocks.MockMetrics{}

	p := Plugin{
		MattermostPlugin: plugin.MattermostPlugin{
			API: mockAPI,
		},
		callsClusterLocks: map[string]*cluster.Mutex{},
		metrics:           mockMetrics,
	}

	store, tearDown := NewTestStore(t)
	t.Cleanup(tearDown)
	p.store = store

	channelID := model.NewId()
	userID := model.NewId()
	connID := model.NewId()
	controllerConnID := model.NewId()

	// 1. Setup active call with screen sharing and remote control
	call := &public.Call{
		ID:        model.NewId(),
		ChannelID: channelID,
		StartAt:   time.Now().UnixMilli(),
		Props: public.CallProps{
			ScreenSharingSessionID: connID,
			RemoteControlSessionID: controllerConnID,
		},
	}
	require.NoError(t, p.store.CreateCall(call))

	us := &session{
		userID:         userID,
		channelID:      channelID,
		connID:         connID,
		originalConnID: connID,
	}

	msg := clientMessage{
		Type: clientMessageTypeScreenOff,
	}

	// Mocking expectations
	mockAPI.On("KVSetWithOptions", "mutex_call_"+channelID, mock.Anything, mock.Anything).Return(true, nil)
	mockAPI.On("KVDelete", "mutex_call_"+channelID).Return(nil)
	mockMetrics.On("ObserveClusterMutexGrabTime", mock.Anything, mock.Anything)
	mockMetrics.On("ObserveClusterMutexLockedTime", mock.Anything, mock.Anything)

	// Expect WebSocket event for screen off
	mockMetrics.On("IncWebSocketEvent", "out", wsEventUserScreenOff).Once()
	mockAPI.On("PublishWebSocketEvent", wsEventUserScreenOff, mock.Anything, mock.Anything).Once()

	// Expect WebSocket event for remote control off (this is what we are testing)
	mockMetrics.On("IncWebSocketEvent", "out", wsEventHostRemoteControlOff).Once()
	mockAPI.On("PublishWebSocketEvent", wsEventHostRemoteControlOff, mock.Anything, mock.Anything).Once()

	// 2. Trigger screen off
	err := p.handleClientMessageTypeScreen(us, msg, "")
	require.NoError(t, err)

	// 3. Verify state
	updatedCall, err := p.store.GetCall(call.ID, db.GetCallOpts{})
	require.NoError(t, err)
	require.Empty(t, updatedCall.Props.ScreenSharingSessionID)
	require.Empty(t, updatedCall.Props.RemoteControlSessionID, "RemoteControlSessionID should be cleared when screen sharing stops")
}
