"use strict";
/**
 * Layout SVG Generator
 * Creates SVG visualizations of cutting plans for 2D sheets
 * Follows Single Responsibility Principle - only handles SVG generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutSvgGenerator = void 0;
exports.generateLayoutSvg = generateLayoutSvg;
exports.generateMultipleLayoutsSvg = generateMultipleLayoutsSvg;
exports.svgToDataUrl = svgToDataUrl;
const DEFAULT_OPTIONS = {
    scale: 0.5,
    padding: 20,
    showLabels: true,
    showDimensions: true,
    pieceColor: '#4CAF50',
    wasteColor: '#ffebee',
    borderColor: '#333333',
    fontSize: 10
};
/**
 * Generate SVG visualization for a cutting layout
 */
function generateLayoutSvg(layout, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { scale, padding, showLabels, showDimensions, pieceColor, wasteColor, borderColor, fontSize } = opts;
    const svgWidth = layout.sheetWidth * scale + padding * 2;
    const svgHeight = layout.sheetHeight * scale + padding * 2;
    const svg = [];
    // SVG header
    svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`);
    // Styles
    svg.push(`<defs>
    <style>
      .sheet { fill: ${wasteColor}; stroke: ${borderColor}; stroke-width: 2; }
      .piece { fill: ${pieceColor}; stroke: #2E7D32; stroke-width: 1; opacity: 0.9; }
      .piece:hover { opacity: 1; stroke-width: 2; }
      .label { font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: #ffffff; text-anchor: middle; dominant-baseline: central; }
      .dimension { font-family: Arial, sans-serif; font-size: ${fontSize - 2}px; fill: #666666; }
      .waste-text { font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: #c62828; }
    </style>
  </defs>`);
    // Background group with transform for padding
    svg.push(`<g transform="translate(${padding}, ${padding})">`);
    // Sheet background (waste area)
    svg.push(`<rect class="sheet" x="0" y="0" width="${layout.sheetWidth * scale}" height="${layout.sheetHeight * scale}" />`);
    // Pieces
    for (const piece of layout.pieces) {
        const x = piece.x * scale;
        const y = piece.y * scale;
        const w = piece.width * scale;
        const h = piece.height * scale;
        // Piece rectangle
        svg.push(`<rect class="piece" x="${x}" y="${y}" width="${w}" height="${h}" data-id="${piece.pieceId}" />`);
        // Label
        if (showLabels && piece.label) {
            const labelX = x + w / 2;
            const labelY = y + h / 2;
            // Only show label if piece is big enough
            if (w > fontSize * 3 && h > fontSize * 2) {
                svg.push(`<text class="label" x="${labelX}" y="${labelY}">${piece.label}</text>`);
            }
        }
        // Rotated indicator
        if (piece.rotated && w > fontSize * 2 && h > fontSize * 2) {
            svg.push(`<text class="label" x="${x + w - 8}" y="${y + 10}" font-size="${fontSize - 2}">↻</text>`);
        }
    }
    // Sheet dimensions
    if (showDimensions) {
        const sheetW = layout.sheetWidth * scale;
        const sheetH = layout.sheetHeight * scale;
        // Width dimension (top)
        svg.push(`<text class="dimension" x="${sheetW / 2}" y="-5" text-anchor="middle">${layout.sheetWidth} mm</text>`);
        // Height dimension (left)
        svg.push(`<text class="dimension" x="-5" y="${sheetH / 2}" text-anchor="end" transform="rotate(-90, -5, ${sheetH / 2})">${layout.sheetHeight} mm</text>`);
    }
    // Waste info
    if (layout.wastePercentage !== undefined) {
        const sheetW = layout.sheetWidth * scale;
        const sheetH = layout.sheetHeight * scale;
        svg.push(`<text class="waste-text" x="${sheetW - 5}" y="${sheetH - 5}" text-anchor="end">Fire: ${layout.wastePercentage.toFixed(1)}%</text>`);
    }
    svg.push('</g>');
    svg.push('</svg>');
    return svg.join('\n');
}
/**
 * Generate multiple SVG layouts as a single combined SVG
 */
function generateMultipleLayoutsSvg(layouts, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { scale, padding } = opts;
    // Calculate total dimensions
    let totalHeight = 0;
    let maxWidth = 0;
    for (const layout of layouts) {
        const w = layout.sheetWidth * scale + padding * 2;
        const h = layout.sheetHeight * scale + padding * 2;
        maxWidth = Math.max(maxWidth, w);
        totalHeight += h + 20; // 20px gap between layouts
    }
    const svg = [];
    svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${totalHeight}" viewBox="0 0 ${maxWidth} ${totalHeight}">`);
    let currentY = 0;
    let sequence = 1;
    for (const layout of layouts) {
        const layoutSvg = generateLayoutSvg(layout, opts);
        // Extract inner content (remove svg tags)
        const innerContent = layoutSvg
            .replace(/<svg[^>]*>/, '')
            .replace(/<\/svg>/, '');
        // Add layout title
        svg.push(`<text x="10" y="${currentY + 15}" font-family="Arial" font-size="12" fill="#333">Levha ${sequence}</text>`);
        // Wrap in group with translation
        svg.push(`<g transform="translate(0, ${currentY + 20})">`);
        svg.push(innerContent);
        svg.push('</g>');
        currentY += layout.sheetHeight * scale + padding * 2 + 40;
        sequence++;
    }
    svg.push('</svg>');
    return svg.join('\n');
}
/**
 * Convert SVG to data URL for embedding
 */
function svgToDataUrl(svg) {
    const encoded = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${encoded}`;
}
/**
 * Layout SVG Generator class for dependency injection
 */
class LayoutSvgGenerator {
    defaultOptions;
    constructor(defaultOptions = {}) {
        this.defaultOptions = defaultOptions;
    }
    generate(layout) {
        return generateLayoutSvg(layout, this.defaultOptions);
    }
    generateMultiple(layouts) {
        return generateMultipleLayoutsSvg(layouts, this.defaultOptions);
    }
    toDataUrl(svg) {
        return svgToDataUrl(svg);
    }
}
exports.LayoutSvgGenerator = LayoutSvgGenerator;
//# sourceMappingURL=layout-svg-generator.js.map