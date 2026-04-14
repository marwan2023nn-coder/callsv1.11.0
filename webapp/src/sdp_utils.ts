// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * setSDPMaxVideoBW updates the maximum video bandwidth for all video sections in the SDP.
 * It ensures that bandwidth (b=) lines are correctly placed after the m= line and before any a= lines.
 *
 * @param sdp The SDP string to modify.
 * @param bandwidth The bandwidth value in kbps.
 * @returns The modified SDP string.
 */
export function setSDPMaxVideoBW(sdp: string, bandwidth: number): string {
    let modifier = 'AS';
    let val = bandwidth;
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        modifier = 'TIAS';
        val = (bandwidth >>> 0) * 1000;
    }

    const lines = sdp.split(/\r?\n/);
    const newLines: string[] = [];
    let inVideoSection = false;
    let foundModifierInSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === '') {
            continue;
        }

        if (line.startsWith('m=')) {
            if (inVideoSection && !foundModifierInSection) {
                newLines.push('b=' + modifier + ':' + val);
            }

            inVideoSection = line.startsWith('m=video ');
            foundModifierInSection = false;
            newLines.push(line);
            continue;
        }

        if (inVideoSection) {
            if (line.startsWith('b=' + modifier + ':')) {
                newLines.push('b=' + modifier + ':' + val);
                foundModifierInSection = true;
                continue;
            }

            if (line.startsWith('a=') && !foundModifierInSection) {
                newLines.push('b=' + modifier + ':' + val);
                foundModifierInSection = true;
            }
        }

        newLines.push(line);
    }

    if (inVideoSection && !foundModifierInSection) {
        newLines.push('b=' + modifier + ':' + val);
    }

    let result = newLines.join('\r\n');
    if (!result.endsWith('\r\n')) {
        result += '\r\n';
    }
    return result;
}
