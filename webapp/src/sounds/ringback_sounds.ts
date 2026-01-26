// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import callsCalm from '../../mattermost-webapp/webapp/channels/src/sounds/calls_calm.mp3';
import callsCheerful from '../../mattermost-webapp/webapp/channels/src/sounds/calls_cheerful.mp3';
import callsDynamic from '../../mattermost-webapp/webapp/channels/src/sounds/calls_dynamic.mp3';
import callsUrgent from '../../mattermost-webapp/webapp/channels/src/sounds/calls_urgent.mp3';

declare const require: any;

const EXCLUDED_FILENAMES = new Set(['ring.mp3', 'join_self.mp3', 'join_user.mp3', 'leave_self.mp3']);

const soundsContext = require.context('./', false, /\.mp3$/);

const ringbackSoundsMap: Record<string, string> = {};

soundsContext.keys().forEach((key: string) => {
    const filename = String(key).replace('./', '');
    const mod = soundsContext(key);
    ringbackSoundsMap[filename] = mod?.default ?? mod;
});

type RingbackSoundOption = {
    label: string;
    value: string;
};

const BUILTIN_RINGBACK_SOUNDS: Array<{label: string; value: string; src: string}> = [
    {label: 'Dynamic', value: 'builtin:Dynamic', src: callsDynamic},
    {label: 'Calm', value: 'builtin:Calm', src: callsCalm},
    {label: 'Urgent', value: 'builtin:Urgent', src: callsUrgent},
    {label: 'Cheerful', value: 'builtin:Cheerful', src: callsCheerful},
];

const builtinRingbackSoundsMap: Record<string, string> = BUILTIN_RINGBACK_SOUNDS.reduce((acc, s) => {
    acc[s.value] = s.src;
    return acc;
}, {} as Record<string, string>);

export function getRingbackSoundFilenames(): string[] {
    return Object.keys(ringbackSoundsMap).filter((f) => !EXCLUDED_FILENAMES.has(f)).sort();
}

export function getRingbackSoundOptions(): RingbackSoundOption[] {
    const builtin = BUILTIN_RINGBACK_SOUNDS.map((s) => ({label: s.label, value: s.value}));
    const custom = getRingbackSoundFilenames().map((filename) => ({label: filename, value: filename}));
    return [...builtin, ...custom];
}

export function getRingbackSoundSrc(soundKey: string): string | undefined {
    return builtinRingbackSoundsMap[soundKey] || ringbackSoundsMap[soundKey];
}
