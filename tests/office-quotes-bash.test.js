const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BASH_SCRIPT = path.join(__dirname, '../office-quotes');

describe('office-quotes (Bash version)', () => {

    // Ensure script is executable
    beforeAll(() => {
        try {
            fs.chmodSync(BASH_SCRIPT, '755');
        } catch (e) {
            console.error('Could not chmod script:', e);
        }
    });

    test('should return a random quote by default', () => {
        const output = execSync(`${BASH_SCRIPT}`).toString().trim();
        expect(output).toMatch(/^.+: .+$/);
    });

    test('should return only the quote content with -q', () => {
        const output = execSync(`${BASH_SCRIPT} -q`).toString().trim();
        // Should not contain the colon prefix (Character: )
        expect(output).not.toMatch(/^.+: .+$/);
        expect(output.length).toBeGreaterThan(0);
    });

    test('should return the correct quote count', () => {
        const output = execSync(`${BASH_SCRIPT} count`).toString().trim();
        expect(output).toMatch(/^Local: \d+ quotes$/);
    });

    test('should list all characters', () => {
        const output = execSync(`${BASH_SCRIPT} characters`).toString().trim();
        const lines = output.split('\n');
        expect(lines).toContain('Michael Scott');
        expect(lines).toContain('Dwight Schrute');
        expect(lines.length).toBeGreaterThan(5);
    });

    test('should search for quotes containing a query', () => {
        const output = execSync(`${BASH_SCRIPT} search "loyalty"`).toString().trim();
        expect(output.toLowerCase()).toContain('loyalty');
        expect(output).toContain('[Dwight Schrute]');
    });

    test('should list quotes for a specific character', () => {
        const output = execSync(`${BASH_SCRIPT} list "Dwight"`).toString().trim();
        const lines = output.split('\n');
        expect(lines.length).toBeGreaterThan(0);
        lines.forEach(line => {
            expect(line).toMatch(/^Dwight Schrute: .+$/);
        });
    });

    describe('API commands (mocked or smoke test)', () => {
        test('should return an SVG URL when using --image', () => {
            const output = execSync(`${BASH_SCRIPT} api random --image`).toString().trim();
            expect(output).toContain('https://officeapi.akashrajpurohit.com/quote/random?responseType=svg');
        });

        test('should return JSON when using api json', () => {
            const output = execSync(`${BASH_SCRIPT} api json`).toString().trim();
            try {
                const json = JSON.parse(output);
                expect(json).toHaveProperty('quote');
                expect(json).toHaveProperty('character');
            } catch (e) {
                // If API is down, it should return the error JSON defined in the script
                expect(output).toContain('"error"');
            }
        });
    });
});
