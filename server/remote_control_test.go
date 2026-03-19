// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"testing"
	"time"

	"github.com/mattermost/mattermost-plugin-calls/server/cluster"
	"github.com/mattermost/mattermost-plugin-calls/server/public"

	serverMocks "github.com/mattermost/mattermost-plugin-calls/server/mocks/github.com/mattermost/mattermost-plugin-calls/server/interfaces"
	pluginMocks "github.com/mattermost/mattermost-plugin-calls/server/mocks/github.com/mattermost/mattermost/server/public/plugin"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestHandleClientMessageTypeScreenOff_ClearsRemoteControl(t *testing.T) {
	mockAPI := &pluginMocks.MockAPI{}
	mockMetrics := &serverMocks.MockMetrics{}

	p := Plugin{
		MattermostPlugin: plugin.MattermostPlugin{
			API: mockAPI,
		},
		callsClusterLocks: map[string]*cluster.Mutex{},
		metrics:           mockMetrics,
		nodeID:            "nodeID",
	}

	store, tearDown := NewTestStore(t)
	t.Cleanup(tearDown)
	p.store = store

	channelID := model.NewId()
	userID := model.NewId()
	connID := "session_id"

	// Mocking config
	p.configuration = &configuration{
		ClientConfig: ClientConfig{
			AllowScreenSharing: model.NewPointer(true),
		},
	}

	// Create a call with screen sharing and remote control active
	err := p.store.CreateCall(&public.Call{
		ID:        model.NewId(),
		ChannelID: channelID,
		StartAt:   time.Now().UnixMilli(),
		Props: public.CallProps{
			ScreenSharingSessionID: connID,
			RemoteControlSessionID: "controller_id",
		},
	})
	require.NoError(t, err)

	// Mock session
	us := &session{
		userID:         userID,
		channelID:      channelID,
		originalConnID: connID,
		connID:         connID,
	}

	msg := clientMessage{
		Type: clientMessageTypeScreenOff,
	}

	mockAPI.On("LogDebug", mock.Anything, mock.Anything, mock.Anything,
		mock.Anything, mock.Anything, mock.Anything, mock.Anything,
		mock.Anything, mock.Anything, mock.Anything, mock.Anything)
	mockAPI.On("KVSetWithOptions", mock.Anything, mock.Anything, mock.Anything).Return(true, nil)
	mockAPI.On("KVDelete", mock.Anything).Return(nil)
	mockMetrics.On("ObserveClusterMutexGrabTime", mock.Anything, mock.Anything)
	mockMetrics.On("ObserveClusterMutexLockedTime", mock.Anything, mock.Anything)
	mockMetrics.On("ObserveAppHandlersTime", mock.Anything, mock.Anything)
	mockMetrics.On("IncWebSocketEvent", "out", mock.Anything)
	mockAPI.On("PublishWebSocketEvent", mock.Anything, mock.Anything, mock.Anything).Return()

	err = p.handleClientMessageTypeScreen(us, msg, "nodeID")
	require.NoError(t, err)

	// Verify state
	state, err := p.getCallState(channelID, true)
	require.NoError(t, err)
	require.Equal(t, "", state.Call.Props.ScreenSharingSessionID)
	require.Equal(t, "", state.Call.Props.RemoteControlSessionID)
}

func TestRemoteControlEventValidation(t *testing.T) {
	t.Run("valid events", func(t *testing.T) {
		events := []public.RemoteControlEvent{
			{Action: "move", X: 0.5, Y: 0.5},
			{Action: "mousedown", X: 0, Y: 0, Button: 0},
			{Action: "mouseup", X: 1, Y: 1},
			{Action: "scroll", DeltaX: 10, DeltaY: 20},
			{Action: "keydown", Key: "Enter"},
			{Action: "keyup", Key: "A"},
		}
		for _, ev := range events {
			require.NoError(t, ev.Validate())
		}
	})

	t.Run("invalid coordinates", func(t *testing.T) {
		events := []public.RemoteControlEvent{
			{Action: "move", X: -0.1, Y: 0.5},
			{Action: "move", X: 1.1, Y: 0.5},
			{Action: "mousedown", X: 0.5, Y: -0.01},
			{Action: "mouseup", X: 0.5, Y: 1.01},
		}
		for _, ev := range events {
			require.Error(t, ev.Validate())
		}
	})

	t.Run("invalid action", func(t *testing.T) {
		ev := public.RemoteControlEvent{Action: "hack"}
		require.Error(t, ev.Validate())
	})
}
