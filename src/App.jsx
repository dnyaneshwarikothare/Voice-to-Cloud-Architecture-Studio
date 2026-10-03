import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { AIUsageModal } from './components/AIUsageModal';
import { ArchitectureExplanationModal } from './components/ArchitectureExplanationModal';
import { BeforeAfterModal } from './components/BeforeAfterModal';
import { ExportModal } from './components/ExportModal';
import { SavedArchitectureModal } from './components/SavedArchitectureModal';
import { SmartClarificationModal } from './components/SmartClarificationModal';
import { ComponentInspectorModal } from './components/ComponentInspectorModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ArchitectureInput } from './components/ArchitectureInput';
import { ErrorBoundary } from './components/ErrorBoundary';

// Existing feature panels for deep-dive tabs
import { WhatIfSimulatorPanel } from './components/WhatIfSimulatorPanel';
import { ImpactAnalyzerPanel } from './components/ImpactAnalyzerPanel';
import { ExperimentLabPanel } from './components/ExperimentLabPanel';
import { ArchitectureComparisonPanel } from './components/ArchitectureComparisonPanel';
import { CostPanel } from './components/CostPanel';
import { GrowthSimulatorPanel } from './components/GrowthSimulatorPanel';
import { FailureSimulatorPanel } from './components/FailureSimulatorPanel';
import { DecisionMemoryPanel } from './components/DecisionMemoryPanel';
import { HealthPanel } from './components/HealthPanel';
import { TrafficSimulatorPanel } from './components/TrafficSimulatorPanel';
import { RecommendationPanel } from './components/RecommendationPanel';
import { RequirementsTabPanel } from './components/RequirementsTabPanel';
import { CloudMappingPanel } from './components/CloudMappingPanel';
import { ArchitectureExplanationPanel } from './components/ArchitectureExplanationPanel';
import { TerraformPreviewPanel } from './components/TerraformPreviewPanel';
import { TechComparisonPanel } from './components/TechComparisonPanel';
import { BottleneckAnalysisPanel } from './components/BottleneckAnalysisPanel';
import { VersionHistoryPanel } from './components/VersionHistoryPanel';
import { ExportStudioPanel } from './components/ExportStudioPanel';
import { C4ViewsPanel } from './components/C4ViewsPanel';
import { FutureArchitecturePanel } from './components/FutureArchitecturePanel';

import {
  analyzeRequirementsApi,
  generateArchitectureApi,
  validateArchitectureApi,
  analyzeHealthApi,
  estimateCostApi,
  conversationalCommandApi,
  generateScaledArchitectureApi
} from './services/apiService';
import { PRICING_ASSUMPTIONS_DEFAULT } from './data/mockPricing';
import { PRESET_ARCHITECTURES } from './data/presetArchitectures';
import { computeArchitectureDiff } from './services/optimizationService';
import { analyzeArchitectureHealth } from './services/healthService';
import { calculateArchitectureCosts } from './services/costService';
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
  Wrench,
  Grid,
  LayoutGrid,
  Cpu,
  History,
  Download,
  HeartPulse,
  ArrowLeft,
  ChevronDown,
  X
} from 'lucide-react';

export default function App() {
  const defaultPreset = PRESET_ARCHITECTURES[0];

  // Core Architecture State
  const [architecture, setArchitecture] = useState({
    project_name: defaultPreset.name,
    components: defaultPreset.components,
    connections: defaultPreset.connections,
    rawText: defaultPreset.description,
    provider_used: 'rule_based_engine',
    provider_notice: null,
    cached: false
  });
  const [activeName, setActiveName] = useState(defaultPreset.name);
  const [inputText, setInputText] = useState(defaultPreset.description);
  const [isProcessing, setIsProcessing] = useState(false);

  // Scaled Future Architecture State (Feature 10)
  const [scaledArchitecture, setScaledArchitecture] = useState(null);
  const [activeView, setActiveView] = useState('current'); // 'current' or 'scaled'
  const [isGeneratingScaled, setIsGeneratingScaled] = useState(false);

  // Architecture Levels (Feature 18: high-level, c4-context, c4-container, c4-component)
  const [architectureLevel, setArchitectureLevel] = useState('c4-container');

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Version History
  const [versionHistory, setVersionHistory] = useState([
    {
      id: 1,
      note: 'Initial Baseline Architecture',
      architecture: defaultPreset,
      timestamp: new Date().toISOString()
    }
  ]);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Top Studio Feature Navigation (Feature 18: canvas, input, technologies, traffic, bottlenecks, cost, health, whatif, versions, compare, export)
  const [activeNav, setActiveNav] = useState('canvas');
  const [isMoreNavOpen, setIsMoreNavOpen] = useState(false);

  // Beginner vs Advanced Mode Toggle
  const [isBeginnerMode, setIsBeginnerMode] = useState(false);

  // View state
  const [cloudMode, setCloudMode] = useState('logical'); // 'logical', 'aws', 'gcp'
  const [direction, setDirection] = useState('LR'); // 'LR' or 'TD'

  // Left Sidebar Tab
  const [leftTab, setLeftTab] = useState('input');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Right Panel View Mode: 'insights' (default clean right sidebar) or 'deep-dive'
  const [rightViewMode, setRightViewMode] = useState('insights');
  const [rightDeepTab, setRightDeepTab] = useState('whatif');

  // Pricing assumptions
  const [assumptions, setAssumptions] = useState(PRICING_ASSUMPTIONS_DEFAULT);

  // Validation State
  const [validationResult, setValidationResult] = useState({ is_valid: true, errors: [], warnings: [] });

  // Health, Cost, and Traffic Insights Cache
  const [healthData, setHealthData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);

  // Requirements Analysis State
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

  // Failure Simulation State
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
  const [isAIUsageOpen, setIsAIUsageOpen] = useState(false);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);

  // Before / After Modal State
  const [beforeAfterState, setBeforeAfterState] = useState({
    isOpen: false,
    beforeArchitecture: null,
    afterArchitecture: null,
    optimization: null
  });

  // Optimization Success Notification Banner State (Requirement 5)
  const [optimizationSuccessNotice, setOptimizationSuccessNotice] = useState(null);

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

  // Real-Time Architecture Validation
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

  // Real-Time Health & Cost Insights calculation
  useEffect(() => {
    let isCancelled = false;
    async function fetchInsights() {
      try {
        const [hRes, cRes] = await Promise.all([
          analyzeHealthApi(architecture),
          estimateCostApi(architecture, assumptions)
        ]);
        if (!isCancelled) {
          if (hRes) setHealthData(hRes);
          if (cRes) setCostData(cRes);
        }
      } catch (err) {
        console.warn('Insights fetch error:', err);
      }
    }
    fetchInsights();
    return () => { isCancelled = true; };
  }, [architecture, assumptions]);

  // Initiate Architecture Generation Pipeline
  const handleInitiateGeneration = async (overrideText) => {
    const textToParse = overrideText !== undefined ? overrideText : inputText;
    if (!textToParse || !textToParse.trim()) return;

    setIsProcessing(true);

    try {
      const analysis = await analyzeRequirementsApi(textToParse);
      setRequirementsData(analysis);

      if (analysis.needs_clarification && analysis.questions && analysis.questions.length > 0) {
        setClarificationModal({
          isOpen: true,
          analysisResult: analysis,
          pendingPrompt: textToParse
        });
        setIsProcessing(false);
      } else {
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
      const newArch = {
        project_name: generated.project_name || 'Generated Architecture',
        components: generated.components || [],
        connections: generated.connections || [],
        rawText: prompt,
        provider_used: generated.provider_used || 'auto_fallback',
        provider_notice: generated.provider_notice || null,
        cached: Boolean(generated.cached)
      };

      updateArchitectureState(newArch);
      setActiveName(generated.project_name || 'Custom Architecture');
      setScaledArchitecture(null);
      setActiveView('current');

      // Add to version history
      setVersionHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          note: `Generated: ${generated.project_name || 'Architecture'}`,
          architecture: newArch,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate Scaled Architecture (Feature 10)
  const handleGenerateScaledArchitecture = async () => {
    setIsGeneratingScaled(true);
    try {
      const scaled = await generateScaledArchitectureApi(architecture, 1000000);
      setScaledArchitecture(scaled);
      setActiveView('scaled');
    } catch (err) {
      console.error('Scaled architecture generation failed:', err);
    } finally {
      setIsGeneratingScaled(false);
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
          setRightViewMode('deep-dive');
          setRightDeepTab('impact');
        } else if (res.intent === 'simulate_traffic' || /what\s+if/i.test(commandText)) {
          setLeftTab('whatif');
        } else if (res.intent === 'optimize_cost') {
          setLeftTab('cost');
        } else if (res.intent === 'explain') {
          setIsExplainModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Conversational command failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset) => {
    const newArch = {
      project_name: preset.name,
      components: preset.components,
      connections: preset.connections,
      rawText: preset.description,
      provider_used: 'preset_library',
      provider_notice: null,
      cached: false
    };
    updateArchitectureState(newArch);
    setInputText(preset.description);
    setActiveName(preset.name);
    setScaledArchitecture(null);
    setActiveView('current');
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
      rawText: '',
      provider_used: 'user_defined',
      provider_notice: null,
      cached: false
    });
    setInputText('');
    setActiveName('New Architecture');
    setSelectedComponent(null);
    setScaledArchitecture(null);
    setActiveView('current');
    setActiveFailureState({ isActive: false, targetType: null, failedIds: [], cascadedIds: [] });
  };

  // Update Component (Visual Editor Feature 3.G)
  const handleUpdateComponent = (updatedComp) => {
    if (!updatedComp || !updatedComp.id) return;
    const updatedComps = (architecture.components || []).map(c => c.id === updatedComp.id ? updatedComp : c);
    updateArchitectureState({
      ...architecture,
      components: updatedComps
    }, true);
    setSelectedComponent(updatedComp);
  };

  // Delete Selected Component (Visual Editor Feature 3.G)
  const handleDeleteSelectedComponent = (targetId) => {
    const idToDelete = targetId || selectedComponent?.id;
    if (!idToDelete) return;
    const updatedComps = (architecture.components || []).filter(c => c.id !== idToDelete);
    const updatedConns = (architecture.connections || []).filter(
      conn => conn.from !== idToDelete && conn.to !== idToDelete && conn.from_id !== idToDelete && conn.to_id !== idToDelete
    );
    updateArchitectureState({
      ...architecture,
      components: updatedComps,
      connections: updatedConns
    }, true);
    if (selectedComponent?.id === idToDelete) {
      setSelectedComponent(null);
      setIsInspectorOpen(false);
    }
  };

  // Save Version Snapshot
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

  // Unified Handler to apply optimization to the architecture model (Requirement 2, 3, 4, 5)
  const handleApplyOptimization = (afterArch, customSummary = null) => {
    if (!afterArch || !Array.isArray(afterArch.components)) return;

    // 1. Calculate diff against current architecture
    const diff = computeArchitectureDiff(architecture, afterArch);
    const beforeH = analyzeArchitectureHealth(architecture);
    const afterH = analyzeArchitectureHealth(afterArch);
    const beforeC = calculateArchitectureCosts(architecture, assumptions);
    const afterC = calculateArchitectureCosts(afterArch, assumptions);

    const summary = customSummary || {
      addedCount: diff.addedComponents.length,
      addedNames: diff.addedComponents.map(c => c.name),
      removedCount: diff.removedComponents.length,
      connectionsChanged: diff.connectionsChanged,
      beforeHealth: beforeH.overallScore,
      afterHealth: afterH.overallScore,
      beforeCost: beforeC.aws.totalMonthly,
      afterCost: afterC.aws.totalMonthly
    };

    // 2. Save Pre-Optimization version snapshot (Requirement 3)
    const preVerNum = versionHistory.length;
    const preVer = {
      id: Date.now(),
      note: `Version ${preVerNum}: Current Architecture (Pre-Optimization)`,
      architecture: JSON.parse(JSON.stringify(architecture)),
      timestamp: new Date().toISOString()
    };

    // 3. Update real architecture state (Requirement 2 & 4)
    updateArchitectureState(afterArch, true);
    setActiveName(`${activeName} (Optimized)`);

    // 4. Save Post-Optimization version snapshot (Requirement 3)
    const postVer = {
      id: Date.now() + 1,
      note: `Version ${preVerNum + 1}: Optimized Architecture`,
      architecture: JSON.parse(JSON.stringify(afterArch)),
      timestamp: new Date().toISOString()
    };

    setVersionHistory(prev => [...prev, preVer, postVer]);

    // 5. Set success notification banner (Requirement 5)
    setOptimizationSuccessNotice({
      timestamp: Date.now(),
      summary
    });

    // Close beforeAfter modal if open
    setBeforeAfterState(s => ({ ...s, isOpen: false }));
  };

  // Handle Optimizer "Apply Suggestion"
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
      handleApplyOptimization(beforeAfterState.afterArchitecture);
    }
  };

  return (
    <div className="app-container">
      {/* Top Professional Navbar */}
      <Header
        onSelectPreset={handleSelectPreset}
        onNewArchitecture={handleNewArchitecture}
        onOpenSaveModal={() => setIsSaveOpen(true)}
        onOpenSavedListModal={() => setIsLibraryOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onOpenAIUsageModal={() => setIsAIUsageOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        isBeginnerMode={isBeginnerMode}
        onToggleBeginnerMode={() => setIsBeginnerMode(!isBeginnerMode)}
        activeArchitectureName={activeName}
        providerUsed={architecture.provider_used}
      />

      {/* Top Studio Feature Navigation Bar (15 Core Capabilities + More Tools Dropdown) */}
      <nav className="studio-nav">
        <button
          className={`studio-nav-btn ${activeNav === 'canvas' ? 'active' : ''}`}
          onClick={() => { setActiveNav('canvas'); setIsMoreNavOpen(false); }}
        >
          <LayoutGrid size={14} />
          <span>Architecture</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'input' ? 'active' : ''}`}
          onClick={() => { setActiveNav('input'); setIsMoreNavOpen(false); }}
        >
          <FileText size={14} />
          <span>Input &amp; Voice</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'technologies' ? 'active' : ''}`}
          onClick={() => { setActiveNav('technologies'); setIsMoreNavOpen(false); }}
        >
          <Cpu size={14} />
          <span>Technologies</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'optimizer' ? 'active' : ''}`}
          onClick={() => { setActiveNav('optimizer'); setIsMoreNavOpen(false); }}
        >
          <Sparkles size={14} />
          <span>Optimizer</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'traffic' ? 'active' : ''}`}
          onClick={() => { setActiveNav('traffic'); setIsMoreNavOpen(false); }}
        >
          <TrendingUp size={14} />
          <span>Traffic Simulation</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'bottlenecks' ? 'active' : ''}`}
          onClick={() => { setActiveNav('bottlenecks'); setIsMoreNavOpen(false); }}
        >
          <AlertOctagon size={14} />
          <span>Bottlenecks</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'cost' ? 'active' : ''}`}
          onClick={() => { setActiveNav('cost'); setIsMoreNavOpen(false); }}
        >
          <DollarSign size={14} />
          <span>Cost Analysis</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'health' ? 'active' : ''}`}
          onClick={() => { setActiveNav('health'); setIsMoreNavOpen(false); }}
        >
          <HeartPulse size={14} />
          <span>Architecture Health</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'whatif' ? 'active' : ''}`}
          onClick={() => { setActiveNav('whatif'); setIsMoreNavOpen(false); }}
        >
          <SlidersHorizontal size={14} />
          <span>What-If Analysis</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'future' ? 'active' : ''}`}
          onClick={() => { setActiveNav('future'); setIsMoreNavOpen(false); }}
        >
          <TrendingUp size={14} color="#2563eb" />
          <span>Future Architecture</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'compare' ? 'active' : ''}`}
          onClick={() => { setActiveNav('compare'); setIsMoreNavOpen(false); }}
        >
          <Scale size={14} />
          <span>Compare</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'versions' ? 'active' : ''}`}
          onClick={() => { setActiveNav('versions'); setIsMoreNavOpen(false); }}
        >
          <History size={14} />
          <span>Versions ({versionHistory.length})</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'terraform' ? 'active' : ''}`}
          onClick={() => { setActiveNav('terraform'); setIsMoreNavOpen(false); }}
        >
          <FileCode size={14} />
          <span>Terraform</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'c4' ? 'active' : ''}`}
          onClick={() => { setActiveNav('c4'); setIsMoreNavOpen(false); }}
        >
          <Layers size={14} />
          <span>C4 Views</span>
        </button>
        <button
          className={`studio-nav-btn ${activeNav === 'export' ? 'active' : ''}`}
          onClick={() => { setActiveNav('export'); setIsMoreNavOpen(false); }}
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        {/* More Tools Dropdown Menu */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            className={`studio-nav-btn ${['cloudmap', 'decisions', 'failure', 'impact', 'experiments'].includes(activeNav) ? 'active' : ''}`}
            onClick={() => setIsMoreNavOpen(!isMoreNavOpen)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Compass size={14} />
            <span>More</span>
            <ChevronDown size={12} />
          </button>

          {isMoreNavOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                minWidth: '220px',
                zIndex: 100,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeNav === 'cloudmap' ? '#eff6ff' : 'transparent',
                  color: activeNav === 'cloudmap' ? '#2563eb' : '#0f172a',
                  fontSize: '0.76rem',
                  fontWeight: activeNav === 'cloudmap' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => {
                  setActiveNav('cloudmap');
                  setIsMoreNavOpen(false);
                }}
              >
                <Cloud size={14} color="#2563eb" />
                <span>Cloud Provider Mapping</span>
              </button>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeNav === 'decisions' ? '#eff6ff' : 'transparent',
                  color: activeNav === 'decisions' ? '#0284c7' : '#0f172a',
                  fontSize: '0.76rem',
                  fontWeight: activeNav === 'decisions' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => {
                  setActiveNav('decisions');
                  setIsMoreNavOpen(false);
                }}
              >
                <Bookmark size={14} color="#0284c7" />
                <span>Architecture Decisions (ADRs)</span>
              </button>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeNav === 'failure' ? '#eff6ff' : 'transparent',
                  color: activeNav === 'failure' ? '#dc2626' : '#0f172a',
                  fontSize: '0.76rem',
                  fontWeight: activeNav === 'failure' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => {
                  setActiveNav('failure');
                  setIsMoreNavOpen(false);
                }}
              >
                <AlertOctagon size={14} color="#dc2626" />
                <span>Chaos &amp; Failure Simulator</span>
              </button>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeNav === 'impact' ? '#eff6ff' : 'transparent',
                  color: activeNav === 'impact' ? '#d97706' : '#0f172a',
                  fontSize: '0.76rem',
                  fontWeight: activeNav === 'impact' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => {
                  setActiveNav('impact');
                  setIsMoreNavOpen(false);
                }}
              >
                <Activity size={14} color="#d97706" />
                <span>Component Impact Analyzer</span>
              </button>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeNav === 'experiments' ? '#eff6ff' : 'transparent',
                  color: activeNav === 'experiments' ? '#7c3aed' : '#0f172a',
                  fontSize: '0.76rem',
                  fontWeight: activeNav === 'experiments' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => {
                  setActiveNav('experiments');
                  setIsMoreNavOpen(false);
                }}
              >
                <FlaskConical size={14} color="#7c3aed" />
                <span>Experiment &amp; Scenario Lab</span>
              </button>

              <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => {
                  setIsAIUsageOpen(true);
                  setIsMoreNavOpen(false);
                }}
              >
                <Sparkles size={14} color="#16a34a" />
                <span>AI Engine Quota &amp; Fallback Status</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Optimization Application Success Banner (Requirement 5) */}
      {optimizationSuccessNotice && (
        <div
          id="optimization-success-banner"
          style={{
            margin: '10px 20px 0',
            padding: '12px 18px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            zIndex: 15
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#15803d' }}>
                Optimization applied successfully.
              </div>
              <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '2px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span><strong>Components added:</strong> {optimizationSuccessNotice.summary.addedCount} {optimizationSuccessNotice.summary.addedNames?.length > 0 ? `(${optimizationSuccessNotice.summary.addedNames.join(', ')})` : ''}</span>
                <span><strong>Components removed:</strong> {optimizationSuccessNotice.summary.removedCount}</span>
                <span><strong>Connections changed:</strong> {optimizationSuccessNotice.summary.connectionsChanged}</span>
                <span><strong>Health:</strong> {optimizationSuccessNotice.summary.beforeHealth} → {optimizationSuccessNotice.summary.afterHealth}</span>
                <span><strong>Estimated cost:</strong> ${optimizationSuccessNotice.summary.beforeCost.toFixed(2)} → ${optimizationSuccessNotice.summary.afterCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => { setActiveNav('canvas'); setOptimizationSuccessNotice(null); }}
              style={{ fontSize: '0.72rem' }}
            >
              View Canvas
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => { setActiveNav('versions'); setOptimizationSuccessNotice(null); }}
              style={{ fontSize: '0.72rem' }}
            >
              View Versions ({versionHistory.length})
            </button>
            <button
              className="icon-btn"
              onClick={() => setOptimizationSuccessNotice(null)}
              style={{ padding: '4px' }}
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Viewport (Canvas or Dedicated Feature View) */}
      {activeNav === 'canvas' ? (
        <main className="studio-grid">
        {/* ========================================================
            COLUMN 1: LEFT SIDEBAR (11 Functional Sections)
            ======================================================== */}
        <ErrorBoundary title="Sidebar Configuration Error">
          <LeftSidebar
            activeTab={leftTab}
            onTabChange={setLeftTab}
            inputText={inputText}
            onInputTextChange={setInputText}
            onInitiateGeneration={handleInitiateGeneration}
            onConversationalCommand={handleConversationalCommand}
            isProcessing={isProcessing}
            architecture={architecture}
            onUpdateArchitecture={(newArch) => updateArchitectureState(newArch, true)}
            selectedComponent={selectedComponent}
            onSelectComponent={(comp) => {
              setSelectedComponent(comp);
              if (comp) setIsInspectorOpen(true);
            }}
            cloudMode={cloudMode}
            onCloudModeChange={setCloudMode}
            assumptions={assumptions}
            onAssumptionsChange={setAssumptions}
            healthData={healthData}
            trafficData={trafficData}
            costData={costData}
            versionHistory={versionHistory}
            onSaveVersion={handleSaveVersion}
            onRestoreVersion={handleRestoreVersion}
            onOpenExportModal={() => setIsExportOpen(true)}
          />
        </ErrorBoundary>

        {/* ========================================================
            COLUMN 2: CENTER CANVAS (Interactive Mermaid Diagram)
            ======================================================== */}
        <section className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Validation Notice Bar */}
          {!validationResult.is_valid && (
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '6px 14px', fontSize: '0.74rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color="#dc2626" />
              <span><b>Architecture Consideration:</b> {typeof validationResult.errors[0] === 'string' ? validationResult.errors[0] : (validationResult.errors[0]?.message || 'Structural consideration detected')}</span>
            </div>
          )}

          <ErrorBoundary title="Diagram Render Error">
            <ArchitectureDiagram
              architecture={architecture}
              scaledArchitecture={scaledArchitecture}
              activeView={activeView}
              onViewChange={setActiveView}
              cloudMode={cloudMode}
              onCloudModeChange={setCloudMode}
              direction={direction}
              onDirectionToggle={() => setDirection(d => d === 'LR' ? 'TD' : 'LR')}
              architectureLevel={architectureLevel}
              onLevelChange={setArchitectureLevel}
              failureState={activeFailureState}
              selectedComponent={selectedComponent}
              onSelectComponent={(comp) => {
                setSelectedComponent(comp);
                if (comp) setIsInspectorOpen(true);
              }}
              onOpenExplainModal={() => setIsExplainModalOpen(true)}
              onOpenAddComponent={() => setLeftTab('components')}
              onOpenAddConnection={() => setLeftTab('connections')}
              onDeleteSelectedComponent={handleDeleteSelectedComponent}
            />
          </ErrorBoundary>
        </section>

        {/* ========================================================
            COLUMN 3: RIGHT SIDEBAR (Insights & Scalability Actions)
            ======================================================== */}
        <ErrorBoundary title="Insights Panel Error">
          {rightViewMode === 'insights' ? (
            <RightSidebar
              architecture={activeView === 'scaled' && scaledArchitecture ? scaledArchitecture : architecture}
              healthData={healthData}
              trafficData={trafficData}
              costData={costData}
              onGenerateScaledArchitecture={handleGenerateScaledArchitecture}
              onOpenAIUsageModal={() => setIsAIUsageOpen(true)}
              isGeneratingScaled={isGeneratingScaled}
              onNavigateTab={(tab) => setActiveNav(tab)}
            />
          ) : (
            <aside className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} color="#2563eb" />
                Advanced Calculators & Labs
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setRightViewMode('insights')}
                style={{ fontSize: '0.68rem', padding: '2px 8px' }}
              >
                Back to Insights
              </button>
            </div>

            <div className="dashboard-tab-grid">
              <button className={`dashboard-tab-item ${rightDeepTab === 'whatif' ? 'active' : ''}`} onClick={() => setRightDeepTab('whatif')}>
                <Sparkles size={13} color="#2563eb" />
                <span>What-If</span>
              </button>
              <button className={`dashboard-tab-item ${rightDeepTab === 'impact' ? 'active' : ''}`} onClick={() => setRightDeepTab('impact')}>
                <Activity size={13} color="#d97706" />
                <span>Impact</span>
              </button>
              <button className={`dashboard-tab-item ${rightDeepTab === 'failure' ? 'active' : ''}`} onClick={() => setRightDeepTab('failure')}>
                <AlertOctagon size={13} color="#dc2626" />
                <span>Failure</span>
              </button>
              <button className={`dashboard-tab-item ${rightDeepTab === 'optimizer' ? 'active' : ''}`} onClick={() => setRightDeepTab('optimizer')}>
                <Sparkles size={13} color="#16a34a" />
                <span>Optimizer</span>
              </button>
              <button className={`dashboard-tab-item ${rightDeepTab === 'techcomp' ? 'active' : ''}`} onClick={() => setRightDeepTab('techcomp')}>
                <Scale size={13} color="#7c3aed" />
                <span>Compare</span>
              </button>
              <button className={`dashboard-tab-item ${rightDeepTab === 'decisions' ? 'active' : ''}`} onClick={() => setRightDeepTab('decisions')}>
                <Bookmark size={13} color="#0284c7" />
                <span>ADRs</span>
              </button>
              <button className={`dashboard-tab-item ${rightDeepTab === 'cloudmap' ? 'active' : ''}`} onClick={() => setRightDeepTab('cloudmap')}>
                <Cloud size={13} color="#2563eb" />
                <span>Cloud</span>
              </button>
              <button className={`dashboard-tab-item ${rightDeepTab === 'terraform' ? 'active' : ''}`} onClick={() => setRightDeepTab('terraform')}>
                <FileCode size={13} color="#059669" />
                <span>IaC</span>
              </button>
            </div>

            <div className="panel-content">
              <ErrorBoundary title="Tab Error" onReset={() => setRightDeepTab('whatif')}>
                {rightDeepTab === 'whatif' && (
                  <WhatIfSimulatorPanel
                    architecture={architecture}
                    onApplySimulatedArchitecture={(simArch) => updateArchitectureState(simArch)}
                  />
                )}
                {rightDeepTab === 'impact' && (
                  <ImpactAnalyzerPanel architecture={architecture} />
                )}
                {rightDeepTab === 'failure' && (
                  <FailureSimulatorPanel
                    architecture={architecture}
                    activeFailureState={activeFailureState}
                    onFailureStateChange={setActiveFailureState}
                  />
                )}
                {rightDeepTab === 'optimizer' && (
                  <RecommendationPanel
                    architecture={architecture}
                    onApplyOptimization={handleTriggerOptimization}
                    onApplyDirectOptimization={handleApplyOptimization}
                    versionHistory={versionHistory}
                    assumptions={assumptions}
                    onReturnToCanvas={() => setActiveNav('canvas')}
                    onNavigateToVersions={() => setActiveNav('versions')}
                  />
                )}
                {rightDeepTab === 'techcomp' && (
                  <TechComparisonPanel />
                )}
                {rightDeepTab === 'decisions' && (
                  <DecisionMemoryPanel architecture={architecture} />
                )}
                {rightDeepTab === 'cloudmap' && (
                  <CloudMappingPanel
                    architecture={architecture}
                    cloudMode={cloudMode}
                    onCloudModeChange={setCloudMode}
                  />
                )}
                {rightDeepTab === 'terraform' && (
                  <TerraformPreviewPanel
                    architecture={architecture}
                    cloudMode={cloudMode}
                  />
                )}
              </ErrorBoundary>
            </div>
          </aside>
        )}
      </ErrorBoundary>
      </main>
      ) : (
        /* DEDICATED FULL-VIEW CONTAINER FOR SPECIALIZED FEATURES (Feature 18) */
        <div className="studio-view-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveNav('canvas')}
              style={{ fontSize: '0.74rem' }}
            >
              <ArrowLeft size={13} />
              <span>Back to Architecture Canvas</span>
            </button>

            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Active Project: <strong style={{ color: '#0f172a' }}>{activeName}</strong>
            </div>
          </div>

          <ErrorBoundary title="Feature View Error" onReturnToCanvas={() => setActiveNav('canvas')}>
            {activeNav === 'input' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
                <div className="card" style={{ background: '#ffffff', padding: '16px' }}>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mic size={18} color="#2563eb" />
                    <span>Voice & Text Architecture Input</span>
                  </h3>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '12px' }}>
                    Describe your software architecture or microservices system using speech or text prompt.
                  </p>
                  <ArchitectureInput
                    value={inputText}
                    onChange={setInputText}
                    onGenerate={() => {
                      handleInitiateGeneration();
                      setActiveNav('canvas');
                    }}
                    onClear={() => setInputText('')}
                    onConversationalCommand={handleConversationalCommand}
                    isProcessing={isProcessing}
                  />
                </div>

                <div className="card" style={{ background: '#ffffff', padding: '16px' }}>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#0284c7" />
                    <span>Extracted System Requirements</span>
                  </h3>
                  <RequirementsTabPanel requirementsData={requirementsData} />
                </div>
              </div>
            )}

            {activeNav === 'technologies' && (
              <TechComparisonPanel />
            )}

            {activeNav === 'optimizer' && (
              <RecommendationPanel
                architecture={architecture}
                onApplyOptimization={handleTriggerOptimization}
                onApplyDirectOptimization={handleApplyOptimization}
                versionHistory={versionHistory}
                assumptions={assumptions}
                onReturnToCanvas={() => setActiveNav('canvas')}
                onNavigateToVersions={() => setActiveNav('versions')}
              />
            )}

            {activeNav === 'traffic' && (
              <TrafficSimulatorPanel
                architecture={architecture}
                onGenerateScaledArchitecture={handleGenerateScaledArchitecture}
                isGeneratingScaled={isGeneratingScaled}
              />
            )}

            {activeNav === 'bottlenecks' && (
              <BottleneckAnalysisPanel
                architecture={architecture}
                onGenerateScaledArchitecture={handleGenerateScaledArchitecture}
                isGeneratingScaled={isGeneratingScaled}
              />
            )}

            {activeNav === 'cost' && (
              <CostPanel
                architecture={architecture}
                assumptions={assumptions}
                onAssumptionsChange={setAssumptions}
                onUpdateArchitecture={(newArch) => updateArchitectureState(newArch, true)}
              />
            )}

            {activeNav === 'health' && (
              <HealthPanel
                architecture={architecture}
                onGenerateScaledArchitecture={handleGenerateScaledArchitecture}
                isGeneratingScaled={isGeneratingScaled}
              />
            )}

            {activeNav === 'whatif' && (
              <WhatIfSimulatorPanel
                architecture={architecture}
                onApplySimulatedArchitecture={(newArch) => {
                  updateArchitectureState(newArch, true);
                  setActiveNav('canvas');
                }}
              />
            )}

            {activeNav === 'future' && (
              <FutureArchitecturePanel
                currentArchitecture={architecture}
                scaledArchitecture={scaledArchitecture}
                onGenerateScaledArchitecture={handleGenerateScaledArchitecture}
                isGeneratingScaled={isGeneratingScaled}
                onAdoptScaledArchitecture={() => {
                  if (scaledArchitecture) {
                    updateArchitectureState(scaledArchitecture, true);
                    setActiveNav('canvas');
                  }
                }}
              />
            )}

            {activeNav === 'compare' && (
              <ArchitectureComparisonPanel
                currentArchitecture={architecture}
                scaledArchitecture={scaledArchitecture}
                onGenerateScaledArchitecture={handleGenerateScaledArchitecture}
                isGeneratingScaled={isGeneratingScaled}
                onApplyScaledAsCurrent={() => {
                  if (scaledArchitecture) {
                    updateArchitectureState(scaledArchitecture, true);
                    setActiveNav('canvas');
                  }
                }}
                onSwitchView={setActiveView}
              />
            )}

            {activeNav === 'versions' && (
              <VersionHistoryPanel
                versionHistory={versionHistory}
                onSaveVersion={handleSaveVersion}
                onRestoreVersion={(ver) => {
                  handleRestoreVersion(ver);
                  setActiveNav('canvas');
                }}
                currentArchitecture={architecture}
              />
            )}

            {activeNav === 'terraform' && (
              <TerraformPreviewPanel
                architecture={architecture}
                cloudMode={cloudMode}
              />
            )}

            {activeNav === 'c4' && (
              <C4ViewsPanel
                architecture={architecture}
                cloudMode={cloudMode}
              />
            )}

            {activeNav === 'export' && (
              <ExportStudioPanel
                architecture={architecture}
                cloudMode={cloudMode}
                direction={direction}
              />
            )}

            {activeNav === 'cloudmap' && (
              <CloudMappingPanel
                architecture={architecture}
                cloudMode={cloudMode}
                onCloudModeChange={setCloudMode}
              />
            )}

            {activeNav === 'decisions' && (
              <DecisionMemoryPanel
                architecture={architecture}
              />
            )}

            {activeNav === 'failure' && (
              <FailureSimulatorPanel
                architecture={architecture}
                activeFailureState={activeFailureState}
                onFailureStateChange={setActiveFailureState}
              />
            )}

            {activeNav === 'impact' && (
              <ImpactAnalyzerPanel
                architecture={architecture}
              />
            )}

            {activeNav === 'experiments' && (
              <ExperimentLabPanel
                architecture={architecture}
                onSwitchArchitecture={(newArch) => {
                  updateArchitectureState(newArch, true);
                  setActiveNav('canvas');
                }}
                onNavigateToCompare={() => setActiveNav('compare')}
              />
            )}
          </ErrorBoundary>
        </div>
      )}

      {/* AI Usage & Developer Status Modal (Feature 3) */}
      <AIUsageModal
        isOpen={isAIUsageOpen}
        onClose={() => setIsAIUsageOpen(false)}
      />

      {/* Explain Architecture Modal (Feature 17) */}
      <ArchitectureExplanationModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        architecture={activeView === 'scaled' && scaledArchitecture ? scaledArchitecture : architecture}
      />

      {/* Smart Clarification Questions Modal */}
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

      {/* Component Inspector Modal (Visual Editor Feature 3.G) */}
      <ComponentInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        component={selectedComponent}
        architecture={architecture}
        onUpdateComponent={handleUpdateComponent}
        onDeleteComponent={handleDeleteSelectedComponent}
        isBeginnerMode={isBeginnerMode}
      />

      {/* Version History Modal */}
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
        architecture={activeView === 'scaled' && scaledArchitecture ? scaledArchitecture : architecture}
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
        onLoadArchitecture={(savedItem) => {
          if (!savedItem?.architecture) return;
          updateArchitectureState(savedItem.architecture);
          setActiveName(savedItem.name || 'Saved Architecture');
          setScaledArchitecture(null);
          setActiveView('current');
        }}
      />
    </div>
  );
}
