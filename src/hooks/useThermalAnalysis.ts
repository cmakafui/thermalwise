// src/hooks/useThermalAnalysis.ts - Updated with restart functionality
import { useState, useRef, useCallback, useEffect } from "react";
import { useAgent } from "agents/react";

interface ThermalAnomaly {
  id: string;
  location: string;
  severity: "minor" | "moderate" | "severe";
  description: string;
  temperatureDifferential: string;
  probableCause: string;
  coordinates: [number, number, number, number];
  estimatedEnergyLoss: string;
  repairCost: string;
  repairPriority: "low" | "medium" | "high" | "immediate";
  confidence: number;
}

interface ImagePair {
  id: string;
  rgbUrl: string;
  thermalUrl: string;
  label: string;
}

interface BuildingInfo {
  buildingName: string;
  location: string;
  buildingId: string;
  constructionYear: number;
  buildingType: "Residential" | "Commercial" | "Industrial";
  inspector: string;
  inspectionDate: string;
  inspectionTime: string;
  outsideTemp: string;
  notes?: string;
}

// Human-in-the-Loop interfaces
interface PendingApproval {
  id: string;
  type:
    | "start_analysis"
    | "anomaly_detection"
    | "generate_report"
    | "expensive_operation";
  title: string;
  description: string;
  context: {
    analysisId?: string;
    anomalyId?: string;
    operationType?: string;
    estimatedCost?: number;
    [key: string]: unknown;
  };
  timestamp: number;
}

interface ApprovalDecision {
  approvalId: string;
  approved: boolean;
  reason?: string;
}

interface AnalysisState {
  status:
    | "idle"
    | "analyzing"
    | "awaiting_approval"
    | "completed"
    | "error"
    | "stopped";
  progress: number;
  currentImagePair?: number;
  totalImagePairs?: number;
  analysisLog: string[];
  detectedAnomalies: ThermalAnomaly[];
  finalReport?: string;
  energyRating?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  error?: string;
  // Human-in-the-loop additions
  pendingApprovals: PendingApproval[];
  approvalHistory: ApprovalDecision[];
}

interface ThermalAnalysisAgentState {
  buildingInfo: BuildingInfo | null;
  imagePairs: ImagePair[];
  analysisState: AnalysisState;
}

interface AgentEvent {
  type: string;
  data?: unknown;
}

interface AgentWithMethods {
  state?: ThermalAnalysisAgentState;
  call: <T>(method: string, args?: unknown[]) => Promise<T>;
  readyState: number;
  addEventListener: (
    event: string,
    listener: (event: AgentEvent) => void
  ) => void;
  removeEventListener: (
    event: string,
    listener: (event: AgentEvent) => void
  ) => void;
}

/**
 * Hook for managing thermal analysis with streaming updates and agent integration
 */
export function useThermalAnalysis(analysisId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState | null>(
    null
  );
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const [imagePairs, setImagePairs] = useState<ImagePair[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    []
  );
  const [approvalHistory, setApprovalHistory] = useState<ApprovalDecision[]>(
    []
  );
  const hasInitialized = useRef(false);
  const initializationAttempted = useRef(false);

  console.log(
    `[useThermalAnalysis] Hook initialized for analysisId: ${analysisId}`
  );

  // Create agent connection with predictable name
  const agent = useAgent<ThermalAnalysisAgentState>({
    agent: "ThermalAnalysisAgent",
    name: `analysis-${analysisId}`,
    onStateUpdate: (state) => {
      console.log("[useThermalAnalysis] Agent state update received:", state);

      // Update local state from agent state
      if (state.buildingInfo) {
        setBuildingInfo(state.buildingInfo);
      }

      if (state.imagePairs) {
        setImagePairs(state.imagePairs);
      }

      if (state.analysisState) {
        setAnalysisState(state.analysisState);
        setIsAnalyzing(state.analysisState.status === "analyzing");

        // Update human-in-the-loop state
        setPendingApprovals(state.analysisState.pendingApprovals || []);
        setApprovalHistory(state.analysisState.approvalHistory || []);
      }
    },
  }) as AgentWithMethods;

  // Initialize analysis with building info and image pairs
  const initializeAnalysis = useCallback(
    async (
      buildingData: BuildingInfo,
      imageData: ImagePair[]
    ): Promise<void> => {
      console.log(
        `[useThermalAnalysis] Initializing analysis with ${imageData.length} image pairs`
      );

      if (!isConnected) {
        throw new Error("Agent not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        await agent.call("initializeAnalysis", [buildingData, imageData]);
        setBuildingInfo(buildingData);
        setImagePairs(imageData);
        hasInitialized.current = true;

        console.log("[useThermalAnalysis] Analysis initialized successfully");
      } catch (err) {
        console.error(`[useThermalAnalysis] Failed to initialize:`, err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [agent, isConnected]
  );

  // Monitor connection status
  useEffect(() => {
    const handleOpen = () => {
      console.log("[useThermalAnalysis] WebSocket connected");
      setIsConnected(true);
    };

    const handleClose = () => {
      console.log("[useThermalAnalysis] WebSocket disconnected");
      setIsConnected(false);
    };

    const handleError = (event: AgentEvent) => {
      console.error("[useThermalAnalysis] WebSocket error:", event);
      setError(new Error("Connection error"));
    };

    // Add event listeners if agent supports them
    if (agent.addEventListener) {
      agent.addEventListener("open", handleOpen);
      agent.addEventListener("close", handleClose);
      agent.addEventListener("error", handleError);
    }

    // Check initial connection state
    if (agent.readyState === 1) {
      // WebSocket.OPEN
      setIsConnected(true);
    }

    return () => {
      if (agent.removeEventListener) {
        agent.removeEventListener("open", handleOpen);
        agent.removeEventListener("close", handleClose);
        agent.removeEventListener("error", handleError);
      }
    };
  }, [agent]);

  // Auto-initialize from sessionStorage
  useEffect(() => {
    const initializeFromStorage = async () => {
      if (initializationAttempted.current || !isConnected) return;

      initializationAttempted.current = true;
      console.log(
        "[useThermalAnalysis] Attempting to initialize from sessionStorage"
      );

      try {
        const storedData = sessionStorage.getItem(`analysis-${analysisId}`);
        if (storedData) {
          const {
            buildingInfo: storedBuildingInfo,
            imagePairs: storedImagePairs,
          } = JSON.parse(storedData);

          if (storedBuildingInfo && storedImagePairs) {
            console.log(
              "[useThermalAnalysis] Found stored data, initializing..."
            );
            await initializeAnalysis(storedBuildingInfo, storedImagePairs);

            // Clean up sessionStorage after successful initialization
            sessionStorage.removeItem(`analysis-${analysisId}`);
          }
        } else {
          console.log(
            "[useThermalAnalysis] No stored data found for",
            analysisId
          );
        }
      } catch (err) {
        console.error(
          "[useThermalAnalysis] Failed to initialize from storage:",
          err
        );
        setError(
          err instanceof Error ? err : new Error("Failed to initialize")
        );
      }
    };

    // Small delay to ensure agent connection is stable
    const timeoutId = setTimeout(initializeFromStorage, 500);
    return () => clearTimeout(timeoutId);
  }, [analysisId, isConnected, initializeAnalysis]);

  // Start the thermal analysis
  const startAnalysis = useCallback(async (): Promise<void> => {
    console.log(`[useThermalAnalysis] Starting thermal analysis`);

    if (!hasInitialized.current) {
      throw new Error("Analysis must be initialized first");
    }

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      await agent.call("startAnalysis", []);
      console.log("[useThermalAnalysis] Analysis started successfully");
    } catch (err) {
      console.error(`[useThermalAnalysis] Analysis failed:`, err);
      setIsAnalyzing(false);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [agent, isConnected]);

  // Stop the analysis
  const stopAnalysis = useCallback(async (): Promise<void> => {
    console.log(`[useThermalAnalysis] Stopping analysis`);

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    try {
      await agent.call("stopAnalysis", []);
      const state = await agent.call<AnalysisState>("getAnalysisState", []);
      if (state.status === "stopped") {
        setIsAnalyzing(false);
      }
      console.log("[useThermalAnalysis] Analysis stopped successfully");
    } catch (err) {
      console.error(`[useThermalAnalysis] Failed to stop analysis:`, err);
      throw err;
    }
  }, [agent, isConnected]);

  // Restart the analysis
  const restartAnalysis = useCallback(async (): Promise<void> => {
    console.log(`[useThermalAnalysis] Restarting analysis`);

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    try {
      await agent.call("restartAnalysis", []);
      setError(null);
      setIsAnalyzing(false);
      console.log("[useThermalAnalysis] Analysis restarted successfully");
    } catch (err) {
      console.error(`[useThermalAnalysis] Failed to restart analysis:`, err);
      throw err;
    }
  }, [agent, isConnected]);

  // HUMAN-IN-THE-LOOP: Provide approval decision
  const provideApproval = useCallback(
    async (decision: ApprovalDecision): Promise<void> => {
      console.log(
        `[useThermalAnalysis] Providing approval decision:`,
        decision
      );

      if (!isConnected) {
        throw new Error("Agent not connected");
      }

      try {
        await agent.call("provideApproval", [decision]);
        console.log("[useThermalAnalysis] Approval decision sent successfully");
      } catch (err) {
        console.error(`[useThermalAnalysis] Failed to send approval:`, err);
        throw err;
      }
    },
    [agent, isConnected]
  );

  // HUMAN-IN-THE-LOOP: Get pending approvals
  const getPendingApprovals = useCallback(async (): Promise<
    PendingApproval[]
  > => {
    console.log(`[useThermalAnalysis] Getting pending approvals`);

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    try {
      const approvals = await agent.call<PendingApproval[]>(
        "getPendingApprovals",
        []
      );
      setPendingApprovals(approvals);
      return approvals;
    } catch (err) {
      console.error(
        `[useThermalAnalysis] Failed to get pending approvals:`,
        err
      );
      throw err;
    }
  }, [agent, isConnected]);

  // HUMAN-IN-THE-LOOP: Get approval history
  const getApprovalHistory = useCallback(async (): Promise<
    ApprovalDecision[]
  > => {
    console.log(`[useThermalAnalysis] Getting approval history`);

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    try {
      const history = await agent.call<ApprovalDecision[]>(
        "getApprovalHistory",
        []
      );
      setApprovalHistory(history);
      return history;
    } catch (err) {
      console.error(
        `[useThermalAnalysis] Failed to get approval history:`,
        err
      );
      throw err;
    }
  }, [agent, isConnected]);

  // Get current analysis state
  const getAnalysisState = useCallback(async (): Promise<AnalysisState> => {
    console.log(`[useThermalAnalysis] Getting analysis state`);

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    try {
      const state = await agent.call<AnalysisState>("getAnalysisState", []);
      setAnalysisState(state);
      return state;
    } catch (err) {
      console.error(`[useThermalAnalysis] Failed to get analysis state:`, err);
      throw err;
    }
  }, [agent, isConnected]);

  // Get detected anomalies
  const getDetectedAnomalies = useCallback(async (): Promise<
    ThermalAnomaly[]
  > => {
    console.log(`[useThermalAnalysis] Getting detected anomalies`);

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    try {
      return await agent.call<ThermalAnomaly[]>("getDetectedAnomalies", []);
    } catch (err) {
      console.error(`[useThermalAnalysis] Failed to get anomalies:`, err);
      throw err;
    }
  }, [agent, isConnected]);

  // Get final report
  const getFinalReport = useCallback(async (): Promise<string | null> => {
    console.log(`[useThermalAnalysis] Getting final report`);

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    try {
      return await agent.call<string | null>("getFinalReport", []);
    } catch (err) {
      console.error(`[useThermalAnalysis] Failed to get report:`, err);
      throw err;
    }
  }, [agent, isConnected]);

  // Get building info from agent
  const getBuildingInfo =
    useCallback(async (): Promise<BuildingInfo | null> => {
      console.log(`[useThermalAnalysis] Getting building info`);

      if (!isConnected) {
        throw new Error("Agent not connected");
      }

      try {
        return await agent.call<BuildingInfo | null>("getBuildingInfo", []);
      } catch (err) {
        console.error(`[useThermalAnalysis] Failed to get building info:`, err);
        throw err;
      }
    }, [agent, isConnected]);

  // Get image pairs from agent
  const getImagePairs = useCallback(async (): Promise<ImagePair[]> => {
    console.log(`[useThermalAnalysis] Getting image pairs`);

    if (!isConnected) {
      throw new Error("Agent not connected");
    }

    try {
      return await agent.call<ImagePair[]>("getImagePairs", []);
    } catch (err) {
      console.error(`[useThermalAnalysis] Failed to get image pairs:`, err);
      throw err;
    }
  }, [agent, isConnected]);

  // Refresh data from agent
  const refreshData = useCallback(async (): Promise<void> => {
    console.log(`[useThermalAnalysis] Refreshing data from agent`);

    if (!isConnected) {
      console.log("[useThermalAnalysis] Not connected, skipping refresh");
      return;
    }

    try {
      const [agentBuildingInfo, agentImagePairs, agentAnalysisState] =
        await Promise.all([
          getBuildingInfo(),
          getImagePairs(),
          getAnalysisState(),
        ]);

      if (agentBuildingInfo) setBuildingInfo(agentBuildingInfo);
      if (agentImagePairs) setImagePairs(agentImagePairs);
      if (agentAnalysisState) {
        setAnalysisState(agentAnalysisState);
        setIsAnalyzing(agentAnalysisState.status === "analyzing");

        // Update human-in-the-loop state
        setPendingApprovals(agentAnalysisState.pendingApprovals || []);
        setApprovalHistory(agentAnalysisState.approvalHistory || []);
      }

      if (agentBuildingInfo && agentImagePairs) {
        hasInitialized.current = true;
      }

      console.log("[useThermalAnalysis] Data refreshed successfully");
    } catch (err) {
      console.error("[useThermalAnalysis] Failed to refresh data:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to refresh data")
      );
    }
  }, [isConnected, getBuildingInfo, getImagePairs, getAnalysisState]);

  // Refresh data when connection is established
  useEffect(() => {
    if (isConnected && !hasInitialized.current) {
      const timeoutId = setTimeout(refreshData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, refreshData]);

  return {
    // Connection state
    isConnected,

    // Data state
    buildingInfo,
    imagePairs,
    analysisState,

    // Loading states
    isLoading,
    isAnalyzing,
    error,

    // Human-in-the-loop state
    pendingApprovals,
    approvalHistory,

    // Computed state
    hasInitialized: hasInitialized.current,
    isInitialized: hasInitialized.current,
    isAwaitingApproval: analysisState?.status === "awaiting_approval",

    // Actions
    initializeAnalysis,
    startAnalysis,
    stopAnalysis,
    restartAnalysis, // NEW: Added restart functionality
    refreshData,

    // Human-in-the-loop actions
    provideApproval,
    getPendingApprovals,
    getApprovalHistory,

    // Data fetchers
    getAnalysisState,
    getDetectedAnomalies,
    getFinalReport,
    getBuildingInfo,
    getImagePairs,

    // Agent reference (for advanced usage)
    agent,
  };
}
