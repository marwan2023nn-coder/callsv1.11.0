// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';
import {hostLowerHand, hostMake, hostMute, hostRemoteControlOff, hostRemoteControlOn, hostScreenOff} from 'src/actions';
import {DropdownMenuItem, DropdownMenuSeparator} from 'src/components/dot_menu/dot_menu';
import MinusCircleOutlineIcon from 'src/components/icons/minus_circle_outline';
import MonitorAccount from 'src/components/icons/monitor_account';
import MutedIcon from 'src/components/icons/muted_icon';
import ScreenIcon from 'src/components/icons/screen_icon';
import UnraisedHandIcon from 'src/components/icons/unraised_hand';
import UnshareScreenIcon from 'src/components/icons/unshare_screen';
import {idForCurrentCall, remoteControlSessionIDForCurrentCall, screenSharingSessionIDForCurrentCall} from 'src/selectors';
import styled from 'styled-components';

type Props = {
    callID?: string;
    userID: string;
    sessionID: string;
    isMuted: boolean;
    isSharingScreen: boolean;
    isHandRaised: boolean;
    isHost: boolean;
    onRemove: () => void;
}

export const HostControlsMenu = ({
    callID,
    userID,
    sessionID,
    isMuted,
    isSharingScreen,
    isHandRaised,
    isHost,
    onRemove,
}: Props) => {
    const {formatMessage} = useIntl();
    const currentCallID = useSelector(idForCurrentCall);
    const screenSharingSessionID = useSelector(screenSharingSessionIDForCurrentCall);
    const remoteControlSessionID = useSelector(remoteControlSessionIDForCurrentCall);

    if (!callID) {
        return null;
    }

    const isSharer = window.callsClient?.getSessionID() === screenSharingSessionID;
    const canGrantRemoteControl = isSharer && screenSharingSessionID && !remoteControlSessionID && !isSharingScreen;
    const canRevokeRemoteControl = (isSharer || isHost) && remoteControlSessionID === sessionID;

    const muteUnmute = isMuted ? null : (
        <DropdownMenuItem onClick={() => hostMute(callID, sessionID)}>
            <MutedIcon
                data-testid={'host-mute'}
                fill='var(--center-channel-color-56)'
                style={{width: '16px', height: '16px'}}
            />
            {formatMessage({id: '8isok9', defaultMessage: 'Mute participant'})}
        </DropdownMenuItem>
    );

    const showingAtLeastOne = !isMuted || isSharingScreen || isHandRaised || !isHost;

    return (
        <>
            {muteUnmute}
            {isSharingScreen &&
                <DropdownMenuItem onClick={() => hostScreenOff(callID, sessionID)}>
                    <UnshareScreenIcon
                        fill='var(--center-channel-color-56)'
                        style={{width: '16px', height: '16px'}}
                    />
                    {formatMessage({id: 'eC6XJY', defaultMessage: 'Stop screen share'})}
                </DropdownMenuItem>
            }
            {isHandRaised &&
                <DropdownMenuItem onClick={() => hostLowerHand(callID, sessionID)}>
                    <UnraisedHandIcon
                        fill='var(--center-channel-color-56)'
                        style={{width: '16px', height: '16px'}}
                    />
                    {formatMessage({id: 'Cbb/An', defaultMessage: 'Lower hand'})}
                </DropdownMenuItem>
            }
            {canGrantRemoteControl &&
                <DropdownMenuItem onClick={() => hostRemoteControlOn(callID, sessionID)}>
                    <ScreenIcon
                        fill='var(--center-channel-color-56)'
                        style={{width: '16px', height: '16px'}}
                    />
                    {formatMessage({id: 'Ld/051', defaultMessage: 'Grant remote control'})}
                </DropdownMenuItem>
            }
            {canRevokeRemoteControl &&
                <DropdownMenuItem onClick={() => hostRemoteControlOff(callID)}>
                    <ScreenIcon
                        fill='var(--center-channel-color-56)'
                        style={{width: '16px', height: '16px'}}
                    />
                    {formatMessage({id: 'dxd4Xp', defaultMessage: 'Revoke remote control'})}
                </DropdownMenuItem>
            }
            {!isHost &&
                <DropdownMenuItem onClick={() => hostMake(callID, userID)}>
                    <MonitorAccount
                        fill='var(--center-channel-color-56)'
                        style={{width: '16px', height: '16px'}}
                    />
                    {formatMessage({id: 'HBa/E5', defaultMessage: 'Make host'})}
                </DropdownMenuItem>
            }
            {showingAtLeastOne &&
                <DropdownMenuSeparator/>
            }
            <DropdownMenuItem onClick={onRemove}>
                <MinusCircleOutlineIcon
                    fill='var(--dnd-indicator)'
                    style={{width: '16px', height: '16px'}}
                />
                <RedText>{formatMessage({id: 'BI2zH5', defaultMessage: 'Remove from call'})}</RedText>
            </DropdownMenuItem>
        </>
    );
};

const RedText = styled.span`
    color: var(--dnd-indicator);
`;
