import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/landing/card";
import {
    Search,
    SpellCheck,
    ArrowLeft,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Copy,
    RotateCcw,
    FileText,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8000";

/* ───────────────────────────── Navbar ───────────────────────────── */
function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                <Link to="/" className="flex items-center gap-2 no-underline">
                    <span className="text-lg font-bold tracking-tight text-neutral-900">
                        Word<span className="text-amber-500">Lens</span>
                    </span>
                </Link>

                <div className="hidden items-center gap-6 md:flex">
                    <Link
                        to="/"
                        className="text-sm font-medium text-neutral-500 hover:text-amber-600 no-underline flex items-center gap-1.5"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Beranda
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    >
                        Login
                    </Button>
                    <Button
                        size="sm"
                        className="bg-amber-500 text-white hover:bg-amber-600 border-0 shadow-none"
                    >
                        Register
                    </Button>
                </div>
            </div>
        </nav>
    );
}

/* ────────────────────── SpellCheck Component ────────────────────── */
export default function SpellCheckPage() {
    const [text, setText] = useState("");
    const [errors, setErrors] = useState([]);
    const [totalWords, setTotalWords] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const [copied, setCopied] = useState(false);
    const [apiError, setApiError] = useState(null);

    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;

    const handleCheck = async () => {
        if (!text.trim()) return;
        setIsChecking(true);
        setApiError(null);

        try {
            const response = await fetch(`${API_BASE}/api/spelling/check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || `Server error: ${response.status}`);
            }

            const result = await response.json();
            
            // Format result.corrections to match previous errors layout
            const formattedErrors = result.corrections.map(c => ({
                word: c.original,
                suggestions: c.suggestions.map(s => ({ word: s, distance: 0, frequency: 0 }))
            }));

            setErrors(formattedErrors);
            setTotalWords(text.trim().split(/\s+/).length);
            setHasChecked(true);
        } catch (err) {
            console.error("Spell check error:", err);
            setApiError(
                err.message || "Gagal terhubung ke server. Pastikan backend berjalan."
            );
        } finally {
            setIsChecking(false);
        }
    };

    const handleReset = () => {
        setText("");
        setErrors([]);
        setHasChecked(false);
        setApiError(null);
        setTotalWords(0);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReplace = (errorWord, replacement) => {
        const regex = new RegExp(`\\b${errorWord}\\b`, "gi");
        setText((prev) => prev.replace(regex, replacement));
        setErrors((prev) =>
            prev.filter(
                (e) => e.word.toLowerCase() !== errorWord.toLowerCase()
            )
        );
    };

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            <Navbar />

            <main className="mx-auto max-w-5xl px-6 py-10">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                            <SpellCheck className="h-5 w-5 text-amber-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                            Pengecekan Ejaan
                        </h1>
                    </div>
                    <p className="text-neutral-500 text-sm mt-1 ml-[52px]">
                        Masukkan atau tempel teks Anda untuk memeriksa kesalahan ejaan
                        menggunakan algoritma SymSpell
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* ─── Input Area ─── */}
                    <div className="lg:col-span-2">
                        <Card className="border-neutral-200 bg-white shadow-none">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold text-neutral-900">
                                        Input Teks
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>{wordCount} kata</span>
                                        <span>·</span>
                                        <span>{charCount} karakter</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    id="spell-check-input"
                                    value={text}
                                    onChange={(e) => {
                                        setText(e.target.value);
                                        if (hasChecked) setHasChecked(false);
                                        if (apiError) setApiError(null);
                                    }}
                                    placeholder="Ketik atau tempel teks Anda di sini untuk diperiksa ejaannya..."
                                    className="w-full min-h-[300px] rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none resize-y transition-colors leading-relaxed"
                                />

                                {/* API Error */}
                                {apiError && (
                                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                        <p className="text-xs text-red-700">{apiError}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <Button
                                        onClick={handleCheck}
                                        disabled={!text.trim() || isChecking}
                                        className="bg-amber-500 text-white hover:bg-amber-600 border-0 shadow-none font-semibold"
                                    >
                                        {isChecking ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Memeriksa...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="h-4 w-4" />
                                                Periksa Ejaan
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleCopy}
                                        disabled={!text.trim()}
                                        className="border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                    >
                                        <Copy className="h-4 w-4" />
                                        {copied ? "Tersalin!" : "Salin Teks"}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        disabled={!text.trim()}
                                        className="border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Reset
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ─── Result Panel ─── */}
                    <div className="lg:col-span-1">
                        <Card className="border-neutral-200 bg-white shadow-none sticky top-20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold text-neutral-900">
                                    Hasil Pemeriksaan
                                </CardTitle>
                                {hasChecked && (
                                    <p className="text-xs text-neutral-400 mt-1">
                                        {totalWords} kata diperiksa
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent>
                                {!hasChecked ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 mb-4">
                                            <SpellCheck className="h-7 w-7 text-neutral-300" />
                                        </div>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Masukkan teks dan klik
                                            <br />
                                            <strong className="text-neutral-500">
                                                "Periksa Ejaan"
                                            </strong>
                                            <br />
                                            untuk memulai
                                        </p>
                                    </div>
                                ) : errors.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 mb-4">
                                            <CheckCircle2 className="h-7 w-7 text-green-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-green-700 mb-1">
                                            Tidak ada kesalahan!
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            Ejaan teks Anda sudah benar
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Summary */}
                                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 mb-4">
                                            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                            <p className="text-xs text-amber-700">
                                                Ditemukan <strong>{errors.length}</strong> kemungkinan
                                                kesalahan ejaan
                                            </p>
                                        </div>

                                        {/* Error list */}
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                            {errors.map((err, idx) => (
                                                <div
                                                    key={`${err.word}-${err.position}-${idx}`}
                                                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-red-600 break-all">
                                                                "{err.word}"
                                                            </p>
                                                            {err.suggestions.length > 0 ? (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-neutral-400 mb-1.5">
                                                                        Saran perbaikan:
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {err.suggestions.map((sug) => (
                                                                            <button
                                                                                key={sug.word}
                                                                                onClick={() =>
                                                                                    handleReplace(err.word, sug.word)
                                                                                }
                                                                                className="rounded-md bg-white border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
                                                                                title={`Jarak edit: ${sug.distance}, Frekuensi: ${sug.frequency}`}
                                                                            >
                                                                                {sug.word}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-neutral-400 mt-1">
                                                                    Tidak ada saran yang ditemukan
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Tip section */}
                <Card className="mt-6 border-neutral-200 bg-white shadow-none">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 shrink-0 mt-0.5">
                                <SpellCheck className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-neutral-800 mb-1">
                                    Tips Penggunaan
                                </p>
                                <ul className="text-xs text-neutral-500 space-y-1 leading-relaxed">
                                    <li>
                                        • Tempelkan teks dari dokumen, artikel, atau tugas Anda ke
                                        kotak input
                                    </li>
                                    <li>
                                        • Klik tombol "Periksa Ejaan" untuk memulai analisis
                                        menggunakan algoritma SymSpell
                                    </li>
                                    <li>
                                        • Klik saran perbaikan untuk mengganti kata yang salah
                                        secara otomatis
                                    </li>
                                    <li>
                                        • Gunakan tombol "Salin Teks" untuk menyalin hasil yang
                                        sudah diperbaiki
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
