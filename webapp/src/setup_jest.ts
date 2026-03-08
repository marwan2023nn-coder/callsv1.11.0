// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import '@testing-library/jest-dom';

import {TextDecoder, TextEncoder} from 'util';

global.TextEncoder = TextEncoder;

// @ts-ignore
global.TextDecoder = TextDecoder;

// Mock require.context for Jest
if (typeof (require as any).context === 'undefined') {
    const context = () => {
        const res = (key: string) => ({default: key});
        res.keys = () => [];
        res.resolve = (key: string) => key;
        res.id = 'mock';
        return res;
    };
    (require as any).context = context;
}
