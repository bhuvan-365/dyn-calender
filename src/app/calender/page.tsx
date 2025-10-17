"use client";

import React, { useEffect, useMemo, useState } from "react";

type Mode = "allow" | "block";

function monthKeyFromDate(y: number, m: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export default function DynamicCalendarPage() {
    const today = new Date();
    const [viewYear, setViewYear] = useState<number>(today.getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
    const [mode, setMode] = useState<Mode>("allow");
    const [input, setInput] = useState<string>("");
    const [highlightedRange, setHighlightedRange] = useState<Date[] | null>(null);

    // persisted data: monthKey -> array of numeric days
    const [availableDatesByMonth, setAvailableDatesByMonth] = useState<Record<string, number[]>>(() => {
        try {
            const raw = localStorage.getItem("availableDatesByMonth");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    const [blockedDatesByMonth, setBlockedDatesByMonth] = useState<Record<string, number[]>>(() => {
        try {
            const raw = localStorage.getItem("blockedDatesByMonth");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem("availableDatesByMonth", JSON.stringify(availableDatesByMonth));
    }, [availableDatesByMonth]);
    useEffect(() => {
        localStorage.setItem("blockedDatesByMonth", JSON.stringify(blockedDatesByMonth));
    }, [blockedDatesByMonth]);

    // helpers
    function daysInMonth(y: number, m: number) {
        return new Date(y, m + 1, 0).getDate();
    }
    function firstWeekday(y: number, m: number) {
        return new Date(y, m, 1).getDay();
    }

    const monthKey = useMemo(() => monthKeyFromDate(viewYear, viewMonth), [viewYear, viewMonth]);

    // parse CSV input -> unique sorted days within the month
    function parseInput(text: string) {
        return Array.from(
            new Set(
                text
                    .split(",")
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => !Number.isNaN(n) && n >= 1 && n <= daysInMonth(viewYear, viewMonth))
            )
        ).sort((a, b) => a - b);
    }

    function applyInput() {
        const parsed = parseInput(input);
        // if mode = allow => entered = available, others = blocked
        if (mode === "allow") {
            setAvailableDatesByMonth((prev) => ({ ...prev, [monthKey]: parsed }));
            // blocked = all other days
            const all = Array.from({ length: daysInMonth(viewYear, viewMonth) }, (_, i) => i + 1);
            const blocked = all.filter((d) => !parsed.includes(d));
            setBlockedDatesByMonth((prev) => ({ ...prev, [monthKey]: blocked }));
        } else {
            // mode = block => entered = blocked, others = available
            setBlockedDatesByMonth((prev) => ({ ...prev, [monthKey]: parsed }));
            const all = Array.from({ length: daysInMonth(viewYear, viewMonth) }, (_, i) => i + 1);
            const available = all.filter((d) => !parsed.includes(d));
            setAvailableDatesByMonth((prev) => ({ ...prev, [monthKey]: available }));
        }

        // print structured console object
        setTimeout(() => {
            console.clear();
            console.log({ availableDatesByMonth, blockedDatesByMonth });
            console.log({ availableDatesByMonth, blockedDatesByMonth })
        }, 50);

        setInput("");
        setHighlightedRange(null);

    }

    // clicking an available date should highlight 10 consecutive days starting at that date
    // the highlight may wrap into next months; we compute the Date range and store it, but only
    // visible days in the current month will show the blue border
    function handleAvailableDateClick(day: number) {
        // build start Date at viewYear, viewMonth, day
        const start = new Date(viewYear, viewMonth, day);
        const range: Date[] = [];
        for (let i = 0; i < 10; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            range.push(d);
        }
        setHighlightedRange(range);

        // also log the overall objects
        setTimeout(() => {
            console.clear();
            console.log({ availableDatesByMonth, blockedDatesByMonth });

            // const cleanAvailable = JSON.parse(JSON.stringify(availableDatesByMonth));
            // const cleanBlocked = JSON.parse(JSON.stringify(blockedDatesByMonth));
            // console.log(cleanAvailable, cleanBlocked);
        }, 50);
    }

    // render helpers
    const totalDays = daysInMonth(viewYear, viewMonth);
    const offset = firstWeekday(viewYear, viewMonth);
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

    // helpers to detect highlight membership for visible day
    function isDayHighlighted(day: number) {
        if (!highlightedRange) return false;
        return highlightedRange.some((d) => d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day);
    }

    // UI months/years
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const yearOptions = Array.from({ length: 10 }, (_, i) => today.getFullYear() - 2 + i);

    // current arrays for this month
    const availableForThisMonth = availableDatesByMonth[monthKey] || [];
    const blockedForThisMonth = blockedDatesByMonth[monthKey] || [];

    return (
        <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">
                {/* Header: month/year */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <select className="border px-3 py-2 rounded" value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}>
                            {months.map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>
                        <select className="border px-3 py-2 rounded" value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}>
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                            <input type="radio" checked={mode === "allow"} onChange={() => setMode("allow")} />
                            <span className="select-none">Allow Booking:</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" checked={mode === "block"} onChange={() => setMode("block")} />
                            <span className="select-none">Don't Allow Booking:</span>
                        </label>
                    </div>
                </div>

                {/* Input area */}
                <div className="flex gap-2 mb-4">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Enter comma-separated day numbers for ${months[viewMonth]} ${viewYear} (e.g. 1,2,6)`}
                        className="flex-1 border px-3 py-2 rounded"
                    />
                    <button onClick={applyInput} className="px-4 py-2 rounded bg-blue-600 text-white">Apply</button>
                    <button onClick={() => { setAvailableDatesByMonth({}); setBlockedDatesByMonth({}); localStorage.removeItem('availableDatesByMonth'); localStorage.removeItem('blockedDatesByMonth'); }} className="px-3 py-2 rounded border">Clear All</button>
                </div>

                {/* week headers */}
                <div className="grid grid-cols-7 text-center font-medium text-sm text-gray-600">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{d}</div>)}
                </div>

                {/* calendar grid */}
                <div className="grid grid-cols-7 gap-2 mt-2">
                    {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="h-20 border rounded bg-gray-50" />)}

                    {daysArray.map((day) => {
                        const isBlocked = blockedForThisMonth.includes(day);
                        const isAvailable = availableForThisMonth.includes(day);
                        const highlighted = isDayHighlighted(day);

                        // disabled if blocked
                        return (
                            <button
                                key={day}
                                onClick={() => {
                                    if (!isBlocked) handleAvailableDateClick(day);
                                }}
                                disabled={isBlocked}
                                className={`relative h-20 border rounded p-2 text-left flex flex-col justify-between items-start transition-all
                  ${isBlocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-blue-50'}
                  ${highlighted ? 'ring-2 ring-blue-500' : ''}
                `}
                            >
                                <div className="text-sm font-medium">{day}</div>

                                {isBlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-red-500 text-2xl font-bold">✕</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* footer: show current month data and console button */}


                <div className="mt-4 border-t pt-4 flex flex-col gap-2">
                    <div>
                        <strong>availableDatesByMonth:</strong>
                        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(availableDatesByMonth, null, 2)}</pre>
                    </div>
                    <div>
                        <strong>blockedDatesByMonth:</strong>
                        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(blockedDatesByMonth, null, 2)}</pre>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => console.log({ availableDatesByMonth, blockedDatesByMonth })} className="px-3 py-1 border rounded">Console Log</button>
                        <button onClick={() => setHighlightedRange(null)} className="px-3 py-1 border rounded">Clear Highlight</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
