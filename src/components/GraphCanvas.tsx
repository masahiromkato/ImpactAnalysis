import React, { useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useReactFlow,
    getNodesBounds,
    getViewportForBounds,
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type NodeTypes,
    ReactFlowProvider
} from '@xyflow/react';
import { ChevronRight, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { ImpactNode } from './ImpactNode';
import { TierGroupNode } from './TierGroupNode';

const nodeTypes: NodeTypes = {
    impact: ImpactNode,
    tierGroup: TierGroupNode,
};

interface GraphCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    lastExecuted: string | null;
}

const GraphCanvasInner: React.FC<GraphCanvasProps> = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    isSidebarOpen,
    setIsSidebarOpen,
    lastExecuted,
}) => {
    const { getNodes } = useReactFlow();

    const onDownloadImage = useCallback(() => {
        const nodes = getNodes();
        const nodesBounds = getNodesBounds(nodes);
        const transform = getViewportForBounds(nodesBounds, 1024, 768, 0.5, 2, 20);

        const flowElement = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!flowElement) return;

        toPng(flowElement, {
            backgroundColor: '#0f172a',
            width: 1024 * 2,
            height: 768 * 2,
            style: {
                width: '1024px',
                height: '768px',
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
            },
        }).then((dataUrl) => {
            download(dataUrl, `impact-analysis-${Date.now()}.png`);
        });
    }, [getNodes]);

    return (
        <div className="canvas-area" style={{ flex: '4', position: 'relative', borderBottom: '1px solid var(--border-color)' }}>
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    style={{
                        position: 'absolute', top: '16px', left: '16px', zIndex: 50,
                        background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '50%',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', animation: 'fade-in 0.3s'
                    }}
                    title="サイドバーを開く"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            <div style={{
                position: 'absolute',
                top: '16px',
                left: isSidebarOpen ? '16px' : '64px',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'left 0.3s ease'
            }}>
                {lastExecuted && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid var(--border-color)',
                        pointerEvents: 'none'
                    }}>
                        最終実行: {lastExecuted}
                    </div>
                )}
                {nodes.length > 0 && (
                    <button
                        onClick={onDownloadImage}
                        style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            color: '#fff',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: 'fit-content',
                            pointerEvents: 'auto'
                        }}
                        className="btn-export"
                    >
                        <Download size={16} /> 画像として保存 (PNG)
                    </button>
                )}
            </div>

            {nodes.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    左側の「実行」ボタンを押してください
                </div>
            ) : (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodeClick={onNodeClick}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                    minZoom={0.2}
                    maxZoom={2}
                >
                    <Background color="var(--border-color)" gap={20} size={1} />
                    <Controls style={{ background: 'var(--panel-bg)', fill: '#fff' }} position="bottom-left" showInteractive={false} />
                </ReactFlow>
            )}
        </div>
    );
};

export const GraphCanvas: React.FC<GraphCanvasProps> = (props) => (
    <ReactFlowProvider>
        <GraphCanvasInner {...props} />
    </ReactFlowProvider>
);
