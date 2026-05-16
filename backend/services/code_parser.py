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

def parse_codebase(repo_path: str):
    skip_dirs = {'node_modules', '.git', '__pycache__', 'dist', 'build'}
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
                    
                    if ext == '.py':
                        try:
                            blocks = cc_visit(content)
                            avg_complexity = sum(b.complexity for b in blocks) / len(blocks) if blocks else 0
                            file_info["complexity"] = avg_complexity
                        except Exception:
                            pass
                    
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
