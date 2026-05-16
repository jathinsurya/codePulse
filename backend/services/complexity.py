def calculate_heatmap(file_tree, current_path=""):
    heatmap_files = []
    
    for node in file_tree:
        node_path = f"{current_path}/{node['name']}" if current_path else f"/{node['name']}"
        
        if node["type"] == "folder":
            heatmap_files.extend(calculate_heatmap(node["children"], node_path))
        else:
            # Normalize complexity
            raw_complexity = node.get("complexity", 1)
            if not isinstance(raw_complexity, (int, float)):
                raw_complexity = 1
            norm_complexity = min(int(raw_complexity * 5), 100) 
            
            # Simulated lack of tests bonus based on name
            no_test_bonus = 0 if "test" in node["name"].lower() else 50
            
            risk = int((norm_complexity * 0.6) + (no_test_bonus * 0.4))
            risk = min(max(risk, 0), 100)
            
            if risk < 30:
                color = "emerald"
            elif risk < 65:
                color = "amber"
            else:
                color = "rose"
                
            bugs = max(0, int(risk / 15))
            
            heatmap_files.append({
                "name": node["name"],
                "path": node_path,
                "complexity": norm_complexity,
                "bugs": bugs,
                "risk": risk,
                "color": color
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
            raw_complexity = node.get("complexity", 1)
            if not isinstance(raw_complexity, (int, float)): raw_complexity = 1
            norm_complexity = min(int(raw_complexity * 5), 100) 
            no_test_bonus = 0 if "test" in node["name"].lower() else 50
            risk = min(max(int((norm_complexity * 0.6) + (no_test_bonus * 0.4)), 0), 100)
            
            # Simulated risk factors
            duplication = min(100, int(norm_complexity * 0.7))
            
            children.append({
                "name": node["name"],
                "path": node_path,
                "value": risk + 10, # D3 uses 'value'
                "size": risk + 10,
                "riskScore": risk,
                "riskFactors": {
                    "complexity": norm_complexity,
                    "duplication": duplication,
                    "noTests": no_test_bonus
                },
                "bobExplanation": f"This file shows a risk score of {risk}% primarily due to {'high complexity' if norm_complexity > 50 else 'lack of tests'}. Recommend refactoring if this is a core module.",
                "issues": ["Complex logic" if norm_complexity > 60 else "No tests" if no_test_bonus > 0 else "Review needed"],
                "bugs": max(0, int(risk / 15))
            })
    return children
