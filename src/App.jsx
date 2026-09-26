import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { VoiceInput } from './components/VoiceInput';
import { ArchitectureInput } from './components/ArchitectureInput';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { CloudSelector } from './components/CloudSelector';
import { ArchitectureEditor } from './components/ArchitectureEditor';
import { HealthPanel } from './components/HealthPanel';
import { CostPanel } from './components/CostPanel';
import { RecommendationPanel } from './components/RecommendationPanel';
import { BeforeAfterModal } from './components/BeforeAfterModal';
import { ExportModal } from './components/ExportModal';
import { SavedArchitectureModal } from './components/SavedArchitectureModal';
import { SmartClarificationModal } from './components/SmartClarificationModal';
import { ComponentInspectorModal } from './components/ComponentInspectorModal';
import { TrafficSimulatorPanel } from './components/TrafficSimulatorPanel';
import { FailureSimulatorPanel } from './components/FailureSimulatorPanel';
import { ArchitectureExplanationPanel } from './components/ArchitectureExplanationPanel';
import { CloudMappingPanel } from './components/CloudMappingPanel';
import { TerraformPreviewPanel } from './components/TerraformPreviewPanel';
import { RequirementsTabPanel } from './components/RequirementsTabPanel';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import { WhatIfSimulatorPanel } from './components/WhatIfSimulatorPanel';
import { ImpactAnalyzerPanel } from './components/ImpactAnalyzerPanel';
import { ExperimentLabPanel } from './components/ExperimentLabPanel';
import { ArchitectureComparisonPanel } from './components/ArchitectureComparisonPanel';
import { GrowthSimulatorPanel } from './components/GrowthSimulatorPanel';
import { DecisionMemoryPanel } from './components/DecisionMemoryPanel';

import {
  analyzeRequirementsApi,
  generateArchitectureApi,
  validateArchitectureApi,
  analyzeHealthApi,
  estimateCostApi,
  conversationalCommandApi
} from './services/apiService';
import { PRICING_ASSUMPTIONS_DEFAULT } from './data/mockPricing';
import { PRESET_ARCHITECTURES } from './data/presetArchitectures';
import {
  Activity,
  DollarSign,
  Sparkles,
  SlidersHorizontal,
  Edit3,
  Mic,
  FileText,
  AlertOctagon,
  Cloud,
  FileCode,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FlaskConical,
  Scale,
  Bookmark,
  TrendingUp,
  GitCommit,
  Layers,
  Wrench
} from 'lucide-react';

export default function App() {
  const defaultPreset = PRESET_ARCHITECTURES[0];

  // Core Architecture State
  const [architecture, setArchitecture] = useState({
    project_name: defaultPreset.name,
    components: defaultPreset.components,
    connections: defaultPreset.connections,
    rawText: defaultPreset.description
  });
  const [activeName, setActiveName] = useState(defaultPreset.name);
  const [inputText, setInputText] = useState(defaultPreset.description);
  const [isProcessing, setIsProcessing] = useState(false);

  // Undo / Redo Stacks (Feature 21)
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Version History (Feature 20)
  const [versionHistory, setVersionHistory] = useState([
    {
      id: 1,
      note: 'Initial Baseline Architecture',
      architecture: defaultPreset,
      timestamp: new Date().toISOString()
    }
  ]);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Beginner vs Advanced Mode Toggle (Feature 26)
  const [isBeginnerMode, setIsBeginnerMode] = useState(false);

  // View state
  const [cloudMode, setCloudMode] = useState('logical'); // 'logical', 'aws', 'gcp'
  const [direction, setDirection] = useState('LR'); // 'LR' or 'TD'
  const [diagramType, setDiagramType] = useState('flowchart');

  // Left Panel Subtab ('input' or 'editor')
  const [leftTab, setLeftTab] = useState('input');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Right Panel Tabs:
  // 'requirements', 'health', 'cost', 'traffic', 'failure', 'optimizer', 'cloudmap', 'explain', 'terraform'
  const [rightTab, setRightTab] = useState('requirements');

  // Pricing assumptions
  const [assumptions, setAssumptions] = useState(PRICING_ASSUMPTIONS_DEFAULT);

  // Validation State (Feature 22)
  const [validationResult, setValidationResult] = useState({ is_valid: true, errors: [], warnings: [] });

  // Requirements Analysis State (Feature 1 & 3)
  const [requirementsData, setRequirementsData] = useState({
    application_type: 'E-commerce',
    expected_users: '10,000 – 100,000',
    main_features: ['User Authentication', 'Product Catalog', 'Shopping Cart', 'Payment Gateway', 'Order Management'],
    data_requirements: ['Relational transactional database for orders', 'In-memory cache for product catalog'],
    security_requirements: ['PCI-DSS compliance for payment data', 'HTTPS encryption', 'JWT access tokens'],
    performance_requirements: ['Sub-100ms catalog page load', 'Global static content delivery via CDN'],
    availability_requirements: ['99.95% High Availability', 'Multi-AZ failover']
  });

  // Smart Clarification Modal State
  const [clarificationModal, setClarificationModal] = useState({
    isOpen: false,
    analysisResult: null,
    pendingPrompt: ''
  });

  // Failure Simulation State (Feature 14 & 15)
  const [activeFailureState, setActiveFailureState] = useState({
    isActive: false,
    targetType: null,
    failedIds: [],
    cascadedIds: []
  });

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Before / After Modal State
  const [beforeAfterState, setBeforeAfterState] = useState({
    isOpen: false,
    beforeArchitecture: null,
    afterArchitecture: null,
    optimization: null
  });

  // Helper to commit architecture updates with Undo/Redo tracking
  const updateArchitectureState = useCallback((newArch, recordUndo = true) => {
    if (recordUndo) {
      setUndoStack(prev => [...prev.slice(-25), architecture]);
      setRedoStack([]);
    }
    setArchitecture(newArch);
  }, [architecture]);

  // Undo / Redo Actions
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, architecture]);
    setArchitecture(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, architecture]);
    setArchitecture(next);
  };

  // Real-Time Architecture Validation (Feature 22)
  useEffect(() => {
    let isCancelled = false;
    async function validate() {
      const res = await validateArchitectureApi(architecture);
      if (!isCancelled && res) {
        setValidationResult(res);
      }
    }
    validate();
    return () => { isCancelled = true; };
  }, [architecture]);

  // Initiate Architecture Generation Pipeline (Natural language / Voice input)
  const handleInitiateGeneration = async (overrideText) => {
    const textToParse = overrideText !== undefined ? overrideText : inputText;
    if (!textToParse || !textToParse.trim()) return;

    setIsProcessing(true);

    try {
      const analysis = await analyzeRequirementsApi(textToParse);
      setRequirementsData(analysis);

      if (analysis.needs_clarification && analysis.questions && analysis.questions.length > 0) {
        // Open Smart Clarification Modal
        setClarificationModal({
          isOpen: true,
          analysisResult: analysis,
          pendingPrompt: textToParse
        });
        setIsProcessing(false);
      } else {
        // Generate immediately
        await finalizeArchitectureGeneration(textToParse, {}, analysis.application_type);
      }
    } catch (err) {
      console.error('Error analyzing requirements:', err);
      await finalizeArchitectureGeneration(textToParse, {}, 'Web Application');
    }
  };

  // Finalize Generation with Answers
  const finalizeArchitectureGeneration = async (prompt, answers = {}, appType = null) => {
    setIsProcessing(true);
    try {
      const generated = await generateArchitectureApi(prompt, answers, appType, cloudMode);
      updateArchitectureState({
        project_name: generated.project_name || 'Generated Architecture',
        components: generated.components || [],
        connections: generated.connections || [],
        rawText: prompt
      });
      setActiveName(generated.project_name || 'Custom Architecture');
      setLeftTab('editor'); // Switch to visual editor to inspect
      setRightTab('requirements'); // Show requirements first
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Conversational Architecture Command Handler
  const handleConversationalCommand = async (commandText) => {
    if (!commandText || !commandText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await conversationalCommandApi(commandText, architecture);
      if (res && res.updated_architecture) {
        updateArchitectureState(res.updated_architecture);
        setActiveName(`${activeName} (Edited)`);

        if (res.intent === 'remove_component' || res.intent === 'add_component') {
          setRightTab('impact');
        } else if (res.intent === 'simulate_traffic' || /what\s+if/i.test(commandText)) {
          setRightTab('whatif');
        } else if (res.intent === 'optimize_cost') {
          setRightTab('cost');
        } else if (res.intent === 'explain') {
          setRightTab('explain');
        }
      }
    } catch (err) {
      console.error('Conversational command failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Preset Selection (All 9 Domains)
  const handleSelectPreset = (preset) => {
    updateArchitectureState({
      project_name: preset.name,
      components: preset.components,
      connections: preset.connections,
      rawText: preset.description
    });
    setInputText(preset.description);
    setActiveName(preset.name);
    setRequirementsData({
      application_type: preset.domain,
      expected_users: '10,000 – 100,000',
      main_features: preset.components.map(c => c.name),
      data_requirements: ['Persistent database records', 'Session caching'],
      security_requirements: ['HTTPS encryption', 'JWT access tokens', 'Perimeter firewall'],
      performance_requirements: ['Sub-100ms response latency', 'Edge CDN distribution'],
      availability_requirements: ['99.9% High Availability SLA']
    });
    setActiveFailureState({ isActive: false, targetType: null, failedIds: [], cascadedIds: [] });
  };

  // Handle New Blank Architecture
  const handleNewArchitecture = () => {
    updateArchitectureState({
      project_name: 'New Architecture',
      components: [],
      connections: [],
      rawText: ''
    });
    setInputText('');
    setActiveName('New Architecture');
    setSelectedComponent(null);
    setActiveFailureState({ isActive: false, targetType: null, failedIds: [], cascadedIds: [] });
  };

  // Handle Optimizer "Apply Suggestion" click -> Opens Before / After Modal
  const handleTriggerOptimization = (optimization) => {
    if (!optimization) return;
    const afterArch = optimization.target_architecture || (optimization.apply ? optimization.apply(architecture) : null);
    if (!afterArch) return;

    setBeforeAfterState({
      isOpen: true,
      beforeArchitecture: architecture,
      afterArchitecture: afterArch,
      optimization
    });
  };

  // Confirm and commit optimized architecture
  const handleConfirmOptimization = () => {
    if (beforeAfterState.afterArchitecture) {
      updateArchitectureState(beforeAfterState.afterArchitecture);
      setActiveName(`${activeName} (Optimized)`);
    }
  };

  // Load from Saved Library
  const handleLoadSavedArchitecture = (savedItem) => {
    if (!savedItem || !savedItem.architecture) return;
    updateArchitectureState(savedItem.architecture);
    if (savedItem.assumptions) setAssumptions(savedItem.assumptions);
    if (savedItem.cloudMode) setCloudMode(savedItem.cloudMode);
    setInputText(savedItem.description || savedItem.architecture.rawText || '');
    setActiveName(savedItem.name);
  };

  // Save Version Snapshot (Feature 20)
  const handleSaveVersion = (note) => {
    const newVer = {
      id: Date.now(),
      note: note || `Snapshot #${versionHistory.length + 1}`,
      architecture: JSON.parse(JSON.stringify(architecture)),
      timestamp: new Date().toISOString()
    };
    setVersionHistory(prev => [...prev, newVer]);
  };

  const handleRestoreVersion = (ver) => {
    if (!ver || !ver.architecture) return;
    updateArchitectureState(ver.architecture);
    setActiveName(`${activeName} (v${ver.note})`);
    setIsVersionModalOpen(false);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Header
        onSelectPreset={handleSelectPreset}
        onNewArchitecture={handleNewArchitecture}
        onOpenSaveModal={() => setIsSaveOpen(true)}
        onOpenSavedListModal={() => setIsLibraryOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        isBeginnerMode={isBeginnerMode}
        onToggleBeginnerMode={() => setIsBeginnerMode(!isBeginnerMode)}
        activeArchitectureName={activeName}
      />

      {/* Main 3-Column Studio Grid */}
      <main className="studio-grid">
        {/* ========================================================
            LEFT COLUMN: Voice/Text Input & Visual Component Editor
            ======================================================== */}
        <section className="panel">
          <div className="panel-header">
            <div className="tab-row" style={{ width: '100%', background: 'transparent' }}>
              <button
                className={`tab-btn ${leftTab === 'input' ? 'active' : ''}`}
                onClick={() => setLeftTab('input')}
              >
                <Mic size={14} />
                Voice & Text Input
              </button>
              <button
                className={`tab-btn ${leftTab === 'editor' ? 'active' : ''}`}
                onClick={() => setLeftTab('editor')}
              >
                <Edit3 size={14} />
                Visual Editor ({architecture.components.length})
              </button>
            </div>
          </div>

          <div className="panel-content">
            {leftTab === 'input' ? (
              <>
                <VoiceInput
                  currentText={inputText}
                  onTranscriptChange={(text) => {
                    setInputText(text);
                  }}
                />

                <ArchitectureInput
                  value={inputText}
                  onChange={setInputText}
                  onGenerate={() => handleInitiateGeneration()}
                  onClear={() => setInputText('')}
                  onConversationalCommand={handleConversationalCommand}
                  isProcessing={isProcessing}
                />
              </>
            ) : (
              <ArchitectureEditor
                architecture={architecture}
                onUpdateArchitecture={(newArch) => updateArchitectureState(newArch, true)}
                selectedComponent={selectedComponent}
                onSelectComponent={(comp) => {
                  setSelectedComponent(comp);
                  setIsInspectorOpen(true);
                }}
              />
            )}
          </div>
        </section>

        {/* ========================================================
            CENTER COLUMN: Cloud Selector & Live Mermaid Diagram Canvas
            ======================================================== */}
        <section className="panel" style={{ background: '#080c14' }}>
          <CloudSelector
            cloudMode={cloudMode}
            onCloudModeChange={setCloudMode}
            direction={direction}
            onDirectionToggle={() => setDirection(d => d === 'LR' ? 'TD' : 'LR')}
            diagramType={diagramType}
            onDiagramTypeChange={setDiagramType}
          />

          {/* Validation Notice Bar */}
          {!validationResult.is_valid && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', borderBottom: '1px solid rgba(244, 63, 94, 0.3)', padding: '6px 14px', fontSize: '0.72rem', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color="#f43f5e" />
              <span><b>Architecture Warning:</b> {typeof validationResult.errors[0] === 'string' ? validationResult.errors[0] : (validationResult.errors[0]?.message || 'Structural consideration detected')}</span>
            </div>
          )}

          <ErrorBoundary title="Diagram Render Error">
            <ArchitectureDiagram
              architecture={architecture}
              cloudMode={cloudMode}
              direction={direction}
              failureState={activeFailureState}
              onSelectComponent={(comp) => {
                if (comp) {
                  setSelectedComponent(comp);
                  setIsInspectorOpen(true);
                } else {
                  setSelectedComponent(null);
                  setIsInspectorOpen(false);
                }
              }}
            />
          </ErrorBoundary>
        </section>

        {/* ========================================================
            RIGHT COLUMN: Comprehensive Multi-Tab Studio Dashboard
            ======================================================== */}
        <section className="panel">
          <div className="panel-header" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="#38bdf8" />
              Architecture Studio Dashboard
            </span>
            <span className="opt-badge" style={{ textTransform: 'capitalize', fontSize: '0.66rem' }}>
              Active: {rightTab === 'cloudmap' ? 'Cloud Map' : rightTab}
            </span>
          </div>

          <div className="dashboard-tab-grid">
            <button
              className={`dashboard-tab-item ${rightTab === 'whatif' ? 'active' : ''}`}
              onClick={() => setRightTab('whatif')}
              title="What-If: Scenario-based traffic surges, outages, and removals"
            >
              <Sparkles size={13} color="#38bdf8" />
              <span>What-If</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'impact' ? 'active' : ''}`}
              onClick={() => setRightTab('impact')}
              title="Impact: Dependency graph and ripple effect analysis"
            >
              <Activity size={13} color="#f59e0b" />
              <span>Impact</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'experiments' ? 'active' : ''}`}
              onClick={() => setRightTab('experiments')}
              title="Experiments: Branch and manage multiple architecture scenarios"
            >
              <FlaskConical size={13} color="#a855f7" />
              <span>Lab</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'compare' ? 'active' : ''}`}
              onClick={() => setRightTab('compare')}
              title="Compare: Factual multi-architecture comparison"
            >
              <Scale size={13} color="#10b981" />
              <span>Compare</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'cost' ? 'active' : ''}`}
              onClick={() => setRightTab('cost')}
              title="Cost: Monthly AWS & GCP estimates with Budget Mode"
            >
              <DollarSign size={13} color="#10b981" />
              <span>Cost</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'growth' ? 'active' : ''}`}
              onClick={() => setRightTab('growth')}
              title="Growth: Multi-month user and throughput scaling simulator"
            >
              <TrendingUp size={13} color="#06b6d4" />
              <span>Growth</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'failure' ? 'active' : ''}`}
              onClick={() => setRightTab('failure')}
              title="Failure: Multi-tier cascade and blast-radius outages"
            >
              <AlertOctagon size={13} color="#f43f5e" />
              <span>Failure</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'decisions' ? 'active' : ''}`}
              onClick={() => setRightTab('decisions')}
              title="Decisions: Architecture Decision Records (ADRs) linked to components"
            >
              <Bookmark size={13} color="#ec4899" />
              <span>Decisions</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'health' ? 'active' : ''}`}
              onClick={() => setRightTab('health')}
              title="Health: Multi-pillar reliability scores"
            >
              <Activity size={13} color="#38bdf8" />
              <span>Health</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'security' ? 'active' : ''}`}
              onClick={() => setRightTab('security')}
              title="Security: Vulnerabilities & access controls"
            >
              <Shield size={13} color="#38bdf8" />
              <span>Security</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'traffic' ? 'active' : ''}`}
              onClick={() => setRightTab('traffic')}
              title="Traffic: Future load simulation & bottlenecks"
            >
              <Activity size={13} color="#f59e0b" />
              <span>Traffic</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'optimizer' ? 'active' : ''}`}
              onClick={() => setRightTab('optimizer')}
              title="Optimizer: Recommendations & Cost vs Performance trade-offs"
            >
              <Sparkles size={13} color="#eab308" />
              <span>Optimizer</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'requirements' ? 'active' : ''}`}
              onClick={() => setRightTab('requirements')}
              title="Requirements: Domain, features, and capacity requirements"
            >
              <FileText size={13} color="#818cf8" />
              <span>Reqs</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'cloudmap' ? 'active' : ''}`}
              onClick={() => setRightTab('cloudmap')}
              title="Cloud Map: AWS & GCP native service mappings"
            >
              <Cloud size={13} color="#38bdf8" />
              <span>Cloud</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'explain' ? 'active' : ''}`}
              onClick={() => setRightTab('explain')}
              title="Explain: Step-by-step request flow narrative"
            >
              <Compass size={13} color="#a855f7" />
              <span>Explain</span>
            </button>
            <button
              className={`dashboard-tab-item ${rightTab === 'terraform' ? 'active' : ''}`}
              onClick={() => setRightTab('terraform')}
              title="Terraform: Executable Infrastructure Code preview"
            >
              <FileCode size={13} color="#10b981" />
              <span>Terraform</span>
            </button>
          </div>

          <div className="panel-content">
            <ErrorBoundary title="Dashboard Tab Error" onReset={() => setRightTab('whatif')}>
              {/* 1. What-If Simulator Tab */}
              {rightTab === 'whatif' && (
                <WhatIfSimulatorPanel
                  architecture={architecture}
                  onApplySimulatedArchitecture={(simArch) => updateArchitectureState(simArch)}
                />
              )}

              {/* 2. Impact Analyzer Tab */}
              {rightTab === 'impact' && (
                <ImpactAnalyzerPanel architecture={architecture} />
              )}

              {/* 3. Experiment Lab Tab */}
              {rightTab === 'experiments' && (
                <ExperimentLabPanel
                  architecture={architecture}
                  onSwitchArchitecture={(expArch) => updateArchitectureState(expArch)}
                  onNavigateToCompare={() => setRightTab('compare')}
                />
              )}

              {/* 4. Multi-Architecture Comparison Tab */}
              {rightTab === 'compare' && (
                <ArchitectureComparisonPanel architecture={architecture} />
              )}

              {/* 5. Cloud Cost Tab with Budget Mode */}
              {rightTab === 'cost' && (
                <CostPanel
                  architecture={architecture}
                  assumptions={assumptions}
                  onAssumptionsChange={setAssumptions}
                  onUpdateArchitecture={(newArch) => updateArchitectureState(newArch)}
                />
              )}

              {/* 6. Growth Simulator Tab */}
              {rightTab === 'growth' && (
                <GrowthSimulatorPanel architecture={architecture} />
              )}

              {/* 7. Failure Cascade Simulator Tab */}
              {rightTab === 'failure' && (
                <FailureSimulatorPanel
                  architecture={architecture}
                  activeFailureState={activeFailureState}
                  onFailureStateChange={setActiveFailureState}
                />
              )}

              {/* 8. Architecture Decision Memory (ADRs) Tab */}
              {rightTab === 'decisions' && (
                <DecisionMemoryPanel architecture={architecture} />
              )}

              {/* 9. Multi-Pillar Health Tab */}
              {rightTab === 'health' && (
                <HealthPanel architecture={architecture} defaultPillar="all" />
              )}

              {/* 10. Dedicated Security Tab */}
              {rightTab === 'security' && (
                <HealthPanel architecture={architecture} defaultPillar="security" />
              )}

              {/* 11. Traffic Simulator Tab */}
              {rightTab === 'traffic' && (
                <TrafficSimulatorPanel architecture={architecture} />
              )}

              {/* 12. Optimizer Tab */}
              {rightTab === 'optimizer' && (
                <RecommendationPanel
                  architecture={architecture}
                  onApplyOptimization={handleTriggerOptimization}
                />
              )}

              {/* 13. Requirements Tab */}
              {rightTab === 'requirements' && (
                <RequirementsTabPanel
                  requirements={requirementsData}
                  onOpenClarificationModal={() => {
                    setClarificationModal({
                      isOpen: true,
                      analysisResult: requirementsData,
                      pendingPrompt: inputText
                    });
                  }}
                />
              )}

              {/* 14. Cloud Mapping Tab */}
              {rightTab === 'cloudmap' && (
                <CloudMappingPanel
                  architecture={architecture}
                  cloudMode={cloudMode}
                  onCloudModeChange={setCloudMode}
                />
              )}

              {/* 15. Step-by-Step Architecture Explanation Tab */}
              {rightTab === 'explain' && (
                <ArchitectureExplanationPanel
                  architecture={architecture}
                  isBeginnerMode={isBeginnerMode}
                />
              )}

              {/* 16. Terraform IaC Tab */}
              {rightTab === 'terraform' && (
                <TerraformPreviewPanel
                  architecture={architecture}
                  cloudMode={cloudMode}
                />
              )}
            </ErrorBoundary>
          </div>
        </section>
      </main>

      {/* Smart Clarification Questions Modal (Feature 1) */}
      <SmartClarificationModal
        isOpen={clarificationModal.isOpen}
        onClose={() => setClarificationModal(prev => ({ ...prev, isOpen: false }))}
        analysisResult={clarificationModal.analysisResult}
        onConfirm={(answers) => {
          finalizeArchitectureGeneration(
            clarificationModal.pendingPrompt,
            answers,
            clarificationModal.analysisResult?.application_type
          );
        }}
      />

      {/* "Why This Component?" Educational Inspector Modal (Feature 5) */}
      <ComponentInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        component={selectedComponent}
        architecture={architecture}
        isBeginnerMode={isBeginnerMode}
      />

      {/* Architecture Version History Modal (Feature 20) */}
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versionHistory={versionHistory}
        onSaveVersion={handleSaveVersion}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Before / After Optimization Modal */}
      <BeforeAfterModal
        isOpen={beforeAfterState.isOpen}
        onClose={() => setBeforeAfterState(s => ({ ...s, isOpen: false }))}
        beforeArchitecture={beforeAfterState.beforeArchitecture}
        afterArchitecture={beforeAfterState.afterArchitecture}
        optimization={beforeAfterState.optimization}
        assumptions={assumptions}
        onConfirmApply={handleConfirmOptimization}
      />

      {/* Export Modal (Mermaid, SVG, PNG, JSON, PDF, Terraform) */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        architecture={architecture}
        cloudMode={cloudMode}
        direction={direction}
      />

      {/* Save Modal */}
      <SavedArchitectureModal
        isOpen={isSaveOpen}
        mode="save"
        onClose={() => setIsSaveOpen(false)}
        currentArchitecture={architecture}
        currentAssumptions={assumptions}
        cloudMode={cloudMode}
      />

      {/* Saved Architectures Library Modal */}
      <SavedArchitectureModal
        isOpen={isLibraryOpen}
        mode="list"
        onClose={() => setIsLibraryOpen(false)}
        currentArchitecture={architecture}
        currentAssumptions={assumptions}
        cloudMode={cloudMode}
        onLoadArchitecture={handleLoadSavedArchitecture}
      />
    </div>
  );
}
