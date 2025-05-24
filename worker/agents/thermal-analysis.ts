// worker/agents/thermal-analysis.ts - Full human-in-the-loop version
import { Agent, unstable_callable as callable } from "agents";
import type { Env } from "../types";
import { google } from "@ai-sdk/google";
import { generateObject, streamText, generateText, tool } from "ai";
import { z } from "zod";

// Approval system types
interface PendingApproval {
  id: string;
  type:
    | "start_analysis"
    | "anomaly_detection"
    | "generate_report"
    | "expensive_operation";
  title: string;
  description: string;
  context: Record<string, unknown>;
  timestamp: number;
}

interface ApprovalDecision {
  approvalId: string;
  approved: boolean;
  reason?: string;
}

// Define interfaces
interface ThermalAnomaly {
  id: string;
  location: string;
  severity: "minor" | "moderate" | "severe";
  description: string;
  temperatureDifferential: string;
  probableCause: string;
  coordinates: number[]; // Changed from tuple to array
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

export interface ThermalAnalysisState {
  buildingInfo: BuildingInfo | null;
  imagePairs: ImagePair[];
  analysisState: AnalysisState;
}

// Fixed schemas - simplified to work with Google Gemini
const ThermalAnomalySchema = z.object({
  location: z.string().describe("Location of the anomaly"),
  severity: z.string().describe("Severity: minor, moderate, or severe"),
  description: z.string().describe("Description of the thermal pattern"),
  temperatureDifferential: z.string().describe("Temperature differential"),
  probableCause: z.string().describe("Likely cause of the anomaly"),
  coordinatesText: z.string().describe("Coordinates as text (x1,y1,x2,y2)"),
  estimatedEnergyLoss: z.string().describe("Estimated energy loss"),
  repairCost: z.string().describe("Estimated repair cost"),
  repairPriority: z
    .string()
    .describe("Priority: low, medium, high, or immediate"),
  confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
});

const ImageAnalysisSchema = z.object({
  anomalies: z.array(ThermalAnomalySchema).describe("Detected anomalies"),
  overallAssessment: z.string().describe("Overall assessment"),
  energyEfficiencyNotes: z.string().describe("Energy efficiency notes"),
});

const EnergyRatingSchema = z.object({
  rating: z.string().describe("EU energy rating A through G"),
  justification: z.string().describe("Detailed justification for the rating"),
  improvementPotential: z.string().describe("Potential for improvement"),
});

// Helper function to parse coordinates
function parseCoordinates(coordText: string): number[] {
  try {
    return coordText.split(",").map((n) => parseFloat(n.trim()));
  } catch {
    return [0, 0, 1, 1]; // Default fallback
  }
}

// Helper function to validate severity
function validateSeverity(severity: string): "minor" | "moderate" | "severe" {
  const normalized = severity.toLowerCase();
  if (normalized.includes("severe")) return "severe";
  if (normalized.includes("moderate")) return "moderate";
  return "minor";
}

// Helper function to validate priority
function validatePriority(
  priority: string
): "low" | "medium" | "high" | "immediate" {
  const normalized = priority.toLowerCase();
  if (normalized.includes("immediate")) return "immediate";
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium")) return "medium";
  return "low";
}

export class ThermalAnalysisAgent extends Agent<Env, ThermalAnalysisState> {
  private shouldStopAnalysis = false;

  initialState: ThermalAnalysisState = {
    buildingInfo: null,
    imagePairs: [],
    analysisState: {
      status: "idle",
      progress: 0,
      analysisLog: [],
      detectedAnomalies: [],
      pendingApprovals: [],
      approvalHistory: [],
    },
  };

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    console.log("[ThermalAnalysisAgent] Initialized with human-in-the-loop");
  }

  // Helper method to request human approval
  private async requestApproval(
    type: PendingApproval["type"],
    title: string,
    description: string,
    context: Record<string, unknown> = {}
  ): Promise<boolean> {
    const approvalId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pendingApproval: PendingApproval = {
      id: approvalId,
      type,
      title,
      description,
      context,
      timestamp: Date.now(),
    };

    // Add to pending approvals and update state
    const currentState = this.state.analysisState;
    this.setState({
      ...this.state,
      analysisState: {
        ...currentState,
        status: "awaiting_approval",
        pendingApprovals: [...currentState.pendingApprovals, pendingApproval],
        analysisLog: [
          ...currentState.analysisLog,
          `⏸️ Waiting for approval: ${title}`,
        ],
      },
    });

    console.log(`[ThermalAnalysisAgent] Requesting approval for: ${title}`);

    // Wait for approval decision (polling approach)
    return new Promise((resolve) => {
      const checkApproval = () => {
        const state = this.state.analysisState;
        const decision = state.approvalHistory.find(
          (d) => d.approvalId === approvalId
        );

        if (decision) {
          // Remove from pending approvals
          this.setState({
            ...this.state,
            analysisState: {
              ...state,
              status: decision.approved ? "analyzing" : "idle",
              pendingApprovals: state.pendingApprovals.filter(
                (p) => p.id !== approvalId
              ),
              analysisLog: [
                ...state.analysisLog,
                `${decision.approved ? "✅" : "❌"} ${title}: ${decision.approved ? "Approved" : "Denied"}${decision.reason ? ` - ${decision.reason}` : ""}`,
              ],
            },
          });

          resolve(decision.approved);
        } else if (this.shouldStopAnalysis) {
          // Handle cancellation
          this.setState({
            ...this.state,
            analysisState: {
              ...state,
              status: "stopped",
              pendingApprovals: state.pendingApprovals.filter(
                (p) => p.id !== approvalId
              ),
            },
          });
          resolve(false);
        } else {
          // Check again in 1 second
          setTimeout(checkApproval, 1000);
        }
      };

      checkApproval();
    });
  }

  private updateProgress(progress: number, message: string) {
    const currentState = this.state.analysisState;
    this.setState({
      ...this.state,
      analysisState: {
        ...currentState,
        progress,
        analysisLog: [
          ...currentState.analysisLog,
          `[${new Date().toLocaleTimeString()}] ${message}`,
        ],
      },
    });
  }

  private resetAnalysisState() {
    console.log("[ThermalAnalysisAgent] Resetting analysis state");
    this.setState({
      ...this.state,
      analysisState: {
        status: "idle",
        progress: 0,
        currentImagePair: undefined,
        totalImagePairs: undefined,
        analysisLog: [],
        detectedAnomalies: [],
        finalReport: undefined,
        energyRating: undefined,
        error: undefined,
        pendingApprovals: [],
        approvalHistory: [],
      },
    });
  }

  // Tool to analyze a single image pair - REAL AI-powered analysis
  private analyzeImagePair = tool({
    description:
      "Analyzes a single RGB+thermal image pair for thermal anomalies",
    parameters: z.object({
      rgbUrl: z.string().describe("URL of the RGB image"),
      thermalUrl: z.string().describe("URL of the thermal image"),
      pairLabel: z.string().describe("Label of the image pair being analyzed"),
      buildingContext: z.string().describe("Building context information"),
    }),
    execute: async ({
      rgbUrl,
      thermalUrl,
      pairLabel,
      buildingContext,
    }): Promise<string> => {
      console.log(`[ThermalAnalysisAgent] Analyzing image pair: ${pairLabel}`);

      try {
        // Use the simplified schema that works with Google Gemini
        const result = await generateObject({
          model: google("gemini-2.5-flash-preview-05-20"),
          schema: ImageAnalysisSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are a professional thermographic engineer analyzing thermal images for energy efficiency issues.

Building Context: ${buildingContext}
Area: ${pairLabel}

ANALYSIS REQUIREMENTS:
1. Compare the RGB image (visual) with the thermal image (infrared)
2. Identify thermal anomalies that indicate energy inefficiency:
   - Thermal bridges (heat loss through structural elements)
   - Air leakage (drafts around windows, doors, joints)
   - Insulation gaps or deficiencies
   - Moisture intrusion indicators
   - Temperature differentials indicating heat loss

3. For each anomaly found:
   - Provide precise location description
   - Assess severity: "minor", "moderate", or "severe"
   - Estimate temperature differential (e.g., "5-8°C difference")
   - Identify probable cause
   - Provide coordinates as text "x1,y1,x2,y2" (normalized 0.0-1.0)
   - Estimate energy loss and repair costs in EUR
   - Assign priority: "low", "medium", "high", or "immediate"
   - Confidence score between 0.0 and 1.0

4. Be conservative - only report genuine thermal anomalies, not normal variations

Analyze both images together to identify energy efficiency issues:`,
                },
                {
                  type: "image",
                  image: rgbUrl,
                },
                {
                  type: "image",
                  image: thermalUrl,
                },
              ],
            },
          ],
        });

        // Convert the simplified schema results to proper typed anomalies
        const anomaliesWithIds: ThermalAnomaly[] = result.object.anomalies.map(
          (anomaly, index) => ({
            id: `${pairLabel.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}_${index}`,
            location: anomaly.location,
            severity: validateSeverity(anomaly.severity),
            description: anomaly.description,
            temperatureDifferential: anomaly.temperatureDifferential,
            probableCause: anomaly.probableCause,
            coordinates: parseCoordinates(anomaly.coordinatesText),
            estimatedEnergyLoss: anomaly.estimatedEnergyLoss,
            repairCost: anomaly.repairCost,
            repairPriority: validatePriority(anomaly.repairPriority),
            confidence: anomaly.confidence,
          })
        );

        // Update state with new anomalies
        const currentState = this.state.analysisState;
        const updatedAnomalies = [
          ...currentState.detectedAnomalies,
          ...anomaliesWithIds,
        ];

        this.setState({
          ...this.state,
          analysisState: {
            ...currentState,
            detectedAnomalies: updatedAnomalies,
          },
        });

        const resultMessage = `Found ${anomaliesWithIds.length} thermal anomalies in ${pairLabel}. ${result.object.overallAssessment}`;
        console.log("[ThermalAnalysisAgent]", resultMessage);

        return JSON.stringify(
          {
            anomaliesFound: anomaliesWithIds.length,
            assessment: result.object.overallAssessment,
            notes: result.object.energyEfficiencyNotes,
            anomalies: anomaliesWithIds,
          },
          null,
          2
        );
      } catch (error: unknown) {
        const errorMsg = `Error analyzing ${pairLabel}: ${error instanceof Error ? error.message : String(error)}`;
        console.error("[ThermalAnalysisAgent]", errorMsg);
        return errorMsg;
      }
    },
  });

  // Tool to generate comprehensive energy efficiency report - REAL AI-powered
  private generateEnergyReport = tool({
    description:
      "Generates a comprehensive energy efficiency report with EU rating",
    parameters: z.object({
      allAnomalies: z
        .string()
        .describe("JSON string of all detected anomalies"),
    }),
    execute: async ({ allAnomalies }): Promise<string> => {
      console.log(
        "[ThermalAnalysisAgent] Generating comprehensive energy report"
      );

      try {
        const buildingInfo = this.state.buildingInfo;
        if (!buildingInfo) {
          throw new Error("Building information not available");
        }

        // Use simplified schema for energy rating
        const ratingResult = await generateObject({
          model: google("gemini-2.5-flash-preview-05-20"),
          schema: EnergyRatingSchema,
          prompt: `As a certified energy auditor, determine the EU energy rating for this building based on thermal analysis results.

Building Information:
- Type: ${buildingInfo.buildingType}
- Construction Year: ${buildingInfo.constructionYear}
- Location: ${buildingInfo.location}
- Outside Temperature: ${buildingInfo.outsideTemp}°C

Thermal Analysis Results:
${allAnomalies}

EU Energy Rating Scale:
- A: Excellent (minimal heat loss, modern insulation)
- B: Very Good (minor issues, well-maintained)
- C: Good (some inefficiencies, average performance)
- D: Fair (moderate issues, needs improvement)
- E: Poor (significant heat loss, multiple issues)
- F: Very Poor (major deficiencies, urgent repairs needed)
- G: Extremely Poor (severe energy loss, immediate action required)

Consider:
1. Number and severity of thermal anomalies
2. Building age and construction standards
3. Climate conditions and heating requirements
4. Overall thermal performance patterns

Provide the rating as a single letter A through G.`,
        });

        // Parse the rating to ensure it's valid
        const validRating = ratingResult.object.rating.charAt(0).toUpperCase();
        const energyRating = ["A", "B", "C", "D", "E", "F", "G"].includes(
          validRating
        )
          ? (validRating as "A" | "B" | "C" | "D" | "E" | "F" | "G")
          : "D"; // Default fallback

        // Generate the comprehensive report
        const reportResult = await generateText({
          model: google("gemini-2.5-flash-preview-05-20"),
          prompt: `Generate a professional energy efficiency report following EU standards and building thermography best practices.

Building Information:
- Name: ${buildingInfo.buildingName}
- Location: ${buildingInfo.location}
- Building ID: ${buildingInfo.buildingId}
- Type: ${buildingInfo.buildingType}
- Construction Year: ${buildingInfo.constructionYear}
- Inspector: ${buildingInfo.inspector}
- Inspection Date: ${buildingInfo.inspectionDate} at ${buildingInfo.inspectionTime}
- Outside Temperature: ${buildingInfo.outsideTemp}°C
${buildingInfo.notes ? `- Notes: ${buildingInfo.notes}` : ""}

Energy Rating: ${energyRating}
Rating Justification: ${ratingResult.object.justification}

Thermal Analysis Results:
${allAnomalies}

Create a structured report with these sections:

# Executive Summary
Brief overview of findings and energy rating with key recommendations.

# Building Assessment
Technical details about the building and inspection conditions.

# Energy Rating: ${energyRating}
Detailed justification for the energy rating with supporting evidence.

# Thermal Analysis Findings
Summary of detected anomalies organized by severity and location.

# Priority Recommendations
Actionable recommendations prioritized by:
1. Safety and immediate concerns
2. High-impact energy savings
3. Cost-effective improvements
4. Long-term efficiency upgrades

Include estimated costs, energy savings potential, and payback periods.

# Financial Analysis
- Total estimated repair costs
- Annual energy savings potential
- Return on investment calculations
- EU compliance considerations

# Technical Appendix
Detailed anomaly descriptions with coordinates and technical specifications.

# Conclusion and Next Steps
Summary with clear action items and follow-up recommendations.

Use professional thermography language suitable for building owners, facility managers, and compliance officers. Format in clear markdown with proper headers and structure.`,
        });

        // Update state with final report and rating
        const currentState = this.state.analysisState;
        this.setState({
          ...this.state,
          analysisState: {
            ...currentState,
            finalReport: reportResult.text,
            energyRating: energyRating,
          },
        });

        return `Energy efficiency report generated successfully. Energy Rating: ${energyRating}`;
      } catch (error: unknown) {
        const errorMsg = `Error generating report: ${error instanceof Error ? error.message : String(error)}`;
        console.error("[ThermalAnalysisAgent]", errorMsg);
        return errorMsg;
      }
    },
  });

  @callable()
  async initializeAnalysis(
    buildingInfo: BuildingInfo,
    imagePairs: ImagePair[]
  ): Promise<void> {
    console.log(
      "[ThermalAnalysisAgent] Initializing analysis with",
      imagePairs.length,
      "image pairs"
    );

    this.setState({
      buildingInfo,
      imagePairs,
      analysisState: {
        status: "idle",
        progress: 0,
        analysisLog: [`Initialized analysis for ${buildingInfo.buildingName}`],
        detectedAnomalies: [],
        pendingApprovals: [],
        approvalHistory: [],
      },
    });
  }

  @callable()
  async startAnalysis(): Promise<void> {
    console.log(
      "[ThermalAnalysisAgent] Starting analysis with human approval checkpoints"
    );

    if (!this.state.buildingInfo || this.state.imagePairs.length === 0) {
      throw new Error("Building info and image pairs must be provided");
    }

    // Reset flags and state
    this.shouldStopAnalysis = false;
    this.resetAnalysisState();

    try {
      // User clicked "Start Analysis" - that's already consent, so begin immediately

      this.setState({
        ...this.state,
        analysisState: {
          ...this.state.analysisState,
          status: "analyzing",
          totalImagePairs: this.state.imagePairs.length,
          analysisLog: [
            ...this.state.analysisState.analysisLog,
            "Starting AI-powered thermal analysis...",
          ],
        },
      });

      const model = google("gemini-2.5-flash-preview-05-20");
      const buildingInfo = this.state.buildingInfo;
      const imagePairs = this.state.imagePairs;

      // Create building context string
      const buildingContext = `${buildingInfo.buildingName} (${buildingInfo.buildingType}, built ${buildingInfo.constructionYear}) in ${buildingInfo.location}. Outside temp: ${buildingInfo.outsideTemp}°C during inspection on ${buildingInfo.inspectionDate}.`;

      const systemPrompt = `You are an expert thermographic engineer conducting a comprehensive energy efficiency analysis with human oversight.

Building Context: ${buildingContext}
Analysis Scope: ${imagePairs.length} image pairs to analyze
Inspector: ${buildingInfo.inspector}

ANALYSIS WORKFLOW:
1. Systematically analyze each RGB+thermal image pair
2. Identify thermal anomalies indicating energy inefficiency
3. Extract structured data for each anomaly found
4. Generate a comprehensive energy efficiency report with EU rating

Use the provided tools to:
- analyzeImagePair: Process each image pair individually
- generateEnergyReport: Create final comprehensive report

Focus on professional thermographic analysis identifying:
- Thermal bridges and heat loss paths
- Air leakage around building envelope
- Insulation deficiencies and gaps
- Moisture-related thermal patterns
- Energy efficiency improvement opportunities

Process all ${imagePairs.length} image pairs methodically, then generate the final report.`;

      this.updateProgress(5, "Initializing AI analysis engine...");

      // Use streamText with maxSteps for multi-step analysis
      const stream = await streamText({
        model,
        maxSteps: Math.min(20, imagePairs.length + 5), // Dynamic max steps based on image count
        system: systemPrompt,
        prompt: `Begin comprehensive thermal analysis of ${buildingInfo.buildingName}. 

Analyze these ${imagePairs.length} image pairs systematically:
${imagePairs.map((pair, i) => `${i + 1}. ${pair.label} - RGB: ${pair.rgbUrl}, Thermal: ${pair.thermalUrl}`).join("\n")}

After analyzing all image pairs, generate a comprehensive energy efficiency report.`,
        tools: {
          analyzeImagePair: this.analyzeImagePair,
          generateEnergyReport: this.generateEnergyReport,
        },
        onStepFinish: (result) => {
          if (this.shouldStopAnalysis) return;

          const stepNumber = result.toolCalls?.length || 0;
          console.log(
            `[ThermalAnalysisAgent] Step ${stepNumber + 1} completed`
          );

          // Update progress based on step completion
          const baseProgress =
            10 + (stepNumber * 70) / Math.min(20, imagePairs.length + 5);
          this.updateProgress(
            Math.min(baseProgress, 85),
            `Completed analysis step ${stepNumber + 1}`
          );

          // Log tool calls
          if (result.toolCalls && result.toolCalls.length > 0) {
            result.toolCalls.forEach((call) => {
              if (call.toolName === "analyzeImagePair") {
                const args = call.args as {
                  rgbUrl: string;
                  thermalUrl: string;
                  pairLabel: string;
                  buildingContext: string;
                };
                this.updateProgress(
                  this.state.analysisState.progress,
                  `Analyzing ${args.pairLabel}...`
                );
              } else if (call.toolName === "generateEnergyReport") {
                this.updateProgress(
                  this.state.analysisState.progress,
                  "Generating comprehensive energy report..."
                );
              }
            });
          }

          // Log tool results
          if (result.toolResults && result.toolResults.length > 0) {
            result.toolResults.forEach((result) => {
              if (typeof result.result === "string") {
                this.updateProgress(
                  this.state.analysisState.progress,
                  result.result.split("\n")[0]
                );
              }
            });
          }
        },
      });

      // Check for critical anomalies during analysis and request approval if needed
      let criticalAnomaliesFound = false;
      let imagePairAnalyzed = 0;

      // Stream the analysis
      let fullResponse = "";
      for await (const part of stream.fullStream) {
        if (this.shouldStopAnalysis) {
          console.log("[ThermalAnalysisAgent] Analysis stopped by user");
          break;
        }

        if (part.type === "text-delta") {
          fullResponse += part.textDelta;
        }

        if (part.type === "tool-call") {
          // Track which image pair is being analyzed
          if (part.toolName === "analyzeImagePair") {
            // Tool call detected, no additional processing needed
          }
        }

        if (part.type === "tool-result") {
          imagePairAnalyzed++;

          // Check for critical anomalies every few image pairs
          if (
            imagePairAnalyzed %
              Math.max(1, Math.floor(imagePairs.length / 3)) ===
            0
          ) {
            const currentAnomalies = this.state.analysisState.detectedAnomalies;
            const criticalAnomalies = currentAnomalies.filter(
              (a) => a.severity === "severe"
            );

            if (criticalAnomalies.length > 0 && !criticalAnomaliesFound) {
              criticalAnomaliesFound = true;

              // Find the most recent critical anomalies and their associated images
              const recentCriticalAnomalies = criticalAnomalies.slice(-3); // Last 3 critical ones
              const associatedImages = recentCriticalAnomalies
                .map((anomaly) => {
                  // Find image pair that likely contains this anomaly
                  const matchingPair = imagePairs.find((pair) =>
                    anomaly.id.includes(
                      pair.label.toLowerCase().replace(/\s+/g, "_")
                    )
                  );
                  return matchingPair;
                })
                .filter(Boolean);

              // CHECKPOINT: Request approval for critical anomalies with images
              const continueAfterCritical = await this.requestApproval(
                "anomaly_detection",
                "Critical Thermal Issues Found",
                `Found ${criticalAnomalies.length} severe thermal anomalies that may indicate serious energy efficiency problems. Review the findings and decide whether to continue analyzing the remaining ${imagePairs.length - imagePairAnalyzed} image pairs.`,
                {
                  severeCount: criticalAnomalies.length,
                  totalAnomalies: currentAnomalies.length,
                  imagesAnalyzed: imagePairAnalyzed,
                  imagesRemaining: imagePairs.length - imagePairAnalyzed,
                  // Include image URLs for visual context
                  associatedImages: associatedImages.map((pair) => ({
                    label: pair?.label,
                    rgbUrl: pair?.rgbUrl,
                    thermalUrl: pair?.thermalUrl,
                  })),
                  // Include detailed anomaly info
                  criticalAnomalies: recentCriticalAnomalies.map((a) => ({
                    location: a.location,
                    description: a.description,
                    severity: a.severity,
                    confidence: a.confidence,
                    temperatureDifferential: a.temperatureDifferential,
                    probableCause: a.probableCause,
                    estimatedEnergyLoss: a.estimatedEnergyLoss,
                    repairCost: a.repairCost,
                    repairPriority: a.repairPriority,
                  })),
                }
              );

              if (!continueAfterCritical) {
                this.shouldStopAnalysis = true;
                this.setState({
                  ...this.state,
                  analysisState: {
                    ...this.state.analysisState,
                    status: "stopped",
                    progress: 70,
                  },
                });
                this.updateProgress(
                  70,
                  "Analysis stopped after critical anomaly detection"
                );
                return; // Exit the method completely
              } else {
                // User approved, continue analysis
                this.updateProgress(
                  this.state.analysisState.progress,
                  "Continuing analysis after approval..."
                );
              }
            }
          }
        }
      }

      if (!this.shouldStopAnalysis) {
        // CHECKPOINT 3: Request approval for comprehensive report generation
        const detectedAnomalies = this.state.analysisState.detectedAnomalies;
        if (detectedAnomalies.length > 0) {
          const reportApproved = await this.requestApproval(
            "generate_report",
            "Generate Comprehensive Report",
            `Generate detailed energy efficiency report with EU rating for ${detectedAnomalies.length} detected anomalies. This requires additional AI processing.`,
            {
              anomalyCount: detectedAnomalies.length,
              severeCount: detectedAnomalies.filter(
                (a) => a.severity === "severe"
              ).length,
              moderateCount: detectedAnomalies.filter(
                (a) => a.severity === "moderate"
              ).length,
              minorCount: detectedAnomalies.filter(
                (a) => a.severity === "minor"
              ).length,
              reportType: "Comprehensive Energy Efficiency Report",
              estimatedCost: "~$2-4",
            }
          );

          if (!reportApproved) {
            this.updateProgress(
              85,
              "Analysis completed without detailed report"
            );
          } else {
            this.updateProgress(90, "Generating comprehensive report...");
          }
        }

        // Mark analysis as completed regardless of report generation
        this.setState({
          ...this.state,
          analysisState: {
            ...this.state.analysisState,
            status: "completed",
            progress: 100,
            analysisLog: [
              ...this.state.analysisState.analysisLog,
              "✅ Thermal analysis completed successfully!",
              `📊 Found ${this.state.analysisState.detectedAnomalies.length} thermal anomalies`,
              `⚡ Energy rating: ${this.state.analysisState.energyRating || "Calculating..."}`,
              `📝 Analysis summary: ${fullResponse.slice(0, 200)}...`,
              detectedAnomalies.length > 0
                ? "📋 Analysis completed with findings"
                : "📋 Analysis completed - no issues found",
            ],
          },
        });

        console.log("[ThermalAnalysisAgent] Analysis completed successfully");
      } else {
        // Analysis was stopped
        this.setState({
          ...this.state,
          analysisState: {
            ...this.state.analysisState,
            status: "stopped",
            analysisLog: [
              ...this.state.analysisState.analysisLog,
              "⏹️ Analysis was stopped during processing",
            ],
          },
        });
      }
    } catch (error: unknown) {
      console.error("[ThermalAnalysisAgent] Analysis error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.setState({
        ...this.state,
        analysisState: {
          ...this.state.analysisState,
          status: "error",
          error: errorMessage,
          analysisLog: [
            ...this.state.analysisState.analysisLog,
            `❌ Analysis failed: ${errorMessage}`,
          ],
        },
      });
    } finally {
      // Always reset the stop flag
      this.shouldStopAnalysis = false;
    }
  }

  // Original complex analysis method (preserved for reference - no approvals)
  @callable()
  async startComplexAnalysis(): Promise<void> {
    console.log(
      "[ThermalAnalysisAgent] Starting complex AI analysis (no human oversight)"
    );

    if (!this.state.buildingInfo || this.state.imagePairs.length === 0) {
      throw new Error("Building info and image pairs must be provided");
    }

    // Reset flags and state
    this.shouldStopAnalysis = false;
    this.resetAnalysisState();

    try {
      this.setState({
        ...this.state,
        analysisState: {
          ...this.state.analysisState,
          status: "analyzing",
          totalImagePairs: this.state.imagePairs.length,
          analysisLog: ["Starting AI-powered thermal analysis (automated)..."],
        },
      });

      const model = google("gemini-2.5-flash-preview-05-20");
      const buildingInfo = this.state.buildingInfo;
      const imagePairs = this.state.imagePairs;

      // Create building context string
      const buildingContext = `${buildingInfo.buildingName} (${buildingInfo.buildingType}, built ${buildingInfo.constructionYear}) in ${buildingInfo.location}. Outside temp: ${buildingInfo.outsideTemp}°C during inspection on ${buildingInfo.inspectionDate}.`;

      const systemPrompt = `You are an expert thermographic engineer conducting a comprehensive energy efficiency analysis.

Building Context: ${buildingContext}
Analysis Scope: ${imagePairs.length} image pairs to analyze
Inspector: ${buildingInfo.inspector}

ANALYSIS WORKFLOW:
1. Systematically analyze each RGB+thermal image pair
2. Identify thermal anomalies indicating energy inefficiency
3. Extract structured data for each anomaly found
4. Generate a comprehensive energy efficiency report with EU rating

Use the provided tools to:
- analyzeImagePair: Process each image pair individually
- generateEnergyReport: Create final comprehensive report

Focus on professional thermographic analysis identifying:
- Thermal bridges and heat loss paths
- Air leakage around building envelope
- Insulation deficiencies and gaps
- Moisture-related thermal patterns
- Energy efficiency improvement opportunities

Process all ${imagePairs.length} image pairs methodically, then generate the final report.`;

      this.updateProgress(5, "Initializing AI analysis engine...");

      // Use streamText with maxSteps for multi-step analysis
      const stream = await streamText({
        model,
        maxSteps: 20,
        system: systemPrompt,
        prompt: `Begin comprehensive thermal analysis of ${buildingInfo.buildingName}. 

Analyze these ${imagePairs.length} image pairs systematically:
${imagePairs.map((pair, i) => `${i + 1}. ${pair.label} - RGB: ${pair.rgbUrl}, Thermal: ${pair.thermalUrl}`).join("\n")}

After analyzing all image pairs, generate a comprehensive energy efficiency report.`,
        tools: {
          analyzeImagePair: this.analyzeImagePair,
          generateEnergyReport: this.generateEnergyReport,
        },
        onStepFinish: (result) => {
          if (this.shouldStopAnalysis) return;

          const stepNumber = result.toolCalls?.length || 0;
          console.log(
            `[ThermalAnalysisAgent] Step ${stepNumber + 1} completed`
          );

          // Update progress based on step completion
          const baseProgress = 10 + (stepNumber * 70) / 20;
          this.updateProgress(
            Math.min(baseProgress, 85),
            `Completed analysis step ${stepNumber + 1}`
          );

          // Log tool calls
          if (result.toolCalls && result.toolCalls.length > 0) {
            result.toolCalls.forEach((call) => {
              if (call.toolName === "analyzeImagePair") {
                const args = call.args as {
                  rgbUrl: string;
                  thermalUrl: string;
                  pairLabel: string;
                  buildingContext: string;
                };
                this.updateProgress(
                  this.state.analysisState.progress,
                  `Analyzing ${args.pairLabel}...`
                );
              } else if (call.toolName === "generateEnergyReport") {
                this.updateProgress(
                  this.state.analysisState.progress,
                  "Generating comprehensive energy report..."
                );
              }
            });
          }

          // Log tool results
          if (result.toolResults && result.toolResults.length > 0) {
            result.toolResults.forEach((result) => {
              if (typeof result.result === "string") {
                this.updateProgress(
                  this.state.analysisState.progress,
                  result.result.split("\n")[0]
                );
              }
            });
          }
        },
      });

      // Stream the analysis
      let fullResponse = "";
      for await (const part of stream.fullStream) {
        if (this.shouldStopAnalysis) {
          console.log("[ThermalAnalysisAgent] Analysis stopped by user");
          break;
        }

        if (part.type === "text-delta") {
          fullResponse += part.textDelta;
        }
      }

      if (!this.shouldStopAnalysis) {
        // Analysis completed successfully
        this.setState({
          ...this.state,
          analysisState: {
            ...this.state.analysisState,
            status: "completed",
            progress: 100,
            analysisLog: [
              ...this.state.analysisState.analysisLog,
              "✅ Thermal analysis completed successfully!",
              `📊 Found ${this.state.analysisState.detectedAnomalies.length} thermal anomalies`,
              `⚡ Energy rating: ${this.state.analysisState.energyRating || "Calculating..."}`,
              `📝 Analysis summary: ${fullResponse.slice(0, 200)}...`,
            ],
          },
        });

        console.log("[ThermalAnalysisAgent] Analysis completed successfully");
      }
    } catch (error: unknown) {
      console.error("[ThermalAnalysisAgent] Analysis error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.setState({
        ...this.state,
        analysisState: {
          ...this.state.analysisState,
          status: "error",
          error: errorMessage,
          analysisLog: [
            ...this.state.analysisState.analysisLog,
            `❌ Analysis failed: ${errorMessage}`,
          ],
        },
      });
    }
  }

  @callable()
  async restartAnalysis(): Promise<void> {
    console.log("[ThermalAnalysisAgent] Restarting analysis");

    // Reset analysis state but keep building info and images
    this.setState({
      ...this.state,
      analysisState: {
        status: "idle",
        progress: 0,
        analysisLog: ["Analysis restarted - ready to begin"],
        detectedAnomalies: [],
        pendingApprovals: [],
        approvalHistory: [],
      },
    });
  }

  @callable()
  async stopAnalysis(): Promise<void> {
    console.log("[ThermalAnalysisAgent] Stopping analysis");
    this.shouldStopAnalysis = true;

    const currentState = this.state.analysisState;
    this.setState({
      ...this.state,
      analysisState: {
        ...currentState,
        status: "stopped",
        analysisLog: [
          ...currentState.analysisLog,
          "⏹️ Analysis stopped by user",
        ],
      },
    });
  }

  @callable()
  async getAnalysisState(): Promise<AnalysisState> {
    return this.state.analysisState;
  }

  @callable()
  async getDetectedAnomalies(): Promise<ThermalAnomaly[]> {
    return this.state.analysisState.detectedAnomalies;
  }

  @callable()
  async getFinalReport(): Promise<string | null> {
    return this.state.analysisState.finalReport || null;
  }

  @callable()
  async getBuildingInfo(): Promise<BuildingInfo | null> {
    return this.state.buildingInfo;
  }

  @callable()
  async getImagePairs(): Promise<ImagePair[]> {
    return this.state.imagePairs;
  }

  // Method for frontend to provide approval decisions
  @callable()
  async provideApproval(decision: ApprovalDecision): Promise<void> {
    console.log(`[ThermalAnalysisAgent] Received approval decision:`, decision);

    const currentState = this.state.analysisState;

    // Validate that the approval is still pending
    const pendingApproval = currentState.pendingApprovals.find(
      (p) => p.id === decision.approvalId
    );
    if (!pendingApproval) {
      throw new Error(
        `Approval ${decision.approvalId} not found or already processed`
      );
    }

    // Add to approval history
    this.setState({
      ...this.state,
      analysisState: {
        ...currentState,
        approvalHistory: [...currentState.approvalHistory, decision],
      },
    });
  }

  // Get pending approvals for the frontend
  @callable()
  async getPendingApprovals(): Promise<PendingApproval[]> {
    return this.state.analysisState.pendingApprovals;
  }

  // Get approval history
  @callable()
  async getApprovalHistory(): Promise<ApprovalDecision[]> {
    return this.state.analysisState.approvalHistory;
  }

  // Clear all approvals and reset to clean state
  @callable()
  async clearApprovals(): Promise<void> {
    console.log("[ThermalAnalysisAgent] Clearing all approvals");

    const currentState = this.state.analysisState;
    this.setState({
      ...this.state,
      analysisState: {
        ...currentState,
        pendingApprovals: [],
        approvalHistory: [],
      },
    });
  }
}
