// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';
import {STORAGE_CALLS_OUTGOING_RINGBACK_SOUND_KEY} from 'src/constants';
import {pluginId} from 'src/manifest';
import {defaultOutgoingRingbackSound} from 'src/selectors';
import RingSound from 'src/sounds/ring.mp3';
import {getRingbackSoundOptions, getRingbackSoundSrc} from 'src/sounds/ringback_sounds';

const PREVIEW_DURATION_MS = 3000;

export default function RingbackSoundSettingsSection() {
    const {formatMessage} = useIntl();
    const [active, setActive] = useState(false);

    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const title = formatMessage({id: 'calls.ringback_sound.title', defaultMessage: 'Ringing sound'});
    const description = formatMessage({id: 'calls.ringback_sound.description', defaultMessage: 'Choose the sound used while placing a call.'});
    const editLabel = formatMessage({id: 'calls.ringback_sound.edit', defaultMessage: 'Edit'});

    const soundOptions = getRingbackSoundOptions();
    const defaultSound = useSelector(defaultOutgoingRingbackSound);
    const normalizedDefaultSound = defaultSound === 'default' ? '' : defaultSound;

    const getOptionLabel = (value: string, label: string) => {
        switch (value) {
        case 'builtin:Dynamic':
            return formatMessage({id: 'calls.ringback_sound.builtin.dynamic', defaultMessage: 'Dynamic'});
        case 'builtin:Calm':
            return formatMessage({id: 'calls.ringback_sound.builtin.calm', defaultMessage: 'Calm'});
        case 'builtin:Urgent':
            return formatMessage({id: 'calls.ringback_sound.builtin.urgent', defaultMessage: 'Urgent'});
        case 'builtin:Cheerful':
            return formatMessage({id: 'calls.ringback_sound.builtin.cheerful', defaultMessage: 'Cheerful'});
        default:
            return label;
        }
    };

    const resolveDefaultLabel = () => {
        if (!normalizedDefaultSound) {
            return formatMessage({id: 'calls.ringback_sound.default', defaultMessage: 'Default (ring.mp3)'});
        }

        const defaultOption = soundOptions.find((opt) => opt.value === normalizedDefaultSound);
        const label = defaultOption ? getOptionLabel(defaultOption.value, defaultOption.label) : normalizedDefaultSound;
        return formatMessage({id: 'calls.ringback_sound.default_with_value', defaultMessage: 'Default ({defaultSound})'}, {defaultSound: label});
    };

    const defaultOptionLabel = resolveDefaultLabel();

    const getSavedValue = () => {
        return window.localStorage.getItem(STORAGE_CALLS_OUTGOING_RINGBACK_SOUND_KEY) || '';
    };

    const [selectedSound, setSelectedSound] = useState(getSavedValue());

    useEffect(() => {
        if (active) {
            setSelectedSound(getSavedValue());
        }
    }, [active]);

    useEffect(() => {
        if (!active) {
            stopPreview();
        }

        return () => {
            stopPreview();
        };
    }, [active]);

    const handleSave = () => {
        if (selectedSound) {
            window.localStorage.setItem(STORAGE_CALLS_OUTGOING_RINGBACK_SOUND_KEY, selectedSound);
        } else {
            window.localStorage.removeItem(STORAGE_CALLS_OUTGOING_RINGBACK_SOUND_KEY);
        }
        setActive(false);
    };

    const stopPreview = () => {
        if (previewTimerRef.current) {
            clearTimeout(previewTimerRef.current);
            previewTimerRef.current = null;
        }

        if (previewAudioRef.current) {
            try {
                previewAudioRef.current.pause();
                previewAudioRef.current.src = '';
                previewAudioRef.current.remove();
            } catch {
                // ignore
            }
            previewAudioRef.current = null;
        }
    };

    const resolvePlayableSrc = (src: string) => {
        if (src.indexOf('/') === 0) {
            return `${window.basename || ''}/static/plugins/${pluginId}${src}`;
        }
        return src;
    };

    const handlePreview = async () => {
        stopPreview();

        const previewKey = selectedSound || normalizedDefaultSound;
        const selectedSrc = previewKey ? getRingbackSoundSrc(previewKey) : '';
        const src = resolvePlayableSrc(selectedSrc || RingSound);

        const audio = new Audio(src);
        previewAudioRef.current = audio;
        try {
            await audio.play();
        } catch {
            // ignore
        }

        previewTimerRef.current = setTimeout(() => {
            stopPreview();
        }, PREVIEW_DURATION_MS);
    };

    if (!active) {
        return (
            <div
                className='section-min'
                onClick={() => setActive(!active)}
            >
                <div className='secion-min__header'>
                    <h4 className='section-min__title'>
                        <span>{title}</span>
                    </h4>
                    <button
                        className='color--link style--none section-min__edit'
                        aria-labelledby=''
                        aria-expanded={active}
                    >
                        <i
                            className='icon-pencil-outline'
                            title={editLabel}
                        />
                        <span>{editLabel}</span>
                    </button>
                </div>
                <div className='section-min__describe'>
                    <span>{description}</span>
                </div>
            </div>
        );
    }

    return (
        <section className='section-max form-horizontal'>
            <h4 className='col-sm-12 section-title'>
                <span>{title}</span>
            </h4>
            <div className='sectionContent col-sm-10 col-sm-offset-2'>
                <div
                    tabIndex={-1}
                    className='setting-list'
                >
                    <div className='setting-list-item'>
                        <fieldset>
                            <div className='form-group'>
                                <label
                                    className='control-label col-sm-4'
                                >
                                    {title}
                                </label>
                                <div className='col-sm-8'>
                                    <select
                                        className='form-control'
                                        value={selectedSound}
                                        onChange={(e) => setSelectedSound(e.target.value)}
                                    >
                                        <option value=''>{defaultOptionLabel}</option>
                                        {soundOptions.map((opt) => (
                                            <option
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {getOptionLabel(opt.value, opt.label)}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type='button'
                                        className='btn btn-tertiary mt-3'
                                        onClick={handlePreview}
                                    >
                                        {formatMessage({id: 'calls.ringback_sound.preview', defaultMessage: 'Preview'})}
                                    </button>
                                    <div className='help-text'>
                                        <span>{description}</span>
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <div className='setting-list-item'>
                        <hr/>
                        <button
                            type='submit'
                            className='btn btn-primary'
                            onClick={handleSave}
                        >
                            {formatMessage({id: 'calls.ringback_sound.save', defaultMessage: 'Save'})}
                        </button>
                        <button
                            className='btn btn-tertiary'
                            onClick={() => setActive(false)}
                        >
                            {formatMessage({id: 'calls.ringback_sound.cancel', defaultMessage: 'Cancel'})}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
