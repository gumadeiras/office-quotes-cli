const app = require('../office-quotes.js');
const fs = require('fs');

// Mock data for testing
const MOCK_QUOTES = [
    { character: "Michael Scott", content: "That's what she said." },
    { character: "Dwight Schrute", content: "Bears. Beets. Battlestar Galactica." },
    { character: "Jim Halpert", content: "Bears. Beets. Battlestar Galactica." }
];

// Mock global fetch for API tests
global.fetch = jest.fn();

describe('office-quotes-cli Unit Tests', () => {

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('parseArgs', () => {
        test('should parse random default command', () => {
            const { command, mode } = app.parseArgs([]);
            expect(command).toBeNull();
            expect(mode).toBe("offline");
        });

        test('should parse --source alias for mode', () => {
            const { mode } = app.parseArgs(['--source', 'api']);
            expect(mode).toBe('api');
        });

        test('should parse --quiet / -q flag', () => {
            const args1 = app.parseArgs(['-q']);
            const args2 = app.parseArgs(['--quiet']);
            expect(args1.quiet).toBe(true);
            expect(args2.quiet).toBe(true);
        });

        test('should force api mode when --format is provided', () => {
            // Even if --source local is specified, --format png should override it
            const { mode } = app.parseArgs(['--source', 'local', '--format', 'png']);
            expect(mode).toBe('api');
        });

        test('should parse episode and season commands', () => {
            const argsE = app.parseArgs(['episode', '3/10']);
            const argsS = app.parseArgs(['season', '3']);
            expect(argsE.command).toBe('episode');
            expect(argsE.commandArgs).toEqual(['3/10']);
            expect(argsS.command).toBe('season');
            expect(argsS.commandArgs).toEqual(['3']);
        });
    });

    describe('Offline Logic', () => {
        let existsSpy, readSpy;

        beforeEach(() => {
            existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            readSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(MOCK_QUOTES));
        });

        afterEach(() => {
            existsSpy.mockRestore();
            readSpy.mockRestore();
        });

        test('loadQuotes should return parsed JSON from correct path', () => {
            const quotes = app.loadQuotes();
            expect(quotes).toHaveLength(3);
            expect(readSpy).toHaveBeenCalled();
        });

        test('searchQuotes should find matching quotes (case-insensitive)', () => {
            const results = app.searchQuotes("BEARS");
            expect(results).toHaveLength(2);
            expect(results[0]).toContain("Dwight Schrute");
        });

        test('listCharacters should return unique sorted characters', () => {
            const chars = app.listCharacters();
            expect(chars).toEqual(["Dwight Schrute", "Jim Halpert", "Michael Scott"]);
        });

        test('getOfflineQuote should throw if quotes are empty', () => {
            readSpy.mockReturnValue("[]");
            expect(() => app.getOfflineQuote()).toThrow("No quotes available.");
        });
    });

    describe('API Metadata Logic', () => {
        beforeEach(() => {
            fetch.mockClear();
        });

        test('fetchApiMetadata should build correct URL for episodes', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ title: "Test Episode" })
            });

            const data = await app.fetchApiMetadata('episode', '3/10');
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/season/3/episode/10'));
            expect(data.title).toBe("Test Episode");
        });

        test('fetchApiMetadata should throw on invalid episode format', async () => {
            await expect(app.fetchApiMetadata('episode', 'invalid')).rejects.toThrow(/Usage:/);
        });

        test('fetchApiMetadata should throw on API error', async () => {
            fetch.mockResolvedValue({ ok: false, status: 404 });
            await expect(app.fetchApiMetadata('season', '99')).rejects.toThrow("API error: 404");
        });
    });
});
