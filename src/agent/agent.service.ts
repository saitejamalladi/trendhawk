import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StateGraph, END, START } from '@langchain/langgraph';
import { LlmFactory } from '../llm/llm.factory';
import { ReportService } from '../report/report.service';
import { AgentState, type AgentStateType } from './agent.state';
import { GRAPH_NODES } from './agent.types';
import { createDiscoverTrendingNode } from './nodes/discover-trending.node';
import { createFilterDuplicatesNode } from './nodes/filter-duplicates.node';
import { createGenerateReportsNode } from './nodes/generate-reports.node';
import {
  createValidateOutputNode,
  routeAfterValidation,
} from './nodes/validate-output.node';
import { createSaveToMongoNode } from './nodes/save-to-mongo.node';
import { createHandleErrorNode } from './nodes/handle-error.node';

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);

  private graph!: ReturnType<AgentService['buildGraph']>;

  constructor(
    private readonly llmFactory: LlmFactory,
    private readonly reportService: ReportService,
  ) {}

  /** Build and compile the LangGraph on module initialisation. */
  onModuleInit() {
    this.graph = this.buildGraph();
    this.logger.log('LangGraph agent compiled successfully');
  }

  private buildGraph() {
    const llm = this.llmFactory.create();

    const workflow = new StateGraph(AgentState)
      // ── Nodes ───────────────────────────────────────────────────────────
      .addNode(GRAPH_NODES.DISCOVER_TRENDING, createDiscoverTrendingNode(llm))
      .addNode(
        GRAPH_NODES.FILTER_DUPLICATES,
        createFilterDuplicatesNode(this.reportService),
      )
      .addNode(GRAPH_NODES.GENERATE_REPORTS, createGenerateReportsNode(llm))
      .addNode(GRAPH_NODES.VALIDATE_OUTPUT, createValidateOutputNode())
      .addNode(
        GRAPH_NODES.SAVE_TO_MONGO,
        createSaveToMongoNode(this.reportService),
      )
      .addNode(GRAPH_NODES.HANDLE_ERROR, createHandleErrorNode())
      // ── Edges ────────────────────────────────────────────────────────────
      .addEdge(START, GRAPH_NODES.DISCOVER_TRENDING)
      .addEdge(GRAPH_NODES.DISCOVER_TRENDING, GRAPH_NODES.FILTER_DUPLICATES)
      .addEdge(GRAPH_NODES.FILTER_DUPLICATES, GRAPH_NODES.GENERATE_REPORTS)
      .addEdge(GRAPH_NODES.GENERATE_REPORTS, GRAPH_NODES.VALIDATE_OUTPUT)
      // Retry routing: valid → saveToMongo | invalid → retry | max retries → handleError
      .addConditionalEdges(GRAPH_NODES.VALIDATE_OUTPUT, routeAfterValidation, {
        saveToMongo: GRAPH_NODES.SAVE_TO_MONGO,
        generateReports: GRAPH_NODES.GENERATE_REPORTS,
        handleError: GRAPH_NODES.HANDLE_ERROR,
      })
      .addEdge(GRAPH_NODES.SAVE_TO_MONGO, END)
      .addEdge(GRAPH_NODES.HANDLE_ERROR, END);

    return workflow.compile();
  }

  /**
   * Run the full agent flow and return the final state.
   * Called by the controller endpoint.
   */
  async runAgent(): Promise<AgentStateType> {
    this.logger.log('Agent run started');

    const result = await this.graph.invoke({});

    if (result.error) {
      this.logger.error(`Agent run finished with error: ${result.error}`);
    } else {
      this.logger.log(
        `Agent run complete — ${result.reports.length} report(s) saved`,
      );
    }

    return result;
  }
}
