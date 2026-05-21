/**
 * Engram API wrapper
 */

import axios, { AxiosInstance } from 'axios';
import {
  Observation,
  Project,
  SearchFilters,
  SearchResult,
  Statistics,
  EngramConfig,
} from '@types/engram';
import { ApiResponse, PaginatedResponse, HealthCheckResponse } from '@types/api';

export class EngramAPI {
  private client: AxiosInstance;
  private apiUrl: string;

  constructor(config: EngramConfig) {
    this.apiUrl = config.api_url || 'http://localhost:8000';

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.api_key ? `Bearer ${config.api_key}` : undefined,
      },
      timeout: 10000,
    });
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await this.client.get<ApiResponse<HealthCheckResponse>>(
      '/health'
    );
    return response.data.data || { status: 'ok', message: 'OK', timestamp: new Date().toISOString() };
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<Project[]> {
    const response = await this.client.get<ApiResponse<Project[]>>('/projects');
    return response.data.data || [];
  }

  /**
   * Get project details
   */
  async getProject(name: string): Promise<Project | null> {
    const response = await this.client.get<ApiResponse<Project>>(
      `/projects/${name}`
    );
    return response.data.data || null;
  }

  /**
   * List observations for a project
   */
  async listObservations(
    project: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<Observation>> {
    const response = await this.client.get<
      ApiResponse<PaginatedResponse<Observation>>
    >(`/projects/${project}/observations`, {
      params: { limit, offset },
    });
    return response.data.data || {
      items: [],
      total: 0,
      page: 0,
      limit,
      has_next: false,
      has_prev: false,
    };
  }

  /**
   * Get single observation
   */
  async getObservation(id: number): Promise<Observation | null> {
    const response = await this.client.get<ApiResponse<Observation>>(
      `/observations/${id}`
    );
    return response.data.data || null;
  }

  /**
   * Search observations
   */
  async searchObservations(
    query: string,
    filters?: SearchFilters
  ): Promise<SearchResult> {
    const response = await this.client.post<ApiResponse<SearchResult>>(
      '/search',
      { query, filters }
    );
    return response.data.data || {
      observations: [],
      total: 0,
      query,
      filters: filters || {},
    };
  }

  /**
   * Get statistics
   */
  async getStatistics(project?: string): Promise<Statistics> {
    const url = project ? `/projects/${project}/statistics` : '/statistics';
    const response = await this.client.get<ApiResponse<Statistics>>(url);
    return response.data.data || {
      total_observations: 0,
      total_sessions: 0,
      by_type: {},
      by_scope: {},
      by_time: {},
      top_topics: [],
    };
  }

  /**
   * Delete observation
   */
  async deleteObservation(id: number): Promise<boolean> {
    const response = await this.client.delete<ApiResponse<{ deleted: boolean }>>(
      `/observations/${id}`
    );
    return response.data.data?.deleted || false;
  }

  /**
   * Update observation
   */
  async updateObservation(
    id: number,
    data: Partial<Observation>
  ): Promise<Observation | null> {
    const response = await this.client.patch<ApiResponse<Observation>>(
      `/observations/${id}`,
      data
    );
    return response.data.data || null;
  }

  /**
   * Export observations
   */
  async exportObservations(
    format: 'json' | 'csv' | 'xml' | 'markdown',
    filters?: SearchFilters
  ): Promise<string> {
    const response = await this.client.post<{ data: string }>(
      '/export',
      { format, filters },
      { responseType: 'text' }
    );
    return response.data.data || '';
  }
}

/**
 * Create API instance from config file
 */
export async function createEngramAPI(
  configPath?: string
): Promise<EngramAPI | null> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const defaultPath = configPath ||
      path.join(os.homedir(), '.config', 'opencode', 'engram.json');

    if (!fs.existsSync(defaultPath)) {
      console.error(`Config file not found at ${defaultPath}`);
      return null;
    }

    const config: EngramConfig = JSON.parse(
      fs.readFileSync(defaultPath, 'utf-8')
    );

    return new EngramAPI(config);
  } catch (error) {
    console.error('Failed to create Engram API:', error);
    return null;
  }
}
