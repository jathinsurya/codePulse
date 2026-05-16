import networkx as nx

def determine_group(path: str, name: str) -> str:
    path_lower = path.lower()
    if 'api' in path_lower or 'route' in path_lower or 'controller' in path_lower:
        return 'api'
    elif 'component' in path_lower or 'view' in path_lower or name.endswith('.tsx') or name.endswith('.jsx'):
        return 'component'
    elif 'util' in path_lower or 'helper' in path_lower:
        return 'utils'
    elif 'db' in path_lower or 'model' in path_lower or 'prisma' in path_lower:
        return 'db'
    elif 'service' in path_lower or 'lib' in path_lower:
        return 'service'
    return 'utils'

def build_dependency_graph(file_tree):
    G = nx.DiGraph()
    all_files = []
    
    def traverse(nodes, current_path=""):
        for node in nodes:
            node_path = f"{current_path}/{node['name']}" if current_path else f"/{node['name']}"
            if node["type"] == "folder":
                traverse(node["children"], node_path)
            else:
                node["full_path"] = node_path
                all_files.append(node)
                
    traverse(file_tree)
    
    # Add nodes
    for file in all_files:
        name = file["name"]
        path = file["full_path"]
        size = file.get("size", 1000)
        group = determine_group(path, name)
        radius = min(max(10, size // 500), 50)
        
        G.add_node(path, id=path, label=name, group=group, radius=radius)
        
    # Add edges
    for file in all_files:
        imports = file.get("imports", [])
        for imp in imports:
            for target_file in all_files:
                target_base = target_file["name"].replace(".ts", "").replace(".js", "")
                if target_base in imp:
                    if file["full_path"] != target_file["full_path"]:
                        G.add_edge(file["full_path"], target_file["full_path"])
                        break
                        
    # Format for frontend
    nodes_data = []
    links_data = []
    
    for node, data in G.nodes(data=True):
        out_degree = G.out_degree(node)
        in_degree = G.in_degree(node)
        is_hub = (in_degree + out_degree) >= 5
        
        nodes_data.append({
            "id": str(data["id"]),
            "label": str(data["label"]),
            "group": str(data["group"]),
            "radius": int(data["radius"]),
            "isHub": bool(is_hub)
        })
        
    for source, target in G.edges():
        links_data.append({
            "source": str(source),
            "target": str(target)
        })
        
    return {"nodes": nodes_data, "links": links_data}
