import os
from typing import List, Dict, Any, Tuple

def generate_onboarding_data(file_tree: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Dynamically generates onboarding steps and suggested questions based on repository structure.
    """
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
    
    onboarding_steps = []
    
    # 1. Critical Entry Points & Configs
    entry_priority = [
        ('README.md', "Core Documentation", "Start here to understand the high-level purpose and setup instructions."),
        ('package.json', "Dependency Map", "Review this to see the project's ecosystem and build scripts."),
        ('requirements.txt', "Python Dependencies", "Check this for the core Python libraries used in the project."),
        ('main.py', "Application Entry", "The primary entry point where the application starts execution."),
        ('index.ts', "Library Entry", "The main export file that defines the public API for this module."),
        ('App.tsx', "Frontend Root", "The top-level React component that orchestrates the entire UI."),
        ('App.js', "Frontend Root", "The top-level React component that orchestrates the entire UI."),
        ('docker-compose.yml', "Infrastructure", "Defines the service orchestration and local development environment."),
        ('go.mod', "Go Module Info", "Defines the module path and project dependencies for Go.")
    ]
    
    step_count = 1
    for filename, title, reason in entry_priority:
        for f in all_files:
            if f['name'].lower() == filename.lower():
                if any(s['file'] == f['full_path'] for s in onboarding_steps): continue
                onboarding_steps.append({
                    "step": step_count,
                    "title": title,
                    "file": f['full_path'],
                    "time": f"{min(10, max(2, f.get('lines', 100) // 40))} min read",
                    "reason": reason,
                    "icon": "doc" if filename.endswith('.md') else "config"
                })
                step_count += 1
                break
        if step_count > 3: break
        
    # 2. Logic Hubs
    if step_count <= 5:
        hub_candidates = sorted(all_files, key=lambda x: (x.get('complexity', 0) * 10) + len(x.get('imports', [])) + (x.get('lines', 0) / 100), reverse=True)
        for f in hub_candidates:
            if any(s['file'] == f['full_path'] for s in onboarding_steps): continue
            if f['name'].lower() in ['package-lock.json', 'yarn.lock', 'go.sum']: continue
            title = f"Analyze {f['name']}"
            if f['extension'] in ['.ts', '.tsx', '.js', '.jsx']:
                title = f"Core Component: {f['name']}"
            elif f['extension'] == '.py':
                title = f"Logic Module: {f['name']}"
                
            onboarding_steps.append({
                "step": step_count,
                "title": title,
                "file": f['full_path'],
                "time": f"{min(15, max(5, f.get('lines', 200) // 30))} min read",
                "reason": f"Identified as a core logic hub with {f.get('lines', 0)} lines of code.",
                "icon": "logic"
            })
            step_count += 1
            if step_count > 5: break
            
    onboarding_steps.sort(key=lambda x: x['step'])

    # 3. Suggested Questions
    questions = [
        "What is the main purpose of this repository?",
        "How is the project structured?",
        "What are the core technologies used here?"
    ]
    
    if any(f['name'].lower() == 'docker-compose.yml' for f in all_files):
        questions.append("How do I run this project using Docker?")
    if any('auth' in f['name'].lower() for f in all_files):
        questions.append("How does authentication work in this system?")
    if any('api' in f['name'].lower() or 'route' in f['name'].lower() for f in all_files):
        questions.append("Which are the most important API endpoints?")

    return onboarding_steps, questions[:6]
