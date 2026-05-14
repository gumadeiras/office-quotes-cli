const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = require('../office-quotes.js');

const NODE_SCRIPT = path.join(__dirname, '../office-quotes.js');

describe('office-quotes (Node.js CLI Integration)', () => {

    test('should return a random quote in JSON format by default', () => {
        const output = execSync(`node ${NODE_SCRIPT}`).toString().trim();
        const json = JSON.parse(output);
        expect(json).toHaveProperty('quote');
        expect(json).toHaveProperty('character');
        expect(typeof json.quote).toBe('string');
    });

    test('should return only plain text with --quiet', () => {
        const output = execSync(`node ${NODE_SCRIPT} --quiet`).toString().trim();
        // Should not be parsable as JSON
        expect(() => JSON.parse(output)).toThrow();
        expect(output.length).toBeGreaterThan(5);
    });

    test('should report the package version', () => {
        const output = execSync(`node ${NODE_SCRIPT} --version`).toString().trim();
        const packageJson = require('../package.json');
        expect(output).toBe(packageJson.version);
    });

    test('should fetch episode metadata from API', () => {
        const output = execSync(`node ${NODE_SCRIPT} episode 1/1`).toString().trim();
        const json = JSON.parse(output);
        expect(json.season).toBe(1);
        expect(json.episode).toBe(1);
        expect(json.title).toBe('Pilot');
    });

    test('should search local quotes and return plain text', () => {
        const output = execSync(`node ${NODE_SCRIPT} search "ignorant slut"`).toString().trim();
        expect(output).toContain('Michael Scott');
        expect(output).toContain('ignorant slut');
    });

    test('should switch to API mode for format flags', async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'test-quote',
                    quote: 'Bears, beets, Battlestar Galactica.',
                    character: 'Dwight Schrute',
                    character_avatar_url: 'https://example.invalid/dwight.png',
                    episode: 1,
                    season: 3
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                text: async () => '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><rect width="500" height="300" fill="#111"/><text class="quote-text" x="24" y="80" fill="#fff">Bears, beets, Battlestar Galactica.</text><text class="character-info" x="24" y="130" fill="#fff">Dwight Schrute</text></svg>'
            });

        try {
            // We use --source local but add --format. It should still work by switching to API.
            const parsed = app.parseArgs(['--source', 'local', '--format', 'svg', '--quiet']);
            expect(parsed.mode).toBe('api');

            const json = await app.getApiQuote({ outputFormat: parsed.outputFormat, quiet: true });
            expect(json).toHaveProperty('imagePath');
            expect(json.format).toBe('svg');
            expect(fs.existsSync(json.imagePath)).toBe(true);

            if (fs.existsSync(json.imagePath)) fs.unlinkSync(json.imagePath);
        } finally {
            global.fetch = originalFetch;
        }
    });

    test('should gracefully handle non-existent commands', () => {
        let errorCaught = false;
        try {
            execSync(`node ${NODE_SCRIPT} nonexistent_command`, { stdio: 'pipe' });
        } catch (error) {
            errorCaught = true;
            expect(error.status).toBe(1);
            expect(error.stderr.toString()).toContain('Unknown command');
        }
        expect(errorCaught).toBe(true);
    });
});
