// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import ReactSelect from 'react-select';
import styled from 'styled-components';

import {STORAGE_CALLS_OUTGOING_RINGBACK_SOUND_KEY} from 'src/constants';
import {getRingbackSoundOptions, getRingbackSoundSrc} from 'src/sounds/ringback_sounds';
import SpeakerIcon from 'src/components/icons/speaker_icon';

type SelectOption = {
    label: string;
    value: string;
};

export default function RingbackSoundSettingsSection() {
    const {formatMessage} = useIntl();
    const [active, setActive] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    const title = formatMessage({defaultMessage: 'Ringing sound'});
    const description = formatMessage({defaultMessage: 'Select the sound you will hear while waiting for the other party to answer.'});
    const editLabel = formatMessage({defaultMessage: 'Edit'});
    const saveLabel = formatMessage({defaultMessage: 'Save'});
    const cancelLabel = formatMessage({defaultMessage: 'Cancel'});
    const previewLabel = formatMessage({defaultMessage: 'Preview'});

    const options = getRingbackSoundOptions();

    useEffect(() => {
        const savedSound = window.localStorage.getItem(STORAGE_CALLS_OUTGOING_RINGBACK_SOUND_KEY) || '';
        const option = options.find((opt) => opt.value === savedSound) || options[0];
        if (option) {
            setSelectedOption(option);
        }

        return () => {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
        };
    }, []);

    const handleSave = () => {
        if (selectedOption) {
            window.localStorage.setItem(STORAGE_CALLS_OUTGOING_RINGBACK_SOUND_KEY, selectedOption.value);
        }
        setActive(false);
    };

    const handlePreview = () => {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
        }

        if (selectedOption) {
            const src = getRingbackSoundSrc(selectedOption.value);
            if (src) {
                const audio = new Audio(src);
                previewAudioRef.current = audio;
                audio.play();
            }
        }
    };

    if (!active) {
        return (
            <div
                className='section-min'
                onClick={() => setActive(!active)}
            >
                <div className='section-min__header'>
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
                        <Fieldset>
                            <SelectionWrapper>
                                <StyledReactSelect
                                    className='react-select singleSelect'
                                    classNamePrefix='react-select'
                                    options={options}
                                    clearable={false}
                                    isClearable={false}
                                    isSearchable={false}
                                    components={{IndicatorSeparator: () => null}}
                                    value={selectedOption}
                                    onChange={(opt: SelectOption) => setSelectedOption(opt)}
                                />
                                <PreviewButton
                                    className='btn btn-tertiary'
                                    onClick={handlePreview}
                                >
                                    <SpeakerIcon
                                        fill='currentColor'
                                        style={{width: '16px', height: '16px', marginRight: '8px'}}
                                    />
                                    {previewLabel}
                                </PreviewButton>
                            </SelectionWrapper>
                            <Description>{description}</Description>
                        </Fieldset>
                    </div>
                    <div className='setting-list-item'>
                        <hr/>
                        <button
                            type='submit'
                            className='btn btn-primary'
                            onClick={handleSave}
                        >
                            {saveLabel}
                        </button>
                        <button
                            className='btn btn-tertiary'
                            onClick={() => setActive(false)}
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

const StyledReactSelect = styled(ReactSelect)`
  width: 260px;
`;

const SelectionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Description = styled.span`
  margin-top: 8px;
`;

const Fieldset = styled.fieldset`
    display: flex;
    flex-direction: column;
`;

const PreviewButton = styled.button`
    display: flex;
    align-items: center;
`;
