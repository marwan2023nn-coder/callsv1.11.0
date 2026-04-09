// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ChangeEvent} from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';
import {LabelRow, leftCol, rightCol} from 'src/components/admin_console_settings/common';
import manifest from 'src/manifest';
import {callsConfig, callsConfigEnvOverrides} from 'src/selectors';
import {CustomComponentProps} from 'src/types/mattermost-webapp';

const DefaultOutgoingRingbackSound = (props: CustomComponentProps) => {
    const {formatMessage} = useIntl();
    const config = useSelector(callsConfig);
    const overrides = useSelector(callsConfigEnvOverrides);
    const overridden = 'DefaultOutgoingRingbackSound' in overrides;

    const fallbackOptions: Array<{display_name: string; value: string}> = [
        {display_name: 'Default (ring.mp3)', value: 'default'},
        {display_name: 'Dynamic', value: 'builtin:Dynamic'},
        {display_name: 'Calm', value: 'builtin:Calm'},
        {display_name: 'Urgent', value: 'builtin:Urgent'},
        {display_name: 'Cheerful', value: 'builtin:Cheerful'},
    ];

    // Webapp doesn't pass the options; read them from manifest settings.
    const settingsSchema = manifest.settings_schema as {settings?: Array<{key: string; options?: Array<{display_name: string; value: string}>}>} | undefined;
    const rawOptions = (settingsSchema?.settings?.find((setting) => (
        setting.key === 'DefaultOutgoingRingbackSound'
    ))?.options || fallbackOptions) as Array<{display_name: string; value: string}>;

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        props.onChange(props.id, e.target.value);
    };

    // Use the value from config if it's overridden by environment variable.
    const value = overridden ? (config.DefaultOutgoingRingbackSound || '') : (props.value ?? '');

    const disabled = props.disabled || overridden;

    return (
        <div
            data-testid={props.id}
            className='form-group'
        >
            <div className={'control-label ' + leftCol}>
                <LabelRow>
                    <label
                        data-testid={props.id + 'label'}
                        htmlFor={props.id}
                    >
                        {formatMessage({id: 'calls.default_outgoing_ringback_sound.title', defaultMessage: 'Default outgoing ringback sound'})}
                    </label>
                </LabelRow>
            </div>
            <div className={rightCol}>
                <select
                    data-testid={props.id + 'dropdown'}
                    className={disabled ? 'form-control disabled' : 'form-control'}
                    id={props.id}
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                >
                    {rawOptions.map(({display_name, value: optValue}) => (
                        <option
                            value={optValue}
                            key={optValue}
                        >
                            {display_name}
                        </option>
                    ))}
                </select>
                <div
                    data-testid={props.id + 'help-text'}
                    className='help-text'
                >
                    {formatMessage({
                        id: 'calls.default_outgoing_ringback_sound.description',
                        defaultMessage: 'The default sound to play while placing a call when the user has not selected a custom ringback sound.',
                    })}
                </div>

                {overridden &&
                <div className='alert alert-warning'>
                    {formatMessage({defaultMessage: 'This setting has been set through an environment variable. It cannot be changed through the System Console.'})}
                </div>
                }
            </div>
        </div>
    );
};

export default DefaultOutgoingRingbackSound;
