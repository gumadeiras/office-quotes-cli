const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

    test('should switch to API mode for format flags', () => {
        // We use --source local but add --format. It should still work by switching to API.
        // We check if it returns a path in /tmp (or os path)
        const output = execSync(`node ${NODE_SCRIPT} --source local --format png`).toString().trim();
        const json = JSON.parse(output);
        expect(json).toHaveProperty('imagePath');
        expect(json.format).toBe('png');
        expect(fs.existsSync(json.imagePath)).toBe(true);

        // Cleanup
        if (fs.existsSync(json.imagePath)) fs.unlinkSync(json.imagePath);
    }, 30000);

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
