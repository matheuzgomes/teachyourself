/**
 * Declarative Learning Object Schema Types
 * Conforms strictly to LEARNING_OBJECT_SCHEMA.md in technical-writing skill.
 */

export type RendererType =
  | "timeline"
  | "pipeline"
  | "state-machine"
  | "architecture"
  | "memory-layout"
  | "dependency-graph"
  | "network-flow"
  | "algorithm-trace"
  | "interactive-3d";

export type VisualizationMode =
  | "static"
  | "animated"
  | "interactive-2d"
  | "interactive-3d";

export interface Annotation {
  target: string;
  text: string;
  position?: "top" | "bottom" | "left" | "right" | "inside";
  variant?: "neutral" | "warning" | "success" | "highlight";
}

export interface ControlOptions {
  play?: boolean;
  pause?: boolean;
  next?: boolean;
  previous?: boolean;
  reset?: boolean;
  speed?: boolean;
  toggleMechanism?: {
    id: string;
    label: string;
    activeLabel: string;
    inactiveLabel: string;
  };
  compare?: {
    baselineLabel: string;
    modifiedLabel: string;
  };
}

export interface LearningState {
  id: string;
  title: string;
  explanation: string;
  focus?: string[];
  show?: string[];
  hide?: string[];
  transition?: {
    durationMs: number;
    easing?: "linear" | "ease-in-out" | "ease-out";
  };
  annotations?: Annotation[];
  activeComponents?: string[];
  metrics?: Record<string, string | number>;
}

export interface LearningObject {
  id: string;
  renderer: RendererType;
  mode: VisualizationMode;
  learningGoal: string;
  whyInteractive: string;
  initialState: string;
  states: LearningState[];
  controls?: ControlOptions;
  accessibilityFallback: {
    description: string;
    staticTableOrDiagram: string;
  };
}

export interface LearningObjectRendererProps<T extends LearningObject = LearningObject> {
  spec: T;
  className?: string;
  onStateChange?: (stateId: string) => void;
}
