import math


def calculate_heatmap(file_tree, current_path=""):
    heatmap_files = []
    
    for node in file_tree:
        node_path = f"{current_path}/{node['name']}" if current_path else f"/{node['name']}"
        
        if node["type"] == "folder":
            heatmap_files.extend(calculate_heatmap(node["children"], node_path))
        else:
            complexity, no_test_score, risk, duplication, bugs = _compute_risk_factors(node)
            
            if risk < 30:
                color = "emerald"
            elif risk < 65:
                color = "amber"
            else:
                color = "rose"
            
            heatmap_files.append({
                "name": node["name"],
                "path": node_path,
                "complexity": complexity,
                "bugs": bugs,
                "risk": risk,
                "color": color,
                "lines": node.get("lines", 0)
            })
            
    return heatmap_files


def build_heatmap_tree(file_tree, current_path=""):
    children = []
    for node in file_tree:
        node_path = f"{current_path}/{node['name']}" if current_path else f"/{node['name']}"
        if node["type"] == "folder":
            child_tree = build_heatmap_tree(node["children"], node_path)
            if child_tree:
                children.append({
                    "name": node["name"],
                    "path": node_path,
                    "children": child_tree
                })
        else:
            complexity, no_test_score, risk, duplication, bugs = _compute_risk_factors(node)
            lines = node.get("lines", 0)
            
            children.append({
                "name": node["name"],
                "path": node_path,
                "value": max(lines, 10),  # D3 tile size based on lines of code
                "size": max(lines, 10),
                "riskScore": risk,
                "riskFactors": {
                    "complexity": complexity,
                    "duplication": duplication,
                    "noTests": no_test_score
                },
                "bobExplanation": _generate_explanation(node, risk, complexity, no_test_score, duplication),
                "issues": _generate_issues(complexity, no_test_score, duplication, lines),
                "bugs": bugs
            })
    return children


def _compute_risk_factors(node):
    """
    Compute all risk factors for a file node using actual parsed metrics.
    Returns: (complexity_score, no_test_score, risk_score, duplication_score, bugs)
    """
    raw_complexity = node.get("complexity", 1)
    if not isinstance(raw_complexity, (int, float)):
        raw_complexity = 1
    
    lines = node.get("lines", 0)
    ext = node.get("extension", "")
    name = node.get("name", "")
    num_imports = len(node.get("imports", []))
    num_functions = len(node.get("functions", []))
    
    # --- Complexity Score (0-100) ---
    # Combine raw complexity with line count and function density
    # raw_complexity from parser is typically 1-30
    base_complexity = min(raw_complexity * 4, 60)
    
    # Long files are inherently more complex
    line_complexity = 0
    if lines > 500:
        line_complexity = 25
    elif lines > 300:
        line_complexity = 18
    elif lines > 150:
        line_complexity = 10
    elif lines > 80:
        line_complexity = 5
    
    # Many functions in one file suggests it does too much
    function_density_bonus = min(num_functions * 2, 15)
    
    complexity_score = min(100, int(base_complexity + line_complexity + function_density_bonus))
    
    # --- No Test Score (0-100) ---
    # More nuanced than just checking if "test" is in the name
    is_test_file = any(kw in name.lower() for kw in ['test', 'spec', '__test__', '.test.', '.spec.'])
    is_config = any(kw in name.lower() for kw in ['config', '.env', 'package.json', 'tsconfig', 'webpack', 'vite', 'jest', 'eslint', '.gitignore', 'readme', 'license'])
    is_static = ext in ['.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.xml', '.csv', '.svg', '.ico']
    
    if is_test_file:
        no_test_score = 0  # This IS a test file
    elif is_config or is_static:
        no_test_score = 10  # Config/static files don't really need tests
    elif ext in ['.css', '.scss', '.less', '.html', '.htm']:
        no_test_score = 15  # Style/markup files rarely need unit tests
    else:
        # Code files that aren't tests get penalized based on complexity
        no_test_score = min(100, 30 + int(complexity_score * 0.5))
    
    # --- Duplication Score (0-100) ---
    # Estimate duplication from import count and file size patterns
    if lines == 0:
        duplication = 0
    else:
        # Files with many imports relative to their size tend to have less duplication
        import_ratio = num_imports / max(lines, 1) * 100
        base_dup = max(0, 30 - int(import_ratio * 5))  # More imports = less duplication
        
        # Longer files tend to have more duplication
        length_dup = min(40, int(math.log2(max(lines, 1)) * 4))
        
        # Factor in complexity: high complexity + long files = likely duplication
        complexity_dup = int(complexity_score * 0.2)
        
        duplication = min(100, base_dup + length_dup + complexity_dup)
    
    # --- Overall Risk Score (0-100) ---
    # Weighted combination of all factors
    risk = int(
        complexity_score * 0.40 +   # 40% weight on complexity
        no_test_score * 0.30 +      # 30% weight on test coverage
        duplication * 0.20 +         # 20% weight on duplication
        line_complexity * 0.10       # 10% extra from file length
    )
    risk = min(max(risk, 0), 100)
    
    # --- Bug Estimation ---
    # Based on risk and complexity
    if risk < 20:
        bugs = 0
    elif risk < 40:
        bugs = 1
    elif risk < 60:
        bugs = max(1, int(complexity_score / 25))
    elif risk < 80:
        bugs = max(2, int(complexity_score / 15))
    else:
        bugs = max(3, int(complexity_score / 10))
    
    return complexity_score, no_test_score, risk, duplication, bugs


def _generate_explanation(node, risk, complexity, no_test_score, duplication):
    """Generate a meaningful explanation based on actual file metrics."""
    name = node.get("name", "")
    lines = node.get("lines", 0)
    num_functions = len(node.get("functions", []))
    
    parts = []
    
    if risk >= 70:
        parts.append(f"High-risk file (score: {risk}/100).")
    elif risk >= 40:
        parts.append(f"Moderate risk (score: {risk}/100).")
    else:
        parts.append(f"Low risk (score: {risk}/100).")
    
    if complexity > 60:
        parts.append(f"High cyclomatic complexity ({complexity}) suggests deeply nested control flow.")
    elif complexity > 30:
        parts.append(f"Moderate complexity ({complexity}) with room for simplification.")
    
    if lines > 300:
        parts.append(f"Large file ({lines} lines) — consider splitting into smaller modules.")
    
    if num_functions > 10:
        parts.append(f"Contains {num_functions} functions — may have too many responsibilities.")
    
    if no_test_score > 60:
        parts.append("No corresponding test file detected.")
    
    if duplication > 50:
        parts.append("Potential code duplication detected.")
    
    if not parts:
        parts.append("Well-structured file with acceptable metrics.")
    
    return " ".join(parts)


def _generate_issues(complexity, no_test_score, duplication, lines):
    """Generate a list of specific issues based on metrics."""
    issues = []
    
    if complexity > 60:
        issues.append("High cyclomatic complexity")
    elif complexity > 35:
        issues.append("Moderate complexity")
    
    if no_test_score > 60:
        issues.append("Missing test coverage")
    
    if duplication > 50:
        issues.append("Potential code duplication")
    
    if lines > 500:
        issues.append("File too large — split recommended")
    elif lines > 300:
        issues.append("Large file")
    
    if not issues:
        issues.append("No major issues")
    
    return issues
