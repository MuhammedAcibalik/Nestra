/**
 * Barcode/QR Code Generator
 * Generates barcode and QR code SVG for labels and tracking
 */

// ==================== INTERFACES ====================

/** Barcode type */
export type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'QR';

/** Barcode generation options */
export interface IBarcodeOptions {
    type: BarcodeType;
    width?: number;
    height?: number;
    margin?: number;
    displayValue?: boolean;
    fontSize?: number;
    background?: string;
    lineColor?: string;
}

/** Barcode output */
export interface IBarcodeOutput {
    svg: string;
    type: BarcodeType;
    data: string;
    width: number;
    height: number;
}

/** Label data for piece/stock */
export interface ILabelData {
    code: string;
    description?: string;
    dimensions?: string;
    quantity?: number;
    date?: Date;
    additionalInfo?: Record<string, string>;
}

// ==================== DEFAULT OPTIONS ====================

const DEFAULT_OPTIONS: IBarcodeOptions = {
    type: 'CODE128',
    width: 200,
    height: 80,
    margin: 10,
    displayValue: true,
    fontSize: 12,
    background: '#ffffff',
    lineColor: '#000000'
};

// ==================== CODE128 CHARACTER SET ====================

const CODE128_START_B = 104;
const CODE128_STOP = 106;

const CODE128_VALUES: Record<string, number> = {
    ' ': 0,
    '!': 1,
    '"': 2,
    '#': 3,
    $: 4,
    '%': 5,
    '&': 6,
    "'": 7,
    '(': 8,
    ')': 9,
    '*': 10,
    '+': 11,
    ',': 12,
    '-': 13,
    '.': 14,
    '/': 15,
    '0': 16,
    '1': 17,
    '2': 18,
    '3': 19,
    '4': 20,
    '5': 21,
    '6': 22,
    '7': 23,
    '8': 24,
    '9': 25,
    ':': 26,
    ';': 27,
    '<': 28,
    '=': 29,
    '>': 30,
    '?': 31,
    '@': 32,
    A: 33,
    B: 34,
    C: 35,
    D: 36,
    E: 37,
    F: 38,
    G: 39,
    H: 40,
    I: 41,
    J: 42,
    K: 43,
    L: 44,
    M: 45,
    N: 46,
    O: 47,
    P: 48,
    Q: 49,
    R: 50,
    S: 51,
    T: 52,
    U: 53,
    V: 54,
    W: 55,
    X: 56,
    Y: 57,
    Z: 58,
    '[': 59,
    '\\': 60,
    ']': 61,
    '^': 62,
    _: 63,
    '`': 64,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    '{': 91,
    '|': 92,
    '}': 93,
    '~': 94
};

// Code128 patterns (binary representation)
const CODE128_PATTERNS = [
    '11011001100',
    '11001101100',
    '11001100110',
    '10010011000',
    '10010001100',
    '10001001100',
    '10011001000',
    '10011000100',
    '10001100100',
    '11001001000',
    '11001000100',
    '11000100100',
    '10110011100',
    '10011011100',
    '10011001110',
    '10111001100',
    '10011101100',
    '10011100110',
    '11001110010',
    '11001011100',
    '11001001110',
    '11011100100',
    '11001110100',
    '11101101110',
    '11101001100',
    '11100101100',
    '11100100110',
    '11101100100',
    '11100110100',
    '11100110010',
    '11011011000',
    '11011000110',
    '11000110110',
    '10100011000',
    '10001011000',
    '10001000110',
    '10110001000',
    '10001101000',
    '10001100010',
    '11010001000',
    '11000101000',
    '11000100010',
    '10110111000',
    '10110001110',
    '10001101110',
    '10111011000',
    '10111000110',
    '10001110110',
    '11101110110',
    '11010001110',
    '11000101110',
    '11011101000',
    '11011100010',
    '11011101110',
    '11101011000',
    '11101000110',
    '11100010110',
    '11101101000',
    '11101100010',
    '11100011010',
    '11101111010',
    '11001000010',
    '11110001010',
    '10100110000',
    '10100001100',
    '10010110000',
    '10010000110',
    '10000101100',
    '10000100110',
    '10110010000',
    '10110000100',
    '10011010000',
    '10011000010',
    '10000110100',
    '10000110010',
    '11000010010',
    '11001010000',
    '11110111010',
    '11000010100',
    '10001111010',
    '10100111100',
    '10010111100',
    '10010011110',
    '10111100100',
    '10011110100',
    '10011110010',
    '11110100100',
    '11110010100',
    '11110010010',
    '11011011110',
    '11011110110',
    '11110110110',
    '10101111000',
    '10100011110',
    '10001011110',
    '10111101000',
    '10111100010',
    '11110101000',
    '11110100010',
    '10111011110',
    '10111101110',
    '11101011110',
    '11110101110',
    '11010000100',
    '11010010000',
    '11010011100',
    '1100011101011'
];

// ==================== BARCODE GENERATOR ====================

export class BarcodeGenerator {
    /**
     * Generate barcode SVG
     */
    generateBarcode(data: string, options: Partial<IBarcodeOptions> = {}): IBarcodeOutput {
        const opts = { ...DEFAULT_OPTIONS, ...options };

        switch (opts.type) {
            case 'QR':
                return this.generateQR(data, opts);
            case 'CODE128':
            default:
                return this.generateCode128(data, opts);
        }
    }

    /**
     * Generate CODE128 barcode
     */
    private generateCode128(data: string, opts: IBarcodeOptions): IBarcodeOutput {
        const { width, height, margin, displayValue, fontSize, background, lineColor } = opts;

        // Calculate bar encoding
        const encoding = this.encodeCode128(data);
        const barWidth = (width! - margin! * 2) / encoding.length;

        // Build SVG
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        svg += `<rect width="100%" height="100%" fill="${background}"/>`;

        // Draw bars
        const barHeight = displayValue ? height! - margin! * 2 - fontSize! - 5 : height! - margin! * 2;
        let x = margin!;

        for (let i = 0; i < encoding.length; i++) {
            if (encoding[i] === '1') {
                svg += `<rect x="${x}" y="${margin}" width="${barWidth}" height="${barHeight}" fill="${lineColor}"/>`;
            }
            x += barWidth;
        }

        // Add text if displayValue is true
        if (displayValue) {
            const textY = height! - margin!;
            svg += `<text x="${width! / 2}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="${fontSize}">${data}</text>`;
        }

        svg += '</svg>';

        return {
            svg,
            type: 'CODE128',
            data,
            width: width!,
            height: height!
        };
    }

    /**
     * Encode data to Code128 binary pattern
     */
    private encodeCode128(data: string): string {
        let encoded = CODE128_PATTERNS[CODE128_START_B]; // Start B
        let checksum = CODE128_START_B;

        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            const value = CODE128_VALUES[char] ?? 0;
            encoded += CODE128_PATTERNS[value];
            checksum += value * (i + 1);
        }

        // Add checksum
        const checksumValue = checksum % 103;
        encoded += CODE128_PATTERNS[checksumValue];

        // Add stop pattern
        encoded += CODE128_PATTERNS[CODE128_STOP];

        return encoded;
    }

    /**
     * Generate simple QR code (basic implementation)
     */
    private generateQR(data: string, opts: IBarcodeOptions): IBarcodeOutput {
        const { width, margin, background, lineColor } = opts;
        const size = width!;

        // Simple QR-like pattern for demonstration
        // In production, use a proper QR library like 'qrcode'
        const moduleCount = 21; // QR Version 1
        const moduleSize = (size - margin! * 2) / moduleCount;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
        svg += `<rect width="100%" height="100%" fill="${background}"/>`;

        // Simple data encoding (hash-based pattern for demo)
        const hash = this.simpleHash(data);

        // Draw finder patterns (corners)
        svg += this.drawFinderPattern(margin!, margin!, moduleSize, lineColor!);
        svg += this.drawFinderPattern(margin! + (moduleCount - 7) * moduleSize, margin!, moduleSize, lineColor!);
        svg += this.drawFinderPattern(margin!, margin! + (moduleCount - 7) * moduleSize, moduleSize, lineColor!);

        // Draw data modules (simple pattern based on hash)
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                // Skip finder pattern areas
                if (this.isFinderPatternArea(row, col, moduleCount)) continue;

                // Determine if module should be dark based on hash
                const shouldBeDark = ((hash >> ((row * moduleCount + col) % 32)) & 1) === 1;

                if (shouldBeDark) {
                    const x = margin! + col * moduleSize;
                    const y = margin! + row * moduleSize;
                    svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${lineColor}"/>`;
                }
            }
        }

        svg += '</svg>';

        return {
            svg,
            type: 'QR',
            data,
            width: size,
            height: size
        };
    }

    private drawFinderPattern(x: number, y: number, moduleSize: number, color: string): string {
        let pattern = '';

        // Outer square (7x7)
        pattern += `<rect x="${x}" y="${y}" width="${moduleSize * 7}" height="${moduleSize * 7}" fill="${color}"/>`;

        // White inner square (5x5)
        pattern += `<rect x="${x + moduleSize}" y="${y + moduleSize}" width="${moduleSize * 5}" height="${moduleSize * 5}" fill="white"/>`;

        // Dark center square (3x3)
        pattern += `<rect x="${x + moduleSize * 2}" y="${y + moduleSize * 2}" width="${moduleSize * 3}" height="${moduleSize * 3}" fill="${color}"/>`;

        return pattern;
    }

    private isFinderPatternArea(row: number, col: number, size: number): boolean {
        // Top-left
        if (row < 8 && col < 8) return true;
        // Top-right
        if (row < 8 && col >= size - 8) return true;
        // Bottom-left
        if (row >= size - 8 && col < 8) return true;
        return false;
    }

    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Generate label with barcode
     */
    generateLabel(data: ILabelData, options: Partial<IBarcodeOptions> = {}): string {
        const opts = { ...DEFAULT_OPTIONS, ...options, height: 120, width: 300 };
        const barcode = this.generateBarcode(data.code, { ...opts, height: 60 });

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}" height="${opts.height}" viewBox="0 0 ${opts.width} ${opts.height}">`;
        svg += `<rect width="100%" height="100%" fill="${opts.background}"/>`;

        // Add barcode
        svg += `<g transform="translate(${(opts.width! - barcode.width) / 2}, 5)">${barcode.svg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}</g>`;

        // Add description if present
        if (data.description) {
            svg += `<text x="${opts.width! / 2}" y="75" text-anchor="middle" font-family="sans-serif" font-size="11">${data.description}</text>`;
        }

        // Add dimensions if present
        if (data.dimensions) {
            svg += `<text x="${opts.width! / 2}" y="90" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#666">${data.dimensions}</text>`;
        }

        // Add quantity if present
        if (data.quantity !== undefined) {
            svg += `<text x="${opts.width! / 2}" y="105" text-anchor="middle" font-family="sans-serif" font-size="10">Adet: ${data.quantity}</text>`;
        }

        svg += '</svg>';
        return svg;
    }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate barcode SVG
 */
export function generateBarcode(data: string, options?: Partial<IBarcodeOptions>): IBarcodeOutput {
    const generator = new BarcodeGenerator();
    return generator.generateBarcode(data, options);
}

/**
 * Generate QR code SVG
 */
export function generateQRCode(data: string, size = 200): IBarcodeOutput {
    const generator = new BarcodeGenerator();
    return generator.generateBarcode(data, { type: 'QR', width: size, height: size });
}

/**
 * Generate label with barcode
 */
export function generateLabel(data: ILabelData, options?: Partial<IBarcodeOptions>): string {
    const generator = new BarcodeGenerator();
    return generator.generateLabel(data, options);
}
