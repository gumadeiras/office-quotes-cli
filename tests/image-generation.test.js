const app = require('../office-quotes.js');
const fs = require('fs');
const path = require('path');
const { imageSize: sizeOf } = require('image-size');

// Helper to create a dummy SVG
const createDummySvg = (filepath) => {
    const content = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300">
    <rect width="100%" height="100%" fill="black"/>
    <text x="50%" y="50%" fill="white" font-size="20" text-anchor="middle">Test Quote</text>
  </svg>`;
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, content);
};

describe('Image Generation (Integration)', () => {
    const tempDir = path.join(__dirname, 'temp_images');
    const baseSvg = path.join(tempDir, 'test.svg');

    beforeAll(() => {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
    });

    beforeEach(() => {
        createDummySvg(baseSvg);
    });

    afterAll(() => {
        // Cleanup
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('should pass through SVG format', async () => {
        const output = await app.convertImage(baseSvg, 'svg');
        expect(output).toBe(baseSvg);
        expect(fs.existsSync(output)).toBe(true);
    });

    test('should convert to PNG with correct format and dimensions', async () => {
        const output = await app.convertImage(baseSvg, 'png');

        if (typeof output !== 'string') {
            throw new Error(`Conversion failed: ${JSON.stringify(output)}`);
        }

        const buffer = fs.readFileSync(output);
        if (buffer.length === 0) throw new Error("Generated PNG file is empty");

        expect(path.extname(output)).toBe('.png');
        expect(fs.existsSync(output)).toBe(true);

        const dimensions = sizeOf(buffer);
        expect(dimensions.type).toBe('png');
        expect(dimensions.width).toBe(500);
        expect(dimensions.height).toBe(300);
    }, 30000);

    test('should convert to JPG with correct format and dimensions', async () => {
        const output = await app.convertImage(baseSvg, 'jpg');

        if (typeof output !== 'string') {
            throw new Error(`Conversion failed: ${JSON.stringify(output)}`);
        }

        const buffer = fs.readFileSync(output);
        if (buffer.length === 0) throw new Error("Generated JPG file is empty");

        expect(path.extname(output)).toBe('.jpg');
        expect(fs.existsSync(output)).toBe(true);

        const dimensions = sizeOf(buffer);
        expect(dimensions.type).toBe('jpg');
        expect(dimensions.width).toBe(500);
        expect(dimensions.height).toBe(300);
    }, 30000);

    test('should handle unsupported formats elegantly', async () => {
        const output = await app.convertImage(baseSvg, 'webp');

        // Should return error object for unsupported format
        expect(typeof output).toBe('object');
        expect(output.status).toBe('error');
        expect(output.error).toContain('WebP format is not supported');
    });
});
