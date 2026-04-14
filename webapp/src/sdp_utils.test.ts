// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {setSDPMaxVideoBW} from './sdp_utils';

describe('sdp_utils', () => {
    describe('setSDPMaxVideoBW', () => {
        const originalUserAgent = window.navigator.userAgent;

        afterEach(() => {
            Object.defineProperty(window.navigator, 'userAgent', {value: originalUserAgent, configurable: true});
        });

        it('should add bandwidth modifier to a single video stream', () => {
            const sdp = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=rtpmap:96 VP8/90000\r\n';
            const expected = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nb=AS:2000\r\na=rtpmap:96 VP8/90000\r\n';
            expect(setSDPMaxVideoBW(sdp, 2000)).toEqual(expected);
        });

        it('should update existing bandwidth modifier', () => {
            const sdp = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nb=AS:1000\r\na=rtpmap:96 VP8/90000\r\n';
            const expected = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nb=AS:2000\r\na=rtpmap:96 VP8/90000\r\n';
            expect(setSDPMaxVideoBW(sdp, 2000)).toEqual(expected);
        });

        it('should add bandwidth modifier to multiple video streams', () => {
            const sdp = [
                'v=0',
                'm=audio 9 UDP/TLS/RTP/SAVPF 111',
                'a=rtpmap:111 opus/48000/2',
                'm=video 9 UDP/TLS/RTP/SAVPF 96',
                'a=rtpmap:96 VP8/90000',
                'm=video 9 UDP/TLS/RTP/SAVPF 97',
                'a=rtpmap:97 VP8/90000',
            ].join('\r\n') + '\r\n';

            const expected = [
                'v=0',
                'm=audio 9 UDP/TLS/RTP/SAVPF 111',
                'a=rtpmap:111 opus/48000/2',
                'm=video 9 UDP/TLS/RTP/SAVPF 96',
                'b=AS:2000',
                'a=rtpmap:96 VP8/90000',
                'm=video 9 UDP/TLS/RTP/SAVPF 97',
                'b=AS:2000',
                'a=rtpmap:97 VP8/90000',
            ].join('\r\n') + '\r\n';

            expect(setSDPMaxVideoBW(sdp, 2000)).toEqual(expected);
        });

        it('should handle Firefox TIAS modifier', () => {
            Object.defineProperty(window.navigator, 'userAgent', {value: 'Firefox', configurable: true});
            const sdp = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=rtpmap:96 VP8/90000\r\n';
            const expected = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nb=TIAS:2000000\r\na=rtpmap:96 VP8/90000\r\n';
            expect(setSDPMaxVideoBW(sdp, 2000)).toEqual(expected);
        });

        it('should append bandwidth line if no attributes exist in section', () => {
            const sdp = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n';
            const expected = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nb=AS:2000\r\n';
            expect(setSDPMaxVideoBW(sdp, 2000)).toEqual(expected);
        });

        it('should handle middle section with no attributes followed by another section', () => {
            const sdp = [
                'v=0',
                'm=video 9 UDP/TLS/RTP/SAVPF 96',
                'm=audio 9 UDP/TLS/RTP/SAVPF 111',
                'a=rtpmap:111 opus/48000/2',
            ].join('\r\n') + '\r\n';

            const expected = [
                'v=0',
                'm=video 9 UDP/TLS/RTP/SAVPF 96',
                'b=AS:2000',
                'm=audio 9 UDP/TLS/RTP/SAVPF 111',
                'a=rtpmap:111 opus/48000/2',
            ].join('\r\n') + '\r\n';

            expect(setSDPMaxVideoBW(sdp, 2000)).toEqual(expected);
        });
    });
});

it('should not add empty lines', () => {
    const sdp = 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n';
    const res = setSDPMaxVideoBW(sdp, 2000);
    const lines = res.split('\r\n');
    expect(lines.filter(l => l === '').length).toBe(1); // Only the trailing one
});
