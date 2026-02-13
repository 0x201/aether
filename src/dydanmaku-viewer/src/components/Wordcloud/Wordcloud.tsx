import React, { useEffect, useRef, useState, useMemo  } from 'react';
import * as d3 from 'd3';
import createCloud, { type Word } from 'd3-cloud';
import {
    interpolateViridis,
    interpolatePlasma,
    interpolateInferno,
    interpolateMagma,
    interpolateCividis,
    interpolateRainbow
} from 'd3-scale-chromatic';
import type { WordCloudProps } from './type';


const WordCloud: React.FC<WordCloudProps> = (prop: WordCloudProps) => {
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
        maxFontSize = 100
    } = prop;
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [layoutReady, setLayoutReady] = useState(false);
    const layoutWordsRef = useRef<any[]>([]);

    const getColormapFunction = () => {
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
    };

    const processedWords = useMemo(() => {
        if (!words.length) return [];
        const validWords = words.filter(word => word.size !== undefined && word.size !== null);
        if (validWords.length === 0) return [];

        const values = validWords.map(word => word.size as number);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        const fontSizeScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([minFontSize, maxFontSize])
            .clamp(true);

        return validWords.map(word => ({
            text: word.text,
            size: fontSizeScale(word.size as number),
            value: word.size as number,
            x: 0,
            y: 0,
            rotate: 0
        }));
    }, [words, minFontSize, maxFontSize]);

    // Deterministic rotation function based on word text (stable across renders)
    const rotationFn = useMemo(() => {
        if (typeof rotationProp === 'function') return rotationProp;

        return (d: any, i: number) => {
            const s = (d && d.text) ? String(d.text) : String(i);
            let h = 0;
            for (let j = 0; j < s.length; j++) {
                h = (h << 5) - h + s.charCodeAt(j);
                h |= 0;
            }
            const r = Math.abs(h) % 6; // 0..5
            return (r - 3) * 30;
        };
    }, [rotationProp]);

    useEffect(() => {
        if (!processedWords.length || !svgRef.current || !containerRef.current) return;

        d3.select(svgRef.current).selectAll('*').remove();

        const layout = createCloud()
            .size([width, height])
            .words(processedWords)
            .padding(5)
            .rotate(rotationFn)
            .font(fontFamily)
            .fontSize((d: any) => d.size)
            .spiral(spiral)
            .random(() => 0.5)
            .on('end', (cloudWords: any[]) => {
                layoutWordsRef.current = cloudWords;
                setLayoutReady(true);
            });

        layout.start();

        return () => {
            if (svgRef.current) {
                d3.select(svgRef.current).selectAll('*').remove();
            }
        };
    }, [processedWords, width, height, rotationFn, fontFamily, spiral]);

    useEffect(() => {
        if (!layoutReady || !layoutWordsRef.current.length || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.attr('width', width).attr('height', height);

        svg.selectAll('.word-cloud-word').remove();

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const colorScale = d3.scaleLinear()
            .domain([Math.min(...words.map(w => w.size as number)), Math.max(...words.map(w => w.size as number))])
            .range([0, 1]);

        const colormapFunction = getColormapFunction();

        const wordElements = g.selectAll('.word-cloud-word')
            .data(layoutWordsRef.current)
            .enter()
            .append('text')
            .style('font-size', (d: Word) => `${d.size}px`)
            .style('font-family', fontFamily)
            .style('fill', (d: Word) => {
                const t = colorScale(d.size as number);
                return colormapFunction(t);
            })
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .attr('transform', (d: Word) =>
                `translate(${d.x},${d.y}) rotate(${d.rotate})`
            )
            .text((d: Word) => d.text as string)
            .attr('class', 'word-cloud-word')
            .style('cursor', onWordClick ? 'pointer' : 'default')
            .style('transition', 'all 0.3s ease')
            .on('mouseover', function (_event: MouseEvent, d: Word) {
                const element = d3.select(this);
                element
                    .style('opacity', 0.8)
                    .style('cursor', 'pointer')
                    .transition().duration(150)
                    .attr('transform', `translate(${d.x},${d.y}) rotate(${d.rotate}) scale(1.2)`);

                if (showTooltip) {
                    element.select('title').remove();
                    element.append('title').text(`${d.text}: ${d.size}`);
                }

                if (onWordHover) {
                    onWordHover(words.find(w => w.text === d.text) || null);
                }
            })
            .on('mouseout', function (_event: MouseEvent, d: Word) {
                const element = d3.select(this);
                const t = colorScale(d.size as number);
                element
                    .style('opacity', 1)
                    .transition().duration(150)
                    .attr('transform', `translate(${d.x},${d.y}) rotate(${d.rotate}) scale(1)`)
                    .style('fill', colormapFunction(t));

                if (onWordHover) {
                    onWordHover(null);
                }
            })
            .on('click', function (_event: MouseEvent, d: Word) {
                if (onWordClick) {
                    const word = words.find(w => w.text === d.text);
                    if (word) {
                        onWordClick(word);
                    }
                }
            });

        wordElements.style('opacity', 0).transition().duration(1000).style('opacity', 1);
    }, [
        layoutReady,
        words,
        width,
        height,
        colormap,
        customColor,
        fontFamily,
        minFontSize,
        maxFontSize,
        onWordClick,
        onWordHover,
        showTooltip
    ]);

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