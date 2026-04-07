// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';
import {mockStore} from 'src/testUtils';

import RingbackSoundSettingsSection from './ringback_sound_settings_section';

describe('RingbackSoundSettingsSection', () => {
    const renderComponent = (storeOverrides = {}) => {
        const store = mockStore({
            ...storeOverrides,
        });

        return render(
            <Provider store={store}>
                <IntlProvider locale='en'>
                    <RingbackSoundSettingsSection/>
                </IntlProvider>
            </Provider>,
        );
    };

    beforeEach(() => {
        window.localStorage.clear();
        jest.clearAllMocks();
    });

    it('should render correctly in collapsed state', () => {
        renderComponent();

        expect(screen.getByText('Ringing sound')).toBeInTheDocument();
        expect(screen.getByText('Select the sound you will hear while waiting for the other party to answer.')).toBeInTheDocument();
    });

    it('should switch to expanded state when clicked', async () => {
        renderComponent();

        await userEvent.click(screen.getByText('Ringing sound'));

        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should save selected sound to localStorage', async () => {
        renderComponent();

        await userEvent.click(screen.getByText('Ringing sound'));

        // Open react-select - using a more robust way to find it
        const select = screen.getByDisplayValue('');
        await userEvent.click(select);

        // Select 'Calm' (one of the builtin sounds)
        const option = await screen.findByText('Calm');
        await userEvent.click(option);

        await userEvent.click(screen.getByText('Save'));

        expect(window.localStorage.getItem('calls_outgoing_ringback_sound')).toBe('builtin:Calm');
    });

    it('should close expanded state when clicking Cancel', async () => {
        renderComponent();

        await userEvent.click(screen.getByText('Ringing sound'));
        expect(screen.getByText('Save')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
});
