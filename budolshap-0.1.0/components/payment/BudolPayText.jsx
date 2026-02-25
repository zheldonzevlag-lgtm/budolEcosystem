import React from 'react';

export default function BudolPayText({ text, className = "", baseClassName = "font-semibold" }) {
    if (!text) return null;

    // Regex to match budol followed by optional underscore and suffix (pay, shap, etc.)
    const pattern = /(budol)(_?)([a-zA-Z₱]+)/gi;
    
    if (!pattern.test(text)) {
        return <span className={className}>{text}</span>;
    }

    // Reset regex lastIndex because of /g flag
    pattern.lastIndex = 0;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const budolPart = "budol";
        let suffixPart = match[3];
        const suffixLower = suffixPart.toLowerCase();

        // Normalize suffix and determine color
        let suffixColor = "text-rose-500"; // Default to rose-500 for Pay
        
        if (suffixLower === "pay" || suffixLower === "₱ay") {
            suffixPart = "Pay";
            suffixColor = "text-rose-500";
        } else if (suffixLower === "shap") {
            suffixPart = "Shap";
            suffixColor = "text-emerald-500";
        } else if (suffixLower === "care") {
            suffixPart = "Care";
            suffixColor = "text-emerald-500";
        } else if (suffixLower === "express") {
            suffixPart = "Express";
            suffixColor = "text-amber-500";
        } else if (suffixLower === "loan") {
            suffixPart = "Loan";
            suffixColor = "text-blue-500";
        } else if (suffixLower === "akawntng") {
            suffixPart = "Akawntng";
            suffixColor = "text-purple-500";
        }

        parts.push(
            <span key={match.index} className={baseClassName}>
                <span className="text-slate-600">budol</span>
                <span className={suffixColor}>{suffixPart}</span>
            </span>
        );

        lastIndex = pattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return (
        <span className={className}>
            {parts.map((part, i) => (
                <React.Fragment key={i}>{part}</React.Fragment>
            ))}
        </span>
    );
}
