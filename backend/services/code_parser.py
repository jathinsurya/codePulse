import os
import re
from radon.complexity import cc_visit

def extract_api_routes(content: str, ext: str):
    routes = []
    if ext in ['.js', '.ts', '.jsx', '.tsx']:
        pattern = re.compile(r'(?:app|router)\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]')
        matches = pattern.findall(content)
        for method, path in matches:
            routes.append({"method": method.upper(), "path": path})
    elif ext == '.py':
        pattern = re.compile(r'@(?:app|router)\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]')
        matches = pattern.findall(content)
        for method, path in matches:
            routes.append({"method": method.upper(), "path": path})
    return routes

def extract_imports_and_functions(content: str, ext: str):
    imports = []
    functions = []
    
    # Fallback to regex for JS/TS imports and functions if tree-sitter language parser isn't available
    if ext in ['.js', '.ts', '.jsx', '.tsx']:
        import_pattern = re.compile(r'import\s+.*from\s+[\'"]([^\'"]+)[\'"]')
        imports = import_pattern.findall(content)
        
        func_pattern = re.compile(r'(?:function\s+([a-zA-Z0-9_]+))|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>')
        for match in func_pattern.findall(content):
            func_name = match[0] if match[0] else match[1]
            if func_name:
                functions.append(func_name)
                
    return imports, functions


def estimate_complexity_from_content(content: str, ext: str, lines: int):
    """
    Estimate cyclomatic complexity for non-Python files using heuristic analysis.
    Counts branching statements, nesting depth, and code patterns.
    """
    if not content or lines == 0:
        return 1
    
    # Count branching/complexity indicators
    branch_keywords = 0
    
    if ext in ['.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp', '.go', '.rs']:
        # Count control flow statements
        branch_patterns = [
            r'\bif\s*\(',         # if statements
            r'\belse\s+if\s*\(', # else if
            r'\belse\s*\{',      # else blocks
            r'\bfor\s*\(',       # for loops
            r'\bwhile\s*\(',     # while loops
            r'\bswitch\s*\(',    # switch statements
            r'\bcase\s+',        # case labels
            r'\bcatch\s*\(',     # catch blocks
            r'\b\?\s*',          # ternary operators (rough)
            r'\b&&\b',           # logical AND
            r'\b\|\|\b',         # logical OR
            r'\breturn\b',       # return statements
        ]
        for pat in branch_patterns:
            branch_keywords += len(re.findall(pat, content))
    
    elif ext == '.py':
        branch_patterns = [
            r'\bif\s+',
            r'\belif\s+',
            r'\belse\s*:',
            r'\bfor\s+',
            r'\bwhile\s+',
            r'\bexcept\s*',
            r'\breturn\b',
            r'\band\b',
            r'\bor\b',
        ]
        for pat in branch_patterns:
            branch_keywords += len(re.findall(pat, content))
    
    elif ext in ['.css', '.scss', '.less']:
        # CSS complexity = number of selectors and nested rules
        selectors = len(re.findall(r'[^{}]+\{', content))
        media_queries = len(re.findall(r'@media', content))
        return max(1, min(selectors // 5 + media_queries, 20))
    
    elif ext in ['.html', '.htm']:
        # HTML is not really "complex" in a code sense
        tags = len(re.findall(r'<[a-zA-Z]', content))
        scripts = len(re.findall(r'<script', content))
        return max(1, min(tags // 20 + scripts * 3, 15))
    
    elif ext in ['.json', '.yaml', '.yml', '.toml', '.xml']:
        # Config files - low complexity, scale with nesting
        nesting = max(content.count('{'), content.count('['))
        return max(1, min(nesting // 3, 8))
    
    elif ext in ['.md', '.txt', '.rst']:
        return 1  # Documentation has no code complexity
    
    else:
        # Unknown extensions: estimate from line count
        return max(1, min(lines // 50, 10))
    
    # Calculate complexity from branch density
    if lines > 0:
        branch_density = branch_keywords / lines  # branches per line
        # Typical range: 0.01 (simple) to 0.15+ (complex)
        complexity = branch_density * 100
        
        # Factor in file length (longer files tend to be more complex)
        length_factor = min(lines / 200, 2.0)  # caps at 2x for files > 400 lines
        complexity *= max(length_factor, 0.5)
        
        # Ensure reasonable range: 1-30
        return max(1, min(int(complexity), 30))
    
    return 1


def parse_codebase(repo_path: str):
    skip_dirs = {'node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 'venv', '.venv', 'env'}
    file_tree = {"name": "root", "type": "folder", "children": []}
    
    def walk_dir(current_path, current_node):
        try:
            entries = os.listdir(current_path)
        except PermissionError:
            return
            
        for entry in sorted(entries):
            full_path = os.path.join(current_path, entry)
            if os.path.isdir(full_path):
                if entry in skip_dirs:
                    continue
                folder_node = {"name": entry, "type": "folder", "children": []}
                current_node["children"].append(folder_node)
                walk_dir(full_path, folder_node)
            else:
                ext = os.path.splitext(entry)[1].lower()
                size = os.path.getsize(full_path)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    lines = len(content.splitlines())
                    
                    file_info = {
                        "name": entry,
                        "type": "file",
                        "size": size,
                        "extension": ext,
                        "lines": lines
                    }
                    
                    # Calculate complexity for Python files using radon
                    if ext == '.py':
                        try:
                            blocks = cc_visit(content)
                            avg_complexity = sum(b.complexity for b in blocks) / len(blocks) if blocks else 0
                            file_info["complexity"] = avg_complexity
                        except Exception:
                            file_info["complexity"] = estimate_complexity_from_content(content, ext, lines)
                    else:
                        # For all other file types, estimate complexity from code patterns
                        file_info["complexity"] = estimate_complexity_from_content(content, ext, lines)
                    
                    if ext in ['.js', '.ts', '.jsx', '.tsx']:
                        imports, functions = extract_imports_and_functions(content, ext)
                        if imports:
                            file_info["imports"] = imports
                        if functions:
                            file_info["functions"] = functions
                        
                    api_routes = extract_api_routes(content, ext)
                    if api_routes:
                        file_info["api_routes"] = api_routes
                        
                    current_node["children"].append(file_info)
                except UnicodeDecodeError:
                    # Skip binary files
                    pass
                except Exception as e:
                    print(f"Error parsing {full_path}: {e}")
                    
    walk_dir(repo_path, file_tree)
    return {"name": os.path.basename(repo_path), "type": "folder", "children": file_tree["children"]}
