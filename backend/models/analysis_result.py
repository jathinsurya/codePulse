from pydantic import BaseModel
from typing import List

class HeatmapFile(BaseModel):
    name: str
    path: str
    complexity: int
    bugs: int
    risk: int
    color: str

class GraphNode(BaseModel):
    id: str
    label: str
    group: str
    radius: int
    isHub: bool

class GraphLink(BaseModel):
    source: str
    target: str

class DependencyGraph(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]

class ApiRoute(BaseModel):
    method: str
    path: str
    file: str
    line: int

class OnboardingStep(BaseModel):
    step: int
    title: str
    file: str
    time: str
    reason: str
    icon: str

from typing import List, Dict, Any

class AnalysisResponse(BaseModel):
    health_score: int
    heatmap_files: List[HeatmapFile]
    heatmap_tree: Dict[str, Any]
    directory_tree: List[Dict[str, Any]]
    languages: Dict[str, float]
    dependency_graph: DependencyGraph
    api_routes: List[ApiRoute]
    total_files: int
    avg_complexity: int
    onboarding_path: List[OnboardingStep]
    suggested_questions: List[str]
