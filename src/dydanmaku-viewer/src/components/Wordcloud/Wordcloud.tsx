import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import createCloud, { type Word as CloudWord } from 'd3-cloud';
import {
    interpolateViridis,
    interpolatePlasma,
    interpolateInferno,
    interpolateMagma,
    interpolateCividis,
    interpolateRainbow,
} from 'd3-scale-chromatic';
import type { WordCloudProps, WordItem } from './type';

interface ProcessedWord extends CloudWord {
    text: string;
    originalSize: number;
    size: number;
    x: number;
    y: number;
    rotate: number;
}


type LayoutWord = ProcessedWord


type ColorMapFunction = (t: number) => string;

const WordCloud: React.FC<WordCloudProps> = (props) => {
    const {
        words,
        width = 800,
        height = 600,
        colormap = 'viridis',
        customColor,
        rotation: rotationProp,
        fontFamily = 'Impact',
        spiral = 'archimedean',
        onWordClick,
        onWordHover,
        showTooltip = true,
        minFontSize = 10,
        maxFontSize = 100,
    } = props;

    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [layoutReady, setLayoutReady] = useState(false);
    const layoutWordsRef = useRef<LayoutWord[]>([]);


    const getColormapFunction = useCallback((): ColorMapFunction => {
        switch (colormap) {
            case 'viridis':
                return interpolateViridis;
            case 'plasma':
                return interpolatePlasma;
            case 'inferno':
                return interpolateInferno;
            case 'magma':
                return interpolateMagma;
            case 'cividis':
                return interpolateCividis;
            case 'rainbow':
                return interpolateRainbow;
            case 'custom':
                return customColor ? (t: number) => customColor(t) : interpolateViridis;
            default:
                return interpolateViridis;
        }
    }, [colormap, customColor]);

    const processedWords = useMemo<ProcessedWord[]>(() => {
        if (!words.length) return [];

        const validWords = words.filter((word): word is WordItem =>
            word.size !== undefined && word.size !== null
        );
        if (validWords.length === 0) return [];

        const values = validWords.map((word) => word.size);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        const fontSizeScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([minFontSize, maxFontSize])
            .clamp(true);

        return validWords.map((word) => ({
            text: word.text,
            originalSize: word.size,
            size: fontSizeScale(word.size),
            x: 0,
            y: 0,
            rotate: 0,
        }));
    }, [words, minFontSize, maxFontSize]);


    const rotationFn = useMemo(() => {
        if (typeof rotationProp === 'function') return rotationProp;

        return (word: CloudWord, index: number): number => {
            const text = word.text ?? String(index);
            let hash = 0;
            for (let i = 0; i < text.length; i++) {
                hash = (hash << 5) - hash + text.charCodeAt(i);
                hash |= 0;
            }
            const r = Math.abs(hash) % 7; // 0-6
            return (r - 3) * 30; // -90, -60, -30, 0, 30, 60, 90
        };
    }, [rotationProp]);


    useEffect(() => {
        if (!processedWords.length || !svgRef.current || !containerRef.current) return;
        
        const svgElement = svgRef.current;
        d3.select(svgElement).selectAll('*').remove();

        const layout = createCloud<ProcessedWord>()
            .size([width, height])
            .words(processedWords)
            .padding(5)
            .rotate(rotationFn)
            .font(fontFamily)
            .fontSize((d) => d.size)
            .spiral(spiral)
            .random(() => 0.5)
            .on('end', (cloudWords: ProcessedWord[]) => {
                layoutWordsRef.current = cloudWords.map((word) => ({
                    ...word,
                    text: word.text ?? '',
                    originalSize: word.originalSize ?? 0,
                    size: word.size ?? 0,
                    x: word.x ?? 0,
                    y: word.y ?? 0,
                    rotate: word.rotate ?? 0,
                }));
                setLayoutReady(true);
            });

        layout.start();

        return () => {
            d3.select(svgElement).selectAll('*').remove();
        };
    }, [processedWords, width, height, rotationFn, fontFamily, spiral]);

    useEffect(() => {
        if (!layoutReady || !layoutWordsRef.current.length || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.attr('width', width).attr('height', height);

        svg.selectAll('.word-cloud-word').remove();

        const group = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const sizes = layoutWordsRef.current.map((w) => w.originalSize);
        const minSize = Math.min(...sizes);
        const maxSize = Math.max(...sizes);
        const colorScale = d3.scaleLinear<number, number>()
            .domain([minSize, maxSize])
            .range([0, 1])
            .clamp(true);

        const colormapFunction = getColormapFunction();

        const wordElements = group.selectAll<SVGTextElement, LayoutWord>('.word-cloud-word')
            .data(layoutWordsRef.current)
            .enter()
            .append('text')
            .attr('class', 'word-cloud-word')
            .style('font-size', (d) => `${d.size}px`)
            .style('font-family', fontFamily)
            .style('fill', (d) => {
                const t = colorScale(d.originalSize);
                return colormapFunction(t);
            })
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .attr('transform', (d) => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
            .text((d) => d.text)
            .style('cursor', onWordClick ? 'pointer' : 'default')
            .style('transition', 'all 0.3s ease')
            .on('mouseover', function (_event, d) {
                const element = d3.select(this);
                element
                    .style('opacity', 0.8)
                    .style('cursor', 'pointer')
                    .transition()
                    .duration(150)
                    .attr('transform', `translate(${d.x},${d.y}) rotate(${d.rotate}) scale(1.2)`);

                if (showTooltip) {
                    element.select('title').remove();
                    element.append('title').text(`${d.text}: ${d.originalSize}`);
                }

                if (onWordHover) {
                    const originalWord = words.find((w) => w.text === d.text);
                    onWordHover(originalWord ?? null);
                }
            })
            .on('mouseout', function (_event, d) {
                const element = d3.select(this);
                element
                    .style('opacity', 1)
                    .transition()
                    .duration(150)
                    .attr('transform', `translate(${d.x},${d.y}) rotate(${d.rotate}) scale(1)`);

                if (onWordHover) {
                    onWordHover(null);
                }
            })
            .on('click', function (_event, d) {
                if (onWordClick) {
                    const originalWord = words.find((w) => w.text === d.text);
                    if (originalWord) {
                        onWordClick(originalWord);
                    }
                }
            });

        wordElements.style('opacity', 0)
            .transition()
            .duration(1000)
            .style('opacity', 1);
    }, [layoutReady, words, width, height, fontFamily, onWordClick, onWordHover, showTooltip, getColormapFunction]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: `${width}px`,
                height: `${height}px`,
                margin: '0 auto',
            }}
        >
            <svg ref={svgRef} />
        </div>
    );
};

export default WordCloud;