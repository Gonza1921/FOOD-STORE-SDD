/**
 * Engram core types
 */

export type ObservationType = 'architecture' | 'decision' | 'bugfix' | 'discovery' | 'pattern' | 'config' | 'learning' | 'manual';

export type ObservationScope = 'project' | 'personal';

export type TimeRange = 'all' | '1_day' | '1_week' | '1_month' | '3_months';

export interface Observation {
  id: number;
  title: string;
  type: ObservationType;
  scope: ObservationScope;
  topic_key?: string;
  content: string;
  project: string;
  created_at: string;
  updated_at: string;
  session_id?: string;
  tags?: string[];
}

export interface Project {
  name: string;
  obs_count: number;
  last_activity?: string;
  description?: string;
}

export interface SearchFilters {
  types?: ObservationType[];
  scopes?: ObservationScope[];
  timeRange?: TimeRange;
  projects?: string[];
}

export interface SearchResult {
  observations: Observation[];
  total: number;
  query: string;
  filters: SearchFilters;
}

export interface Statistics {
  total_observations: number;
  total_sessions: number;
  last_activity?: string;
  by_type: Record<ObservationType, number>;
  by_scope: Record<ObservationScope, number>;
  by_time: Record<TimeRange, number>;
  top_topics: Array<{
    topic_key: string;
    count: number;
  }>;
  activity_timeline?: Record<string, number>; // date -> count
}

export interface EngramConfig {
  api_url: string;
  api_key: string;
  default_project?: string;
}

export interface AppConfig extends EngramConfig {
  theme?: 'light' | 'dark' | 'auto';
  export_path?: string;
  default_scope?: ObservationScope;
  keybindings?: 'default' | 'vim' | 'emacs';
}
