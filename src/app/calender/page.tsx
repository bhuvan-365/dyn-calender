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

    const [availableDatesByMonth, setAvailableDatesByMonth] = useState<
        Record<string, number[]>
    >(() => {
        try {
            const raw = localStorage.getItem("availableDatesByMonth");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    const [blockedDatesByMonth, setBlockedDatesByMonth] = useState<
        Record<string, number[]>
    >(() => {
        try {
            const raw = localStorage.getItem("blockedDatesByMonth");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem(
            "availableDatesByMonth",
            JSON.stringify(availableDatesByMonth)
        );
    }, [availableDatesByMonth]);

    useEffect(() => {
        localStorage.setItem(
            "blockedDatesByMonth",
            JSON.stringify(blockedDatesByMonth)
        );
    }, [blockedDatesByMonth]);

    function daysInMonth(y: number, m: number) {
        return new Date(y, m + 1, 0).getDate();
    }

    function firstWeekday(y: number, m: number) {
        return new Date(y, m, 1).getDay();
    }

    const monthKey = useMemo(
        () => monthKeyFromDate(viewYear, viewMonth),
        [viewYear, viewMonth]
    );

    function parseInput(text: string) {
        const validDays = daysInMonth(viewYear, viewMonth);
        return Array.from(
            new Set(
                text
                    .split(",")
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => !Number.isNaN(n) && n >= 1 && n <= validDays)
            )
        ).sort((a, b) => a - b);
    }

    function applyInput() {
        const parsed = parseInput(input);
        const all = Array.from(
            { length: daysInMonth(viewYear, viewMonth) },
            (_, i) => i + 1
        );

        let newAvailable: Record<string, number[]> = {};
        let newBlocked: Record<string, number[]> = {};

        if (mode === "allow") {
            const available = parsed;
            const blocked = all.filter((d) => !parsed.includes(d));

            setAvailableDatesByMonth((prev) => ({ ...prev, [monthKey]: available }));
            setBlockedDatesByMonth((prev) => ({ ...prev, [monthKey]: blocked }));

            newAvailable = { ...availableDatesByMonth, [monthKey]: available };
            newBlocked = { ...blockedDatesByMonth, [monthKey]: blocked };
        } else {
            const blocked = parsed;
            const available = all.filter((d) => !parsed.includes(d));

            setBlockedDatesByMonth((prev) => ({ ...prev, [monthKey]: blocked }));
            setAvailableDatesByMonth((prev) => ({ ...prev, [monthKey]: available }));

            newAvailable = { ...availableDatesByMonth, [monthKey]: available };
            newBlocked = { ...blockedDatesByMonth, [monthKey]: blocked };
        }

        // Print both formats to console
        setTimeout(() => {
            const currentData = {
                availableDatesByMonth: newAvailable,
                blockedDatesByMonth: newBlocked,
            };

            console.clear();

            // Pretty JSON format like your example
            console.log(`"Dateinfo": ${JSON.stringify(currentData, null, 2)}`);

            //  Object format (usable form)
            console.log({
                Dateinfo: currentData,
            });
        }, 100);

        setInput("");
        setHighlightedRange(null);
    }

    function handleAvailableDateClick(day: number) {
        const start = new Date(viewYear, viewMonth, day);
        const range: Date[] = [];
        for (let i = 0; i < 10; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            range.push(d);
        }
        setHighlightedRange(range);
    }

    const totalDays = daysInMonth(viewYear, viewMonth);
    const offset = firstWeekday(viewYear, viewMonth);
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

    function isDayHighlighted(day: number) {
        if (!highlightedRange) return false;
        return highlightedRange.some(
            (d) =>
                d.getFullYear() === viewYear &&
                d.getMonth() === viewMonth &&
                d.getDate() === day
        );
    }

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const yearOptions = Array.from({ length: 10 }, (_, i) => today.getFullYear() - 2 + i);

    const availableForThisMonth = availableDatesByMonth[monthKey] || [];
    const blockedForThisMonth = blockedDatesByMonth[monthKey] || [];

    return (
        <div className="min-h-screen py-5">
            <div className="uppercase text-center text-4xl font-semibold">Calender</div>
            <div className=" bg-gray-50 flex items-start justify-center p-6">

                <div className="w-full max-w-xl bg-white rounded-sm shadow border border-zinc-500 p-6">
                    {/* Header */}

                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <select
                                className=" px-3 py-1 rounded bg-black/20 focus:outline-none focus:ring-0 cursor-pointer"
                                value={viewMonth}
                                onChange={(e) => setViewMonth(Number(e.target.value))}
                            >
                                {months.map((m, i) => (
                                    <option key={m} value={i}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <select
                                className=" px-3 py-1 rounded bg-black/20 focus:outline-none focus:ring-0 cursor-pointer"
                                value={viewYear}
                                onChange={(e) => setViewYear(Number(e.target.value))}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>


                    </div>
                    {/* <div className="text-2xl font-semibold text-center py-4 ">Octuber 2025</div> */}
                    <div className="text-2xl font-semibold text-center py-4">
                        {months[viewMonth]} {viewYear}
                    </div>



                    {/* Week headers */}
                    <div className="grid grid-cols-7 text-center font-medium text-sm text-gray-600">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <div key={d} className="py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-2 mt-2">
                        {Array.from({ length: offset }).map((_, i) => (
                            <div key={`e-${i}`} className="h-12 border border-zinc-500 rounded-sm bg-gray-50" />
                        ))}

                        {daysArray.map((day) => {
                            const isBlocked = blockedForThisMonth.includes(day);
                            const highlighted = isDayHighlighted(day);
                            return (
                                <button
                                    key={day}
                                    onClick={() => {
                                        if (!isBlocked) handleAvailableDateClick(day);
                                    }}
                                    disabled={isBlocked}
                                    className={`relative h-12 border border-zinc-500 rounded-sm p-2 text-left transition-all
                  ${isBlocked
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-white hover:bg-blue-50"}
                  ${highlighted ? "ring-2 ring-blue-500" : ""}`}
                                >
                                    <div className="text-md text-center font-medium">{day}</div>
                                    {isBlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-red-500/50 text-2xl font-bold">✕</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
            <div className=" mx-auto max-w-4xl flex justify-center items-center gap-5 pt-12">
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        checked={mode === "allow"}
                        onChange={() => setMode("allow")}
                    />
                    <span>Allow Booking</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        checked={mode === "block"}
                        onChange={() => setMode("block")}
                    />
                    <span>Don't Allow Booking</span>
                </label>
            </div>

            {/* Input */}
            <div className="flex gap-2 mb-4 mx-auto max-w-4xl py-2 px-16">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Enter comma-separated days for ${months[viewMonth]} ${viewYear} (e.g. 1,2,6)`}
                    className="flex-1 border px-3 py-2 rounded"
                />
                <button
                    onClick={applyInput}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                    Apply
                </button>
                <button
                    onClick={() => {
                        setAvailableDatesByMonth({});
                        setBlockedDatesByMonth({});
                        localStorage.removeItem("availableDatesByMonth");
                        localStorage.removeItem("blockedDatesByMonth");
                        console.clear();
                    }}
                    className="px-3 py-2 rounded border"
                >
                    Clear All
                </button>
            </div>
        </div>
    );
}
