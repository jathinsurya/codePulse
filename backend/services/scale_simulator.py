"""
Scale Simulator Service
Computes infrastructure scaling characteristics from actual codebase analysis.
Derives bottleneck thresholds, latency curves, and component failure points
from real code metrics like complexity, API route count, dependency density, etc.
"""
import math


def compute_scale_profile(heatmap_files, api_routes, dependency_graph, total_files, avg_complexity, languages):
    """
    Compute a scale simulation profile from real codebase analysis data.
    Returns a dict describing how the system would behave under increasing load.
    """
    
    # --- Derive base system characteristics from code metrics ---
    
    num_api_routes = len(api_routes) if api_routes else 0
    num_deps = len(dependency_graph.get("links", [])) if dependency_graph else 0
    num_nodes = len(dependency_graph.get("nodes", [])) if dependency_graph else 0
    
    # Calculate high-risk file count and average risk
    high_risk_files = [f for f in heatmap_files if f.get("risk", 0) >= 60]
    critical_files = [f for f in heatmap_files if f.get("risk", 0) >= 80]
    avg_risk = sum(f.get("risk", 0) for f in heatmap_files) / max(len(heatmap_files), 1)
    max_risk = max((f.get("risk", 0) for f in heatmap_files), default=0)
    
    # Coupling ratio: how interconnected the codebase is
    coupling_ratio = num_deps / max(num_nodes, 1)
    
    # Detect architectural components from file paths and API routes
    components = _detect_components(heatmap_files, api_routes)
    
    # --- Compute base latency (derived from code complexity) ---
    # Higher complexity = more processing per request = higher base latency
    base_latency = max(15, min(200, int(
        20 +                                    # minimum network overhead
        avg_complexity * 0.8 +                  # complexity overhead
        num_api_routes * 0.5 +                  # route matching overhead
        coupling_ratio * 5 +                    # dependency resolution overhead
        len(high_risk_files) * 0.3              # tech debt drag
    )))
    
    # --- Compute base error rate (derived from risk profile) ---
    base_error_rate = max(0.01, min(5.0, round(
        0.01 +                                   # baseline
        (avg_risk / 100) * 0.5 +                 # risk-proportional errors
        len(critical_files) * 0.05 +             # critical file hotspots
        (1 if avg_complexity > 60 else 0) * 0.3  # complexity penalty
    , 2)))
    
    # --- Compute base memory usage % (derived from codebase size) ---
    base_memory = max(10, min(50, int(
        15 +                                     # base runtime
        total_files * 0.05 +                     # per-file module load
        num_deps * 0.15 +                        # dependency memory
        avg_complexity * 0.1                     # runtime state overhead
    )))
    
    # --- Compute component failure thresholds ---
    # Weakest components fail first. Thresholds based on complexity and coupling.
    component_profiles = []
    for comp in components:
        threshold = _compute_failure_threshold(comp, coupling_ratio, avg_risk)
        component_profiles.append({
            "name": comp["name"],
            "type": comp["type"],
            "fileCount": comp["fileCount"],
            "avgComplexity": comp["avgComplexity"],
            "avgRisk": comp["avgRisk"],
            "failureThreshold": threshold,
            "healthyDetail": comp["healthyDetail"],
            "failingDetail": comp["failingDetail"],
        })
    
    # Sort by failure threshold (weakest first)
    component_profiles.sort(key=lambda c: c["failureThreshold"])
    
    # --- Compute scaling curve parameters ---
    # These define how metrics degrade as traffic increases
    latency_growth_rate = max(3, min(20, int(
        5 + avg_complexity * 0.15 + coupling_ratio * 2
    )))
    
    error_growth_rate = max(0.05, min(0.5, round(
        0.08 + (avg_risk / 100) * 0.15 + len(critical_files) * 0.01
    , 3)))
    
    memory_growth_rate = max(0.3, min(1.5, round(
        0.4 + total_files * 0.002 + num_deps * 0.005
    , 2)))
    
    # --- Generate AI recommendations based on actual analysis ---
    recommendations = _generate_recommendations(
        components, component_profiles, avg_complexity, 
        avg_risk, num_api_routes, coupling_ratio, total_files, languages
    )
    
    return {
        "baseLatency": base_latency,
        "baseErrorRate": base_error_rate,
        "baseMemory": base_memory,
        "latencyGrowthRate": latency_growth_rate,
        "errorGrowthRate": error_growth_rate,
        "memoryGrowthRate": memory_growth_rate,
        "components": component_profiles[:6],  # top 6 components
        "recommendations": recommendations[:3],  # top 3 recommendations
        "summary": {
            "totalFiles": total_files,
            "avgComplexity": avg_complexity,
            "avgRisk": round(avg_risk, 1),
            "highRiskFiles": len(high_risk_files),
            "criticalFiles": len(critical_files),
            "apiRoutes": num_api_routes,
            "dependencies": num_deps,
            "couplingRatio": round(coupling_ratio, 2)
        }
    }


def _detect_components(heatmap_files, api_routes):
    """
    Detect architectural components from the codebase file structure.
    Groups files by their parent directory/module and classifies them.
    """
    # Group files by their top-level directory
    dir_groups = {}
    for f in heatmap_files:
        parts = f.get("path", "").strip("/").split("/")
        if len(parts) > 1:
            top_dir = parts[0]
        else:
            top_dir = "root"
        
        if top_dir not in dir_groups:
            dir_groups[top_dir] = []
        dir_groups[top_dir].append(f)
    
    # Classify each group into a component type
    components = []
    for dir_name, files in dir_groups.items():
        avg_comp = sum(f.get("complexity", 0) for f in files) / max(len(files), 1)
        avg_risk_val = sum(f.get("risk", 0) for f in files) / max(len(files), 1)
        
        comp_type, healthy_detail, failing_detail = _classify_component(
            dir_name, files, api_routes
        )
        
        components.append({
            "name": _format_component_name(dir_name, comp_type),
            "type": comp_type,
            "dirName": dir_name,
            "fileCount": len(files),
            "avgComplexity": round(avg_comp, 1),
            "avgRisk": round(avg_risk_val, 1),
            "healthyDetail": healthy_detail,
            "failingDetail": failing_detail,
        })
    
    return components


def _classify_component(dir_name, files, api_routes):
    """Classify a directory group into a component type."""
    name_lower = dir_name.lower()
    file_names = [f.get("name", "").lower() for f in files]
    all_names = " ".join(file_names)
    
    # Check for database-related files
    if any(kw in name_lower for kw in ["model", "database", "db", "schema", "migration", "prisma", "drizzle"]):
        return "database", \
            f"All connections healthy. Pool utilization stable across {len(files)} model files.", \
            f"Connection pool exhausted. {len(files)} model files causing lock contention. Query timeouts detected."
    
    # Check for API/route files
    if any(kw in name_lower for kw in ["route", "api", "controller", "endpoint", "handler"]):
        route_count = len(api_routes) if api_routes else len(files)
        return "api_gateway", \
            f"All {route_count} routes responding normally. Request queue empty.", \
            f"CPU at 98% processing {route_count} routes. Event loop lag detected. Dropping non-essential traffic."
    
    # Check for auth files
    if any(kw in name_lower for kw in ["auth", "security", "login", "session", "jwt", "token"]):
        return "auth_service", \
            f"Token validation fast across {len(files)} auth modules. Cache hit rate: 94%.", \
            f"Token validation timeout in {len(files)} modules. Session store overwhelmed. Authentication failing."
    
    # Check for middleware
    if any(kw in name_lower for kw in ["middleware", "interceptor", "guard", "pipe", "filter"]):
        return "middleware", \
            f"All {len(files)} middleware executing under 5ms. Pipeline healthy.", \
            f"Middleware chain bottleneck. {len(files)} filters causing cascading delays."
    
    # Check for service/business logic
    if any(kw in name_lower for kw in ["service", "logic", "core", "domain", "use"]):
        return "business_logic", \
            f"Business logic layer processing normally. {len(files)} services active.", \
            f"Service layer overloaded. {len(files)} service files with memory leaks. GC pressure critical."
    
    # Check for config
    if any(kw in name_lower for kw in ["config", "setting", "env"]):
        return "config", \
            f"Configuration loaded. {len(files)} config files parsed successfully.", \
            f"Configuration reload failing. Hot-reload mechanism overwhelmed."
    
    # Check for utils/helpers
    if any(kw in name_lower for kw in ["util", "helper", "lib", "common", "shared"]):
        return "utilities", \
            f"Utility functions stable. {len(files)} shared modules loaded.", \
            f"Shared utility memory spike. {len(files)} modules with circular references detected."
    
    # Check for UI/components
    if any(kw in name_lower for kw in ["component", "view", "page", "ui", "widget", "layout"]):
        return "frontend", \
            f"UI rendering pipeline stable. {len(files)} components hydrated.", \
            f"SSR timeout. {len(files)} components causing render blocking. Virtual DOM thrashing."
    
    # Check for test files
    if any(kw in name_lower for kw in ["test", "spec", "__test__"]):
        return "testing", \
            f"Test infrastructure idle. {len(files)} test files available.", \
            f"Test runners consuming resources. {len(files)} test files loaded in production."
    
    # Check for static/public assets
    if any(kw in name_lower for kw in ["public", "static", "asset", "image", "style", "css"]):
        return "static_assets", \
            f"CDN serving {len(files)} static assets normally.", \
            f"Static asset bandwidth saturated. {len(files)} files causing origin overload."
    
    # Default: generic module
    return "module", \
        f"Module operating normally. {len(files)} files loaded.", \
        f"Module {dir_name} under stress. {len(files)} files consuming excessive memory."


def _format_component_name(dir_name, comp_type):
    """Format a user-friendly component name."""
    type_labels = {
        "database": "Database Layer",
        "api_gateway": "API Gateway",
        "auth_service": "Auth Service",
        "middleware": "Middleware Pipeline",
        "business_logic": "Business Logic",
        "config": "Config Manager",
        "utilities": "Utility Services",
        "frontend": "Frontend Renderer",
        "testing": "Test Infrastructure",
        "static_assets": "Static Assets CDN",
        "module": f"{dir_name.title()} Module",
    }
    return type_labels.get(comp_type, f"{dir_name.title()} Module")


def _compute_failure_threshold(component, coupling_ratio, avg_risk):
    """
    Compute the traffic multiplier at which this component fails.
    Lower complexity and risk = higher threshold (more resilient).
    """
    base = 90  # maximum possible threshold
    
    # Complexity penalty: -0.3x per complexity point
    complexity_penalty = component["avgComplexity"] * 0.3
    
    # Risk penalty: -0.2x per risk point
    risk_penalty = component["avgRisk"] * 0.2
    
    # File count penalty: more files = more surface area for failure
    file_penalty = min(15, component["fileCount"] * 0.5)
    
    # Coupling penalty
    coupling_penalty = coupling_ratio * 3
    
    # Component type bonus: some types are inherently more resilient
    type_bonuses = {
        "static_assets": 30,
        "config": 25,
        "testing": 20,
        "utilities": 10,
        "frontend": 5,
        "middleware": 0,
        "business_logic": -5,
        "api_gateway": -5,
        "auth_service": -8,
        "database": -10,
        "module": 0,
    }
    type_bonus = type_bonuses.get(component["type"], 0)
    
    threshold = base - complexity_penalty - risk_penalty - file_penalty - coupling_penalty + type_bonus
    return max(5, min(95, round(threshold)))


def _generate_recommendations(components, profiles, avg_complexity, avg_risk, 
                               num_routes, coupling_ratio, total_files, languages):
    """Generate contextual scaling recommendations based on actual analysis."""
    recommendations = []
    
    # Find the weakest component
    if profiles:
        weakest = profiles[0]  # already sorted by threshold
        recommendations.append({
            "title": f"Strengthen {weakest['name']}",
            "description": f"{weakest['name']} is the first bottleneck, failing at {weakest['failureThreshold']}x traffic. "
                          f"It has {weakest['fileCount']} files with avg complexity {weakest['avgComplexity']}. "
                          f"Reduce complexity to increase resilience.",
            "impact": f"Increases failure threshold from {weakest['failureThreshold']}x to ~{min(95, weakest['failureThreshold'] + 20)}x",
            "severity": "critical" if weakest["failureThreshold"] < 30 else "warning",
        })
    
    # High coupling recommendation
    if coupling_ratio > 2.0:
        recommendations.append({
            "title": "Reduce Module Coupling",
            "description": f"Dependency coupling ratio is {coupling_ratio:.1f} (target: <2.0). "
                          f"High coupling means failures cascade quickly across the system. "
                          f"Extract shared interfaces and use dependency injection.",
            "impact": f"Reduces cascade failure risk by ~{min(60, int(coupling_ratio * 15))}%",
            "severity": "critical" if coupling_ratio > 4 else "warning",
        })
    
    # API route optimization
    if num_routes > 10:
        recommendations.append({
            "title": "Implement API Rate Limiting",
            "description": f"System exposes {num_routes} API routes. Under high load, unthrottled endpoints "
                          f"will exhaust server resources. Add rate limiting and request queuing.",
            "impact": f"Protects all {num_routes} endpoints from burst traffic abuse",
            "severity": "warning" if num_routes < 30 else "critical",
        })
    elif num_routes > 0:
        recommendations.append({
            "title": "Add Request Caching",
            "description": f"Cache responses for {num_routes} API routes to reduce computation under load. "
                          f"Implement TTL-based caching for read-heavy endpoints.",
            "impact": f"Reduces server load by 40-60% for cached endpoints",
            "severity": "info",
        })
    
    # Complexity recommendation
    if avg_complexity > 40:
        recommendations.append({
            "title": "Refactor High-Complexity Modules",
            "description": f"Average cyclomatic complexity is {avg_complexity} (target: <30). "
                          f"Complex code paths increase per-request processing time and memory usage. "
                          f"Break down large functions and simplify control flow.",
            "impact": f"Reduces per-request latency by ~{min(50, int(avg_complexity * 0.5))}ms",
            "severity": "warning",
        })
    
    # Codebase size recommendation
    if total_files > 200:
        recommendations.append({
            "title": "Implement Code Splitting",
            "description": f"Codebase has {total_files} files. Large monolithic applications "
                          f"are harder to scale horizontally. Consider microservice decomposition "
                          f"for the most critical modules.",
            "impact": f"Enables independent scaling of high-traffic modules",
            "severity": "info",
        })
    
    # Sort by severity
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    recommendations.sort(key=lambda r: severity_order.get(r["severity"], 3))
    
    return recommendations
