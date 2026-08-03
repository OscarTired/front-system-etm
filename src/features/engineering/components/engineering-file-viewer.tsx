'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { X, FileText } from 'lucide-react';
import { engineeringApi } from '../api/engineering.api';

const DxfCanvas = dynamic(() => import('../../nesting/components/dxf-canvas').then((m) => m.DxfCanvas), { ssr: false });

interface EngineeringFileViewerProps {
  fileId: string;
  fileName: string;
  // Añade estas propiedades opcionales para recibir datos reales del archivo
  projectName?: string;
  loteName?: string;
  onClose: () => void;
}

export const EngineeringFileViewer = ({ 
  fileId, 
  fileName, 
  projectName = 'Proyecto Beta', // Valores por defecto por si no vienen definidos
  loteName = 'Lote-001', 
  onClose 
}: EngineeringFileViewerProps) => {
  const [viewMode, setViewMode] = useState<'dxf' | 'pdf'>('dxf');
  const rawUrl = engineeringApi.getRawUrl(fileId);
  
  // Construimos el query string con los metadatos reales para el reporte
  const queryParams = `?proyecto=${encodeURIComponent(projectName)}&lote=${encodeURIComponent(loteName)}`;
  
  // URL para previsualizar (inline) y para descargar aplicando los parámetros
  const previewUrl = `${engineeringApi.getReportUrl(fileId, false)}${queryParams}`;
  const downloadUrl = `${engineeringApi.getReportUrl(fileId, true)}${queryParams}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#101012] ring-1 ring-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del visor */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex gap-6 items-center">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-white">{fileName}</h3>
            </div>
            {/* Selector de modo */}
            <div className="flex bg-white/5 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('dxf')} 
                className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'dxf' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Vista Técnica (DXF)
              </button>
              <button 
                onClick={() => setViewMode('pdf')} 
                className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'pdf' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Reporte PDF
              </button>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Contenido dinámico */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0a0c]">
          {viewMode === 'dxf' ? (
            <DxfCanvas url={rawUrl} />
          ) : (
            <div className="flex h-full w-full flex-col p-6 gap-4">
              <iframe 
                src={previewUrl} 
                className="flex-1 w-full border-none rounded-xl bg-white" 
                title="Reporte PDF"
              />
              <div className="flex justify-end">
                <a 
                  href={downloadUrl}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <FileText size={14} /> Descargar PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};