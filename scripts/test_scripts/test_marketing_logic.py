
import json

def test_regex():
    import re
    description = "Your secure digital wallet for seamless payments and transfers across the budol₱ay Ecosystem."
    regExp = re.compile(r'(budol)(Pay|₱ay|Ecosystem|Shap|Loan|Express|ID)?', re.IGNORECASE)
    
    spans = []
    lastIndex = 0
    for match in regExp.finditer(description):
        if match.start() > lastIndex:
            spans.append(description[lastIndex:match.start()])
        
        spans.append("budol")
        if match.group(2):
            spans.append(match.group(2))
        lastIndex = match.end()
    
    if lastIndex < len(description):
        spans.append(description[lastIndex:])
    
    print(f"Spans: {spans}")

if __name__ == "__main__":
    test_regex()
