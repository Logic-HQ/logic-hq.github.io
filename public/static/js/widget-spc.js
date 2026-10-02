   import { jsx, jsxs } from 'https://widgetlibs.static.usercontent.goog/react/jsx-runtime-Dc9ViRTo.js';
      import React, { useState, useRef, useEffect, useMemo } from 'https://widgetlibs.static.usercontent.goog/react-Dd1pKoqe.js';
      import ReactDOM from 'https://widgetlibs.static.usercontent.goog/react-dom/client-BTuQ-l8_.js';
      import { ErrorBoundary } from 'https://widgetlibs.static.usercontent.goog/react-error-boundary-BY2GTZrN.js';
      import * as d3 from 'https://widgetlibs.static.usercontent.goog/d3-DQOLej2x.js';
      import * as Slider from 'https://widgetlibs.static.usercontent.goog/@radix-ui/react-slider-DXk-CvUR.js';

      true && (function polyfill() {
         const relList = document.createElement("link").relList;
         if (relList && relList.supports && relList.supports("modulepreload")) return;
         for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
         new MutationObserver((mutations) => {
            for (const mutation of mutations) {
               if (mutation.type !== "childList") continue;
               for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
            }
         }).observe(document, {
            childList: true,
            subtree: true
         });
         function getFetchOpts(link) {
            const fetchOpts = {};
            if (link.integrity) fetchOpts.integrity = link.integrity;
            if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
            if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
            else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
            else fetchOpts.credentials = "same-origin";
            return fetchOpts;
         }
         function processPreload(link) {
            if (link.ep) return;
            link.ep = true;
            const fetchOpts = getFetchOpts(link);
            fetch(link.href, fetchOpts);
         }
      }());

      function ErrorFallback({ error }) {
         return /* @__PURE__ */ jsxs("div", {
            className: "p-5 text-error bg-card rounded-xl border border-border", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Something went wrong:" }),
    /* @__PURE__ */ jsx("pre", { className: "text-xs mt-1 whitespace-pre-wrap", children: error.message })
            ]
         });
      }
      function App() {
         return /* @__PURE__ */ jsx(ErrorBoundary, { FallbackComponent: ErrorFallback, children: /* @__PURE__ */ jsx(SPCWidget, {}) });
      }
      function SPCWidget() {
         const [isPlaying, setIsPlaying] = useState(true);
         const [windowSize, setWindowSize] = useState(30);
         const [processShift, setProcessShift] = useState(0);
         const [streamMode, setStreamMode] = useState("standard");
         const [dataPoints, setDataPoints] = useState([]);
         const [lateQueue, setLateQueue] = useState([]);
         const [width, setWidth] = useState(800);
         const containerRef = useRef(null);
         const height = width * 0.48;
         const isPlayingRef = useRef(isPlaying);
         useEffect(() => {
            isPlayingRef.current = isPlaying;
         }, [isPlaying]);
         useEffect(() => {
            if (!containerRef.current) return;
            const resizeObserver = new ResizeObserver((entries) => {
               for (let entry of entries) {
                  if (entry.contentRect.width) {
                     setWidth(Math.max(entry.contentRect.width, 360));
                  }
               }
            });
            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
         }, []);
         useEffect(() => {
            const initialPoints = [];
            const baseMean = 50;
            const baseStd = 5;
            let timeStampOffset = Date.now() - 6e4;
            for (let i = 0; i < 60; i++) {
               const randValue = baseMean + (Math.random() - 0.5) * 20;
               initialPoints.push({
                  id: i,
                  timestamp: timeStampOffset + i * 1e3,
                  value: randValue,
                  isLate: false,
                  isAnomaly: false,
                  mean: baseMean,
                  ucl: baseMean + 3 * baseStd,
                  lcl: baseMean - 3 * baseStd
               });
            }
            for (let i = 5; i < initialPoints.length; i++) {
               const windowStart = Math.max(0, i - windowSize);
               const subset = initialPoints.slice(windowStart, i + 1).map((d) => d.value);
               const m = d3.mean(subset) ?? baseMean;
               const deviation = d3.deviation(subset) ?? baseStd;
               initialPoints[i].mean = m;
               initialPoints[i].ucl = m + 3 * deviation;
               initialPoints[i].lcl = m - 3 * deviation;
               if (initialPoints[i].value > initialPoints[i].ucl || initialPoints[i].value < initialPoints[i].lcl) {
                  initialPoints[i].isAnomaly = true;
               }
            }
            setDataPoints(initialPoints);
         }, []);
         const lastTickTime = useRef(Date.now());
         const nextPointId = useRef(100);
         useEffect(() => {
            let animationFrameId;
            const tick = () => {
               if (!isPlayingRef.current) {
                  animationFrameId = requestAnimationFrame(tick);
                  return;
               }
               const now = Date.now();
               const delta = now - lastTickTime.current;
               setLateQueue((prevQueue) => {
                  return prevQueue.map((item) => ({ ...item, progress: item.progress + 0.015 })).filter((item) => {
                     if (item.progress >= 1) {
                        setDataPoints((prevPoints) => {
                           const newPoint = {
                              id: item.id,
                              timestamp: item.targetTimestamp,
                              value: item.value,
                              isLate: true,
                              isAnomaly: false,
                              mean: 50,
                              ucl: 65,
                              lcl: 35
                           };
                           const updated = [...prevPoints, newPoint].sort((a, b) => a.timestamp - b.timestamp);
                           for (let k = 1; k < updated.length; k++) {
                              const subset = updated.slice(Math.max(0, k - windowSize), k + 1).map((d) => d.value);
                              const m = d3.mean(subset) ?? 50;
                              const dev = d3.deviation(subset) ?? 4;
                              updated[k].mean = m;
                              updated[k].ucl = m + 3 * dev;
                              updated[k].lcl = m - 3 * dev;
                              if (updated[k].value > updated[k].ucl || updated[k].value < updated[k].lcl) {
                                 updated[k].isAnomaly = true;
                              } else {
                                 updated[k].isAnomaly = false;
                              }
                           }
                           return updated.slice(-120);
                        });
                        return false;
                     }
                     return true;
                  });
               });
               if (delta >= 1e3) {
                  lastTickTime.current = now;
                  nextPointId.current += 1;
                  let noiseFactor = streamMode === "jitter" ? 18 : 10;
                  let anomalyChance = streamMode === "drift" ? 0.25 : 0.06;
                  let driftValue = 0;
                  if (streamMode === "drift") {
                     driftValue = Math.sin(now / 4e3) * 12;
                  }
                  const isTriggeredAnomaly = Math.random() < anomalyChance;
                  const anomalyOffset = isTriggeredAnomaly ? Math.random() > 0.5 ? 18 : -18 : 0;
                  const rawValue = 50 + processShift + driftValue + (Math.random() - 0.5) * noiseFactor + anomalyOffset;
                  if (streamMode === "jitter" && Math.random() < 0.22 && dataPoints.length > 20) {
                     const pastTargetIndex = Math.max(5, dataPoints.length - Math.floor(Math.random() * 12) - 2);
                     const targetTime = dataPoints[pastTargetIndex]?.timestamp ?? now;
                     setLateQueue((prev) => [
                        ...prev,
                        {
                           id: nextPointId.current * 10,
                           targetTimestamp: targetTime + 200,
                           value: 50 + (Math.random() - 0.5) * 22,
                           progress: 0
                        }
                     ]);
                  }
                  setDataPoints((prevPoints) => {
                     const updatedPoints = [...prevPoints];
                     const newElement = {
                        id: nextPointId.current,
                        timestamp: now,
                        value: rawValue,
                        isLate: false,
                        isAnomaly: false,
                        mean: 50,
                        ucl: 65,
                        lcl: 35
                     };
                     updatedPoints.push(newElement);
                     const currentWindow = updatedPoints.slice(-windowSize);
                     const values = currentWindow.map((d) => d.value);
                     const computedMean = d3.mean(values) || 50;
                     const computedStd = d3.deviation(values) || 3;
                     const lastIdx = updatedPoints.length - 1;
                     updatedPoints[lastIdx].mean = computedMean;
                     updatedPoints[lastIdx].ucl = computedMean + 3 * computedStd;
                     updatedPoints[lastIdx].lcl = computedMean - 3 * computedStd;
                     if (rawValue > updatedPoints[lastIdx].ucl || rawValue < updatedPoints[lastIdx].lcl) {
                        updatedPoints[lastIdx].isAnomaly = true;
                     }
                     return updatedPoints.slice(-100);
                  });
               }
               animationFrameId = requestAnimationFrame(tick);
            };
            animationFrameId = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(animationFrameId);
         }, [windowSize, processShift, streamMode, dataPoints.length]);
         const metrics = useMemo(() => {
            if (dataPoints.length === 0) return { mean: 50, std: 0, anomalies: 0 };
            const last = dataPoints[dataPoints.length - 1];
            const anomaliesCount = dataPoints.filter((d) => d.isAnomaly).length;
            const subset = dataPoints.slice(-windowSize).map((d) => d.value);
            const calculatedStd = d3.deviation(subset) ?? 0;
            return {
               mean: last.mean,
               std: calculatedStd,
               anomalies: anomaliesCount
            };
         }, [dataPoints, windowSize]);
         const padding = { top: 40, right: 75, bottom: 35, left: 55 };
         const xScale = useMemo(() => {
            if (dataPoints.length === 0) return d3.scaleLinear().domain([0, 100]).range([padding.left, width - padding.right]);
            return d3.scaleLinear().domain(d3.extent(dataPoints, (d) => d.timestamp)).range([padding.left, width - padding.right]);
         }, [dataPoints, width]);
         const yScale = useMemo(() => {
            return d3.scaleLinear().domain([15, 85]).range([height - padding.bottom, padding.top]);
         }, [height]);
         const sensorLinePath = useMemo(() => {
            if (dataPoints.length === 0) return "";
            const lineGen = d3.line().x((d) => xScale(d.timestamp)).y((d) => yScale(d.value)).defined((d) => Number.isFinite(d.value));
            return lineGen(dataPoints) ?? "";
         }, [dataPoints, xScale, yScale]);
         const meanLinePath = useMemo(() => {
            if (dataPoints.length === 0) return "";
            const lineGen = d3.line().x((d) => xScale(d.timestamp)).y((d) => yScale(d.mean)).defined((d) => Number.isFinite(d.mean));
            return lineGen(dataPoints) ?? "";
         }, [dataPoints, xScale, yScale]);
         const uclLinePath = useMemo(() => {
            if (dataPoints.length === 0) return "";
            const lineGen = d3.line().x((d) => xScale(d.timestamp)).y((d) => yScale(d.ucl)).defined((d) => Number.isFinite(d.ucl));
            return lineGen(dataPoints) ?? "";
         }, [dataPoints, xScale, yScale]);
         const lclLinePath = useMemo(() => {
            if (dataPoints.length === 0) return "";
            const lineGen = d3.line().x((d) => xScale(d.timestamp)).y((d) => yScale(d.lcl)).defined((d) => Number.isFinite(d.lcl));
            return lineGen(dataPoints) ?? "";
         }, [dataPoints, xScale, yScale]);
         const areaShadingPath = useMemo(() => {
            if (dataPoints.length === 0) return "";
            const areaGen = d3.area().x((d) => xScale(d.timestamp)).y0((d) => yScale(d.lcl)).y1((d) => yScale(d.ucl)).defined((d) => Number.isFinite(d.ucl) && Number.isFinite(d.lcl));
            return areaGen(dataPoints) ?? "";
         }, [dataPoints, xScale, yScale]);
         const latestMeta = useMemo(() => {
            if (dataPoints.length === 0) return { ucl: 65, lcl: 35, mean: 50 };
            return dataPoints[dataPoints.length - 1];
         }, [dataPoints]);
         return /* @__PURE__ */ jsxs("div", {
            ref: containerRef, className: "w-full bg-card text-foreground select-none font-sans flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", {
               className: "relative w-full overflow-hidden border-b border-border bg-[#0d1117]", children: [
      /* @__PURE__ */ jsx("div", {
                  className: "absolute top-0 right-0 p-3 z-10 flex items-center justify-end pointer-events-none", children: /* @__PURE__ */ jsx(
                     "button",
                     {
                        onClick: () => setIsPlaying(!isPlaying),
                        className: "w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-none bg-muted/90 hover:bg-secondary-hover text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary pointer-events-auto relative overflow-visible after:absolute after:-inset-1",
                        "aria-label": isPlaying ? "Pause animation" : "Play animation",
                        children: /* @__PURE__ */ jsx("span", { className: "material-icons !text-base", children: isPlaying ? "pause" : "play_arrow" })
                     }
                  )
               }),
      /* @__PURE__ */ jsx(
                  "div",
                  {
                     className: "absolute bg-[#0d1117]/60 text-emerald-400 rounded px-1.5 py-0.5 text-xs font-medium pointer-events-none",
                     style: { left: padding.left + 8, top: padding.top - 20 },
                     children: "Live Stream"
                  }
               ),
      /* @__PURE__ */ jsxs(
                  "svg",
                  {
                     role: "img",
                     "aria-label": "Interactive streaming statistical process control panel chart displaying dynamic moving control limits and anomaly flags.",
                     viewBox: `0 0 ${width} ${height}`,
                     className: "w-full block",
                     children: [
            /* @__PURE__ */ jsxs("g", {
                        stroke: "rgba(255, 255, 255, 0.07)", strokeWidth: 1, children: [
              /* @__PURE__ */ jsx("line", { x1: padding.left, y1: yScale(30), x2: width - padding.right, y2: yScale(30) }),
              /* @__PURE__ */ jsx("line", { x1: padding.left, y1: yScale(50), x2: width - padding.right, y2: yScale(50) }),
              /* @__PURE__ */ jsx("line", { x1: padding.left, y1: yScale(70), x2: width - padding.right, y2: yScale(70) })
                        ]
                     }),
                        areaShadingPath && /* @__PURE__ */ jsx(
                           "path",
                           {
                              d: areaShadingPath,
                              fill: "rgba(234, 67, 53, 0.05)",
                              className: "transition-all duration-300"
                           }
                        ),
                        uclLinePath && /* @__PURE__ */ jsx(
                           "path",
                           {
                              d: uclLinePath,
                              fill: "none",
                              stroke: "#ea4335",
                              strokeWidth: 1.5,
                              strokeDasharray: "4 4",
                              opacity: 0.8
                           }
                        ),
                        lclLinePath && /* @__PURE__ */ jsx(
                           "path",
                           {
                              d: lclLinePath,
                              fill: "none",
                              stroke: "#ea4335",
                              strokeWidth: 1.5,
                              strokeDasharray: "4 4",
                              opacity: 0.8
                           }
                        ),
                        meanLinePath && /* @__PURE__ */ jsx(
                           "path",
                           {
                              d: meanLinePath,
                              fill: "none",
                              stroke: "#336ef3",
                              strokeWidth: 1.8,
                              opacity: 0.85
                           }
                        ),
                        sensorLinePath && /* @__PURE__ */ jsx(
                           "path",
                           {
                              d: sensorLinePath,
                              fill: "none",
                              stroke: "#00f5d4",
                              strokeWidth: 2
                           }
                        ),
                        dataPoints.map((pt, idx) => {
                           const cx = xScale(pt.timestamp);
                           const cy = yScale(pt.value);
                           if (cx < padding.left || cx > width - padding.right) return null;
                           if (pt.isAnomaly) {
                              return /* @__PURE__ */ jsxs("g", {
                                 children: [
                  /* @__PURE__ */ jsx("circle", { cx, cy, r: 7, fill: "#ea4335", opacity: 0.3, className: "animate-ping" }),
                  /* @__PURE__ */ jsx("circle", { cx, cy, r: 4.5, fill: "#ea4335", stroke: "#ffffff", strokeWidth: 1 })
                                 ]
                              }, `anomaly-${pt.id}-${idx}`);
                           }
                           if (idx === dataPoints.length - 1) {
                              return /* @__PURE__ */ jsx("circle", { cx, cy, r: 4, fill: "#00f5d4", stroke: "#ffffff", strokeWidth: 1.5 }, `latest-${pt.id}`);
                           }
                           if (pt.isLate) {
                              return /* @__PURE__ */ jsx("circle", { cx, cy, r: 3.5, fill: "#b5179e", stroke: "#ffffff", strokeWidth: 0.5 }, `late-node-${pt.id}`);
                           }
                           return null;
                        }),
                        lateQueue.map((item) => {
                           const startX = width - padding.right - 20;
                           const startY = padding.top + 20;
                           const targetX = xScale(item.targetTimestamp);
                           const targetY = yScale(item.value);
                           const currentX = startX + (targetX - startX) * item.progress;
                           const currentY = startY + (targetY - startY) * item.progress;
                           return /* @__PURE__ */ jsxs("g", {
                              children: [
                /* @__PURE__ */ jsx(
                                 "line",
                                 {
                                    x1: startX,
                                    y1: startY,
                                    x2: targetX,
                                    y2: targetY,
                                    stroke: "#b5179e",
                                    strokeDasharray: "2 3",
                                    strokeWidth: 1,
                                    opacity: 0.4
                                 }
                              ),
                /* @__PURE__ */ jsx(
                                 "circle",
                                 {
                                    cx: currentX,
                                    cy: currentY,
                                    r: 5,
                                    fill: "#b5179e",
                                    stroke: "#ffffff",
                                    strokeWidth: 1
                                 }
                              )
                              ]
                           }, `queue-item-${item.id}`);
                        }),
            /* @__PURE__ */ jsxs("g", {
                           fill: "rgba(255, 255, 255, 0.6)", fontSize: 11, textAnchor: "start", children: [
              /* @__PURE__ */ jsxs("text", {
                              x: width - padding.right + 8, y: yScale(latestMeta.ucl) + 4, fill: "#ea4335", children: [
                                 "UCL: ",
                                 latestMeta.ucl.toFixed(1)
                              ]
                           }),
              /* @__PURE__ */ jsxs("text", {
                              x: width - padding.right + 8, y: yScale(latestMeta.mean) + 4, fill: "#336ef3", children: [
                                 "CL: ",
                                 latestMeta.mean.toFixed(1)
                              ]
                           }),
              /* @__PURE__ */ jsxs("text", {
                              x: width - padding.right + 8, y: yScale(latestMeta.lcl) + 4, fill: "#ea4335", children: [
                                 "LCL: ",
                                 latestMeta.lcl.toFixed(1)
                              ]
                           }),
              /* @__PURE__ */ jsx("text", { x: padding.left - 36, y: yScale(70) + 4, textAnchor: "end", children: "70.0" }),
              /* @__PURE__ */ jsx("text", { x: padding.left - 36, y: yScale(50) + 4, textAnchor: "end", children: "50.0" }),
              /* @__PURE__ */ jsx("text", { x: padding.left - 36, y: yScale(30) + 4, textAnchor: "end", children: "30.0" })
                           ]
                        })
                     ]
                  }
               )
               ]
            }),
    /* @__PURE__ */ jsxs("div", {
               className: "flex items-center justify-center gap-x-4 sm:gap-x-8 md:gap-x-12 border-b border-border px-5 py-3 shrink-0", children: [
      /* @__PURE__ */ jsxs("div", {
                  className: "flex flex-col items-center gap-0.5 min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium truncate text-center w-full", children: "Process Mean" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground tabular-nums truncate text-center w-full", children: metrics.mean.toFixed(2) })
                  ]
               }),
      /* @__PURE__ */ jsxs("div", {
                  className: "flex flex-col items-center gap-0.5 min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium truncate text-center w-full", children: "Dispersion (σ)" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground tabular-nums truncate text-center w-full", children: metrics.std.toFixed(2) })
                  ]
               }),
      /* @__PURE__ */ jsxs("div", {
                  className: "flex flex-col items-center gap-0.5 min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium truncate text-center w-full", children: "Anomalies" }),
        /* @__PURE__ */ jsx("span", { className: `text-sm font-medium tabular-nums truncate text-center w-full ${metrics.anomalies > 0 ? "text-error" : "text-success"}`, children: metrics.anomalies })
                  ]
               })
               ]
            }),
    /* @__PURE__ */ jsxs("div", {
               className: "p-5 flex flex-col gap-5", children: [
      /* @__PURE__ */ jsxs("div", {
                  className: "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4", children: [
        /* @__PURE__ */ jsxs("div", {
                     className: "flex flex-col gap-1.5 w-full", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Moving Window Size" }),
          /* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-3 w-full", children: [
            /* @__PURE__ */ jsxs(
                           Slider.Root,
                           {
                              className: "relative flex items-center grow touch-none select-none h-11 cursor-pointer py-3 -my-3",
                              value: [windowSize],
                              onValueChange: (val) => setWindowSize(val[0]),
                              min: 15,
                              max: 50,
                              step: 1,
                              "aria-label": "Adjust Moving Window size constraint",
                              children: [
                  /* @__PURE__ */ jsx(Slider.Track, { className: "relative grow rounded-full h-1 !bg-muted", children: /* @__PURE__ */ jsx(Slider.Range, { className: "absolute h-full bg-primary rounded-full" }) }),
                  /* @__PURE__ */ jsx(
                                 Slider.Thumb,
                                 {
                                    className: "block w-[18px] h-[18px] rounded-full bg-primary border-none shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary relative after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11",
                                    "aria-label": "Moving window thumb slider handle"
                                 }
                              )
                              ]
                           }
                        ),
            /* @__PURE__ */ jsxs("span", {
                           className: "text-sm font-medium text-foreground tabular-nums w-[6ch] text-right shrink-0 whitespace-nowrap", children: [
                              windowSize,
                              " pts"
                           ]
                        })
                        ]
                     })
                     ]
                  }),
        /* @__PURE__ */ jsxs("div", {
                     className: "flex flex-col gap-1.5 w-full", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Simulate Process Mean Shift" }),
          /* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-3 w-full", children: [
            /* @__PURE__ */ jsxs(
                           Slider.Root,
                           {
                              className: "relative flex items-center grow touch-none select-none h-11 cursor-pointer py-3 -my-3",
                              value: [processShift],
                              onValueChange: (val) => setProcessShift(val[0]),
                              min: -15,
                              max: 15,
                              step: 0.5,
                              "aria-label": "Simulate artificial process mean shift offset",
                              children: [
                  /* @__PURE__ */ jsx(Slider.Track, { className: "relative grow rounded-full h-1 !bg-muted", children: /* @__PURE__ */ jsx(Slider.Range, { className: "absolute h-full bg-primary rounded-full" }) }),
                  /* @__PURE__ */ jsx(
                                 Slider.Thumb,
                                 {
                                    className: "block w-[18px] h-[18px] rounded-full bg-primary border-none shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary relative after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11",
                                    "aria-label": "Process mean shift thumb handle"
                                 }
                              )
                              ]
                           }
                        ),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground tabular-nums w-[6ch] text-right shrink-0 whitespace-nowrap", children: processShift > 0 ? `+${processShift.toFixed(1)}` : processShift.toFixed(1) })
                        ]
                     })
                     ]
                  })
                  ]
               }),
      /* @__PURE__ */ jsxs("div", {
                  className: "flex flex-col gap-1.5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-muted-foreground", children: "Data Stream Simulation Scenario" }),
        /* @__PURE__ */ jsxs("div", {
                     className: "relative h-9 rounded-lg bg-muted px-3 flex items-center", children: [
          /* @__PURE__ */ jsxs(
                        "select",
                        {
                           value: streamMode,
                           onChange: (e) => setStreamMode(e.target.value),
                           className: "absolute inset-x-0 top-1/2 -translate-y-1/2 h-11 w-full opacity-0 cursor-pointer pointer-events-auto text-sm",
                           "aria-label": "Select streaming statistical scenario mode",
                           children: [
                /* @__PURE__ */ jsx("option", { value: "standard", children: "Standard IoT Stream (Controlled Variance)" }),
                /* @__PURE__ */ jsx("option", { value: "jitter", children: "Late Arrival & Jitter Injections (Out of Order Queue)" }),
                /* @__PURE__ */ jsx("option", { value: "drift", children: "Cyclical Process Drift (Dynamic Control Limits Adaptation)" })
                           ]
                        }
                     ),
          /* @__PURE__ */ jsxs("span", {
                        className: "text-sm font-medium text-foreground truncate", children: [
                           streamMode === "standard" && "Standard IoT Stream (Controlled Variance)",
                           streamMode === "jitter" && "Late Arrival & Jitter Injections (Out of Order Queue)",
                           streamMode === "drift" && "Cyclical Process Drift (Dynamic Control Limits Adaptation)"
                        ]
                     }),
          /* @__PURE__ */ jsx("span", { className: "material-icons absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none !text-base", children: "expand_more" })
                     ]
                  })
                  ]
               })
               ]
            })
            ]
         });
      }

      ReactDOM.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsx(React.StrictMode, { children: /* @__PURE__ */ jsx(App, {}) })
      );
