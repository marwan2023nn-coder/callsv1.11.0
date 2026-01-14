// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { Post } from '@mattermost/types/posts';
import { GlobalState } from '@mattermost/types/store';
import { UserProfile } from '@mattermost/types/users';
import { DateTime } from 'luxon';
import { getUser } from 'mattermost-redux/selectors/entities/users';
import React, { useCallback } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import ConnectedProfiles from 'src/components/connected_profiles';
import DotMenu, { DotMenuButton } from 'src/components/dot_menu/dot_menu';
import ActiveCallIcon from 'src/components/icons/active_call_icon';
import CallIcon from 'src/components/icons/call_icon';
import CompassIcon from 'src/components/icons/compassIcon';
import LeaveCallIcon from 'src/components/icons/leave_call_icon';
import { useDismissJoin } from 'src/components/incoming_calls/hooks';
import { LeaveCallMenu } from 'src/components/leave_call_menu';
import { Header, SubHeader } from 'src/components/shared';
import Timestamp from 'src/components/timestamp';
import { idForCallInChannel } from 'src/selectors';
import {
    callStartedTimestampFn,
    getCallPropsFromPost,
    getUserDisplayName,
    untranslatable,
} from 'src/utils';
import styled from 'styled-components';

interface Props {
    post: Post,
    connectedID: string,
    profiles: UserProfile[],
    isCloudPaid: boolean,
    maxParticipants: number,
    militaryTime: boolean,
    compactDisplay: boolean,
    isRHS: boolean,
    isHost: boolean,
}

const PostType = ({
    post,
    connectedID,
    profiles,
    isCloudPaid,
    maxParticipants,
    militaryTime,
    compactDisplay,
    isRHS,
    isHost,
}: Props) => {
    const intl = useIntl();
    const { formatMessage } = intl;
    const hourCycle: 'h23' | 'h12' = militaryTime ? 'h23' : 'h12';
    const timeFormat = { ...DateTime.TIME_24_SIMPLE, hourCycle };

    const callProps = getCallPropsFromPost(post);

    const user = useSelector((state: GlobalState) => getUser(state, post.user_id));
    const callID = useSelector((state: GlobalState) => idForCallInChannel(state, post.channel_id)) || '';
    const [, onJoin] = useDismissJoin(post.channel_id, callID);

    const timestampFn = useCallback(() => {
        return callStartedTimestampFn(intl, callProps.start_at);
    }, [intl, callProps.start_at]);

    const onLeaveButtonClick = () => {
        const win = window.opener || window;
        const callsClient = win.callsClient;
        if (callsClient) {
            // NOTE: this also handles the desktop global widget case since the opener window
            // will have the client.
            callsClient.disconnect();
        } else if (window.desktopAPI?.leaveCall) {
            window.desktopAPI.leaveCall();
        }
    };

    const recordings = Object.values(callProps.recordings).filter((job) => Boolean(job.file_id)).map((job) => job.file_id);
    const transcriptions = Object.values(callProps.transcriptions).filter((job) => Boolean(job.file_id)).map((job) => job.file_id);

    const recordingsSubMessage = recordings.length > 0 ? (
        <ArtifactsContainer>
            <CompassIcon
                icon='file-video-outline'
                style={{ display: 'inline', fontSize: '16px' }}
            />
            <span>{formatMessage({ defaultMessage: '{count, plural, =1 {# recording} other {# recordings}}' }, { count: recordings.length })}</span>
        </ArtifactsContainer>
    ) : null;

    const transcriptionsSubMessage = recordings.length > 0 ? (
        <ArtifactsContainer>
            <CompassIcon
                icon='file-text-outline'
                style={{ display: 'inline', fontSize: '16px' }}
            />
            <span>{formatMessage({ defaultMessage: '{count, plural, =1 {# transcription} other {# transcriptions}}' }, { count: transcriptions.length })}</span>
        </ArtifactsContainer>
    ) : null;

    const duration = callProps.end_at - callProps.start_at;
    const isMissedCall = duration >= 59000 && callProps.participants.length <= 1;

    const subMessage = callProps.start_at > 0 && callProps.end_at > 0 ? (
        <>
            <span>
                {formatMessage(
                    { defaultMessage: 'بَدَأَ المكالمة في {startTime}' },
                    { startTime: DateTime.fromMillis(callProps.start_at).toLocaleString(timeFormat) },
                )}
            </span>
            <Divider>{untranslatable('•')}</Divider>
            <span>
                {formatMessage(
                    { defaultMessage: 'انتهت المكالمة في {endTime}' },
                    { endTime: DateTime.fromMillis(callProps.end_at).toLocaleString(timeFormat) },
                )}
            </span>
        </>
    ) : (
        <>
            <Timestamp
                timestampFn={timestampFn}
                interval={5000}
            />
            {untranslatable(' ')}
            {
                formatMessage({ defaultMessage: 'by {user}' }, { user: getUserDisplayName(user) })
            }
        </>
    );

    let joinButton = (
        <JoinButton onClick={onJoin}>
            <ActiveCallIcon
                fill='var(--center-channel-bg)'
                style={{ width: '16px', height: '16px' }}
            />
            <ButtonText>{formatMessage({ defaultMessage: 'الانضمام إلى المكالمة' })}</ButtonText>
        </JoinButton>
    );

    // Note: don't use isLimitRestricted because that uses current channel, and this post could be in RHS
    if (maxParticipants > 0 && profiles.length >= maxParticipants) {
        joinButton = (
            <OverlayTrigger
                placement='top'
                overlay={
                    <Tooltip id='tooltip-limit'>
                        <Header>
                            {formatMessage({ defaultMessage: 'Sorry, participants per call are currently limited to {count}.' }, { count: maxParticipants })}
                        </Header>
                        {isCloudPaid &&
                            <SubHeader>
                                {formatMessage({ defaultMessage: 'This is because calls is in the beta phase. We’re working to remove this limit soon.' })}
                            </SubHeader>
                        }
                    </Tooltip>
                }
            >
                <DisabledButton>
                    <CallIcon fill='rgba(var(--center-channel-color-rgb), 0.32)' />
                    <ButtonText>{formatMessage({ defaultMessage: 'الانضمام إلى المكالمة' })}</ButtonText>
                </DisabledButton>
            </OverlayTrigger>
        );
    }

    const compactTitle = compactDisplay && !isRHS ? <br /> : <></>;
    const title = callProps.title ? <h3 className='markdown__heading'>{callProps.title}</h3> : compactTitle;
    const callActive = callProps.end_at === 0;
    const inCall = connectedID === post.channel_id;
    const iconAndText = (
        <>
            <LeaveCallIcon style={{ fill: 'var(--button-color)', width: '18px', height: '16px' }} />
            <ButtonText>{formatMessage({ defaultMessage: 'Leave' })}</ButtonText>
        </>
    );
    const button = inCall ? (
        <DotMenu
            icon={iconAndText}
            dotMenuButton={LeaveButton}
            placement={'top'}
            portal={true}
        >
            <LeaveCallMenu
                channelID={post.channel_id}
                isHost={isHost}
                numParticipants={profiles.length}
                leaveCall={onLeaveButtonClick}
            />
        </DotMenu>
    ) : joinButton;

    return (
        <>
            {title}
            <Main data-testid={'call-thread'}>
                <SubMain>
                    <Left>
                        <CallIndicator $ended={!callActive}>
                            {callActive &&
                                <ActiveCallIcon
                                    fill='var(--online-indicator)'
                                    style={{ width: '14px', height: '14px' }}
                                />
                            }
                            {!callActive &&
                                <LeaveCallIcon
                                    fill={'rgba(var(--center-channel-color-rgb), 0.72)'}
                                    style={{ width: '24px', height: '20px' }}
                                />
                            }
                        </CallIndicator>
                        <MessageWrapper>
                            <Message>
                                {callActive &&
                                    formatMessage({ defaultMessage: 'Call started' })
                                }
                                {/* {!callActive &&
                                    formatMessage({defaultMessage: 'Call ended'})
                                } */}
                            </Message>
                            <SubMessage>{subMessage}</SubMessage>
                        </MessageWrapper>
                    </Left>
                    {(recordings.length > 0 || callActive) && <RowDivider />}
                    <Right>
                        {callActive &&
                            <>
                                <Profiles>
                                    <ConnectedProfiles
                                        profiles={profiles}
                                        size={28}
                                        fontSize={14}
                                        border={true}
                                        maxShowedProfiles={3}
                                    />
                                </Profiles>
                                {button}
                            </>
                        }
                        {recordings.length > 0 && recordingsSubMessage}
                        {transcriptions.length > 0 && transcriptionsSubMessage}
                    </Right>
                </SubMain>
            </Main>
        </>
    );
};

const Main = styled.div`
   box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: flex-start;
    background: rgb(236 236 236);
    border: 1px solid rgb(222, 224, 224);
    border-radius: 12px;
    flex: 0 0 auto;
    order: 0;
    align-self: stretch;
    color: black;
    font-family: "GraphikArabic";
    font-weight: normal;
    width: fit-content;
`;

const SubMain = styled.div`
display: inline-flex;
    @container main (inline-size < 566px) {
        flex-direction: column;
        align-items: flex-start;
    }

    &:empty {
      display: none;
    }
`;

const Left = styled.div`
   display: flex;
    justify-content: center;
    align-items: center;
    padding-left: 5px;
    padding-inline-end: 5px;
    margin-top: 3px;
    margin-bottom: 3px;
    direction: rtl;
`;

const Right = styled.div`
    display: flex;
    flex-grow: 1;
    justify-content: flex-end;
    gap: 12px;

    @container main (inline-size < 566px) {
      width: 100%;
      justify-content: space-between;
    }

    &:empty {
      display: none;
    }
`;

const RowDivider = styled.hr`
    display: none;

    @container main (inline-size < 566px) {
        &&&& {
          display: block;
          width: 100%;
          margin: 0;
          border-top: 1px solid rgba(var(--center-channel-color-rgb), 0.08);
        }
    }
`;

const CallIndicator = styled.div<{ $ended: boolean }>`
   display: inline-flex;
    justify-content: center;
    align-items: center;
    background: var(--online-indicator);
    border-radius: 100%;
    width: 30px;
    height: 30px;
`;

const MessageWrapper = styled.div`
    display: inline-flex;
    margin: 2px 0px;
    overflow: hidden;
    font-family: 'GraphikArabic';
     font-weight: normal;
`;

const Message = styled.span`
    line-height: 24px;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-inline-end: 4px;
     padding-left: 4px;
     font-family: 'GraphikArabic';
     font-weight: normal;
     font-size: 14px;
`;

const SubMessage = styled.div`
    white-space: normal;
    font-size: 14px;
    line-height: 24px;

`;

const Profiles = styled.div`
    display: flex;
    align-items: center;
`;

const Button = styled.button`
    display: flex;
    align-items: center;
    border: none;
    border-radius: 6px;
    padding: 10px 16px;
    cursor: pointer;
    background: #3cca3c;
`;
const ArtifactsContainer = styled.div`
    display: flex;
    align-items: center;
    font-size: 12px;
    line-height: 16px;
    white-space: nowrap;
    color: rgba(var(--center-channel-color-rgb), 0.72);
`;

const JoinButton = styled(Button)`
    font-size: 14px;
    line-height: 20px;
    color: var(--center-channel-bg);
    background: var(--online-indicator);
    margin: 3px;

    &:hover {
        background: linear-gradient(0deg, var(--online-indicator), var(--online-indicator)),
            linear-gradient(0deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08));
        background-blend-mode: multiply;
    }

    &:active {
        background: linear-gradient(0deg, var(--online-indicator), var(--online-indicator)),
            linear-gradient(0deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.16));
        background-blend-mode: multiply;
    }
`;

const LeaveButton = styled(DotMenuButton)`
    display: flex;
    border: none;
    border-radius: 4px;
    padding: 10px 16px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: unset;
    height: unset;
    font-size: 14px;
    line-height: 20px;
    color: var(--button-color);
    background: var(--error-text);
    margin: 4px;
    border-radius: 10px;

    &:hover {
        background: linear-gradient(0deg, var(--error-text), var(--error-text)),
            linear-gradient(0deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08));
        background-blend-mode: multiply;
        color: var(--button-color);
    }

    &:active {
        background: linear-gradient(0deg, var(--error-text), var(--error-text)),
            linear-gradient(0deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.16));
        background-blend-mode: multiply;
        color: var(--button-color);
    }
`;

const ButtonText = styled.span`
    margin: 0 8px;
    font-weight: normal;
    font-family: "GraphikArabic";
`;

const DisabledButton = styled(Button)`
    color: rgba(var(--center-channel-color-rgb), 0.32);
    background: rgba(var(--center-channel-color-rgb), 0.08);
    cursor: not-allowed;
`;

const Divider = styled.span`
    margin: 0 4px;
`;

// eslint-disable-next-line unused-imports/no-unused-vars
const RecordingsContainer = styled.div`
    display: flex;
    align-items: center;
    font-size: 12px;
    line-height: 16px;
    white-space: nowrap;
    color: #2f987e;
`;

export default PostType;
