const app = require('../office-quotes.js');
const fs = require('fs');
const path = require('path');

// Mock data for testing
const MOCK_QUOTES = [
    { character: "Michael Scott", content: "That's what she said." },
    { character: "Dwight Schrute", content: "Bears. Beets. Battlestar Galactica." },
    { character: "Jim Halpert", content: "Bears. Beets. Battlestar Galactica." }
];

describe('office-quotes-cli', () => {

    describe('parseArgs', () => {
        test('should parse random default command', () => {
            const { command, mode } = app.parseArgs([]);
            expect(command).toBeNull();
            expect(mode).toBe("offline");
        });

        test('should parse help flag', () => {
            const { showHelp } = app.parseArgs(['--help']);
            expect(showHelp).toBe(true);
        });

        test('should parse search command', () => {
            const { command, commandArgs } = app.parseArgs(['search', 'bears']);
            expect(command).toBe('search');
            expect(commandArgs).toEqual(['bears']);
        });

        test('should parse api mode', () => {
            const { mode, command } = app.parseArgs(['api']);
            expect(command).toBe('api');
            expect(mode).toBe('api');
        });

        test('should parse flags correctly', () => {
            const { mode, theme, outputFormat } = app.parseArgs(['--mode', 'api', '--theme', 'light', '--format', 'png']);
            expect(mode).toBe('api');
            expect(theme).toBe('light');
            expect(outputFormat).toBe('png');
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

        test('loadQuotes should return parsed JSON', () => {
            const quotes = app.loadQuotes();
            expect(quotes).toHaveLength(3);
            expect(quotes[0].character).toBe("Michael Scott");
        });

        test('countQuotes should return correct length', () => {
            const count = app.countQuotes();
            expect(count).toBe(3);
        });

        test('listCharacters should return unique sorted characters', () => {
            const chars = app.listCharacters();
            expect(chars).toEqual(["Dwight Schrute", "Jim Halpert", "Michael Scott"]);
        });

        test('listQuotes should filter by character', () => {
            const quotes = app.listQuotes("Dwight");
            expect(quotes).toHaveLength(1);
            expect(quotes[0]).toContain("Dwight Schrute");
        });

        test('searchQuotes should find matching quotes', () => {
            const results = app.searchQuotes("Battlestar");
            expect(results).toHaveLength(2);
            expect(results[0]).toContain("Dwight Schrute");
            expect(results[1]).toContain("Jim Halpert");
        });

        test('getOfflineQuote should return a valid quote object', () => {
            const quote = app.getOfflineQuote();
            expect(quote).toHaveProperty('quote');
            expect(quote).toHaveProperty('character');
        });
    });
});
